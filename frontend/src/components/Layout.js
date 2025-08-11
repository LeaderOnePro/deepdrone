import React from 'react';

const Layout = ({ children }) => {
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
              <a href="/dashboard" style={{ 
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-secondary)',
                fontWeight: 500
              }}>
                仪表盘
              </a>
              <a href="/control" style={{ 
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-secondary)',
                fontWeight: 500
              }}>
                控制台
              </a>
              <a href="/settings" style={{ 
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-secondary)',
                fontWeight: 500
              }}>
                设置
              </a>
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
};

export default Layout;