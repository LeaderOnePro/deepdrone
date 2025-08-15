import axios from 'axios';

// 缓存管理
class ApiCache {
  constructor(ttl = 5 * 60 * 1000) { // 默认5分钟TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, customTtl) {
    const ttl = customTtl || this.ttl;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

// 请求去重管理
const pendingRequests = new Map();

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api',
  timeout: 60000, // Increase timeout to 60 seconds for drone operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 生成请求唯一标识
    const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
    
    // 检查是否有相同的请求正在进行
    if (pendingRequests.has(requestKey)) {
      const cancelToken = axios.CancelToken.source();
      cancelToken.cancel('Duplicate request cancelled');
      config.cancelToken = cancelToken.token;
    } else {
      // 记录请求
      const cancelToken = axios.CancelToken.source();
      config.cancelToken = cancelToken.token;
      pendingRequests.set(requestKey, cancelToken);
      
      // 请求完成后清理
      config.metadata = { requestKey };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // 清理请求记录
    if (response.config.metadata?.requestKey) {
      pendingRequests.delete(response.config.metadata.requestKey);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // 清理请求记录
    if (error.config?.metadata?.requestKey) {
      pendingRequests.delete(error.config.metadata.requestKey);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// 带缓存的API调用函数
const cachedApiCall = async (cacheKey, apiCall, cacheTtl) => {
  // 检查缓存
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // 执行API调用
  const response = await apiCall();
  
  // 缓存结果
  if (response.status === 200) {
    apiCache.set(cacheKey, response.data, cacheTtl);
  }
  
  return { data: response.data, fromCache: false };
};

export const apiService = {
  // Provider and model management
  getProviders: () => cachedApiCall(
    'providers', 
    () => api.get('/providers'),
    10 * 60 * 1000 // 10分钟缓存
  ),
  
  configureModel: (config) => {
    // 清除相关缓存
    apiCache.delete('current-model');
    return api.post('/models/configure', config);
  },
  
  testModelConnection: (config) => api.post('/models/test', config),
  
  getCurrentModel: () => cachedApiCall(
    'current-model',
    () => api.get('/models/current'),
    2 * 60 * 1000 // 2分钟缓存
  ),
  
  // Ollama specific
  getOllamaModels: (baseUrl = 'http://localhost:11434') => 
    cachedApiCall(
      `ollama-models-${baseUrl}`,
      () => api.post('/ollama/models', { base_url: baseUrl }),
      5 * 60 * 1000 // 5分钟缓存
    ),
  
  // Chat functionality
  sendChatMessage: (message, conversationId = null) => 
    api.post('/chat', { message, conversation_id: conversationId }),
  
  // Drone operations
  connectDrone: (connectionString) => {
    // 清除无人机状态缓存
    apiCache.delete('drone-status');
    return api.post('/drone/connect', { connection_string: connectionString });
  },
  
  disconnectDrone: () => {
    // 清除无人机状态缓存
    apiCache.delete('drone-status');
    return api.post('/drone/disconnect');
  },
  
  getDroneStatus: () => cachedApiCall(
    'drone-status',
    () => api.get('/drone/status'),
    1000 // 1秒缓存，保持实时性
  ),
  
  sendDroneCommand: (command) => 
    api.post('/drone/command', { command }),

  // 缓存管理
  clearCache: () => apiCache.clear(),
  clearCacheKey: (key) => apiCache.delete(key)
};

export default api;