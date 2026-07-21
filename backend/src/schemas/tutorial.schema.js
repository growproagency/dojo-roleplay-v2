import Joi from 'joi';

export const tutorialKeySchema = Joi.string().pattern(/^[a-z0-9-]+$/).max(100).required();

export const tutorialProgressQuerySchema = Joi.object({
  version: Joi.number().integer().min(1).max(1000).required(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const tutorialProgressSchema = Joi.object({
  tutorialVersion: Joi.number().integer().min(1).max(1000).required(),
  status: Joi.string().valid('in_progress', 'skipped', 'completed').required(),
  currentStep: Joi.number().integer().min(0).max(100).required(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
