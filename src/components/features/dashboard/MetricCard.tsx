import React, { ReactNode } from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'info' | 'warning' | 'success';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  variant = 'default'
}) => {
  return (
    <div className={`metric-card metric-card-${variant}`}>
      <div className="metric-card-content">
        <div className="metric-info">
          <h3 className="metric-title">{title}</h3>
          <div className="metric-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          {trend && (
            <div className={`metric-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
              <span className="trend-arrow">{trend.isPositive ? '↑' : '↓'}</span>
              <span className="trend-value">{Math.abs(trend.value)}%</span>
              <span className="trend-period">지난 주 대비</span>
            </div>
          )}
        </div>
        <div className="metric-icon">{icon}</div>
      </div>
    </div>
  );
};

export default MetricCard; 