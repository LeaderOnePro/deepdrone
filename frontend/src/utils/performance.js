import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// 性能指标收集
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    // 收集 Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  }
};

// 发送性能数据到分析服务
function sendToAnalytics(metric) {
  console.log('Performance metric:', metric);
  
  // 在生产环境中，可以发送到分析服务
  // 例如 Google Analytics, DataDog, 或自定义分析服务
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

// 组件渲染性能监控
export class ComponentPerformanceMonitor {
  constructor(componentName) {
    this.componentName = componentName;
    this.renderCount = 0;
    this.renderTimes = [];
  }

  startRender() {
    this.renderStart = performance.now();
  }

  endRender() {
    if (this.renderStart) {
      const renderTime = performance.now() - this.renderStart;
      this.renderCount++;
      this.renderTimes.push(renderTime);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${this.componentName} render #${this.renderCount}: ${renderTime.toFixed(2)}ms`);
      }
      
      // 如果渲染时间过长，发出警告
      if (renderTime > 16) { // 60fps = 16.67ms per frame
        console.warn(`${this.componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    }
  }

  getStats() {
    if (this.renderTimes.length === 0) return null;
    
    const total = this.renderTimes.reduce((sum, time) => sum + time, 0);
    const average = total / this.renderTimes.length;
    const max = Math.max(...this.renderTimes);
    const min = Math.min(...this.renderTimes);
    
    return {
      componentName: this.componentName,
      renderCount: this.renderCount,
      averageRenderTime: average,
      maxRenderTime: max,
      minRenderTime: min,
      totalRenderTime: total
    };
  }
}

// 内存使用监控
export const monitorMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory;
    console.log('Memory usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
    });
    
    // 如果内存使用超过限制的80%，发出警告
    if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
      console.warn('High memory usage detected!');
    }
  }
};

// 网络性能监控
export const monitorNetworkPerformance = () => {
  if (navigator.connection) {
    const connection = navigator.connection;
    console.log('Network info:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    });
  }
};

// 长任务监控
export const monitorLongTasks = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name
        });
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
};

// 资源加载性能监控
export const monitorResourceLoading = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) { // 超过1秒的资源加载
          console.warn('Slow resource loading:', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// 初始化所有性能监控
export const initAllPerformanceMonitoring = () => {
  initPerformanceMonitoring();
  monitorLongTasks();
  monitorResourceLoading();
  
  // 定期监控内存和网络
  setInterval(() => {
    monitorMemoryUsage();
    monitorNetworkPerformance();
  }, 30000); // 每30秒检查一次
};