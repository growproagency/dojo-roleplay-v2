// controllers/example.controller.js
// HTTP layer — the bridge between Express and your service layer.
// Extracts data from req, calls a service, sends the response.
// Never contains business logic. Keep each function under 15 lines.
//
// All errors bubble up through asyncHandler → global error handler.
import { asyncHandler } from '../utils/asyncHandler.js';
import * as exampleService from '../services/example.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await exampleService.getAll({ page: Number(page), limit: Number(limit) });
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req, res) => {
  const record = await exampleService.getById(req.params.id);
  res.status(200).json({ data: record });
});

export const create = asyncHandler(async (req, res) => {
  const record = await exampleService.create(req.user.id, req.body);
  res.status(201).json({ data: record });
});

export const update = asyncHandler(async (req, res) => {
  const record = await exampleService.update(req.user.id, req.params.id, req.body);
  res.status(200).json({ data: record });
});

export const remove = asyncHandler(async (req, res) => {
  await exampleService.remove(req.user.id, req.params.id);
  res.status(204).send();
});
