import React from 'react';
import Card, { CardBody } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, trend, trendDirection, icon }) => {
  return (
    <Card>
      <CardBody style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        </div>
        
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            {trendDirection === 'up' ? (
              <TrendingUp size={16} color="var(--success)" />
            ) : (
              <TrendingDown size={16} color="var(--danger)" />
            )}
            <span style={{ color: trendDirection === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 500 }}>
              {trend.split(' ')[0]}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {trend.substring(trend.indexOf(' '))}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default MetricCard;
