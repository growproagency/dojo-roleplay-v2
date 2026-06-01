import Joi from 'joi';

export const highLevelPaymentCompletedSchema = Joi.object({
  schoolName: Joi.string().min(1).max(255).required(),
  fullName: Joi.string().min(1).max(255).optional(),
  ownerName: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(32).allow('', null).optional(),
  plan: Joi.string().min(1).max(64).required(),
  paymentId: Joi.string().max(255).allow('', null).optional(),
  highLevelContactId: Joi.string().max(255).allow('', null).optional(),
  externalId: Joi.string().max(255).allow('', null).optional(),
}).or('fullName', 'ownerName').options({ stripUnknown: true, convert: true, abortEarly: false });
