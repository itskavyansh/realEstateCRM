const { User, Lead, Deal, Activity } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/users
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, { users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, 'Email already in use', 409);

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: role || 'AGENT',
      phone: phone || '',
    });

    sendSuccess(res, user.toJSON(), 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user.toJSON());
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, phone, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (password) user.passwordHash = password;

    await user.save();
    sendSuccess(res, user.toJSON(), 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/users/:id/deactivate
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, user.toJSON(), `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id/stats
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', 404);

    const [
      totalLeads,
      leadsConverted,
      activeDeals,
      closedDeals,
      allClosedDeals,
    ] = await Promise.all([
      Lead.countDocuments({ assignedAgent: userId }),
      Lead.countDocuments({ assignedAgent: userId, status: 'CLOSED' }),
      Deal.countDocuments({ agent: userId, stage: { $nin: ['CLOSED', 'CANCELLED'] } }),
      Deal.countDocuments({ agent: userId, stage: 'CLOSED' }),
      Deal.find({ agent: userId, stage: 'CLOSED' }),
    ]);

    const totalCommission = allClosedDeals.reduce((sum, d) => sum + d.commissionAmount, 0);
    const totalRevenue = allClosedDeals.reduce((sum, d) => sum + d.dealValue, 0);

    // Monthly performance for the current year
    const currentYear = new Date().getFullYear();
    const monthlyPerformance = await Deal.aggregate([
      {
        $match: {
          agent: user._id,
          stage: 'CLOSED',
          actualCloseDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$actualCloseDate' } },
          revenue: { $sum: '$dealValue' },
          commission: { $sum: '$commissionAmount' },
          deals: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
      revenue: 0,
      commission: 0,
      deals: 0,
    }));

    monthlyPerformance.forEach((r) => {
      monthlyData[r._id.month - 1] = {
        ...monthlyData[r._id.month - 1],
        revenue: r.revenue,
        commission: r.commission,
        deals: r.deals,
      };
    });

    sendSuccess(res, {
      user: user.toJSON(),
      stats: {
        totalLeads,
        leadsConverted,
        activeDeals,
        closedDeals,
        totalCommission,
        totalRevenue,
        conversionRate: totalLeads > 0 ? ((leadsConverted / totalLeads) * 100).toFixed(1) : 0,
      },
      monthlyPerformance: monthlyData,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/users/bulk-reassign
const bulkReassign = async (req, res, next) => {
  try {
    const { fromAgentId, toAgentId } = req.body;

    const result = await Lead.updateMany(
      { assignedAgent: fromAgentId },
      { assignedAgent: toAgentId }
    );

    sendSuccess(res, { reassigned: result.modifiedCount }, `${result.modifiedCount} leads reassigned`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, createUser, getUserById, updateUser, deactivateUser, getUserStats, bulkReassign };
