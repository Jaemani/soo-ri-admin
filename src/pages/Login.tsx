import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const response = await fetch('https://soo-ri-back.kro.kr/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '로그인에 실패했습니다.');
      }

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
      <div className="login-card">
        <div className="login-logo">
          {/* Replace with your actual logo if available */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40Z" fill="#1A237E" fillOpacity="0.9"/>
            <path d="M13 13L27 27" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M13 27L27 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h1 className="login-title">수리수리 마수리</h1>
        <h2 className="login-subtitle">관리자 로그인</h2>
        
        {error && <div className="login-error">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="user-id">아이디</label>
            <input
              id="user-id"
              className="form-input"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="user-password">비밀번호</label>
            <input
              id="user-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
            />
          </div>
          
          <button
            className="login-button"
            type="submit"
            disabled={isLoading || !id || !password}
          >
            {isLoading ? (
              <>
                <span className="login-loading"></span>
                로그인 중...
              </>
            ) : '로그인'}
          </button>
        </form>
        
        <div className="login-footer">
          수리수리 마수리 ⓒ 2023
        </div>
      </div>
    </div>
  );
};

export default Login;