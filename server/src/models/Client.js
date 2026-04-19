const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    type: {
      type: String,
      enum: ['BUYER', 'SELLER', 'BOTH'],
      default: 'BUYER',
    },
    budget: { type: Number, default: 0 },
    preferredLocations: [{ type: String }],
    notes: { type: String, default: '' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
