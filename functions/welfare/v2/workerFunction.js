/**
 * V2 Worker Function - 비동기 리포트 생성 워커
 * 
 * 역할:
 * 1. Cloud Tasks에서 호출됨
 * 2. 기존 파이프라인 실행
 * 3. 리포트 저장
 * 4. 상태 업데이트
 * 5. 알림 발송 (FCM)
 */

const admin = require('firebase-admin');
const { runWelfarePipeline } = require('../pipeline');

// Lazy initialization
let db = null;

function getDb() {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

/**
 * Worker 메인 함수 - Cloud Tasks에서 호출
 * @param {Object} payload - { taskId, userId, requestedAt }
 */
async function processWelfareReport(payload) {
  const { taskId, userId, requestedAt } = payload;
  const db = getDb();
  
  console.log(`🔧 Worker started: taskId=${taskId}, userId=${userId}`);
  
  const taskRef = db.collection('welfare_tasks').doc(taskId);
  const startTime = Date.now();

  try {
    // 1. 상태 업데이트: processing
    await taskRef.update({
      status: 'processing',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. 기존 파이프라인 실행
    console.log(`📊 Running pipeline for user: ${userId}`);
    const result = await runWelfarePipeline(userId);

    if (!result.success) {
      throw new Error(result.error || 'Pipeline failed');
    }

    // 3. 성능 메트릭 계산
    const endTime = Date.now();
    const totalLatencyMs = endTime - startTime;

    // 4. 리포트에 V2 메타데이터 추가
    const reportRef = getDb().collection('user_welfare_reports').doc(userId);
    await reportRef.update({
      version: 'v2',
      generationMethod: 'async',
      taskId,
      performanceMetrics: {
        totalLatencyMs,
        requestedAt,
        completedAt: endTime
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Task 상태 업데이트: completed
    await taskRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      result: {
        success: true,
        latencyMs: totalLatencyMs,
        isFallback: result.report?.isFallback || false
      }
    });

    // 6. 알림 발송 (FCM)
    await sendCompletionNotification(userId, taskId);

    console.log(`✅ Worker completed: taskId=${taskId}, latency=${totalLatencyMs}ms`);
    
    return { success: true, taskId, latencyMs: totalLatencyMs };

  } catch (error) {
    console.error(`❌ Worker failed: taskId=${taskId}, error=${error.message}`);
    
    // 실패 상태 업데이트
    await taskRef.update({
      status: 'failed',
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 실패 알림 발송
    await sendFailureNotification(userId, taskId, error.message);

    // Cloud Tasks가 재시도하도록 에러 throw
    throw error;
  }
}

/**
 * 완료 알림 발송 (FCM)
 */
async function sendCompletionNotification(userId, taskId) {
  try {
    const db = getDb();
    // 사용자 FCM 토큰 조회
    const userSnapshot = await db.collection('users')
      .where('firebaseUid', '==', userId)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.warn(`⚠️ User not found for FCM: ${userId}`);
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) {
      console.log(`ℹ️ No FCM tokens for user: ${userId}`);
      return;
    }

    // FCM 메시지 발송
    const message = {
      notification: {
        title: '📋 복지 리포트가 준비되었습니다',
        body: '맞춤 복지 서비스 추천을 확인해보세요!'
      },
      data: {
        type: 'welfare_report_ready',
        taskId,
        userId
      },
      tokens: fcmTokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`📱 FCM sent: success=${response.successCount}, failure=${response.failureCount}`);

    // 실패한 토큰 정리
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        // 실패한 토큰 제거
        await userSnapshot.docs[0].ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
        });
        console.log(`🗑️ Removed ${failedTokens.length} invalid FCM tokens`);
      }
    }

  } catch (error) {
    // FCM 실패는 전체 작업 실패로 처리하지 않음
    console.error(`⚠️ FCM notification failed: ${error.message}`);
  }
}

/**
 * 실패 알림 발송
 */
async function sendFailureNotification(userId, taskId, errorMessage) {
  try {
    const db = getDb();
    const userSnapshot = await db.collection('users')
      .where('firebaseUid', '==', userId)
      .limit(1)
      .get();

    if (userSnapshot.empty) return;

    const userData = userSnapshot.docs[0].data();
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    const message = {
      notification: {
        title: '⚠️ 리포트 생성 실패',
        body: '잠시 후 다시 시도해주세요.'
      },
      data: {
        type: 'welfare_report_failed',
        taskId,
        userId,
        error: errorMessage
      },
      tokens: fcmTokens
    };

    await admin.messaging().sendEachForMulticast(message);
    
  } catch (error) {
    console.error(`⚠️ Failure notification failed: ${error.message}`);
  }
}

/**
 * 보호자 알림 발송 (Guardian Mode)
 * - 위험 감지 시 보호자에게 알림
 */
async function sendGuardianNotification(userId, riskReport) {
  try {
    const db = getDb();
    // 사용자 정보 조회
    const userSnapshot = await db.collection('users')
      .where('firebaseUid', '==', userId)
      .limit(1)
      .get();

    if (userSnapshot.empty) return;

    const userData = userSnapshot.docs[0].data();
    
    // Guardian Mode 활성화 확인
    if (!userData.guardianModeEnabled || !userData.guardianIds?.length) {
      return;
    }

    // 보호자 FCM 토큰 수집
    const guardianTokens = [];
    for (const guardianId of userData.guardianIds) {
      const guardianDoc = await getDb().collection('users').doc(guardianId).get();
      if (guardianDoc.exists) {
        const guardianData = guardianDoc.data();
        if (guardianData.fcmTokens?.length) {
          guardianTokens.push(...guardianData.fcmTokens);
        }
      }
    }

    if (guardianTokens.length === 0) return;

    // 위험 유형별 메시지 템플릿
    const templates = {
      battery_warning: {
        title: `⚠️ ${userData.name}님 휠체어 배터리 주의`,
        body: '배터리 방전 위험이 감지되었습니다. 충전 상태를 확인해주세요.'
      },
      activity_decline: {
        title: `💙 ${userData.name}님 활동 변화 알림`,
        body: '최근 외부 활동이 줄었습니다. 안부 전화를 드려보세요.'
      },
      danger_zone: {
        title: `🚨 ${userData.name}님 이동 경로 주의`,
        body: '자주 이용하는 경로에 위험 구간이 감지되었습니다.'
      },
      maintenance_due: {
        title: `🔧 ${userData.name}님 휠체어 점검 알림`,
        body: '정기 점검 시기가 되었습니다. 점검을 권장드립니다.'
      }
    };

    const template = templates[riskReport.riskType] || {
      title: `📋 ${userData.name}님 알림`,
      body: riskReport.description
    };

    const message = {
      notification: template,
      data: {
        type: 'guardian_alert',
        userId,
        riskType: riskReport.riskType,
        severity: riskReport.severity
      },
      tokens: guardianTokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`👨‍👩‍👧 Guardian FCM sent: success=${response.successCount}`);

  } catch (error) {
    console.error(`⚠️ Guardian notification failed: ${error.message}`);
  }
}

module.exports = {
  processWelfareReport,
  sendCompletionNotification,
  sendFailureNotification,
  sendGuardianNotification
};
