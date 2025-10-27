import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { login } from '../services/auth';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiBase = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${apiBase}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        if (data.admin) {
          localStorage.setItem('adminId', data.admin.id);
          localStorage.setItem('stationLabel', data.admin.label);
        }
        navigate('/');
      } else {
        throw new Error('로그인에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1 className="login-title">수리수리 마수리</h1>
        <h2 className="login-subtitle">관리자 로그인</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              disabled={isLoading}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
              className="form-control"
            />
          </div>
          
          {error && (
            <p className="login-error">{error}</p>
          )}
          
          <Button 
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading || !id || !password}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;