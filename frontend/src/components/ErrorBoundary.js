import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 在生产环境中，可以将错误发送到错误报告服务
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
      // 这里可以集成错误报告服务，如 Sentry
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#dc3545',
              marginBottom: '16px'
            }}>
              ⚠️ 应用程序出现错误
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: '#6c757d',
              marginBottom: '24px'
            }}>
              很抱歉，应用程序遇到了一个意外错误。请刷新页面重试。
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                backgroundColor: '#fff',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  错误详情 (开发模式)
                </summary>
                <pre style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#dc3545',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                刷新页面
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;