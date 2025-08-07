import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';

// Create Material-UI theme - 科技感亮色主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // 科技蓝
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#00e676', // 科技绿
      light: '#66ffa6',
      dark: '#00c853',
    },
    background: {
      default: '#f5f7fa', // 浅灰蓝背景
      paper: '#ffffff',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00c853',
    },
    info: {
      main: '#00bcd4',
      light: '#4dd0e1',
      dark: '#0097a7',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1976d2',
    },
    h6: {
      fontWeight: 500,
      color: '#1976d2',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e3f2fd',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(25, 118, 210, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 24px',
        },
        contained: {
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          boxShadow: '0 3px 15px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
            boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1976d2 0%, #00bcd4 100%)',
          boxShadow: '0 2px 20px rgba(25, 118, 210, 0.2)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #00e676 30%, #4caf50 90%)',
          boxShadow: '0 4px 20px rgba(0, 230, 118, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #00c853 30%, #388e3c 90%)',
            boxShadow: '0 6px 25px rgba(0, 230, 118, 0.4)',
          },
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);