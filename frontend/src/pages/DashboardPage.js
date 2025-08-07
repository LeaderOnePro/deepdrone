import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Fab,
} from '@mui/material';
import {
  FlightTakeoff,
  Battery90,
  LocationOn,
  Speed,
  Settings,
  Chat,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = ({ currentModel, droneStatus, onModelUpdate, onDroneUpdate }) => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState('ready');

  useEffect(() => {
    // Update system status based on model and drone status
    if (!currentModel?.configured) {
      setSystemStatus('no_model');
    } else if (!droneStatus?.connected) {
      setSystemStatus('no_drone');
    } else {
      setSystemStatus('ready');
    }
  }, [currentModel, droneStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'success';
      case 'no_model': return 'warning';
      case 'no_drone': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return '系统就绪';
      case 'no_model': return 'AI模型未配置';
      case 'no_drone': return '无人机未连接';
      default: return '未知状态';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 800,
          fontSize: '3rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          mb: 1,
        }}>
          🚁 DeepDrone 2.0
        </Typography>
        <Typography variant="subtitle1" sx={{ 
          color: 'text.secondary', 
          fontSize: '1.2rem',
          textAlign: 'center',
          fontWeight: 500,
          mb: 2,
        }}>
          新一代AI驱动的智能无人机控制系统
        </Typography>
        <Typography variant="body2" sx={{ 
          textAlign: 'center',
          color: '#6366f1',
          fontWeight: 600,
          fontSize: '1rem',
        }}>
          by 臻巅科技 ⚡
        </Typography>
      </Box>

      {/* System Status Alert */}
      {systemStatus !== 'ready' && (
        <Alert 
          severity={systemStatus === 'no_model' ? 'warning' : 'error'} 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { fontSize: '1rem' }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/settings')}
              sx={{ fontWeight: 500 }}
            >
              立即配置
            </Button>
          }
        >
          {getStatusText(systemStatus)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Status Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">系统状态</Typography>
              </Box>
              <Chip 
                label={getStatusText(systemStatus)}
                color={getStatusColor(systemStatus)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                系统整体健康状态和就绪情况
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Model Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chat sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">AI模型</Typography>
              </Box>
              {currentModel?.configured ? (
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {currentModel.model_info?.provider}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentModel.model_info?.model_id}
                  </Typography>
                  <Chip label="Connected" color="success" size="small" sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    未配置AI模型
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/settings')}
                    sx={{ mt: 1 }}
                  >
                    立即配置
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Drone Status Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FlightTakeoff sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">无人机状态</Typography>
              </Box>
              {droneStatus?.connected ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Battery90 sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      电池: {droneStatus.battery}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={droneStatus.battery} 
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    模式: {droneStatus.mode}
                  </Typography>
                  <Chip label="Connected" color="success" size="small" sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    无人机未连接
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/settings')}
                    sx={{ mt: 1 }}
                  >
                    立即连接
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                快速操作
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Chat />}
                  onClick={() => navigate('/control')}
                  disabled={systemStatus !== 'ready'}
                  fullWidth
                >
                  开始控制
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => navigate('/settings')}
                  fullWidth
                >
                  系统设置
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Card (if drone connected) */}
        {droneStatus?.connected && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">位置信息</Typography>
                </Box>
                <Typography variant="body1">
                  纬度: {droneStatus.location?.lat?.toFixed(6)}
                </Typography>
                <Typography variant="body1">
                  经度: {droneStatus.location?.lon?.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  海拔: {droneStatus.altitude}米
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* System Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                系统信息
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ fontWeight: 500 }}>
                DeepDrone 2.0 - 新一代AI驱动的智能无人机控制系统 by 臻巅科技 ⚡
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 自然语言无人机控制
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 多AI提供商支持
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 实时遥测数据监控
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 安全飞行操作保障
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button for Quick Access */}
      {systemStatus === 'ready' && (
        <Fab
          color="primary"
          aria-label="start control"
          onClick={() => navigate('/control')}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 16 }, // Account for mobile navigation
            right: 16,
          }}
        >
          <Chat />
        </Fab>
      )}
    </Box>
  );
};

export default DashboardPage;