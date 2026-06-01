// schemas/example.schema.js
// Example Joi validation schemas.
// Define your schemas here and import them into route files.
//
// Replace "example" with your resource name (e.g. post.schema.js, product.schema.js).
import Joi from 'joi';

export const createExampleSchema = Joi.object({
  title:   Joi.string().min(1).max(200).trim().required(),
  body:    Joi.string().min(1).max(10000).trim().required(),
  // Add your fields here
});

export const updateExampleSchema = Joi.object({
  title:  Joi.string().min(1).max(200).trim(),
  body:   Joi.string().min(1).max(10000).trim(),
}).min(1); // at least one field required
