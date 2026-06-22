import Joi from 'joi';

export const createScenarioSchema = Joi.object({
  slug: Joi.string().min(1).max(100).pattern(/^[a-z0-9_]+$/).optional(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(1000).required(),
  contextType: Joi.string().valid('inbound_call', 'outbound_callback', 'in_person').default('inbound_call'),
  characterName: Joi.string().min(1).max(100).required(),
  characterBlurb: Joi.string().max(500).allow('', null).optional(),
  topics: Joi.array().items(Joi.string().min(1).max(40)).max(6).allow(null).optional(),
  schoolId: Joi.number().integer().allow(null).optional(),
  characterPrompt: Joi.string().min(1).required(),
  openingLine: Joi.string().min(1).max(500).required(),
  voiceId: Joi.string().min(1).required(),
  voiceProvider: Joi.string().default('vapi'),
  scoringPrompt: Joi.string().min(1).allow('', null).optional(),
  isActive: Joi.boolean().default(true),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const updateScenarioSchema = createScenarioSchema.fork(
  ['title', 'description', 'characterName', 'characterPrompt', 'openingLine', 'voiceId'],
  f => f.optional()
);

export const updateBuiltInScenarioSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(1000).required(),
  systemPromptBase: Joi.string().min(1).required(),
  firstMessage: Joi.string().max(500).allow('', null).optional(),
  voiceId: Joi.string().min(1).required(),
  voiceProvider: Joi.string().default('vapi'),
  scoringRubricType: Joi.string().valid('inbound', 'outbound', 'salesEnrollment', 'renewal', 'cancellation').required(),
  scoringCategories: Joi.array().items(Joi.object({
    name: Joi.string().min(1).max(120).required(),
    weight: Joi.number().min(0).max(100).required(),
    anchors: Joi.object().pattern(Joi.string().min(1).max(20), Joi.string().allow('').max(2000)).required(),
  })).min(1).max(12).required(),
  objectionFocus: Joi.object({
    easy: Joi.array().items(Joi.string().min(1).max(500)).min(1).required(),
    medium: Joi.array().items(Joi.string().min(1).max(500)).min(1).required(),
    hard: Joi.array().items(Joi.string().min(1).max(500)).min(1).required(),
  }).required(),
  objectionCounts: Joi.object({
    easy: Joi.number().integer().min(0).max(10).required(),
    medium: Joi.number().integer().min(0).max(10).required(),
    hard: Joi.number().integer().min(0).max(10).required(),
  }).required(),
  status: Joi.string().valid('draft', 'published').default('draft'),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
