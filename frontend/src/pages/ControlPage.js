import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Send,
  FlightTakeoff,
  FlightLand,
  Stop,
  Refresh,
  Clear,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const ControlPage = ({ currentModel, droneStatus }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'system',
          content: 'Welcome to DeepDrone Control! You can use natural language to control your drone.',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
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
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.sendChatMessage(userMessage.content);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickCommand = (command) => {
    setInputMessage(command);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: 1,
        type: 'system',
        content: 'Chat cleared. Ready for new commands.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'user': return 'primary.main';
      case 'assistant': return 'success.main';
      case 'system': return 'info.main';
      case 'error': return 'error.main';
      default: return 'text.primary';
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'user': return '👤';
      case 'assistant': return '🤖';
      case 'system': return 'ℹ️';
      case 'error': return '❌';
      default: return '';
    }
  };

  // Check if system is ready
  const isSystemReady = currentModel?.configured && droneStatus?.connected;

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
              🎮 无人机控制中心
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
              使用自然语言控制您的无人机
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* System Status Alert */}
      {!isSystemReady && (
        <Alert severity="warning" sx={{ 
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-message': { fontSize: '1rem' }
        }}>
          {!currentModel?.configured && 'AI模型未配置。'}
          {!droneStatus?.connected && '无人机未连接。'}
          请在控制无人机前检查您的设置。
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Chat Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">AI聊天界面</Typography>
                <Box>
                  <IconButton onClick={clearMessages} size="small">
                    <Clear />
                  </IconButton>
                  <IconButton onClick={scrollToBottom} size="small">
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>

              {/* Messages Area */}
              <Paper 
                sx={{ 
                  flexGrow: 1, 
                  p: 2, 
                  mb: 2, 
                  overflow: 'auto',
                  bgcolor: 'background.default',
                  border: '1px solid #333'
                }}
              >
                {messages.map((message) => (
                  <Box key={message.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>
                        {getMessageIcon(message.type)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ color: getMessageColor(message.type), fontWeight: 'bold' }}
                      >
                        {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        bgcolor: message.type === 'user' ? 'primary.dark' : 'transparent',
                        p: message.type === 'user' ? 1 : 0,
                        borderRadius: message.type === 'user' ? 1 : 0,
                      }}
                    >
                      {message.content}
                    </Typography>
                  </Box>
                ))}
                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      🤖 AI is thinking...
                    </Typography>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Paper>

              {/* Input Area */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your drone command here... (e.g., 'Take off to 30 meters')"
                  disabled={!isSystemReady || isLoading}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isSystemReady || isLoading}
                  startIcon={<Send />}
                >
                  Send
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Control Panel */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Quick Commands */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Commands
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<FlightTakeoff />}
                      onClick={() => handleQuickCommand('Connect to drone and take off to 30 meters')}
                      disabled={!isSystemReady}
                      fullWidth
                    >
                      Take Off (30m)
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleQuickCommand('Fly in a square pattern with 50 meter sides')}
                      disabled={!isSystemReady}
                      fullWidth
                    >
                      Square Pattern
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleQuickCommand('Show current battery status and location')}
                      disabled={!isSystemReady}
                      fullWidth
                    >
                      Status Check
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FlightLand />}
                      onClick={() => handleQuickCommand('Return to home and land safely')}
                      disabled={!isSystemReady}
                      fullWidth
                    >
                      Return Home
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Stop />}
                      onClick={() => handleQuickCommand('Emergency stop and hover in place')}
                      disabled={!isSystemReady}
                      fullWidth
                    >
                      Emergency Stop
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Drone Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Drone Status
                  </Typography>
                  {droneStatus?.connected ? (
                    <Box>
                      <Box sx={{ mb: 1 }}>
                        <Chip 
                          label={`Battery: ${droneStatus.battery}%`} 
                          color={droneStatus.battery > 50 ? 'success' : droneStatus.battery > 20 ? 'warning' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2">
                        Mode: {droneStatus.mode}
                      </Typography>
                      <Typography variant="body2">
                        Altitude: {droneStatus.altitude}m
                      </Typography>
                      <Typography variant="body2">
                        Armed: {droneStatus.armed ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Drone not connected
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* AI Model Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Model
                  </Typography>
                  {currentModel?.configured ? (
                    <Box>
                      <Typography variant="body2">
                        Provider: {currentModel.model_info?.provider}
                      </Typography>
                      <Typography variant="body2">
                        Model: {currentModel.model_info?.model_id}
                      </Typography>
                      <Chip label="Ready" color="success" size="small" sx={{ mt: 1 }} />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No AI model configured
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ControlPage;