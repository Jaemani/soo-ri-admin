/**
 * V2 Welfare Module - 비동기 아키텍처
 * 
 * 모듈 구조:
 * - triggerFunction: 비동기 요청 트리거
 * - workerFunction: 백그라운드 워커
 */

const { 
  triggerWelfareReport, 
  getTaskStatus, 
  getLatestTaskByUser 
} = require('./triggerFunction');

const { 
  processWelfareReport,
  sendGuardianNotification 
} = require('./workerFunction');

module.exports = {
  // Trigger Functions
  triggerWelfareReport,
  getTaskStatus,
  getLatestTaskByUser,
  
  // Worker Functions
  processWelfareReport,
  sendGuardianNotification
};
