const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'LEAD_CREATED',
        'LEAD_STATUS_CHANGED',
        'LEAD_ASSIGNED',
        'DEAL_CREATED',
        'DEAL_STAGE_CHANGED',
        'FOLLOW_UP_CREATED',
        'FOLLOW_UP_COMPLETED',
        'NOTE_ADDED',
        'PROPERTY_CREATED',
        'PROPERTY_UPDATED',
        'CLIENT_CREATED',
        'INTERACTION_LOGGED',
        'DOCUMENT_UPLOADED',
      ],
      required: true,
    },
    description: { type: String, required: true },
    entityType: { type: String, enum: ['LEAD', 'PROPERTY', 'CLIENT', 'DEAL', 'USER'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
