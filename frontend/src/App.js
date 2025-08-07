import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { FlightTakeoff, Settings, Dashboard } from '@mui/icons-material';

// Import pages
import DashboardPage from './pages/DashboardPage';
import ControlPage from './pages/ControlPage';
import SettingsPage from './pages/SettingsPage';

// Import components
import Navigation from './components/Navigation';

// Import services
import { apiService } from './services/apiService';

function App() {
  const [currentModel, setCurrentModel] = useState(null);
  const [droneStatus, setDroneStatus] = useState(null);

  useEffect(() => {
    // Load initial data
    loadCurrentModel();
    loadDroneStatus();
  }, []);

  const loadCurrentModel = async () => {
    try {
      const response = await apiService.getCurrentModel();
      setCurrentModel(response.data);
    } catch (error) {
      console.error('Failed to load current model:', error);
    }
  };

  const loadDroneStatus = async () => {
    try {
      const response = await apiService.getDroneStatus();
      setDroneStatus(response.data);
    } catch (error) {
      console.error('Failed to load drone status:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <FlightTakeoff sx={{ mr: 2, color: 'white' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white', fontWeight: 600 }}>
            DeepDrone 控制中心
          </Typography>
          
          {/* Status indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {currentModel?.configured && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                AI模型: {currentModel.model_info?.provider} ({currentModel.model_info?.model_id})
              </Typography>
            )}
            
            {droneStatus?.connected && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                无人机: 已连接 ({droneStatus.battery}%)
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <DashboardPage 
                currentModel={currentModel}
                droneStatus={droneStatus}
                onModelUpdate={loadCurrentModel}
                onDroneUpdate={loadDroneStatus}
              />
            } 
          />
          <Route 
            path="/control" 
            element={
              <ControlPage 
                currentModel={currentModel}
                droneStatus={droneStatus}
              />
            } 
          />
          <Route 
            path="/settings" 
            element={
              <SettingsPage 
                currentModel={currentModel}
                onModelUpdate={loadCurrentModel}
              />
            } 
          />
        </Routes>
      </Container>

      {/* Bottom Navigation for Mobile */}
      <Navigation />
    </Box>
  );
}

export default App;