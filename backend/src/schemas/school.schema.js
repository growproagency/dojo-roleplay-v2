import Joi from 'joi';

export const updateSchoolSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  streetAddress: Joi.string().max(500).allow('', null).optional(),
  city: Joi.string().max(255).allow('', null).optional(),
  state: Joi.string().max(100).allow('', null).optional(),
  zipCode: Joi.string().max(20).allow('', null).optional(),
  introOffer: Joi.string().max(500).allow('', null).optional(),
  priceRangeLow: Joi.number().min(0).allow(null).optional(),
  priceRangeHigh: Joi.number().min(0).allow(null).optional(),
  programDirectorName: Joi.string().max(255).allow('', null).optional(),
  additionalNotes: Joi.string().max(2000).allow('', null).optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const createInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('staff', 'school_admin').default('staff'),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
