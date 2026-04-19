const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Real Estate CRM' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    defaultCommissionResidential: { type: Number, default: 2 },
    defaultCommissionCommercial: { type: Number, default: 1.5 },
    defaultCommissionPlot: { type: Number, default: 1 },
    notifyOnNewLead: { type: Boolean, default: true },
    notifyOnDealClosed: { type: Boolean, default: true },
    notifyOnFollowUpDue: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
