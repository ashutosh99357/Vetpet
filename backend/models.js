const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  messages: [MessageSchema],
  context: {
    userId: String,
    userName: String,
    petName: String
  },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  bookingState: {
    active: { type: Boolean, default: false },
    step: { type: String, default: null },
    data: {
      ownerName: String,
      petName: String,
      phone: String,
      dateTime: String
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const AppointmentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  ownerName: { type: String, required: true },
  petName: { type: String, required: true },
  phone: { type: String, required: true },
  dateTime: { type: String, required: true },
  status: { type: String, default: 'confirmed', enum: ['confirmed', 'cancelled', 'completed'] },
  createdAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', ConversationSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = { Conversation, Appointment };
