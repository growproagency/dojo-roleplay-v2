import Joi from 'joi';

export const reportQuerySchema = Joi.object({
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).custom((value, helpers) => Number(value.slice(0, 4)) >= 2000 ? value : helpers.error('any.invalid')),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
}).options({ abortEarly: false, stripUnknown: true, convert: true });

export const reportTimezoneSchema = Joi.object({
  timezone: Joi.string().max(100).required().custom((value, helpers) => {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone; }
    catch { return helpers.error('any.invalid'); }
  }),
}).options({ abortEarly: false, stripUnknown: true, convert: true });

export const reportParamsSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});
