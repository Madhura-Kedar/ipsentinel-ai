import React from 'react';
import './UI.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  icon,
  ...props 
}) => {
  const classes = `btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
