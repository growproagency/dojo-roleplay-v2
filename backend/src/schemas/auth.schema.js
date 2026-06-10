import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .allow('', null)
    .optional()
    .messages({ 'string.pattern.base': 'Phone must be in E.164 format, e.g. +639171234567' }),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const acceptInviteSchema = Joi.object({
  email: Joi.string().email().lowercase().optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
