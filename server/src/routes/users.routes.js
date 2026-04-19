const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT']).optional().default('AGENT'),
  phone: z.string().optional().default(''),
});

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', ctrl.getUsers);
router.post('/', validate(createUserSchema), ctrl.createUser);
router.get('/:id', ctrl.getUserById);
router.put('/:id', ctrl.updateUser);
router.patch('/:id/deactivate', ctrl.deactivateUser);
router.get('/:id/stats', ctrl.getUserStats);
router.post('/bulk-reassign', ctrl.bulkReassign);

module.exports = router;
