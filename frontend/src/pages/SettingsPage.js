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
} from '@mui/material';
import { Save, TestTube, Refresh } from '@mui/icons-material';
import { apiService } from '../services/apiService';

const SettingsPage = ({ currentModel, onModelUpdate }) => {
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
      setMessage({ type: 'error', text: 'Failed to load AI providers' });
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
      base_url: provider === 'ollama' ? 'http://localhost:11434' : '',
    }));
  };

  const handleSaveModel = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.configureModel(modelConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'AI model configured successfully!' });
        onModelUpdate();
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Model configuration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to configure AI model' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!modelConfig.provider || !modelConfig.model_id) {
      setMessage({ type: 'error', text: 'Please select provider and model first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await apiService.configureModel(modelConfig);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Connection test successful!' });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Connection test failed' 
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
        setMessage({ type: 'success', text: 'Drone connected successfully!' });
      } else {
        setMessage({ type: 'error', text: response.data.message });
      }
    } catch (error) {
      console.error('Drone connection error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to connect to drone' 
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
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
          ⚙️ Settings
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          Configure AI models and drone connections
        </Typography>
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
                    {selectedProvider?.models.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

              {/* Base URL (for Ollama) */}
              {modelConfig.provider === 'ollama' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={modelConfig.base_url}
                    onChange={(e) => handleModelConfigChange('base_url', e.target.value)}
                    placeholder="http://localhost:11434"
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
                    startIcon={<TestTube />}
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