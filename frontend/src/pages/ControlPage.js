import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/apiService';

const ControlPage = ({ currentModel, droneStatus }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

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
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
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
    '执行边长50米的正方形飞行路线',
    '返回起飞点并安全降落',
    '紧急停止并悬停在当前位置'
  ];

  const isSystemReady = currentModel?.configured && droneStatus?.connected;

  return (
    <Layout>
      {/* 系统状态检查 */}
      {!isSystemReady && (
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
            请在控制无人机前检查您的设置。
          </span>
          <button 
            className="button button--primary"
            onClick={() => navigate('/settings')}
          >
            设置
          </button>
        </div>
      )}

      <div className="grid grid--3" style={{ gap: 'var(--space-xl)' }}>
        {/* 聊天界面 */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              borderBottom: '1px solid var(--color-border)',
              padding: 'var(--space-md)',
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
              backgroundColor: 'var(--color-surface)'
            }}>
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
                             'var(--color-secondary)'
                    }}>
                      {message.type === 'user' ? '👤 您' : 
                       message.type === 'error' ? '❌ 错误' : 
                       message.type === 'system' ? 'ℹ️ 系统' : '🤖 AI'}
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
                    {message.content}
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
                disabled={!isSystemReady || isLoading}
                style={{
                  flex: 1,
                  minHeight: '60px',
                  resize: 'vertical',
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
                disabled={!inputMessage.trim() || !isSystemReady || isLoading}
                style={{ 
                  alignSelf: 'flex-end',
                  opacity: (!inputMessage.trim() || !isSystemReady || isLoading) ? 0.5 : 1
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

        {/* 侧边栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* 快速命令 */}
          <div className="card">
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 600,
              marginBottom: 'var(--space-md)'
            }}>
              快捷指令
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {quickCommands.map((command, index) => (
                <button
                  key={index}
                  className="button button--secondary"
                  onClick={() => setInputMessage(command)}
                  disabled={!isSystemReady}
                  style={{ 
                    textAlign: 'left',
                    fontSize: 'var(--font-size-xs)',
                    opacity: !isSystemReady ? 0.5 : 1
                  }}
                >
                  {command}
                </button>
              ))}
            </div>
          </div>

          {/* 无人机状态 */}
          <div className="card">
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
              <div className="status status--error">
                <div className="status-dot"></div>
                无人机未连接
              </div>
            )}
          </div>

          {/* AI 模型状态 */}
          <div className="card">
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