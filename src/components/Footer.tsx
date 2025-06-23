import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
<footer className="footer"
    style={{
      background: '#F5F3E6',
      height: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Pretendard',
    }}>
    <div style={{ fontSize: 26, color: '#1A1A1A', marginBottom: 24, fontWeight: 600 }}>
      Our partners
    </div>
    <div
        style={{
            display: 'flex',
            gap: 75,
            alignItems: 'center',
            marginBottom: 32,
            height: 60,
            padding: 0,
        }}
    >
        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            <img
                src={'/welfare_center_logo.png'}
                alt="성동종합사회복지관 로고"
                style={{ height: 60 }}
            />
        </div>
        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            <img
                src={'/kakao_impact_logo_color.png'}
                alt="카카오임팩트 로고"
                style={{ height: 50 }}
            />
        </div>
        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            <img
                src={'/catch_star_logo.png'}
                alt="별따러가자 로고"
                style={{ height: 60 }}
            />
        </div>
    </div>

    <div style={{ fontSize: 14, fontWeight: 500, color: 'rgb(144, 144, 147)', textAlign: 'center' }}>
    본 서비스는 카카오임팩트의 기술 이니셔티브&nbsp;
        <a
            href="https://techforimpact.io/"
            style={{ color: 'rgb(144, 144, 147)', textDecoration: 'underline', fontWeight: 600 }}
        >
            테크포임팩트
        </a>
    &nbsp;의 지원으로 개발되었습니다.
    </div>

</footer>
);

export default Footer;