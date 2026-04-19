const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stage: {
      type: String,
      enum: ['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'AGREEMENT', 'CLOSED', 'CANCELLED'],
      default: 'INQUIRY',
    },
    dealValue: { type: Number, required: true },
    commissionPercent: { type: Number, default: 2 },
    commissionAmount: { type: Number, default: 0 },
    expectedCloseDate: { type: Date, default: null },
    actualCloseDate: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-calculate commission amount before save
dealSchema.pre('save', function (next) {
  this.commissionAmount = (this.dealValue * this.commissionPercent) / 100;
  next();
});

dealSchema.index({ stage: 1 });
dealSchema.index({ agent: 1 });

module.exports = mongoose.model('Deal', dealSchema);
