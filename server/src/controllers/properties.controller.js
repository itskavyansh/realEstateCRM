const { Property, Activity } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/properties
const getProperties = async (req, res, next) => {
  try {
    const { type, status, minPrice, maxPrice, search, agent, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (agent) filter.agent = agent;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('agent', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    sendSuccess(res, { properties, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/properties
const createProperty = async (req, res, next) => {
  try {
    const propertyData = { ...req.body };

    // Handle amenities as comma-separated or array
    if (typeof propertyData.amenities === 'string') {
      propertyData.amenities = propertyData.amenities.split(',').map((a) => a.trim());
    }

    // Set agent to current user if not specified
    if (!propertyData.agent) {
      propertyData.agent = req.user.id;
    }

    const property = await Property.create(propertyData);

    await Activity.create({
      type: 'PROPERTY_CREATED',
      description: `Property "${property.title}" listed`,
      entityType: 'PROPERTY',
      entityId: property._id,
      user: req.user.id,
    });

    const populated = await Property.findById(property._id).populate('agent', 'name email');
    sendSuccess(res, populated, 'Property created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/properties/:id
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('agent', 'name email phone avatar');
    if (!property) return sendError(res, 'Property not found', 404);
    sendSuccess(res, property);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/properties/:id
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return sendError(res, 'Property not found', 404);

    // Agents can only edit their own listings
    if (req.user.role === 'AGENT' && property.agent.toString() !== req.user.id) {
      return sendError(res, 'Forbidden. You can only edit your own listings.', 403);
    }

    const updateData = { ...req.body };
    if (typeof updateData.amenities === 'string') {
      updateData.amenities = updateData.amenities.split(',').map((a) => a.trim());
    }

    const updated = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('agent', 'name email');

    await Activity.create({
      type: 'PROPERTY_UPDATED',
      description: `Property "${updated.title}" updated`,
      entityType: 'PROPERTY',
      entityId: updated._id,
      user: req.user.id,
    });

    sendSuccess(res, updated, 'Property updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/properties/:id
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return sendError(res, 'Property not found', 404);

    if (req.user.role === 'AGENT' && property.agent.toString() !== req.user.id) {
      return sendError(res, 'Forbidden. You can only delete your own listings.', 403);
    }

    await Property.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Property deleted successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/properties/:id/images
const uploadImages = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return sendError(res, 'Property not found', 404);

    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No images uploaded', 400);
    }

    // Build image paths relative to server
    const imagePaths = req.files.map((f) => `/uploads/properties/${f.filename}`);
    property.images.push(...imagePaths);
    await property.save();

    sendSuccess(res, property, 'Images uploaded successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProperties, createProperty, getPropertyById, updateProperty, deleteProperty, uploadImages };
