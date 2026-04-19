const { Lead, Activity, FollowUp } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { parseLeadsCSV } = require('../utils/csvParser');

// GET /api/v1/leads
const getLeads = async (req, res, next) => {
  try {
    const { status, source, assignedAgent, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Agents can only see their own leads
    if (req.user.role === 'AGENT') {
      filter.assignedAgent = req.user.id;
    } else if (assignedAgent) {
      filter.assignedAgent = assignedAgent;
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedAgent', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    sendSuccess(res, { leads, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads
const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create(req.body);

    // Log activity
    await Activity.create({
      type: 'LEAD_CREATED',
      description: `New lead "${lead.name}" created`,
      entityType: 'LEAD',
      entityId: lead._id,
      user: req.user.id,
    });

    const populated = await Lead.findById(lead._id).populate('assignedAgent', 'name email');
    sendSuccess(res, populated, 'Lead created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedAgent', 'name email avatar');
    if (!lead) return sendError(res, 'Lead not found', 404);

    // Agent can only access their own leads
    if (req.user.role === 'AGENT' && lead.assignedAgent?._id?.toString() !== req.user.id) {
      return sendError(res, 'Forbidden', 403);
    }

    // Get activities for this lead
    const activities = await Activity.find({ entityType: 'LEAD', entityId: lead._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Get follow-ups
    const followUps = await FollowUp.find({ lead: lead._id })
      .populate('user', 'name')
      .sort({ scheduledAt: -1 });

    sendSuccess(res, { lead, activities, followUps });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/leads/:id
const updateLead = async (req, res, next) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) return sendError(res, 'Lead not found', 404);

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedAgent', 'name email');

    // Log status change activity
    if (req.body.status && req.body.status !== oldLead.status) {
      await Activity.create({
        type: 'LEAD_STATUS_CHANGED',
        description: `Lead status changed from ${oldLead.status} to ${req.body.status}`,
        entityType: 'LEAD',
        entityId: oldLead._id,
        user: req.user.id,
        metadata: { oldStatus: oldLead.status, newStatus: req.body.status },
      });
    }

    sendSuccess(res, updatedLead, 'Lead updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/leads/:id
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    sendSuccess(res, null, 'Lead deleted successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/:id/assign
const assignLead = async (req, res, next) => {
  try {
    const { agentId } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { assignedAgent: agentId },
      { new: true }
    ).populate('assignedAgent', 'name email');

    if (!lead) return sendError(res, 'Lead not found', 404);

    await Activity.create({
      type: 'LEAD_ASSIGNED',
      description: `Lead assigned to ${lead.assignedAgent?.name || 'unassigned'}`,
      entityType: 'LEAD',
      entityId: lead._id,
      user: req.user.id,
    });

    sendSuccess(res, lead, 'Lead assigned successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/import-csv
const importCSV = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No CSV file uploaded', 400);

    const leadData = await parseLeadsCSV(req.file.path);

    // Assign to current user if agent, else leave unassigned
    const leads = leadData.map((l) => ({
      ...l,
      assignedAgent: req.user.role === 'AGENT' ? req.user.id : null,
    }));

    const created = await Lead.insertMany(leads);

    // Log activity for each lead
    const activities = created.map((lead) => ({
      type: 'LEAD_CREATED',
      description: `Lead "${lead.name}" imported via CSV`,
      entityType: 'LEAD',
      entityId: lead._id,
      user: req.user.id,
    }));
    await Activity.insertMany(activities);

    sendSuccess(res, { imported: created.length }, `${created.length} leads imported successfully`, 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/leads/:id/activities
const getLeadActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ entityType: 'LEAD', entityId: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/:id/follow-ups
const createFollowUp = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);

    const followUp = await FollowUp.create({
      lead: lead._id,
      user: req.user.id,
      scheduledAt: req.body.scheduledAt,
      note: req.body.note || '',
    });

    await Activity.create({
      type: 'FOLLOW_UP_CREATED',
      description: `Follow-up scheduled for ${new Date(req.body.scheduledAt).toLocaleString()}`,
      entityType: 'LEAD',
      entityId: lead._id,
      user: req.user.id,
    });

    const populated = await FollowUp.findById(followUp._id).populate('user', 'name');
    sendSuccess(res, populated, 'Follow-up created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/bulk-assign
const bulkAssign = async (req, res, next) => {
  try {
    const { leadIds, agentId } = req.body;
    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { assignedAgent: agentId }
    );
    sendSuccess(res, null, `${leadIds.length} leads reassigned successfully`);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/leads/bulk-status
const bulkStatus = async (req, res, next) => {
  try {
    const { leadIds, status } = req.body;
    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { status }
    );
    sendSuccess(res, null, `${leadIds.length} leads updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLeads, createLead, getLeadById, updateLead, deleteLead,
  assignLead, importCSV, getLeadActivities, createFollowUp,
  bulkAssign, bulkStatus,
};
