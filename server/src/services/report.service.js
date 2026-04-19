const { Lead, Deal, Property, Activity, User } = require('../models');

/**
 * Monthly leads grouped by source (for stacked bar chart).
 */
const getLeadsBySource = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const results = await Lead.aggregate([
    { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, source: '$source' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // Transform into chart-friendly format
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i).toLocaleString('default', { month: 'short' }),
    WEBSITE: 0, AD: 0, REFERRAL: 0, CALL: 0, WALKIN: 0,
  }));

  results.forEach((r) => {
    months[r._id.month - 1][r._id.source] = r.count;
  });

  return months;
};

/**
 * Lead conversion funnel (counts at each stage).
 */
const getConversionFunnel = async () => {
  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CLOSED', 'LOST'];
  const results = await Lead.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const funnelMap = {};
  results.forEach((r) => { funnelMap[r._id] = r.count; });

  return stages.map((stage) => ({ stage, count: funnelMap[stage] || 0 }));
};

/**
 * Monthly revenue from closed deals (line chart).
 */
const getRevenueByMonth = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const results = await Deal.aggregate([
    {
      $match: {
        stage: 'CLOSED',
        actualCloseDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$actualCloseDate' } },
        revenue: { $sum: '$dealValue' },
        commission: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i).toLocaleString('default', { month: 'short' }),
    revenue: 0,
    commission: 0,
    deals: 0,
  }));

  results.forEach((r) => {
    months[r._id.month - 1].revenue = r.revenue;
    months[r._id.month - 1].commission = r.commission;
    months[r._id.month - 1].deals = r.count;
  });

  return months;
};

/**
 * Agent leaderboard — leads handled, deals closed, revenue, commission.
 */
const getAgentLeaderboard = async () => {
  const agents = await User.find({ role: 'AGENT', isActive: true }).select('name email');

  const leaderboard = await Promise.all(
    agents.map(async (agent) => {
      const leadsAssigned = await Lead.countDocuments({ assignedAgent: agent._id });
      const leadsConverted = await Lead.countDocuments({ assignedAgent: agent._id, status: 'CLOSED' });
      const closedDeals = await Deal.find({ agent: agent._id, stage: 'CLOSED' });
      const totalRevenue = closedDeals.reduce((sum, d) => sum + d.dealValue, 0);
      const totalCommission = closedDeals.reduce((sum, d) => sum + d.commissionAmount, 0);
      const activeDeals = await Deal.countDocuments({
        agent: agent._id,
        stage: { $nin: ['CLOSED', 'CANCELLED'] },
      });

      return {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        leadsAssigned,
        leadsConverted,
        dealsClosed: closedDeals.length,
        activeDeals,
        totalRevenue,
        totalCommission,
      };
    })
  );

  return leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);
};

/**
 * Top performing properties by inquiry/deal count.
 */
const getTopProperties = async () => {
  const results = await Deal.aggregate([
    { $group: { _id: '$property', dealCount: { $sum: 1 }, totalValue: { $sum: '$dealValue' } } },
    { $sort: { dealCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'properties',
        localField: '_id',
        foreignField: '_id',
        as: 'property',
      },
    },
    { $unwind: '$property' },
    {
      $project: {
        _id: 1,
        dealCount: 1,
        totalValue: 1,
        title: '$property.title',
        type: '$property.type',
        price: '$property.price',
        address: '$property.address',
      },
    },
  ]);

  return results;
};

module.exports = {
  getLeadsBySource,
  getConversionFunnel,
  getRevenueByMonth,
  getAgentLeaderboard,
  getTopProperties,
};
