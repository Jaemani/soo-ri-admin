import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
  style?: React.CSSProperties;
  variant?: 'default' | 'info' | 'warning' | 'success';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '', 
  noPadding = false,
  style = {},
  variant = 'default'
}) => {
  return (
    <div 
      className={`card ${variant !== 'default' ? `card-${variant}` : ''} ${className}`}
      style={{
        padding: noPadding ? 0 : '1.5rem',
        ...style
      }}
    >
      {title && (
        <div className="card-title">
          {title}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card; 