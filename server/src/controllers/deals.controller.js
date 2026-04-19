const { Deal, Activity, Document: DealDocument } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/deals
const getDeals = async (req, res, next) => {
  try {
    const { stage, agent, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (stage) filter.stage = stage;
    if (agent) filter.agent = agent;
    if (req.user.role === 'AGENT') filter.agent = req.user.id;

    const skip = (Number(page) - 1) * Number(limit);
    const [deals, total] = await Promise.all([
      Deal.find(filter)
        .populate('client', 'name email phone')
        .populate('property', 'title price address images')
        .populate('agent', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Deal.countDocuments(filter),
    ]);

    sendSuccess(res, { deals, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/deals/kanban
const getKanban = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'AGENT') filter.agent = req.user.id;

    const deals = await Deal.find(filter)
      .populate('client', 'name email phone')
      .populate('property', 'title price address')
      .populate('agent', 'name email')
      .sort({ updatedAt: -1 });

    // Group by stage
    const stages = ['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED'];
    const kanban = {};
    stages.forEach((s) => { kanban[s] = []; });
    deals.forEach((d) => { kanban[d.stage].push(d); });

    sendSuccess(res, kanban);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/deals
const createDeal = async (req, res, next) => {
  try {
    const dealData = { ...req.body };
    if (!dealData.agent) dealData.agent = req.user.id;

    const deal = await Deal.create(dealData);

    await Activity.create({
      type: 'DEAL_CREATED',
      description: `New deal created with value ₹${deal.dealValue.toLocaleString()}`,
      entityType: 'DEAL',
      entityId: deal._id,
      user: req.user.id,
    });

    const populated = await Deal.findById(deal._id)
      .populate('client', 'name email')
      .populate('property', 'title price')
      .populate('agent', 'name email');

    sendSuccess(res, populated, 'Deal created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/deals/:id
const getDealById = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('client', 'name email phone type')
      .populate('property', 'title price address images type')
      .populate('agent', 'name email phone');

    if (!deal) return sendError(res, 'Deal not found', 404);

    // Get documents
    const documents = await DealDocument.find({ deal: deal._id })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    // Get activities
    const activities = await Activity.find({ entityType: 'DEAL', entityId: deal._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    sendSuccess(res, { deal, documents, activities });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/deals/:id
const updateDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return sendError(res, 'Deal not found', 404);

    // Update fields
    Object.assign(deal, req.body);

    // If closing the deal, set actual close date
    if (req.body.stage === 'CLOSED' && !deal.actualCloseDate) {
      deal.actualCloseDate = new Date();
    }

    await deal.save();

    const populated = await Deal.findById(deal._id)
      .populate('client', 'name email')
      .populate('property', 'title price')
      .populate('agent', 'name email');

    sendSuccess(res, populated, 'Deal updated successfully');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/deals/:id/stage
const updateStage = async (req, res, next) => {
  try {
    const { stage } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) return sendError(res, 'Deal not found', 404);

    const oldStage = deal.stage;
    deal.stage = stage;

    if (stage === 'CLOSED' && !deal.actualCloseDate) {
      deal.actualCloseDate = new Date();
    }

    await deal.save();

    await Activity.create({
      type: 'DEAL_STAGE_CHANGED',
      description: `Deal stage changed from ${oldStage} to ${stage}`,
      entityType: 'DEAL',
      entityId: deal._id,
      user: req.user.id,
      metadata: { oldStage, newStage: stage },
    });

    const populated = await Deal.findById(deal._id)
      .populate('client', 'name email')
      .populate('property', 'title price')
      .populate('agent', 'name email');

    sendSuccess(res, populated, 'Deal stage updated');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/deals/:id/documents
const uploadDocuments = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return sendError(res, 'Deal not found', 404);

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No documents uploaded', 400);
    }

    const docs = req.files.map((f) => ({
      deal: deal._id,
      filename: `/uploads/documents/${f.filename}`,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      uploadedBy: req.user.id,
    }));

    const created = await DealDocument.insertMany(docs);

    await Activity.create({
      type: 'DOCUMENT_UPLOADED',
      description: `${created.length} document(s) uploaded`,
      entityType: 'DEAL',
      entityId: deal._id,
      user: req.user.id,
    });

    sendSuccess(res, created, 'Documents uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDeals, getKanban, createDeal, getDealById, updateDeal, updateStage, uploadDocuments };
