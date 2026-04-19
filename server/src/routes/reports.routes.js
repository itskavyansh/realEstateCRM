const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate);

// Dashboard stats available to all roles
router.get('/dashboard-stats', ctrl.getDashboardStats);

// Analytics reports - Admin and Manager only
router.get('/leads-by-source', authorize('ADMIN', 'MANAGER'), ctrl.getLeadsBySource);
router.get('/conversion-funnel', authorize('ADMIN', 'MANAGER'), ctrl.getConversionFunnel);
router.get('/revenue-by-month', authorize('ADMIN', 'MANAGER'), ctrl.getRevenueByMonth);
router.get('/agent-leaderboard', authorize('ADMIN', 'MANAGER'), ctrl.getAgentLeaderboard);
router.get('/top-properties', authorize('ADMIN', 'MANAGER'), ctrl.getTopProperties);

module.exports = router;
