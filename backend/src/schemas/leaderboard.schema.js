import Joi from 'joi';

export const leaderboardQuerySchema = Joi.object({
  range: Joi.string().valid('all', '7d', '30d', '90d').default('30d'),
  from: Joi.date().iso().max('now').raw(),
  scenario: Joi.string().max(100),
  difficulty: Joi.string().valid('easy', 'medium', 'hard'),
  schoolId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
}).options({ abortEarly: false, stripUnknown: true, convert: true });
