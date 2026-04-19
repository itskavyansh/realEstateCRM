const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/deals.controller');

const createDealSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  property: z.string().min(1, 'Property is required'),
  agent: z.string().optional(),
  stage: z.enum(['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED']).optional().default('INQUIRY'),
  dealValue: z.number().positive('Deal value must be positive'),
  commissionPercent: z.number().min(0).max(100).optional().default(2),
  expectedCloseDate: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
});

const stageSchema = z.object({
  stage: z.enum(['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED']),
});

router.use(authenticate);

router.get('/', ctrl.getDeals);
router.get('/kanban', ctrl.getKanban);
router.post('/', validate(createDealSchema), ctrl.createDeal);
router.get('/:id', ctrl.getDealById);
router.put('/:id', ctrl.updateDeal);
router.patch('/:id/stage', validate(stageSchema), ctrl.updateStage);
router.post('/:id/documents', upload.array('documents', 10), ctrl.uploadDocuments);

module.exports = router;
