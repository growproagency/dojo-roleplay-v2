// utils/asyncHandler.js
// Wraps async route handlers so you never need try/catch in controllers.
// Any thrown error is automatically forwarded to the global error handler.
//
// Usage:
//   router.get('/', asyncHandler(async (req, res) => { ... }));
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
