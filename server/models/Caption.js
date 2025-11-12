import mongoose from 'mongoose';

const { Schema } = mongoose;

const captionEntrySchema = new Schema({
  speaker: {
    type: Schema.Types.ObjectId,
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
  translations: [
    {
      language: { type: String, required: true },
      text: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    },
  ],
  confidence: { type: Number, min: 0, max: 1, default: 0.8 },
  timestamp: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
  isFinal: { type: Boolean, default: false },
});

const meetingCaptionsSchema = new Schema(
  {
    meetingId: { type: String, required: true, unique: true },
    captions: { type: [captionEntrySchema], default: [] },
  },
  { timestamps: true }
);

meetingCaptionsSchema.index({ meetingId: 1 });

const Caption = mongoose.model('Caption', meetingCaptionsSchema);

export default Caption;