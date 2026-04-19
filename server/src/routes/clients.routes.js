const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/clients.controller');

const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  type: z.enum(['BUYER', 'SELLER', 'BOTH']).optional().default('BUYER'),
  budget: z.number().optional().default(0),
  preferredLocations: z.union([z.array(z.string()), z.string()]).optional().default([]),
  notes: z.string().optional().default(''),
  lead: z.string().optional().nullable(),
});

const interactionSchema = z.object({
  type: z.enum(['CALL', 'SITE_VISIT', 'EMAIL']),
  date: z.string().or(z.date()).optional(),
  notes: z.string().optional().default(''),
});

const followUpSchema = z.object({
  scheduledAt: z.string().or(z.date()),
  note: z.string().optional().default(''),
});

router.use(authenticate);

router.get('/', ctrl.getClients);
router.post('/', validate(createClientSchema), ctrl.createClient);
router.get('/:id', ctrl.getClientById);
router.put('/:id', ctrl.updateClient);
router.delete('/:id', ctrl.deleteClient);
router.post('/:id/interactions', validate(interactionSchema), ctrl.logInteraction);
router.get('/:id/interactions', ctrl.getInteractions);
router.post('/:id/follow-ups', validate(followUpSchema), ctrl.createClientFollowUp);

module.exports = router;
