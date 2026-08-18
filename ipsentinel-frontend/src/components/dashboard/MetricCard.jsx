import React from 'react';
import Card, { CardBody } from '../ui/Card';
import './Dashboard.css';

const MetricCard = ({ title, value, icon, trend, trendValue }) => {
  const isUp = trend === 'up';
  
  return (
    <Card className="metric-card">
      <CardBody className="metric-card-body">
        <div className="metric-header">
          <span className="metric-title">{title}</span>
          <span className="metric-icon">{icon}</span>
        </div>
        <div className="metric-value">{value}</div>
        {trendValue && (
          <div className={`metric-trend ${isUp ? 'trend-up' : 'trend-down'}`}>
            {isUp ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default MetricCard;
