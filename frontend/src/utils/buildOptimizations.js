// 构建优化相关的工具函数

// 代码分割点标记
export const loadableComponents = {
  // 懒加载的页面组件
  DashboardPage: () => import('../pages/DashboardPage'),
  ControlPage: () => import('../pages/ControlPage'),
  SettingsPage: () => import('../pages/SettingsPage'),
  
  // 懒加载的功能组件
  VirtualList: () => import('../components/VirtualList'),
  LazyImage: () => import('../components/LazyImage'),
};

// 预加载关键资源
export const preloadCriticalResources = () => {
  // 预加载关键CSS
  const criticalCSS = [
    '/static/css/main.css'
  ];
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
  
  // 预加载关键字体
  const criticalFonts = [
    // 如果有自定义字体，在这里添加
  ];
  
  criticalFonts.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });
};

// 资源提示优化
export const addResourceHints = () => {
  // DNS 预解析
  const domains = [
    'localhost:8000', // API 服务器
    // 其他外部域名
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
  
  // 预连接到关键域名
  const preconnectDomains = [
    'localhost:8000'
  ];
  
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
};

// 图片优化
export const optimizeImages = () => {
  // 为所有图片添加 loading="lazy"
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.loading = 'lazy';
  });
  
  // 为关键图片添加 fetchpriority="high"
  const criticalImages = document.querySelectorAll('img[data-critical]');
  criticalImages.forEach(img => {
    img.fetchPriority = 'high';
  });
};

// 初始化所有构建优化
export const initBuildOptimizations = () => {
  // 在 DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadCriticalResources();
      addResourceHints();
      optimizeImages();
    });
  } else {
    preloadCriticalResources();
    addResourceHints();
    optimizeImages();
  }
};