const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/leads.controller');

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  budgetMin: z.number().optional().default(0),
  budgetMax: z.number().optional().default(0),
  propertyTypePreference: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'PLOT', '']).optional().default(''),
  source: z.enum(['WEBSITE', 'AD', 'REFERRAL', 'CALL', 'WALKIN']).optional().default('WEBSITE'),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CLOSED', 'LOST']).optional().default('NEW'),
  assignedAgent: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
});

const followUpSchema = z.object({
  scheduledAt: z.string().or(z.date()),
  note: z.string().optional().default(''),
});

router.use(authenticate);

router.get('/', ctrl.getLeads);
router.post('/', validate(createLeadSchema), ctrl.createLead);
router.get('/:id', ctrl.getLeadById);
router.put('/:id', ctrl.updateLead);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), ctrl.deleteLead);
router.post('/:id/assign', authorize('ADMIN', 'MANAGER'), ctrl.assignLead);
router.post('/import-csv', upload.single('csv'), ctrl.importCSV);
router.get('/:id/activities', ctrl.getLeadActivities);
router.post('/:id/follow-ups', validate(followUpSchema), ctrl.createFollowUp);
router.post('/bulk-assign', authorize('ADMIN', 'MANAGER'), ctrl.bulkAssign);
router.post('/bulk-status', authorize('ADMIN', 'MANAGER'), ctrl.bulkStatus);

module.exports = router;
