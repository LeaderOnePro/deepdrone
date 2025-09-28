import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/apiService';
import { useAppContext } from '../context/AppContext';

const ControlPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const {
    currentModel,
    droneStatus,
    actions,
    loading,
    isSystemReady
  } = useAppContext();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        actions.setLoading('model', true);
        const modelResponse = await apiService.getCurrentModel();
        actions.setCurrentModel(modelResponse.data);

        actions.setLoading('drone', true);
        const droneResponse = await apiService.getDroneStatus();
        actions.setDroneStatus(droneResponse.data);
      } catch (statusError) {
        actions.setError(statusError.message);
      }
    };

    fetchStatus();
  }, [actions]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'system',
          content: 'DeepDrone 控制界面已就绪。使用自然语言控制您的无人机。',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.sendChatMessage(inputMessage);
      console.log('Chat response received:', response.data);
      
      // Check if response has the expected structure
      if (!response.data || typeof response.data.response !== 'string') {
        throw new Error('Invalid response format from server');
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        execution_results: response.data.execution_results || []
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Add execution results as separate messages if present
      if (response.data.execution_results && response.data.execution_results.length > 0) {
        const executionMessage = {
          id: Date.now() + 2,
          type: 'execution',
          content: response.data.execution_results,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, executionMessage]);
      }
    } catch (error) {
      console.error('Chat error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setError('发送消息失败，请重试。');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: '与 AI 通信失败，请检查您的连接。',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const quickCommands = [
    '连接无人机并起飞到30米高度',
    '显示当前电池状态和位置信息',
    '返回起飞点并安全降落',
    '紧急停止并悬停在当前位置'
  ];

  const statusLoading = loading?.model || loading?.drone;
  const hasStatusInfo = Boolean(currentModel) || Boolean(droneStatus);
  const systemReady = Boolean(isSystemReady);

  return (
    <Layout>
      {/* 系统状态检查 */}
      {hasStatusInfo && !systemReady && !statusLoading && (
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)' }}>
            {!currentModel?.configured && 'AI 模型未配置。'}
            {!droneStatus?.connected && '无人机未连接。'}
            需要连接无人机才能进行控制
          </span>
          <button 
            className="button button--primary"
            onClick={() => {
              if (!droneStatus?.connected) {
                navigate('/settings?tab=drone');
              } else {
                navigate('/settings');
              }
            }}
          >
            {!droneStatus?.connected ? '连接' : '设置'}
          </button>
        </div>
      )}

      <div className="grid grid--3" style={{ gap: 'var(--space-xl)' }}>
        {/* AI控制界面 */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              borderBottom: '1px solid var(--color-border)',
              padding: 'var(--space-sm) var(--space-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                AI 控制界面
              </h2>
              <button 
                className="button button--secondary"
                onClick={() => setMessages([])}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                清空
              </button>
            </div>

            {/* 消息区域 */}
            <div style={{ 
              flex: 1,
              padding: 'var(--space-md)',
              overflowY: 'auto',
              backgroundColor: 'var(--color-surface)',
              minHeight: 0
            }}>
              {/* 快捷指令区域 - 在消息区域内部 */}
              <div style={{ 
                marginBottom: 'var(--space-lg)',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <h4 style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 600,
                  marginBottom: 'var(--space-sm)',
                  color: 'var(--color-secondary)'
                }}>
                  快捷指令
                </h4>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '16px' 
                }}>
                  {quickCommands.map((command, index) => (
                    <button
                      key={index}
                      className="button button--secondary"
                      onClick={() => setInputMessage(command)}
                      disabled={!systemReady}
                      style={{ 
                        fontSize: '11px',
                        padding: '4px 8px',
                        opacity: !systemReady ? 0.5 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {command}
                    </button>
                  ))}
                </div>
              </div>
              {messages.map((message) => (
                <div key={message.id} style={{ marginBottom: 'var(--space-md)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-xs)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    <span style={{ 
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: message.type === 'user' ? 'var(--color-primary)' : 
                             message.type === 'error' ? 'var(--color-error)' : 
                             message.type === 'execution' ? 'var(--color-success)' :
                             'var(--color-secondary)'
                    }}>
                      {message.type === 'user' ? '👤 您' : 
                       message.type === 'error' ? '❌ 错误' : 
                       message.type === 'system' ? 'ℹ️ 系统' : 
                       message.type === 'execution' ? '⚙️ 执行结果' : '🤖 AI'}
                    </span>
                    <span style={{ 
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-tertiary)'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ 
                    padding: 'var(--space-sm)',
                    backgroundColor: message.type === 'user' ? 'var(--color-primary)' : 'var(--color-background)',
                    color: message.type === 'user' ? 'var(--color-background)' : 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.type === 'execution' ? (
                      <div>
                        {message.content.map((result, index) => (
                          <div key={index} style={{ 
                            marginBottom: index < message.content.length - 1 ? 'var(--space-sm)' : 0,
                            padding: 'var(--space-sm)',
                            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            <div style={{ 
                              fontSize: 'var(--font-size-xs)', 
                              fontWeight: 600,
                              marginBottom: 'var(--space-xs)',
                              color: result.success ? '#155724' : '#721c24'
                            }}>
                              {result.success ? '✅ 执行成功' : '❌ 执行失败'}
                            </div>
                            {result.output && (
                              <div style={{ 
                                fontSize: 'var(--font-size-xs)',
                                color: '#155724',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {result.output}
                              </div>
                            )}
                            {result.error && (
                              <div style={{ 
                                fontSize: 'var(--font-size-xs)',
                                color: '#721c24',
                                fontFamily: 'monospace'
                              }}>
                                {result.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-xs)',
                  color: 'var(--color-secondary)',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  🤖 AI 正在处理中...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div style={{ 
              padding: 'var(--space-md)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: 'var(--space-sm)'
            }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="在此输入无人机指令... (例如：'起飞到30米高度')"
                disabled={!systemReady || isLoading}
                style={{
                  flex: 1,
                  height: '40px',
                  resize: 'none',
                  padding: 'var(--space-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit'
                }}
              />
              <button
                className="button button--primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !systemReady || isLoading}
                style={{ 
                  height: '40px',
                  opacity: (!inputMessage.trim() || !systemReady || isLoading) ? 0.5 : 1
                }}
              >
                发送
              </button>
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-sm)',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: 'var(--radius-sm)',
                margin: 'var(--space-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-error)'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* 状态侧边栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* 无人机状态 */}
          <div className="card" style={{ flex: '1' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 600,
              marginBottom: 'var(--space-md)'
            }}>
              无人机状态
            </h3>
            {droneStatus?.connected ? (
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div className="status status--success" style={{ marginBottom: 'var(--space-xs)' }}>
                  <div className="status-dot"></div>
                  电量: {droneStatus.battery}%
                </div>
                <p style={{ color: 'var(--color-secondary)', margin: 0 }}>
                  模式: {droneStatus.mode}<br/>
                  高度: {droneStatus.altitude}m<br/>
                  解锁: {droneStatus.armed ? '是' : '否'}
                </p>
              </div>
            ) : (
              <div>
                <div className="status status--error" style={{ marginBottom: 'var(--space-md)' }}>
                  <div className="status-dot"></div>
                  未连接
                </div>
                <p style={{ 
                  color: 'var(--color-secondary)', 
                  fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-md)'
                }}>
                  需要连接无人机才能进行控制
                </p>
                <button 
                  className="button button--secondary"
                  onClick={() => navigate('/settings?tab=drone')}
                  style={{ width: '100%' }}
                >
                  连接
                </button>
              </div>
            )}
          </div>

          {/* AI 模型状态 */}
          <div className="card" style={{ flex: '1' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 600,
              marginBottom: 'var(--space-md)'
            }}>
              AI 模型
            </h3>
            {currentModel?.configured ? (
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div className="status status--success" style={{ marginBottom: 'var(--space-xs)' }}>
                  <div className="status-dot"></div>
                  就绪
                </div>
                <p style={{ color: 'var(--color-secondary)', margin: 0 }}>
                  提供商: {currentModel.model_info?.provider}<br/>
                  模型: {currentModel.model_info?.model_id}
                </p>
              </div>
            ) : (
              <div className="status status--error">
                <div className="status-dot"></div>
                未配置 AI 模型
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ControlPage;
