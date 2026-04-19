const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    note: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

followUpSchema.index({ scheduledAt: 1, isCompleted: 1, emailSent: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
