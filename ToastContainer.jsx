import React, { useReducer, useCallback, useMemo, createContext, useContext } from 'react';
import Toast from './Toast';
import './Toast.css';

const ToastContext = createContext(null);

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, { ...action.payload, id: Date.now() + Math.random() }];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContainer');
  }
  return context;
};

const ToastContainer = ({ 
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
}) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((message, options = {}) => {
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type: options.type || Toast.Type.INFO,
      duration: options.duration ?? defaultDuration,
      dismissible: options.dismissible ?? true,
    };
    dispatch({ type: 'ADD_TOAST', payload: toast });
  }, [defaultDuration]);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const visibleToasts = useMemo(() => {
    return toasts.slice(-maxToasts);
  }, [toasts, maxToasts]);

  const contextValue = useMemo(() => ({
    toasts: visibleToasts,
    addToast,
    removeToast,
    clearAll,
    showSuccess: (message, options) => addToast(message, { ...options, type: Toast.Type.SUCCESS }),
    showError: (message, options) => addToast(message, { ...options, type: Toast.Type.ERROR }),
    showWarning: (message, options) => addToast(message, { ...options, type: Toast.Type.WARNING }),
    showInfo: (message, options) => addToast(message, { ...options, type: Toast.Type.INFO }),
  }), [visibleToasts, addToast, removeToast, clearAll]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {visibleToasts.length > 0 && (
        <div 
          className={`toast-container toast-container--${position}`}
          aria-live="polite"
          aria-label="Notifications"
        >
          {visibleToasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onDismiss={removeToast}
              dismissible={toast.dismissible}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export default ToastContainer;