const GLITCHTIP_DSN = 'https://23700b2a5cf74033b50abee4f4a43851@errors.multiversegames.ai/2';

export function initErrorTracking() {
  if (typeof Sentry === 'undefined') return;

  Sentry.init({
    dsn: GLITCHTIP_DSN,
    environment: location.hostname === 'localhost' ? 'development' : 'production',
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(
          (b) => b.category !== 'console' || !b.message?.includes('localStorage'),
        );
      }
      return event;
    },
  });

  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), { type: 'window-error' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { type: 'unhandledrejection' });
  });
}

export function captureError(error, context) {
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error, { extra: context });
  }
  console.error(error);
}
