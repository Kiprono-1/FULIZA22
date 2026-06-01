import { createContext, useContext, useEffect, ReactNode } from 'react';
import { initSecurity, auditLog } from '../utils/security';

interface SecurityContextType {
  isSecurityInitialized: boolean;
}

const SecurityContext = createContext<SecurityContextType>({
  isSecurityInitialized: false,
});

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Initialize security measures
    initSecurity();
    
    // Set up global error handling
    const handleError = (event: ErrorEvent) => {
      auditLog.log('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      auditLog.log('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    };
    
    // Set up security event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Monitor for suspicious activity
    let rapidClicks = 0;
    let lastClickTime = 0;
    
    const handleClick = () => {
      const now = Date.now();
      if (now - lastClickTime < 100) {
        rapidClicks++;
        if (rapidClicks > 10) {
          auditLog.log('suspicious_activity', { 
            type: 'rapid_clicking',
            count: rapidClicks 
          });
        }
      } else {
        rapidClicks = 0;
      }
      lastClickTime = now;
    };
    
    document.addEventListener('click', handleClick);
    
    // Monitor for console access (potential tampering)
    let devToolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          auditLog.log('dev_tools_opened');
        }
      } else {
        devToolsOpen = false;
      }
    };
    
    const devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Monitor for tab visibility changes
    const handleVisibilityChange = () => {
      auditLog.log('tab_visibility_change', { 
        hidden: document.hidden 
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up beforeunload handler for session cleanup
    const handleBeforeUnload = () => {
      auditLog.log('session_end');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup function
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(devToolsInterval);
    };
  }, []);

  return (
    <SecurityContext.Provider value={{ isSecurityInitialized: true }}>
      {children}
    </SecurityContext.Provider>
  );
};