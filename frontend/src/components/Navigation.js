import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Simple mobile detection
  const isMobile = window.innerWidth < 768;

  const navigationItems = [
    { path: '/dashboard', label: '仪表盘', icon: '📊' },
    { path: '/control', label: '控制台', icon: '🎮' },
    { path: '/settings', label: '设置', icon: '⚙️' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (!isMobile) {
    return null; // Don't show bottom navigation on desktop
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'var(--color-background)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: 'var(--space-sm) 0'
    }}>
      {navigationItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigation(item.path)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-sm)',
            cursor: 'pointer',
            color: location.pathname === item.path ? 'var(--color-primary)' : 'var(--color-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: location.pathname === item.path ? 600 : 400,
            transition: 'color 0.2s ease'
          }}
        >
          <span style={{ fontSize: '20px' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Navigation;