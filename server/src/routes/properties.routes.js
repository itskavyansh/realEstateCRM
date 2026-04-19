const express = require('express');
const router = express.Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/properties.controller');

const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'PLOT']),
  status: z.enum(['AVAILABLE', 'UNDER_NEGOTIATION', 'SOLD']).optional().default('AVAILABLE'),
  price: z.number().positive('Price must be positive'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  areaSqFt: z.number().optional().default(0),
  bedrooms: z.number().optional().default(0),
  bathrooms: z.number().optional().default(0),
  amenities: z.union([z.array(z.string()), z.string()]).optional().default([]),
  description: z.string().optional().default(''),
  agent: z.string().optional(),
});

router.use(authenticate);

router.get('/', ctrl.getProperties);
router.post('/', validate(createPropertySchema), ctrl.createProperty);
router.get('/:id', ctrl.getPropertyById);
router.put('/:id', ctrl.updateProperty);
router.delete('/:id', ctrl.deleteProperty);
router.post('/:id/images', upload.array('images', 10), ctrl.uploadImages);

module.exports = router;
