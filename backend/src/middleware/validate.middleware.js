// middleware/validate.middleware.js
// Validates and sanitises req.body using a Joi schema before the controller runs.
// Rejects bad data at the door — services and DB never see malformed input.
//
// Options:
//   abortEarly: false   — returns ALL validation errors at once
//   stripUnknown: true  — silently removes fields not in schema (security)
//   convert: true       — coerces types: "2" → 2, "  alice  " → "alice"
//
// Usage:
//   router.post('/', validateBody(createUserSchema), controller.create);
export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,
    stripUnknown: true,
    convert:      true,
  });

  if (error) {
    return res.status(400).json({
      error: {
        code:    'VALIDATION',
        message: 'Validation failed',
        details: error.details.map((d) => ({
          field:   d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
        })),
      },
    });
  }

  req.body = value; // replace with sanitised, coerced value
  next();
};
