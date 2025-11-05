import mongoose from 'mongoose';

const captionSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
  },
  speaker: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
  originalLanguage: {
    type: String,
    required: true,
    default: 'en',
  },
  translations: [{
    language: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
  }],
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number, // in milliseconds
    default: 0,
  },
  isFinal: {
    type: Boolean,
    default: false,
  },
});

captionSchema.index({ meetingId: 1, timestamp: 1 });
captionSchema.index({ speaker: 1 });

const Caption = mongoose.model('Caption', captionSchema);

export default Caption;