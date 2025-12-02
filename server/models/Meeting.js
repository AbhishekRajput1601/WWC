import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a meeting title'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended'],
    default: 'scheduled',
  },
  settings: {
    allowCaptions: {
      type: Boolean,
      default: true,
    },
    allowTranslation: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
  },
  recordings: [
    {
      public_id: { type: String },
      url_high: { type: String },
      url_low: { type: String },
      duration: { type: Number },
      bytes: { type: Number },
      uploadedAt: { type: Date },
      uploadedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'processing', 'ready', 'failed'], default: 'pending' },
    }
  ],
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  captionsText: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
 
  messages: [
    {
      sender: { type: mongoose.Schema.ObjectId, ref: 'User' },
      senderName: { type: String },
      text: { type: String, required: true, maxlength: 2000 },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});


meetingSchema.index({ host: 1 });
meetingSchema.index({ 'participants.user': 1 });
meetingSchema.index({ meetingId: 1, 'messages.timestamp': -1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;