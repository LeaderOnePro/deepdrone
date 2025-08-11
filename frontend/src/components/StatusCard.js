import React from 'react';

const StatusCard = ({ title, status, value, description, action }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'success': return 'status--success';
      case 'warning': return 'status--warning';
      case 'error': return 'status--error';
      default: return '';
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 600,
          marginBottom: 'var(--space-xs)',
          color: 'var(--color-primary)'
        }}>
          {title}
        </h3>
        
        {status && (
          <div className={`status ${getStatusClass(status)}`}>
            <div className="status-dot"></div>
            {value}
          </div>
        )}
      </div>
      
      {description && (
        <p style={{ 
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-secondary)',
          marginBottom: action ? 'var(--space-md)' : 0
        }}>
          {description}
        </p>
      )}
      
      {action && action}
    </div>
  );
};

export default StatusCard;