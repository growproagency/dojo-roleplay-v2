import Joi from 'joi';

export const vapiWebhookSchema = Joi.object({
  message: Joi.object({
    type: Joi.string().required(),
  }).unknown(true).required(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
