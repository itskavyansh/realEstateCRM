const { Client, Activity, Interaction, Deal, FollowUp } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/clients
const getClients = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate('lead', 'name status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Client.countDocuments(filter),
    ]);

    sendSuccess(res, { clients, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/clients
const createClient = async (req, res, next) => {
  try {
    const clientData = { ...req.body };
    if (typeof clientData.preferredLocations === 'string') {
      clientData.preferredLocations = clientData.preferredLocations.split(',').map((l) => l.trim());
    }

    const client = await Client.create(clientData);

    await Activity.create({
      type: 'CLIENT_CREATED',
      description: `Client "${client.name}" created`,
      entityType: 'CLIENT',
      entityId: client._id,
      user: req.user.id,
    });

    sendSuccess(res, client, 'Client created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).populate('lead');
    if (!client) return sendError(res, 'Client not found', 404);

    // Get interactions
    const interactions = await Interaction.find({ client: client._id })
      .populate('user', 'name')
      .sort({ date: -1 });

    // Get deals linked to this client
    const deals = await Deal.find({ client: client._id })
      .populate('property', 'title price')
      .populate('agent', 'name')
      .sort({ createdAt: -1 });

    // Get follow-ups
    const followUps = await FollowUp.find({ client: client._id })
      .populate('user', 'name')
      .sort({ scheduledAt: -1 });

    sendSuccess(res, { client, interactions, deals, followUps });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (typeof updateData.preferredLocations === 'string') {
      updateData.preferredLocations = updateData.preferredLocations.split(',').map((l) => l.trim());
    }

    const client = await Client.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!client) return sendError(res, 'Client not found', 404);

    sendSuccess(res, client, 'Client updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/clients/:id
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return sendError(res, 'Client not found', 404);
    sendSuccess(res, null, 'Client deleted successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/clients/:id/interactions
const logInteraction = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return sendError(res, 'Client not found', 404);

    const interaction = await Interaction.create({
      client: client._id,
      type: req.body.type,
      date: req.body.date || new Date(),
      notes: req.body.notes || '',
      user: req.user.id,
    });

    await Activity.create({
      type: 'INTERACTION_LOGGED',
      description: `${req.body.type} interaction logged with "${client.name}"`,
      entityType: 'CLIENT',
      entityId: client._id,
      user: req.user.id,
    });

    const populated = await Interaction.findById(interaction._id).populate('user', 'name');
    sendSuccess(res, populated, 'Interaction logged successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/clients/:id/interactions
const getInteractions = async (req, res, next) => {
  try {
    const interactions = await Interaction.find({ client: req.params.id })
      .populate('user', 'name')
      .sort({ date: -1 });
    sendSuccess(res, interactions);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/clients/:id/follow-ups
const createClientFollowUp = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return sendError(res, 'Client not found', 404);

    const followUp = await FollowUp.create({
      client: client._id,
      user: req.user.id,
      scheduledAt: req.body.scheduledAt,
      note: req.body.note || '',
    });

    await Activity.create({
      type: 'FOLLOW_UP_CREATED',
      description: `Follow-up scheduled for "${client.name}"`,
      entityType: 'CLIENT',
      entityId: client._id,
      user: req.user.id,
    });

    const populated = await FollowUp.findById(followUp._id).populate('user', 'name');
    sendSuccess(res, populated, 'Follow-up created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClients, createClient, getClientById, updateClient, deleteClient,
  logInteraction, getInteractions, createClientFollowUp,
};
