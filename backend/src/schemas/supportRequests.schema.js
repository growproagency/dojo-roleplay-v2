import Joi from 'joi';

export const createSupportRequestSchema = Joi.object({
  category: Joi.string().valid('practice_call', 'scoring', 'account', 'billing', 'feature', 'other').required(),
  subject: Joi.string().trim().min(3).max(120).required(),
  message: Joi.string().trim().min(10).max(4000).required(),
  pageUrl: Joi.string().uri({ allowRelative: true }).max(500).allow('', null),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const updateSupportRequestSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved').required(),
}).options({ stripUnknown: true, abortEarly: false });
