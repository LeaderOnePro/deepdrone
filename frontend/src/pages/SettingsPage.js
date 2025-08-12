import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { apiService } from '../services/apiService';

const SettingsPage = ({ currentModel, onModelUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // AI Model Configuration
  const [modelConfig, setModelConfig] = useState({
    name: '',
    provider: '',
    model_id: '',
    api_key: '',
    base_url: '',
    max_tokens: 2048,
    temperature: 0.7,
  });

  // Drone Configuration
  const [droneConfig, setDroneConfig] = useState({
    connection_string: 'udp:127.0.0.1:14550',
  });

  // Ollama specific state
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  useEffect(() => {
    loadProviders();
    if (currentModel?.configured) {
      setModelConfig({
        name: currentModel.model_info.name || '',
        provider: currentModel.model_info.provider || '',
        model_id: currentModel.model_info.model_id || '',
        api_key: '', // Don't show existing API key for security
        base_url: currentModel.model_info.base_url || '',
        max_tokens: currentModel.model_info.max_tokens || 2048,
        temperature: currentModel.model_info.temperature || 0.7,
      });
    }
  }, [currentModel]);

  const loadProviders = async () => {
    try {
      const response = await apiService.getProviders();
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setMessage({ type: 'error', text: '加载AI提供商失败' });
    }
  };

  const handleModelConfigChange = (field, value) => {
    setModelConfig(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate name if not set
    if (field === 'provider' || field === 'model_id') {
      const newConfig = { ...modelConfig, [field]: value };
      if (newConfig.provider && newConfig.model_id && !newConfig.name) {
        setModelConfig(prev => ({
          ...prev,
          [field]: value,
          name: `${newConfig.provider}-${newConfig.model_id}`,
        }));
      }
    }
  };

  const handleProviderChange = (provider) => {
    setModelConfig(prev => ({
      ...prev,
      provider,
      model_id: '',
      base_url: provider === 'ollama' ? 'http://localhost:11434' 
               : provider === 'qwen' ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
               : provider === 'deepseek' ? 'https://api.deepseek.com/v1'
               : provider === 'moonshot' ? 'https://api.moonshot.cn/v1'
               : provider === 'xai' ? 'https://api.x.ai/v1'
               : '',
    }));

    // Load Ollama models if Ollama is selected
    if (provider === 'ollama') {
      loadOllamaModels('http://localhost:11434');
    }
  };

  const loadOllamaModels = async (baseUrl) => {
    setOllamaLoading(true);
    try {
      const response = await apiService.getOllamaModels(baseUrl);
      if (response.data.success) {
        setOllamaModels(response.data.models);
      } else {
        setOllamaModels([]);
        console.warn('Failed to load Ollama models:', response.data.error);
      }
    } catch (error) {
      console.error('Error loading Ollama models:', error);
      setOllamaModels([]);
    } finally {
      setOllamaLoading(false);
    }
  };

  const handleSaveModel = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.configureModel(modelConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'AI模型配置成功！' });
        onModelUpdate();
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Model configuration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || '配置AI模型失败' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!modelConfig.provider || !modelConfig.model_id) {
      setMessage({ type: 'error', text: '请先选择提供商和模型' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.configureModel(modelConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: '连接测试成功！' });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || '连接测试失败' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDrone = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.connectDrone(droneConfig.connection_string);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: '无人机连接成功！' });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Drone connection error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || '连接无人机失败' 
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = providers[Object.keys(providers).find(key => 
    providers[key].name === modelConfig.provider
  )];

  return (
    <Layout>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <button 
            className="button button--secondary"
            onClick={() => navigate('/dashboard')}
            style={{ 
              marginRight: 'var(--space-md)',
              padding: 'var(--space-sm)',
              minWidth: 'auto'
            }}
          >
            ← 返回
          </button>
          <div>
            <h1 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 700,
              margin: 0,
              marginBottom: 'var(--space-xs)',
              color: 'var(--color-primary)'
            }}>
              ⚙️ 系统设置
            </h1>
            <p style={{ 
              fontSize: 'var(--font-size-md)', 
              color: 'var(--color-secondary)',
              margin: 0
            }}>
              配置 AI 模型和无人机连接
            </p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div style={{
          padding: 'var(--space-md)',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)' }}>
            {message.text}
          </span>
          <button 
            className="button button--secondary"
            onClick={() => setMessage(null)}
            style={{ 
              padding: 'var(--space-xs)',
              minWidth: 'auto',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div style={{ 
          borderBottom: '1px solid var(--color-border)',
          display: 'flex'
        }}>
          <button
            className={`tab ${activeTab === 0 ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            AI 模型配置
          </button>
          <button
            className={`tab ${activeTab === 1 ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            无人机连接
          </button>
        </div>

        {/* AI Model Configuration Tab */}
        {activeTab === 0 && (
          <div style={{ padding: 'var(--space-lg)' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 600,
                margin: 0,
                marginBottom: 'var(--space-xs)'
              }}>
                AI 模型配置
              </h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                margin: 0
              }}>
                为自然语言无人机控制配置您的 AI 模型
              </p>
            </div>

            <div className="grid grid--2" style={{ gap: 'var(--space-lg)' }}>
              {/* Provider Selection */}
              <div className="form-group">
                <label className="form-label">AI 提供商</label>
                <select
                  className="form-select"
                  value={modelConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  <option value="">选择提供商</option>
                  {Object.entries(providers).map(([key, provider]) => (
                    <option key={key} value={provider.name}>
                      {key} - {provider.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div className="form-group">
                <label className="form-label">模型</label>
                <select
                  className="form-select"
                  value={modelConfig.model_id}
                  onChange={(e) => handleModelConfigChange('model_id', e.target.value)}
                  disabled={!selectedProvider}
                >
                  <option value="">选择模型</option>
                  {/* Show detected Ollama models if available */}
                  {modelConfig.provider === 'ollama' && ollamaModels.length > 0 ? (
                    <>
                      {ollamaModels.map((model) => (
                        <option key={model} value={model}>
                          {model} ✅
                        </option>
                      ))}
                      <option disabled>──────────</option>
                      {selectedProvider?.models.map((model) => (
                        <option key={model} value={model}>
                          {model} (将下载)
                        </option>
                      ))}
                    </>
                  ) : (
                    selectedProvider?.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  )}
                </select>
                {modelConfig.provider === 'ollama' && ollamaLoading && (
                  <div className="form-helper">
                    正在检测模型...
                  </div>
                )}
              </div>

              {/* Configuration Name */}
              <div className="form-group">
                <label className="form-label">配置名称</label>
                <input
                  className="form-input"
                  type="text"
                  value={modelConfig.name}
                  onChange={(e) => handleModelConfigChange('name', e.target.value)}
                  placeholder="例如：openai-gpt4"
                />
              </div>

              {/* API Key */}
              {selectedProvider?.name !== 'ollama' && (
                <div className="form-group">
                  <label className="form-label">API 密钥</label>
                  <input
                    className="form-input"
                    type="password"
                    value={modelConfig.api_key}
                    onChange={(e) => handleModelConfigChange('api_key', e.target.value)}
                    placeholder="输入您的 API 密钥"
                  />
                  {selectedProvider?.api_key_url && (
                    <div className="form-helper">
                      从 <a 
                        href={selectedProvider.api_key_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {selectedProvider.api_key_url}
                      </a> 获取 API 密钥
                      {selectedProvider?.api_key_alternatives && (
                        <span>
                          {' 或 '}
                          {selectedProvider.api_key_alternatives.map((url, index) => (
                            <span key={url}>
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {url}
                              </a>
                              {index < selectedProvider.api_key_alternatives.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Base URL (for Ollama and other providers) */}
              {(modelConfig.provider === 'ollama' || modelConfig.provider === 'qwen' || modelConfig.provider === 'deepseek' || modelConfig.provider === 'moonshot' || modelConfig.provider === 'xai') && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    {modelConfig.provider === 'ollama' ? 'Ollama 服务器地址' : '基础 URL'}
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <input
                      className="form-input"
                      type="text"
                      value={modelConfig.base_url}
                      onChange={(e) => handleModelConfigChange('base_url', e.target.value)}
                      placeholder={
                        modelConfig.provider === 'ollama' 
                          ? 'http://localhost:11434' 
                          : modelConfig.provider === 'qwen'
                          ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
                          : modelConfig.provider === 'deepseek'
                          ? 'https://api.deepseek.com/v1'
                          : modelConfig.provider === 'moonshot'
                          ? 'https://api.moonshot.cn/v1'
                          : modelConfig.provider === 'xai'
                          ? 'https://api.x.ai/v1'
                          : ''
                      }
                    />
                    {modelConfig.provider === 'ollama' && (
                      <button
                        className="button button--secondary"
                        onClick={() => loadOllamaModels(modelConfig.base_url || 'http://localhost:11434')}
                        disabled={ollamaLoading}
                        style={{ minWidth: 'auto', padding: 'var(--space-sm)' }}
                      >
                        🔄
                      </button>
                    )}
                  </div>
                  <div className="form-helper">
                    {modelConfig.provider === 'ollama' 
                      ? '本地: http://localhost:11434, 局域网: http://192.168.1.100:11434, 互联网: https://your-domain.com:11434'
                      : '自定义 API 端点（可选）'
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div className="divider"></div>
            <h4 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 600,
              marginBottom: 'var(--space-lg)'
            }}>
              高级设置
            </h4>

            <div className="grid grid--2" style={{ gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">最大令牌数</label>
                <input
                  className="form-input"
                  type="number"
                  value={modelConfig.max_tokens}
                  onChange={(e) => handleModelConfigChange('max_tokens', parseInt(e.target.value))}
                  min="100"
                  max="4000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">温度</label>
                <input
                  className="form-input"
                  type="number"
                  value={modelConfig.temperature}
                  onChange={(e) => handleModelConfigChange('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-md)', 
              marginTop: 'var(--space-xl)' 
            }}>
              <button
                className="button button--secondary"
                onClick={handleTestConnection}
                disabled={loading || !modelConfig.provider || !modelConfig.model_id}
              >
                🧪 测试连接
              </button>
              <button
                className="button button--primary"
                onClick={handleSaveModel}
                disabled={loading || !modelConfig.provider || !modelConfig.model_id}
              >
                💾 保存配置
              </button>
            </div>
          </div>
        )}

        {/* Drone Connection Tab */}
        {activeTab === 1 && (
          <div style={{ padding: 'var(--space-lg)' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 600,
                margin: 0,
                marginBottom: 'var(--space-xs)'
              }}>
                无人机连接
              </h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                margin: 0
              }}>
                配置与您的无人机或模拟器的连接
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">连接字符串</label>
                <input
                  className="form-input"
                  type="text"
                  value={droneConfig.connection_string}
                  onChange={(e) => setDroneConfig(prev => ({ ...prev, connection_string: e.target.value }))}
                  placeholder="udp:127.0.0.1:14550"
                />
                <div className="form-helper">
                  示例: udp:127.0.0.1:14550 (模拟器), /dev/ttyACM0 (USB), tcp:192.168.1.100:5760 (TCP)
                </div>
              </div>

              <button
                className="button button--primary"
                onClick={handleConnectDrone}
                disabled={loading}
                style={{ height: '40px' }}
              >
                🔗 连接无人机
              </button>
            </div>

            {/* Connection Examples */}
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <h4 style={{ 
                fontSize: 'var(--font-size-md)', 
                fontWeight: 600,
                marginBottom: 'var(--space-md)'
              }}>
                连接示例:
              </h4>
              <div style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                lineHeight: 1.6
              }}>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>模拟器:</strong> udp:127.0.0.1:14550
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>USB 连接:</strong> /dev/ttyACM0 (Linux) 或 COM3 (Windows)
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>TCP 连接:</strong> tcp:192.168.1.100:5760
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>UDP 连接:</strong> udp:192.168.1.100:14550
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SettingsPage;