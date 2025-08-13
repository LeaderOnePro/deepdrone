import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// 应用状态类型
const ActionTypes = {
  SET_CURRENT_MODEL: 'SET_CURRENT_MODEL',
  SET_DRONE_STATUS: 'SET_DRONE_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_CHAT_MESSAGES: 'UPDATE_CHAT_MESSAGES',
  CLEAR_CHAT_MESSAGES: 'CLEAR_CHAT_MESSAGES'
};

// 初始状态
const initialState = {
  currentModel: null,
  droneStatus: null,
  loading: {
    model: false,
    drone: false,
    chat: false
  },
  error: null,
  chatMessages: []
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CURRENT_MODEL:
      return {
        ...state,
        currentModel: action.payload,
        loading: { ...state.loading, model: false }
      };
    
    case ActionTypes.SET_DRONE_STATUS:
      return {
        ...state,
        droneStatus: action.payload,
        loading: { ...state.loading, drone: false }
      };
    
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.type]: action.payload.value }
      };
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: { model: false, drone: false, chat: false }
      };
    
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case ActionTypes.UPDATE_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: action.payload,
        loading: { ...state.loading, chat: false }
      };
    
    case ActionTypes.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
      };
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider 组件
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = useMemo(() => ({
    setCurrentModel: (model) => dispatch({ 
      type: ActionTypes.SET_CURRENT_MODEL, 
      payload: model 
    }),
    
    setDroneStatus: (status) => dispatch({ 
      type: ActionTypes.SET_DRONE_STATUS, 
      payload: status 
    }),
    
    setLoading: (type, value) => dispatch({ 
      type: ActionTypes.SET_LOADING, 
      payload: { type, value } 
    }),
    
    setError: (error) => dispatch({ 
      type: ActionTypes.SET_ERROR, 
      payload: error 
    }),
    
    clearError: () => dispatch({ 
      type: ActionTypes.CLEAR_ERROR 
    }),
    
    updateChatMessages: (messages) => dispatch({ 
      type: ActionTypes.UPDATE_CHAT_MESSAGES, 
      payload: messages 
    }),
    
    clearChatMessages: () => dispatch({ 
      type: ActionTypes.CLEAR_CHAT_MESSAGES 
    })
  }), []);

  // 计算派生状态
  const derivedState = useMemo(() => ({
    isSystemReady: state.currentModel?.configured && state.droneStatus?.connected,
    isLoading: Object.values(state.loading).some(Boolean),
    hasError: Boolean(state.error)
  }), [state.currentModel, state.droneStatus, state.loading, state.error]);

  const contextValue = useMemo(() => ({
    ...state,
    ...derivedState,
    actions
  }), [state, derivedState, actions]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};