import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = memo(({ children }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 极简顶栏 */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-md) 0'
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div>
              <h1 style={{ 
                fontSize: 'var(--font-size-xl)', 
                fontWeight: 700,
                color: 'var(--color-primary)',
                margin: 0
              }}>
                DeepDrone
              </h1>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-tertiary)',
                margin: 0,
                marginTop: 'var(--space-xs)'
              }}>
                臻巅科技
              </p>
            </div>
            
            <nav style={{ display: 'flex', gap: 'var(--space-lg)' }}>
              <Link 
                to="/dashboard" 
                style={{ 
                  fontSize: 'var(--font-size-sm)',
                  color: isActive('/dashboard') ? 'var(--color-primary)' : 'var(--color-secondary)',
                  fontWeight: isActive('/dashboard') ? 600 : 500,
                  textDecoration: 'none'
                }}
              >
                仪表盘
              </Link>
              <Link 
                to="/control" 
                style={{ 
                  fontSize: 'var(--font-size-sm)',
                  color: isActive('/control') ? 'var(--color-primary)' : 'var(--color-secondary)',
                  fontWeight: isActive('/control') ? 600 : 500,
                  textDecoration: 'none'
                }}
              >
                控制台
              </Link>
              <Link 
                to="/settings" 
                style={{ 
                  fontSize: 'var(--font-size-sm)',
                  color: isActive('/settings') ? 'var(--color-primary)' : 'var(--color-secondary)',
                  fontWeight: isActive('/settings') ? 600 : 500,
                  textDecoration: 'none'
                }}
              >
                设置
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <main style={{ 
        flex: 1,
        padding: 'var(--space-xxl) 0'
      }}>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;