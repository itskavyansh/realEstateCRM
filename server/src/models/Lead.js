const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    propertyTypePreference: {
      type: String,
      enum: ['RESIDENTIAL', 'COMMERCIAL', 'PLOT', ''],
      default: '',
    },
    source: {
      type: String,
      enum: ['WEBSITE', 'AD', 'REFERRAL', 'CALL', 'WALKIN'],
      default: 'WEBSITE',
    },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CLOSED', 'LOST'],
      default: 'NEW',
    },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for common queries
leadSchema.index({ status: 1, assignedAgent: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
