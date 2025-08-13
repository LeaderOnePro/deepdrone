import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/reset.css';
import './styles/design-system.css';
import './styles/performance.css';
import App from './App';
import * as serviceWorker from './utils/serviceWorker';
import { initAllPerformanceMonitoring } from './utils/performance';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// 注册 Service Worker
serviceWorker.register({
  onSuccess: () => {
    console.log('DeepDrone is now available offline!');
  },
  onUpdate: (registration) => {
    console.log('New version available! Please refresh.');
    // 可以在这里显示更新提示
  }
});

// 初始化性能监控
initAllPerformanceMonitoring();