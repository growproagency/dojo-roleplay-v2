import Joi from 'joi';

export const listCallsSchema = Joi.object({
  scope: Joi.string().valid('mine', 'school').optional(),
  userId: Joi.number().integer().optional(),
}).options({ stripUnknown: true, convert: true });

export const startCallSchema = Joi.object({
  vapiCallId: Joi.string().max(128).required(),
  scenario: Joi.string().max(100).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
