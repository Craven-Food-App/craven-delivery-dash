import { useEffect } from 'react';

interface CrashReport {
  error: Error;
  componentStack?: string;
  errorBoundary?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export const useCrashReporting = () => {
  useEffect(() => {
    // Global error handler for unhandled errors
    const handleGlobalError = (event: ErrorEvent) => {
      const crashReport: CrashReport = {
        error: new Error(event.message),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: getSessionId()
      };

      reportCrash(crashReport);
    };

    // Global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const crashReport: CrashReport = {
        error: new Error(event.reason?.toString() || 'Unhandled Promise Rejection'),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: getSessionId()
      };

      reportCrash(crashReport);
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const reportCrash = async (crashReport: CrashReport) => {
    try {
      // In production, send to crash reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to Sentry, Bugsnag, or custom endpoint
        console.error('Crash Report:', crashReport);
        
        // await fetch('/api/crashes', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(crashReport)
        // });
      } else {
        console.error('Development Crash Report:', crashReport);
      }
    } catch (error) {
      console.error('Failed to report crash:', error);
    }
  };

  const reportCustomError = (error: Error, context?: string) => {
    const crashReport: CrashReport = {
      error,
      componentStack: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: getSessionId()
    };

    reportCrash(crashReport);
  };

  return {
    reportCustomError
  };
};

// Helper function to get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('crash_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('crash_session_id', sessionId);
  }
  return sessionId;
};
