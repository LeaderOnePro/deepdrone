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
} from '@mui/material';
import {
  FlightTakeoff,
  Battery90,
  LocationOn,
  Speed,
  Settings,
  Chat,
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
      case 'ready': return 'System Ready';
      case 'no_model': return 'AI Model Not Configured';
      case 'no_drone': return 'Drone Not Connected';
      default: return 'Unknown Status';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
          🚁 DeepDrone Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          AI-Powered Drone Control System
        </Typography>
      </Box>

      {/* System Status Alert */}
      {systemStatus !== 'ready' && (
        <Alert 
          severity={systemStatus === 'no_model' ? 'warning' : 'error'} 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/settings')}
            >
              Configure
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
                <Typography variant="h6">System Status</Typography>
              </Box>
              <Chip 
                label={getStatusText(systemStatus)}
                color={getStatusColor(systemStatus)}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Overall system health and readiness
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
                <Typography variant="h6">AI Model</Typography>
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
                    No AI model configured
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/settings')}
                    sx={{ mt: 1 }}
                  >
                    Configure
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
                <Typography variant="h6">Drone Status</Typography>
              </Box>
              {droneStatus?.connected ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Battery90 sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      Battery: {droneStatus.battery}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={droneStatus.battery} 
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Mode: {droneStatus.mode}
                  </Typography>
                  <Chip label="Connected" color="success" size="small" sx={{ mt: 1 }} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Drone not connected
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/settings')}
                    sx={{ mt: 1 }}
                  >
                    Connect
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
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Chat />}
                  onClick={() => navigate('/control')}
                  disabled={systemStatus !== 'ready'}
                  fullWidth
                >
                  Start Control
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => navigate('/settings')}
                  fullWidth
                >
                  Settings
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
                  <Typography variant="h6">Location</Typography>
                </Box>
                <Typography variant="body1">
                  Latitude: {droneStatus.location?.lat?.toFixed(6)}
                </Typography>
                <Typography variant="body1">
                  Longitude: {droneStatus.location?.lon?.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Altitude: {droneStatus.altitude}m
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
                System Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                DeepDrone v1.0.0 - AI-Powered Drone Control System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Natural language drone control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Multiple AI provider support
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Real-time telemetry monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Safe flight operations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;