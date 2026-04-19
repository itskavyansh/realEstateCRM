const { CompanySettings } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/v1/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    sendSuccess(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/settings/logo
const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No logo file uploaded', 400);

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({ logo: `/uploads/logos/${req.file.filename}` });
    } else {
      settings.logo = `/uploads/logos/${req.file.filename}`;
      await settings.save();
    }
    sendSuccess(res, settings, 'Logo uploaded successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, uploadLogo };
