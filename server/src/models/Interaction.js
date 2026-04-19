const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    type: {
      type: String,
      enum: ['CALL', 'SITE_VISIT', 'EMAIL'],
      required: true,
    },
    date: { type: Date, required: true },
    notes: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

interactionSchema.index({ client: 1, date: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);
