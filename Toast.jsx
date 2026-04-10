import React, { useEffect, useCallback } from 'react';
import './Toast.css';

const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

const Toast = ({ 
  id, 
  message, 
  type = ToastType.INFO, 
  duration = 5000, 
  onDismiss,
  dismissible = true 
}) => {
  const handleDismiss = useCallback(() => {
    onDismiss(id);
  }, [id, onDismiss]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDismiss();
    }
    if (e.key === 'Escape' && dismissible) {
      handleDismiss();
    }
  }, [handleDismiss, dismissible]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleDismiss]);

  const typeIcons = {
    [ToastType.SUCCESS]: '✓',
    [ToastType.ERROR]: '✕',
    [ToastType.WARNING]: '⚠',
    [ToastType.INFO]: 'ℹ',
  };

  return (
    <div 
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="toast__icon" aria-hidden="true">
        {typeIcons[type]}
      </span>
      <p className="toast__message">{message}</p>
      {dismissible && (
        <button
          type="button"
          className="toast__close"
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
          aria-label="Dismiss notification"
          tabIndex={0}
        >
          ×
        </button>
      )}
    </div>
  );
};

Toast.Type = ToastType;

export default Toast;