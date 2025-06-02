import React, { useState } from 'react';
import { userService } from '../services/users';
import { repairService } from '../services/repairs';
import { statsService } from '../services/stats';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

const ApiTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    // Test endpoints
    const tests = [
      {
        name: 'Get Users',
        fn: () => userService.getUsers(),
        endpoint: '/users'
      },
      {
        name: 'Get User by ID',
        fn: () => userService.getUser('test-user-id'),
        endpoint: '/users/test-user-id'
      },
      {
        name: 'Get Vehicle Repairs',
        fn: () => repairService.getVehicleRepairs('test-vehicle-id'),
        endpoint: '/repairs/vehicle/test-vehicle-id'
      },
      {
        name: 'Get Repair Stats',
        fn: () => repairService.getStats(),
        endpoint: '/repairs/stats'
      },
      {
        name: 'Get Overall Stats',
        fn: () => statsService.getOverallStats(),
        endpoint: '/stats/overall'
      }
    ];

    for (const test of tests) {
      try {
        const data = await test.fn();
        addResult({
          endpoint: test.endpoint,
          status: 'success',
          data
        });
      } catch (error) {
        addResult({
          endpoint: test.endpoint,
          status: 'error',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    setLoading(false);
  };

  return (
    <div className="api-test-page">
      <Card className="api-test-card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={runTests}
              disabled={loading}
              variant="primary"
              loading={loading}
            >
              전체 테스트 실행
            </Button>
            {results.length > 0 && (
              <Button
                onClick={() => setResults([])}
                variant="secondary"
                disabled={loading}
              >
                결과 초기화
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <span style={{ 
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                총 {results.length}개 테스트 완료
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {results.map((result, index) => (
            <Card
              key={index}
              style={{ 
                backgroundColor: result.status === 'success' ? 'var(--gray-50)' : '#fff5f5'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 style={{ 
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--gray-900)'
                  }}>
                    {result.endpoint}
                  </h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    backgroundColor: result.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                    color: 'white'
                  }}>
                    {result.status === 'success' ? '성공' : '실패'}
                  </span>
                </div>
              </div>
              
              {result.status === 'success' ? (
                <pre style={{ 
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  color: 'var(--gray-800)',
                  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', monospace"
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              ) : (
                <div style={{ 
                  padding: '1rem',
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  color: 'var(--danger-color)',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>오류 메시지:</div>
                  {result.error}
                </div>
              )}
            </Card>
          ))}

          {results.length === 0 && !loading && (
            <Card>
              <div style={{ 
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--gray-500)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ 
                  margin: '0 0 0.5rem',
                  color: 'var(--gray-700)',
                  fontSize: '1.125rem'
                }}>
                  API 테스트 결과가 없습니다
                </h3>
                <p style={{ 
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--gray-500)'
                }}>
                  테스트를 실행하면 결과가 여기에 표시됩니다
                </p>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApiTest; 