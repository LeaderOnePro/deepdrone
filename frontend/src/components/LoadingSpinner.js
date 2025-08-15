import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = '加载中...' }) => {
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: '16px'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6c757d'
        }}>
          {message}
        </p>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(LoadingSpinner);