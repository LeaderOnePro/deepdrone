import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';

// Create Material-UI theme - Gen Z 风格主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // 现代紫色
      light: '#8b5cf6',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899', // 活力粉色
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#fafafa', // 极简白色背景
      paper: '#ffffff',
    },
    success: {
      main: '#10b981', // 现代绿色
      light: '#34d399',
      dark: '#059669',
    },
    info: {
      main: '#06b6d4', // 现代青色
      light: '#22d3ee',
      dark: '#0891b2',
    },
    warning: {
      main: '#f59e0b', // 现代橙色
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // 现代红色
      light: '#f87171',
      dark: '#dc2626',
    },
    // Gen Z 特色颜色
    accent: {
      main: '#8b5cf6', // 霓虹紫
      neon: '#00ff88', // 霓虹绿
      cyber: '#ff006e', // 赛博粉
      electric: '#00d4ff', // 电光蓝
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
    h4: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
          transition: 'none !important',
          animation: 'none !important',
          transform: 'none !important',
          '&:hover': {
            transform: 'none !important',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1) !important',
            border: '1px solid rgba(255, 255, 255, 0.2) !important',
            background: 'rgba(255, 255, 255, 0.8) !important',
            backdropFilter: 'blur(20px) !important',
            borderRadius: '20px !important',
            transition: 'none !important',
            animation: 'none !important',
          },
          '&:focus': {
            transform: 'none !important',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1) !important',
          },
          '&:active': {
            transform: 'none !important',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1) !important',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 16,
          fontWeight: 600,
          padding: '12px 32px',
          fontSize: '1rem',
          transition: 'none !important',
          animation: 'none !important',
          transform: 'none !important',
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            transform: 'none',
          },
        },
        outlined: {
          borderColor: '#6366f1',
          color: '#6366f1',
          borderWidth: 2,
          '&:hover': {
            background: 'rgba(99, 102, 241, 0.05)',
            borderColor: '#6366f1',
            transform: 'none',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(102, 126, 234, 0.3)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
          boxShadow: '0 8px 25px rgba(255, 0, 110, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
            boxShadow: '0 8px 25px rgba(255, 0, 110, 0.4)',
            transform: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          color: 'white',
        },
        colorError: {
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          color: 'white',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          color: 'white',
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