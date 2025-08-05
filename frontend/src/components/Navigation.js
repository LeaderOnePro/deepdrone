import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard,
  GamepadOutlined,
  Settings,
} from '@mui/icons-material';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getValueFromPath = (path) => {
    switch (path) {
      case '/dashboard': return 0;
      case '/control': return 1;
      case '/settings': return 2;
      default: return 0;
    }
  };

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0: navigate('/dashboard'); break;
      case 1: navigate('/control'); break;
      case 2: navigate('/settings'); break;
      default: navigate('/dashboard');
    }
  };

  if (!isMobile) {
    return null; // Don't show bottom navigation on desktop
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderTop: '1px solid #333'
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={getValueFromPath(location.pathname)}
        onChange={handleChange}
        sx={{
          bgcolor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="Control"
          icon={<GamepadOutlined />}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<Settings />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;