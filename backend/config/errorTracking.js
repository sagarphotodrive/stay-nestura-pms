// Optional Sentry integration. Fully inert unless SENTRY_DSN is set — errors still get
// logged to the console either way, this just adds an external sink when configured.
const Sentry = require('@sentry/node');

let enabled = false;

function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[ErrorTracking] No SENTRY_DSN set — errors will only be logged to the console');
    return false;
  }
  Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0 });
  enabled = true;
  console.log('[ErrorTracking] Sentry initialized');
  return true;
}

// Must be called after all routes are registered, before any custom error-handling middleware.
function setupExpressErrorHandler(app) {
  if (enabled) Sentry.setupExpressErrorHandler(app);
}

function captureException(err) {
  if (enabled) Sentry.captureException(err);
}

module.exports = { initErrorTracking, setupExpressErrorHandler, captureException };
