import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import DashboardPage from './pages/DashboardPage';
import ControlPage from './pages/ControlPage';
import SettingsPage from './pages/SettingsPage';

// Import services
import { apiService } from './services/apiService';

function App() {
  const [currentModel, setCurrentModel] = useState(null);
  const [droneStatus, setDroneStatus] = useState(null);

  useEffect(() => {
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
  );
}

export default App;