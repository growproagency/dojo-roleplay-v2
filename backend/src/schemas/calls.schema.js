import Joi from 'joi';

export const listCallsSchema = Joi.object({
  scope: Joi.string().valid('mine', 'school').optional(),
  userId: Joi.number().integer().optional(),
}).options({ stripUnknown: true, convert: true });
