/**
 * V2 Trigger Function - 비동기 리포트 생성 요청
 * 
 * 역할:
 * 1. 요청 검증
 * 2. 중복 요청 방지 (최근 5분 내 요청 확인)
 * 3. Cloud Tasks에 작업 등록
 * 4. 즉시 202 Accepted 응답
 */

const { CloudTasksClient } = require('@google-cloud/tasks');
const admin = require('firebase-admin');

// Lazy initialization - db는 함수 호출 시점에 가져옴
let db = null;
let tasksClient = null;

function getDb() {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

function getTasksClient() {
  if (!tasksClient) {
    tasksClient = new CloudTasksClient();
  }
  return tasksClient;
}

// 환경 변수에서 설정 로드
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'soo-ri';
const LOCATION = process.env.CLOUD_TASKS_LOCATION || 'asia-northeast3';
const QUEUE_NAME = process.env.CLOUD_TASKS_QUEUE || 'welfare-report-queue';
const WORKER_URL = process.env.WORKER_FUNCTION_URL || 
  `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/welfareWorker`;

/**
 * 비동기 리포트 생성 트리거
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{taskId: string, status: string, estimatedTime: string}>}
 */
async function triggerWelfareReport(userId) {
  const db = getDb();
  
  // 1. 중복 요청 확인 (최근 5분 내)
  const recentTask = await checkRecentTask(userId);
  if (recentTask) {
    return {
      success: false,
      error: 'DUPLICATE_REQUEST',
      message: '리포트 생성이 이미 진행 중입니다',
      taskId: recentTask.taskId,
      status: recentTask.status
    };
  }

  // 2. Task 상태 문서 생성
  const taskId = `welfare-${userId}-${Date.now()}`;
  const taskRef = db.collection('welfare_tasks').doc(taskId);
  
  await taskRef.set({
    taskId,
    userId,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Cloud Tasks에 작업 등록
  try {
    await createCloudTask(taskId, userId);
    
    // 상태 업데이트
    await taskRef.update({
      status: 'queued',
      queuedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      taskId,
      status: 'queued',
      message: '리포트 생성이 시작되었습니다',
      estimatedTime: '30초 ~ 1분'
    };
  } catch (error) {
    // Cloud Tasks 실패 시 상태 업데이트
    await taskRef.update({
      status: 'failed',
      error: error.message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

/**
 * 최근 진행 중인 Task 확인
 */
async function checkRecentTask(userId) {
  const db = getDb();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const snapshot = await db.collection('welfare_tasks')
    .where('userId', '==', userId)
    .where('status', 'in', ['pending', 'queued', 'processing'])
    .where('createdAt', '>', admin.firestore.Timestamp.fromDate(fiveMinutesAgo))
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

/**
 * Cloud Tasks에 작업 생성
 */
async function createCloudTask(taskId, userId) {
  const client = getTasksClient();
  const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);
  
  const payload = JSON.stringify({
    taskId,
    userId,
    requestedAt: Date.now()
  });

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: WORKER_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(payload).toString('base64'),
    },
    // 재시도 설정
    // Cloud Tasks는 기본적으로 실패 시 자동 재시도
  };

  const [response] = await client.createTask({ parent, task });
  console.log(`✅ Cloud Task created: ${response.name}`);
  
  return response;
}

/**
 * Task 상태 조회
 */
async function getTaskStatus(taskId) {
  const db = getDb();
  const taskDoc = await db.collection('welfare_tasks').doc(taskId).get();
  
  if (!taskDoc.exists) {
    return null;
  }

  const data = taskDoc.data();
  return {
    taskId: data.taskId,
    userId: data.userId,
    status: data.status,
    createdAt: data.createdAt?.toDate?.()?.toISOString(),
    completedAt: data.completedAt?.toDate?.()?.toISOString(),
    error: data.error
  };
}

/**
 * 사용자의 최신 Task 조회
 */
async function getLatestTaskByUser(userId) {
  const db = getDb();
  const snapshot = await db.collection('welfare_tasks')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();
  return {
    taskId: data.taskId,
    userId: data.userId,
    status: data.status,
    createdAt: data.createdAt?.toDate?.()?.toISOString(),
    completedAt: data.completedAt?.toDate?.()?.toISOString(),
    error: data.error
  };
}

module.exports = {
  triggerWelfareReport,
  getTaskStatus,
  getLatestTaskByUser,
  checkRecentTask
};
