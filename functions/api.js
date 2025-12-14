const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { runWelfarePipeline } = require('./welfare/pipeline');
const { 
  triggerWelfareReport, 
  getTaskStatus, 
  getLatestTaskByUser,
  processWelfareReport 
} = require('./welfare/v2');

// Initialize admin if not already initialized by another function file
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();

// Allow CORS for browser calls (adjust origin as needed)
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, name: 'soo-ri api', version: 1 });
});

// --- Auth ---
// ============================================
// V1 API - 동기식 (기존 유지)
// ============================================
app.post('/admin/welfare/generate', async (req, res) => {
  const { userId } = req.body;
  console.log('📝 [V1] Welfare report generation requested for user:', userId);
  
  if (!userId) {
    console.error('❌ Missing userId in request');
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log('🚀 Starting welfare pipeline...');
    // Run pipeline logic
    const result = await runWelfarePipeline(userId);
    console.log('✅ Pipeline completed successfully:', {
      userId: result.userId,
      hasServices: !!result.services,
      servicesCount: result.services?.length,
      isFallback: result.isFallback
    });
    res.json(result);
  } catch (e) {
    console.error('❌ Welfare Pipeline Error:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

// ============================================
// V2 API - 비동기식 (Cloud Tasks)
// ============================================

/**
 * POST /admin/welfare/generate/async
 * 비동기 리포트 생성 요청
 * 
 * Request: { userId: string }
 * Response: { success: boolean, taskId: string, status: string, estimatedTime: string }
 */
app.post('/admin/welfare/generate/async', async (req, res) => {
  const { userId } = req.body;
  console.log('📝 [V2] Async welfare report requested for user:', userId);
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const result = await triggerWelfareReport(userId);
    
    if (!result.success && result.error === 'DUPLICATE_REQUEST') {
      return res.status(429).json(result);
    }
    
    // 202 Accepted - 요청이 접수되었음을 의미
    res.status(202).json(result);
  } catch (e) {
    console.error('❌ [V2] Trigger Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /admin/welfare/status/:taskId
 * Task 상태 조회
 * 
 * Response: { taskId, userId, status, createdAt, completedAt, error }
 */
app.get('/admin/welfare/status/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const status = await getTaskStatus(taskId);
    
    if (!status) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(status);
  } catch (e) {
    console.error('❌ Status query error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /admin/welfare/status/user/:userId
 * 사용자의 최신 Task 상태 조회
 */
app.get('/admin/welfare/status/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const status = await getLatestTaskByUser(userId);
    
    if (!status) {
      return res.status(404).json({ error: 'No tasks found for user' });
    }
    
    res.json(status);
  } catch (e) {
    console.error('❌ User status query error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/admin/login', (req, res) => {
  const { id, password } = req.body || {};
  if (!id || !password) {
    return res.status(400).json({ success: false, message: 'id and password required' });
  }
  // TODO: Verify against Firestore/Custom Claims
  const token = Buffer.from(JSON.stringify({ id, label: '수리수리 본점' })).toString('base64');
  res.json({ success: true, token, admin: { id, label: '수리수리 본점' } });
});

// GET /api/repairStations - Get list of repair stations
app.get('/repairStations', async (req, res) => {
  try {
    // Check if admin query (for admin panel)
    const isAdmin = req.query.admin === 'current';
    
    if (isAdmin) {
      // Admin endpoint - return single station info
      const adminId = req.headers['x-admin-id'] || 'current';
      // TODO: Load from Firestore based on admin
      const repairStation = {
        id: 'default-station',
        code: '0000',
        label: '기본 수리점',
        aid: [30000, 40000, 50000]
      };
      return res.json({ success: true, repairStation });
    }
    
    // User endpoint - return list of all stations
    const snap = await db.collection('repairStationsLegacy').limit(200).get();
    const stations = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: data.code,
        state: data.state,
        city: data.city,
        region: data.region,
        address: data.address,
        label: data.label,
        telephone: data.telephone,
        coordinate: data.coordinate?.coordinates || data.coordinate || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ stations });
  } catch (e) {
    console.error('repairStations error', e);
    res.status(500).json({ success: false, message: 'Internal error', stations: [] });
  }
});

// PUT /api/repairStations { aid: number[] }
app.put('/repairStations', async (req, res) => {
  try {
    const { aid } = req.body || {};
    if (!Array.isArray(aid) || aid.length !== 3) {
      return res.status(400).json({ success: false, message: 'aid must be an array of length 3' });
    }
    // TODO: Persist to Firestore
    res.json({ success: true, repairStation: { id: 'default-station', code: '0000', label: '기본 수리점', aid } });
  } catch (e) {
    console.error('update repairStations error', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// --- Users (Firestore) ---
// POST /users - Check user existence or create new user
app.post('/users', async (req, res) => {
  try {
    // Extract Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const firebaseUid = decoded.uid;
    const phoneNumber = decoded.phone_number;

    if (!firebaseUid || !phoneNumber) {
      return res.status(401).json({ error: 'Invalid ID token: missing uid or phone_number' });
    }

    // Check if user already exists
    const userQuery = await db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();
    const userExists = !userQuery.empty;

    // If body is empty, just check existence
    const body = req.body || {};
    if (Object.keys(body).length === 0) {
      if (userExists) {
        return res.status(409).json({ error: 'User already exists' });
      }
      return res.status(200).json({ message: 'new User' });
    }

    // If user already exists, return 409
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const { name, supportedDistrict, vehicleId, model, purchasedAt, manufacturedAt, recipientType, vehicleType } = body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    // Find vehicle
    const vehicleQuery = await db.collection('vehicles').where('vehicleId', '==', vehicleId).limit(1).get();
    if (vehicleQuery.empty) {
      return res.status(404).json({ error: 'Invalid vehicleId' });
    }

    const vehicleDoc = vehicleQuery.docs[0];
    const vehicleData = vehicleDoc.data();

    // Check if vehicle already has an owner
    if (vehicleData.userId) {
      return res.status(403).json({ error: 'This Vehicle has an owner' });
    }

    // Create new user document
    const now = admin.firestore.FieldValue.serverTimestamp();
    const newUserData = {
      name,
      firebaseUid,
      phoneNumber,
      role: 'user',
      recipientType: recipientType || 'general',
      smsConsent: false,
      supportedDistrict: supportedDistrict || '',
      guardianIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const newUserRef = await db.collection('users').add(newUserData);

    // Update vehicle with user info
    await vehicleDoc.ref.update({
      userId: newUserRef.id,
      model: model || '',
      purchasedAt: purchasedAt ? admin.firestore.Timestamp.fromDate(new Date(purchasedAt)) : null,
      manufacturedAt: manufacturedAt ? admin.firestore.Timestamp.fromDate(new Date(manufacturedAt)) : null,
      vehicleType: vehicleType || '',
      updatedAt: now,
    });

    // Return created user
    res.status(201).json({
      userId: newUserRef.id,
      name: newUserData.name,
      phoneNumber: newUserData.phoneNumber,
      role: newUserData.role,
      recipientType: newUserData.recipientType,
      smsConsent: newUserData.smsConsent,
      supportedDistrict: newUserData.supportedDistrict,
      vehicleId: vehicleId,
    });
  } catch (e) {
    console.error('POST /users error', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const usersRef = db.collection('users');
    // Simple list; TODO: add filters/search as needed
    const snap = await usersRef.limit(take).get();
    const users = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ success: true, users, totalPages: 1, currentPage: 1, total: users.length });
  } catch (e) {
    console.error('GET /users error', e);
    res.status(500).json({ success: false, users: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/users/role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUid = decoded.uid;

    const userQuery = await db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userQuery.docs[0].data();
    res.json({ role: userData.role || 'user' });
  } catch (e) {
    console.error('GET /users/role error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    const data = doc.data();
    res.json({
      _id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    });
  } catch (e) {
    console.error('GET /users/:id error', e);
    res.status(500).json({ message: 'Internal error' });
  }
});

// --- Repairs (Firestore) ---
const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

app.get('/repairs', async (req, res) => {
  try {
    let q = db.collection('repairs');
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const vehicleId = req.query.vehicleId;
    if (vehicleId) q = q.where('vehicleId', '==', String(vehicleId));
    // NOTE: date filters omitted to avoid index/type issues; add if your schema uses Timestamp
    const snap = await q.limit(take).get();
    const repairs = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        repairedAt: data.repairedAt?.toDate?.()?.toISOString() || data.repairedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ repairs, totalPages: 1, currentPage: 1, total: repairs.length });
  } catch (e) {
    console.error('GET /repairs error', e);
    res.status(500).json({ repairs: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/admin/repairs', async (req, res) => {
  try {
    let q = db.collection('repairs');
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const repairStationCode = req.query.repairStationCode;
    if (repairStationCode) q = q.where('repairStationCode', '==', String(repairStationCode));
    const snap = await q.limit(take).get();
    const repairs = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        repairedAt: data.repairedAt?.toDate?.()?.toISOString() || data.repairedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ repairs, totalPages: 1, currentPage: 1, total: repairs.length });
  } catch (e) {
    console.error('GET /admin/repairs error', e);
    res.status(500).json({ repairs: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/vehicles/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const firebaseUid = decoded.uid;

    // Find user
    const userQuery = await db.collection('users').where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userQuery.docs[0].id;

    // Find vehicle by userId
    const vehicleQuery = await db.collection('vehicles').where('userId', '==', userId).limit(1).get();
    if (vehicleQuery.empty) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicleDoc = vehicleQuery.docs[0];
    const vehicleData = vehicleDoc.data();
    res.json({ 
      vehicleId: vehicleData.vehicleId,
      userId: vehicleData.userId,
      model: vehicleData.model,
      purchasedAt: vehicleData.purchasedAt?.toDate?.()?.toISOString() || vehicleData.purchasedAt,
      manufacturedAt: vehicleData.manufacturedAt?.toDate?.()?.toISOString() || vehicleData.manufacturedAt,
    });
  } catch (e) {
    console.error('GET /vehicles/me error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.get('/vehicles/:vehicleId/repairs', async (req, res) => {
  try {
    const snap = await db.collection('repairs').where('vehicleId', '==', req.params.vehicleId).limit(100).get();
    const repairs = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        repairedAt: data.repairedAt?.toDate?.()?.toISOString() || data.repairedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ repairs });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId/repairs error', e);
    res.status(500).json({ repairs: [] });
  }
});

app.get('/vehicles/:vehicleId/repairs/:repairId', async (req, res) => {
  try {
    const doc = await db.collection('repairs').doc(req.params.repairId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Repair not found' });
    }
    const repairData = doc.data();
    if (repairData.vehicleId !== req.params.vehicleId) {
      return res.status(404).json({ error: 'Repair not found for this vehicle' });
    }
    res.json({
      _id: doc.id,
      ...repairData,
      repairedAt: repairData.repairedAt?.toDate?.()?.toISOString() || repairData.repairedAt,
      createdAt: repairData.createdAt?.toDate?.()?.toISOString() || repairData.createdAt,
      updatedAt: repairData.updatedAt?.toDate?.()?.toISOString() || repairData.updatedAt,
    });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId/repairs/:repairId error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/vehicles/:vehicleId/repairs', async (req, res) => {
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      ...req.body,
      vehicleId: req.params.vehicleId,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection('repairs').add(data);
    const saved = await docRef.get();
    res.status(201).json({ _id: docRef.id, ...saved.data() });
  } catch (e) {
    console.error('POST /vehicles/:vehicleId/repairs error', e);
    res.status(500).json({ message: 'Internal error' });
  }
});

// --- SelfCheck endpoints ---
app.post('/vehicles/:vehicleId/selfCheck', async (req, res) => {
  try {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const data = {
      ...req.body,
      vehicleId: req.params.vehicleId,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection('selfChecks').add(data);
    res.status(201).json({ success: true, _id: docRef.id });
  } catch (e) {
    console.error('POST /vehicles/:vehicleId/selfCheck error', e);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

app.get('/vehicles/:vehicleId/selfCheck', async (req, res) => {
  try {
    const snap = await db.collection('selfChecks').where('vehicleId', '==', req.params.vehicleId).limit(100).get();
    const selfChecks = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ selfChecks });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId/selfCheck error', e);
    res.status(500).json({ selfChecks: [] });
  }
});

app.get('/vehicles/:vehicleId/selfCheck/:selfCheckId', async (req, res) => {
  try {
    const doc = await db.collection('selfChecks').doc(req.params.selfCheckId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'SelfCheck not found' });
    }
    const selfCheckData = doc.data();
    if (selfCheckData.vehicleId !== req.params.vehicleId) {
      return res.status(404).json({ error: 'SelfCheck not found for this vehicle' });
    }
    res.json({
      _id: doc.id,
      ...selfCheckData,
      createdAt: selfCheckData.createdAt?.toDate?.()?.toISOString() || selfCheckData.createdAt,
      updatedAt: selfCheckData.updatedAt?.toDate?.()?.toISOString() || selfCheckData.updatedAt,
    });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId/selfCheck/:selfCheckId error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// --- SelfChecks (Firestore) ---
app.get('/selfChecks', async (req, res) => {
  try {
    let q = db.collection('selfChecks');
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const vehicleId = req.query.vehicleId;
    if (vehicleId) q = q.where('vehicleId', '==', String(vehicleId));
    const snap = await q.limit(take).get();
    const selfChecks = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ selfChecks, totalPages: 1, currentPage: 1, total: selfChecks.length });
  } catch (e) {
    console.error('GET /selfChecks error', e);
    res.status(500).json({ selfChecks: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/admin/selfChecks', async (req, res) => {
  try {
    let q = db.collection('selfChecks');
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const userId = req.query.userId;
    // Note: filtering by userId requires joining or denormalizing userId onto selfCheck
    // If selfChecks has 'userId' field directly:
    if (userId) q = q.where('userId', '==', String(userId));

    const snap = await q.limit(take).get();
    const selfChecks = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    res.json({ selfChecks, totalPages: 1, currentPage: 1, total: selfChecks.length });
  } catch (e) {
    console.error('GET /admin/selfChecks error', e);
    res.status(500).json({ selfChecks: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

// --- Vehicles ---
app.get('/vehicles/:vehicleId', async (req, res) => {
  try {
    // Try doc by ID first
    const doc = await db.collection('vehicles').doc(req.params.vehicleId).get();
    if (doc.exists) {
      const data = doc.data();
      return res.json({ 
        _id: doc.id,
        vehicleId: data.vehicleId,
        userId: data.userId,
        model: data.model,
        purchasedAt: data.purchasedAt?.toDate?.()?.toISOString() || data.purchasedAt,
        manufacturedAt: data.manufacturedAt?.toDate?.()?.toISOString() || data.manufacturedAt,
      });
    }
    // Fallback: query by 'vehicleId' field
    const snap = await db.collection('vehicles').where('vehicleId', '==', req.params.vehicleId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'Vehicle not found' });
    const d = snap.docs[0];
    const data = d.data();
    res.json({ 
      _id: d.id,
      vehicleId: data.vehicleId,
      userId: data.userId,
      model: data.model,
      purchasedAt: data.purchasedAt?.toDate?.()?.toISOString() || data.purchasedAt,
      manufacturedAt: data.manufacturedAt?.toDate?.()?.toISOString() || data.manufacturedAt,
    });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId error', e);
    res.status(500).json({ message: 'Internal error' });
  }
});

// --- Stats ---
app.get('/stats/overall', (req, res) => {
  res.json({ ok: true });
});

app.get('/stats/repairs', (req, res) => {
  res.json({ totalRepairs: 0, totalCost: 0, averageCost: 0, repairsByCategory: [], repairsByStation: [], monthlyStats: [] });
});

app.get('/stats/users', (req, res) => {
  res.json({ totalUsers: 0, usersByType: [], activeUsers: 0, newUsersThisMonth: 0 });
});

app.get('/stats/monthly/:year/:month', (req, res) => {
  res.json({ ok: true, year: Number(req.params.year), month: Number(req.params.month) });
});

app.get('/stats/export', (req, res) => {
  res.json({ ok: true });
});

// 404 JSON fallback so we never return HTML
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found', path: req.path });
});

// Export as a regional HTTP function to be used by Hosting rewrites
exports.api = functions.region('asia-northeast3').https.onRequest(app);
