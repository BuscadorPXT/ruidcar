// Facebook Pixel tracking utilities

declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Track a Facebook Pixel event
 * @param eventName - The name of the event to track
 * @param parameters - Optional parameters for the event
 */
export function trackPixelEvent(eventName: string, parameters?: any) {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      if (parameters) {
        window.fbq('track', eventName, parameters);
      } else {
        window.fbq('track', eventName);
      }
      console.log(`Facebook Pixel event tracked: ${eventName}`, parameters);
    } catch (error) {
      console.error('Error tracking Facebook Pixel event:', error);
    }
  }
}

/**
 * Track contact event when user initiates contact
 * @param method - The contact method used (whatsapp, form, etc.)
 * @param source - The source page or component
 */
export function trackContactEvent(method: string = 'whatsapp', source: string = 'icara') {
  trackPixelEvent('Contact', {
    content_name: 'RUIDCAR Contact',
    content_category: 'Lead Generation',
    contact_method: method,
    source_page: source
  });
}

/**
 * Track lead event when user shows interest
 * @param source - The source of the lead
 */
export function trackLeadEvent(source: string = 'icara') {
  trackPixelEvent('Lead', {
    content_name: 'RUIDCAR Lead',
    content_category: 'Lead Generation',
    source_page: source,
    value: 1,
    currency: 'BRL'
  });
}