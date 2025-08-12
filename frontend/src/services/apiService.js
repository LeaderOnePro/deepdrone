import axios from 'axios';

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
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Provider and model management
  getProviders: () => api.get('/providers'),
  
  configureModel: (config) => api.post('/models/configure', config),
  
  testModelConnection: (config) => api.post('/models/test', config),
  
  getCurrentModel: () => api.get('/models/current'),
  
  // Ollama specific
  getOllamaModels: (baseUrl = 'http://localhost:11434') => 
    api.post('/ollama/models', { base_url: baseUrl }),
  
  // Chat functionality
  sendChatMessage: (message, conversationId = null) => 
    api.post('/chat', { message, conversation_id: conversationId }),
  
  // Drone operations
  connectDrone: (connectionString) => 
    api.post('/drone/connect', { connection_string: connectionString }),
  
  getDroneStatus: () => api.get('/drone/status'),
  
  sendDroneCommand: (command) => 
    api.post('/drone/command', { command }),
};

export default api;