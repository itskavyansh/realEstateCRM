const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/settings.controller');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);
router.post('/logo', upload.single('logo'), ctrl.uploadLogo);

module.exports = router;
