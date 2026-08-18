import React from 'react';
import './UI.css';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, action, className = '' }) => {
  return (
    <div className={`card-header ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {action && <div className="card-action">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
};

export default Card;
