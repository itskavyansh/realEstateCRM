const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['RESIDENTIAL', 'COMMERCIAL', 'PLOT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'UNDER_NEGOTIATION', 'SOLD'],
      default: 'AVAILABLE',
    },
    price: { type: Number, required: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    areaSqFt: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    amenities: [{ type: String }],
    description: { type: String, default: '' },
    images: [{ type: String }], // file paths relative to /uploads
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

propertySchema.index({ type: 1, status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ address: 'text', title: 'text' });

module.exports = mongoose.model('Property', propertySchema);
