import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Divider,
  Link,
  IconButton,
} from '@mui/material';
import { Save, Science, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2, color: 'primary.main' }}
            size="large"
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ 
              color: 'primary.main', 
              mb: 0,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #00bcd4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ⚙️ 系统设置
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
              配置AI模型和无人机连接
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Message Alert */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="AI Model Configuration" />
          <Tab label="Drone Connection" />
        </Tabs>

        {/* AI Model Configuration Tab */}
        {activeTab === 0 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  AI Model Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure your AI model for natural language drone control
                </Typography>
              </Grid>

              {/* Provider Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>AI Provider</InputLabel>
                  <Select
                    value={modelConfig.provider}
                    label="AI Provider"
                    onChange={(e) => handleProviderChange(e.target.value)}
                  >
                    {Object.entries(providers).map(([key, provider]) => (
                      <MenuItem key={key} value={provider.name}>
                        {key} - {provider.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Model Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!selectedProvider}>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={modelConfig.model_id}
                    label="Model"
                    onChange={(e) => handleModelConfigChange('model_id', e.target.value)}
                  >
                    {/* Show detected Ollama models if available */}
                    {modelConfig.provider === 'ollama' && ollamaModels.length > 0 ? (
                      <>
                        {ollamaModels.map((model) => (
                          <MenuItem key={model} value={model}>
                            {model} ✅
                          </MenuItem>
                        ))}
                        <Divider />
                        {selectedProvider?.models.map((model) => (
                          <MenuItem key={model} value={model}>
                            {model} (will download)
                          </MenuItem>
                        ))}
                      </>
                    ) : (
                      selectedProvider?.models.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {modelConfig.provider === 'ollama' && ollamaLoading && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Detecting models...
                  </Typography>
                )}
              </Grid>

              {/* Configuration Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Configuration Name"
                  value={modelConfig.name}
                  onChange={(e) => handleModelConfigChange('name', e.target.value)}
                  placeholder="e.g., openai-gpt4"
                />
              </Grid>

              {/* API Key */}
              {selectedProvider?.name !== 'ollama' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="API Key"
                    value={modelConfig.api_key}
                    onChange={(e) => handleModelConfigChange('api_key', e.target.value)}
                    placeholder="Enter your API key"
                    helperText={
                      <Link 
                        href={selectedProvider?.api_key_url} 
                        target="_blank" 
                        rel="noopener"
                      >
                        Get API key from {selectedProvider?.api_key_url}
                      </Link>
                    }
                  />
                </Grid>
              )}

              {/* Base URL (for Ollama and other providers) */}
              {(modelConfig.provider === 'ollama' || modelConfig.provider === 'qwen' || modelConfig.provider === 'deepseek' || modelConfig.provider === 'moonshot' || modelConfig.provider === 'xai') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={modelConfig.provider === 'ollama' ? 'Ollama Server URL' : 'Base URL'}
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
                    helperText={
                      modelConfig.provider === 'ollama' 
                        ? 'Local: http://localhost:11434, LAN: http://192.168.1.100:11434, Internet: https://your-domain.com:11434'
                        : 'Custom API endpoint (optional)'
                    }
                    InputProps={modelConfig.provider === 'ollama' ? {
                      endAdornment: (
                        <IconButton
                          onClick={() => loadOllamaModels(modelConfig.base_url || 'http://localhost:11434')}
                          disabled={ollamaLoading}
                          size="small"
                        >
                          <Refresh />
                        </IconButton>
                      )
                    } : undefined}
                  />
                </Grid>
              )}

              {/* Advanced Settings */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Advanced Settings
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Tokens"
                  value={modelConfig.max_tokens}
                  onChange={(e) => handleModelConfigChange('max_tokens', parseInt(e.target.value))}
                  inputProps={{ min: 100, max: 4000 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Temperature"
                  value={modelConfig.temperature}
                  onChange={(e) => handleModelConfigChange('temperature', parseFloat(e.target.value))}
                  inputProps={{ min: 0, max: 2, step: 0.1 }}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Science />}
                    onClick={handleTestConnection}
                    disabled={loading || !modelConfig.provider || !modelConfig.model_id}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveModel}
                    disabled={loading || !modelConfig.provider || !modelConfig.model_id}
                  >
                    Save Configuration
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Drone Connection Tab */}
        {activeTab === 1 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Drone Connection
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure connection to your drone or simulator
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Connection String"
                  value={droneConfig.connection_string}
                  onChange={(e) => setDroneConfig(prev => ({ ...prev, connection_string: e.target.value }))}
                  placeholder="udp:127.0.0.1:14550"
                  helperText="Examples: udp:127.0.0.1:14550 (simulator), /dev/ttyACM0 (USB), tcp:192.168.1.100:5760 (TCP)"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleConnectDrone}
                  disabled={loading}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Connect Drone
                </Button>
              </Grid>

              {/* Connection Examples */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Connection Examples:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>Simulator:</strong> udp:127.0.0.1:14550
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>USB Connection:</strong> /dev/ttyACM0 (Linux) or COM3 (Windows)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>TCP Connection:</strong> tcp:192.168.1.100:5760
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>UDP Connection:</strong> udp:192.168.1.100:14550
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default SettingsPage;