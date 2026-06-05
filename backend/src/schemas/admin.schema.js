import Joi from 'joi';

export const createSchoolSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(100).pattern(/^[a-z0-9-]+$/).optional(),
  plan: Joi.string().min(1).max(64).allow('', null).optional(),
  ownerUserId: Joi.number().integer().allow(null).optional(),
  usageCapUsd: Joi.number().min(0).allow(null).optional(),
  memberLimit: Joi.number().integer().min(1).allow(null).optional(),
  monthlyRoleplayMinutes: Joi.number().integer().min(0).allow(null).optional(),
  usagePeriodStart: Joi.date().iso().allow(null).optional(),
  usagePeriodEnd: Joi.date().iso().allow(null).optional(),
  subscriptionStatus: Joi.string().valid('active', 'trialing', 'past_due', 'suspended', 'canceled').optional(),
  subscriptionCurrentPeriodEnd: Joi.date().iso().allow(null).optional(),
  accessGraceUntil: Joi.date().iso().allow(null).optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const updateSchoolAdminSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  slug: Joi.string().min(1).max(100).optional(),
  plan: Joi.string().min(1).max(64).allow('', null).optional(),
  ownerUserId: Joi.number().integer().allow(null).optional(),
  usageCapUsd: Joi.number().min(0).allow(null).optional(),
  memberLimit: Joi.number().integer().min(1).allow(null).optional(),
  monthlyRoleplayMinutes: Joi.number().integer().min(0).allow(null).optional(),
  usagePeriodStart: Joi.date().iso().allow(null).optional(),
  usagePeriodEnd: Joi.date().iso().allow(null).optional(),
  subscriptionStatus: Joi.string().valid('active', 'trialing', 'past_due', 'suspended', 'canceled').optional(),
  subscriptionCurrentPeriodEnd: Joi.date().iso().allow(null).optional(),
  accessGraceUntil: Joi.date().iso().allow(null).optional(),
  streetAddress: Joi.string().max(500).allow('', null).optional(),
  city: Joi.string().max(255).allow('', null).optional(),
  state: Joi.string().max(100).allow('', null).optional(),
  zipCode: Joi.string().max(20).allow('', null).optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const changeRoleSchema = Joi.object({
  role: Joi.string().valid('staff', 'school_admin', 'global_admin').required(),
}).options({ stripUnknown: true, abortEarly: false });

export const unassignUserSchema = Joi.object({
  schoolId: Joi.valid(null).optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });

export const adminCreateInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('staff', 'school_admin').default('staff'),
}).options({ stripUnknown: true, abortEarly: false });

export const readdSchoolUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('staff', 'school_admin').default('staff'),
}).options({ stripUnknown: true, abortEarly: false });

export const platformAdminInviteSchema = Joi.object({
  email: Joi.string().email().required(),
}).options({ stripUnknown: true, abortEarly: false });

export const passwordResetLinkSchema = Joi.object({
  email: Joi.string().email().required(),
}).options({ stripUnknown: true, abortEarly: false });

export const updatePlatformSchema = Joi.object({
  defaultModel: Joi.string().max(100).optional(),
  markupPercent: Joi.number().min(0).max(1000).allow(null).optional(),
  defaultUsageCapUsd: Joi.number().min(0).allow(null).optional(),
  maintenanceEnabled: Joi.boolean().optional(),
  maintenanceMessage: Joi.string().max(2000).allow('', null).optional(),
  maintenanceSeverity: Joi.string().valid('info', 'warning', 'critical').optional(),
}).options({ stripUnknown: true, convert: true, abortEarly: false });
