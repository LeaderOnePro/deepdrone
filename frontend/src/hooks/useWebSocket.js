import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 优化的 WebSocket Hook
 */
export const useWebSocket = (url, options = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000
  } = options;

  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  
  const ws = useRef(null);
  const reconnectCount = useRef(0);
  const heartbeatTimer = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      setConnectionStatus('Connecting');

      ws.current.onopen = (event) => {
        setConnectionStatus('Connected');
        reconnectCount.current = 0;
        onOpen?.(event);
        
        // 启动心跳
        if (heartbeatInterval > 0) {
          heartbeatTimer.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, heartbeatInterval);
        }
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        setMessageHistory(prev => [...prev.slice(-99), message]); // 保留最近100条消息
        onMessage?.(message);
      };

      ws.current.onerror = (error) => {
        setConnectionStatus('Error');
        onError?.(error);
      };

      ws.current.onclose = (event) => {
        setConnectionStatus('Disconnected');
        onClose?.(event);
        
        // 清理心跳
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current);
        }

        // 自动重连
        if (reconnectCount.current < reconnectAttempts && !event.wasClean) {
          reconnectCount.current++;
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      setConnectionStatus('Error');
      onError?.(error);
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectAttempts, reconnectInterval, heartbeatInterval]);

  const disconnect = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    sendMessage,
    connect,
    disconnect
  };
};