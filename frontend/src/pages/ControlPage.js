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
          content: 'DeepDrone Control Interface Ready. Use natural language to control your drone.',
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
      setError('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Failed to communicate with AI. Please check your connection.',
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
    'Connect to drone and take off to 30 meters',
    'Show current battery status and location',
    'Fly in a square pattern with 50 meter sides',
    'Return to home and land safely',
    'Emergency stop and hover in place'
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
            {!currentModel?.configured && 'AI Model not configured. '}
            {!droneStatus?.connected && 'Drone not connected. '}
            Please check your settings before controlling the drone.
          </span>
          <button 
            className="button button--primary"
            onClick={() => navigate('/settings')}
          >
            Settings
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
                AI Control Interface
              </h2>
              <button 
                className="button button--secondary"
                onClick={() => setMessages([])}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                Clear
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
                      {message.type === 'user' ? '👤 You' : 
                       message.type === 'error' ? '❌ Error' : 
                       message.type === 'system' ? 'ℹ️ System' : '🤖 AI'}
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
                  🤖 AI is processing...
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
                placeholder="Type your drone command here... (e.g., 'Take off to 30 meters')"
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
                Send
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
              Quick Commands
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
              Drone Status
            </h3>
            {droneStatus?.connected ? (
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div className="status status--success" style={{ marginBottom: 'var(--space-xs)' }}>
                  <div className="status-dot"></div>
                  Battery: {droneStatus.battery}%
                </div>
                <p style={{ color: 'var(--color-secondary)', margin: 0 }}>
                  Mode: {droneStatus.mode}<br/>
                  Altitude: {droneStatus.altitude}m<br/>
                  Armed: {droneStatus.armed ? 'Yes' : 'No'}
                </p>
              </div>
            ) : (
              <div className="status status--error">
                <div className="status-dot"></div>
                Drone not connected
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
              AI Model
            </h3>
            {currentModel?.configured ? (
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <div className="status status--success" style={{ marginBottom: 'var(--space-xs)' }}>
                  <div className="status-dot"></div>
                  Ready
                </div>
                <p style={{ color: 'var(--color-secondary)', margin: 0 }}>
                  Provider: {currentModel.model_info?.provider}<br/>
                  Model: {currentModel.model_info?.model_id}
                </p>
              </div>
            ) : (
              <div className="status status--error">
                <div className="status-dot"></div>
                No AI model configured
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ControlPage;