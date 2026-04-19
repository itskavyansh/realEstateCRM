const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');
const { Lead, Deal, Property, Activity, FollowUp } = require('../models');

// GET /api/v1/reports/leads-by-source
const getLeadsBySource = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const data = await reportService.getLeadsBySource(year);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/conversion-funnel
const getConversionFunnel = async (req, res, next) => {
  try {
    const data = await reportService.getConversionFunnel();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/revenue-by-month
const getRevenueByMonth = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const data = await reportService.getRevenueByMonth(year);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/agent-leaderboard
const getAgentLeaderboard = async (req, res, next) => {
  try {
    const data = await reportService.getAgentLeaderboard();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/top-properties
const getTopProperties = async (req, res, next) => {
  try {
    const data = await reportService.getTopProperties();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/reports/dashboard-stats
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const filter = {};
    if (req.user.role === 'AGENT') filter.agent = req.user.id;

    const leadFilter = {};
    if (req.user.role === 'AGENT') leadFilter.assignedAgent = req.user.id;

    const [totalLeads, activeDeals, revenueMTD, closedLeads, totalLeadsAll] = await Promise.all([
      Lead.countDocuments(leadFilter),
      Deal.countDocuments({ ...filter, stage: { $nin: ['CLOSED', 'CANCELLED'] } }),
      Deal.aggregate([
        {
          $match: {
            ...filter,
            stage: 'CLOSED',
            actualCloseDate: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]),
      Lead.countDocuments({ ...leadFilter, status: 'CLOSED' }),
      Lead.countDocuments(leadFilter),
    ]);

    const conversionRate = totalLeadsAll > 0 ? ((closedLeads / totalLeadsAll) * 100).toFixed(1) : 0;

    // Recent activities
    const recentActivities = await Activity.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Today's follow-ups
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const followUpFilter = {
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      isCompleted: false,
    };
    if (req.user.role === 'AGENT') followUpFilter.user = req.user.id;

    const todayFollowUps = await FollowUp.find(followUpFilter)
      .populate('user', 'name')
      .populate('lead', 'name')
      .populate('client', 'name')
      .sort({ scheduledAt: 1 });

    sendSuccess(res, {
      stats: {
        totalLeads,
        activeDeals,
        revenueMTD: revenueMTD[0]?.total || 0,
        conversionRate: Number(conversionRate),
      },
      recentActivities,
      todayFollowUps,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLeadsBySource, getConversionFunnel, getRevenueByMonth,
  getAgentLeaderboard, getTopProperties, getDashboardStats,
};
