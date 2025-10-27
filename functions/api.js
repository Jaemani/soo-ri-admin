const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

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
app.post('/admin/login', (req, res) => {
  const { id, password } = req.body || {};
  if (!id || !password) {
    return res.status(400).json({ success: false, message: 'id and password required' });
  }
  // TODO: Verify against Firestore/Custom Claims
  const token = Buffer.from(JSON.stringify({ id, label: '수리수리 본점' })).toString('base64');
  res.json({ success: true, token, admin: { id, label: '수리수리 본점' } });
});

// Example endpoint compatible with frontend expectations
// GET /api/repairStations?admin=current
app.get('/repairStations', async (req, res) => {
  try {
    const adminId = req.headers['x-admin-id'] || req.query.admin || 'current';
    // TODO: Load from Firestore once schema is defined
    // Temporary mocked payload to unblock UI
    const repairStation = {
      id: 'default-station',
      code: '0000',
      label: '기본 수리점',
      aid: [30000, 40000, 50000]
    };
    res.json({ success: true, repairStation });
  } catch (e) {
    console.error('repairStations error', e);
    res.status(500).json({ success: false, message: 'Internal error' });
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
app.get('/users', async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const usersRef = db.collection('users');
    // Simple list; TODO: add filters/search as needed
    const snap = await usersRef.limit(take).get();
    const users = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    res.json({ success: true, users, totalPages: 1, currentPage: 1, total: users.length });
  } catch (e) {
    console.error('GET /users error', e);
    res.status(500).json({ success: false, users: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: doc.id, ...doc.data() });
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
    const repairs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
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
    const repairs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    res.json({ repairs, totalPages: 1, currentPage: 1, total: repairs.length });
  } catch (e) {
    console.error('GET /admin/repairs error', e);
    res.status(500).json({ repairs: [], totalPages: 1, currentPage: 1, total: 0 });
  }
});

app.get('/vehicles/:vehicleId/repairs', async (req, res) => {
  try {
    const snap = await db.collection('repairs').where('vehicleId', '==', req.params.vehicleId).limit(100).get();
    const repairs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    res.json({ repairs });
  } catch (e) {
    console.error('GET /vehicles/:vehicleId/repairs error', e);
    res.status(500).json({ repairs: [] });
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

// --- SelfChecks (Firestore) ---
app.get('/selfChecks', async (req, res) => {
  try {
    let q = db.collection('selfChecks');
    const take = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const vehicleId = req.query.vehicleId;
    if (vehicleId) q = q.where('vehicleId', '==', String(vehicleId));
    const snap = await q.limit(take).get();
    const selfChecks = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
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
    if (userId) q = q.where('userId', '==', String(userId));
    const snap = await q.limit(take).get();
    const selfChecks = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
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
    if (doc.exists) return res.json({ _id: doc.id, ...doc.data() });
    // Fallback: query by 'vehicleId' field
    const snap = await db.collection('vehicles').where('vehicleId', '==', req.params.vehicleId).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: 'Vehicle not found' });
    const d = snap.docs[0];
    res.json({ _id: d.id, ...d.data() });
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
