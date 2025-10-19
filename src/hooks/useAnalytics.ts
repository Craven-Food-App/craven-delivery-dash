import { useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export const useAnalytics = () => {
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      sessionId: getSessionId()
    };

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, Mixpanel, or custom analytics
      console.log('Analytics Event:', analyticsEvent);
      
      // Example: Google Analytics 4
      // gtag('event', event, properties);
      
      // Example: Custom analytics endpoint
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(analyticsEvent)
      // });
    } else {
      console.log('Development Analytics Event:', analyticsEvent);
    }
  }, []);

  const trackPageView = useCallback((page: string, title?: string) => {
    trackEvent('page_view', {
      page,
      title: title || document.title
    });
  }, [trackEvent]);

  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    trackEvent('user_action', {
      action,
      ...properties
    });
  }, [trackEvent]);

  const trackError = useCallback((error: string, properties?: Record<string, any>) => {
    trackEvent('error', {
      error,
      ...properties
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metric: string, value: number, properties?: Record<string, any>) => {
    trackEvent('performance', {
      metric,
      value,
      ...properties
    });
  }, [trackEvent]);

  // Track page views automatically
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [trackPageView]);

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackError,
    trackPerformance
  };
};

// Helper function to get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};
