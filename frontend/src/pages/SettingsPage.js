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
            ← Back
          </button>
          <div>
            <h1 style={{ 
              fontSize: 'var(--font-size-xl)', 
              fontWeight: 700,
              margin: 0,
              marginBottom: 'var(--space-xs)',
              color: 'var(--color-primary)'
            }}>
              ⚙️ System Settings
            </h1>
            <p style={{ 
              fontSize: 'var(--font-size-md)', 
              color: 'var(--color-secondary)',
              margin: 0
            }}>
              Configure AI model and drone connection
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
            AI Model Configuration
          </button>
          <button
            className={`tab ${activeTab === 1 ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            Drone Connection
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
                AI Model Configuration
              </h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                margin: 0
              }}>
                Configure your AI model for natural language drone control
              </p>
            </div>

            <div className="grid grid--2" style={{ gap: 'var(--space-lg)' }}>
              {/* Provider Selection */}
              <div className="form-group">
                <label className="form-label">AI Provider</label>
                <select
                  className="form-select"
                  value={modelConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                >
                  <option value="">Select a provider</option>
                  {Object.entries(providers).map(([key, provider]) => (
                    <option key={key} value={provider.name}>
                      {key} - {provider.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div className="form-group">
                <label className="form-label">Model</label>
                <select
                  className="form-select"
                  value={modelConfig.model_id}
                  onChange={(e) => handleModelConfigChange('model_id', e.target.value)}
                  disabled={!selectedProvider}
                >
                  <option value="">Select a model</option>
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
                          {model} (will download)
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
                    Detecting models...
                  </div>
                )}
              </div>

              {/* Configuration Name */}
              <div className="form-group">
                <label className="form-label">Configuration Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={modelConfig.name}
                  onChange={(e) => handleModelConfigChange('name', e.target.value)}
                  placeholder="e.g., openai-gpt4"
                />
              </div>

              {/* API Key */}
              {selectedProvider?.name !== 'ollama' && (
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    className="form-input"
                    type="password"
                    value={modelConfig.api_key}
                    onChange={(e) => handleModelConfigChange('api_key', e.target.value)}
                    placeholder="Enter your API key"
                  />
                  {selectedProvider?.api_key_url && (
                    <div className="form-helper">
                      <a 
                        href={selectedProvider.api_key_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Get API key from {selectedProvider.api_key_url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Base URL (for Ollama and other providers) */}
              {(modelConfig.provider === 'ollama' || modelConfig.provider === 'qwen' || modelConfig.provider === 'deepseek' || modelConfig.provider === 'moonshot' || modelConfig.provider === 'xai') && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    {modelConfig.provider === 'ollama' ? 'Ollama Server URL' : 'Base URL'}
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
                      ? 'Local: http://localhost:11434, LAN: http://192.168.1.100:11434, Internet: https://your-domain.com:11434'
                      : 'Custom API endpoint (optional)'
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
              Advanced Settings
            </h4>

            <div className="grid grid--2" style={{ gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Max Tokens</label>
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
                <label className="form-label">Temperature</label>
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
                🧪 Test Connection
              </button>
              <button
                className="button button--primary"
                onClick={handleSaveModel}
                disabled={loading || !modelConfig.provider || !modelConfig.model_id}
              >
                💾 Save Configuration
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
                Drone Connection
              </h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                margin: 0
              }}>
                Configure connection to your drone or simulator
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Connection String</label>
                <input
                  className="form-input"
                  type="text"
                  value={droneConfig.connection_string}
                  onChange={(e) => setDroneConfig(prev => ({ ...prev, connection_string: e.target.value }))}
                  placeholder="udp:127.0.0.1:14550"
                />
                <div className="form-helper">
                  Examples: udp:127.0.0.1:14550 (simulator), /dev/ttyACM0 (USB), tcp:192.168.1.100:5760 (TCP)
                </div>
              </div>

              <button
                className="button button--primary"
                onClick={handleConnectDrone}
                disabled={loading}
                style={{ height: '40px' }}
              >
                🔗 Connect Drone
              </button>
            </div>

            {/* Connection Examples */}
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <h4 style={{ 
                fontSize: 'var(--font-size-md)', 
                fontWeight: 600,
                marginBottom: 'var(--space-md)'
              }}>
                Connection Examples:
              </h4>
              <div style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-secondary)',
                lineHeight: 1.6
              }}>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>Simulator:</strong> udp:127.0.0.1:14550
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>USB Connection:</strong> /dev/ttyACM0 (Linux) or COM3 (Windows)
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>TCP Connection:</strong> tcp:192.168.1.100:5760
                </div>
                <div style={{ marginBottom: 'var(--space-xs)' }}>
                  • <strong>UDP Connection:</strong> udp:192.168.1.100:14550
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