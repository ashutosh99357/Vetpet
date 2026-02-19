const express = require('express');
const router = express.Router();
const { Conversation, Appointment } = require('./models');
const { getVetResponse, getBookingResponse, detectBookingIntent } = require('./aiService');

// POST /api/messages - Send a message and get AI response
router.post('/messages', async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;

    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        context: context || {},
        bookingState: { active: false, step: null, data: {} }
      });
    }

    // Add user message
    conversation.messages.push({ role: 'user', content: message.trim() });

    let botResponse = '';
    let appointmentCreated = null;

    // Handle booking flow
    if (conversation.bookingState.active) {
      const result = await getBookingResponse(
        conversation.bookingState.step,
        message.trim(),
        conversation.bookingState.data,
        conversation.context
      );

      // Update booking data
      if (result.updateData) {
        conversation.bookingState.data = {
          ...conversation.bookingState.data,
          ...result.updateData
        };
      }

      if (result.message === 'CONFIRMED') {
        // Create appointment
        const apt = await Appointment.create({
          sessionId,
          ownerName: conversation.bookingState.data.ownerName,
          petName: conversation.bookingState.data.petName,
          phone: conversation.bookingState.data.phone,
          dateTime: conversation.bookingState.data.dateTime,
          status: 'confirmed'
        });
        conversation.appointmentId = apt._id;
        appointmentCreated = apt;
        botResponse = `✅ **Appointment Confirmed!**\n\nYour appointment has been successfully booked:\n\n👤 **Owner:** ${apt.ownerName}\n🐾 **Pet:** ${apt.petName}\n📞 **Phone:** ${apt.phone}\n📅 **Date/Time:** ${apt.dateTime}\n\nWe'll see you and ${apt.petName} soon! Is there anything else you'd like to know? 🐾`;
        conversation.bookingState.active = false;
        conversation.bookingState.step = null;
        conversation.bookingState.data = {};
      } else if (result.cancelled) {
        botResponse = result.message;
        conversation.bookingState.active = false;
        conversation.bookingState.step = null;
        conversation.bookingState.data = {};
      } else {
        botResponse = result.message;
        conversation.bookingState.step = result.nextStep;
      }

    } else if (detectBookingIntent(message)) {
      // Start booking flow
      conversation.bookingState.active = true;
      conversation.bookingState.step = null;
      conversation.bookingState.data = {};
      const result = await getBookingResponse(null, message, {}, conversation.context);
      botResponse = result.message;
      conversation.bookingState.step = result.nextStep;

    } else {
      // Regular AI response
      botResponse = await getVetResponse(
        conversation.messages.slice(0, -1),
        message.trim(),
        conversation.context
      );
    }

    // Add bot response
    conversation.messages.push({ role: 'bot', content: botResponse });
    await conversation.save();

    res.json({
      sessionId,
      message: botResponse,
      appointmentCreated: appointmentCreated ? {
        id: appointmentCreated._id,
        ownerName: appointmentCreated.ownerName,
        petName: appointmentCreated.petName,
        dateTime: appointmentCreated.dateTime,
        status: appointmentCreated.status
      } : null,
      bookingActive: conversation.bookingState.active,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/history/:sessionId - Get conversation history
router.get('/history/:sessionId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) {
      return res.json({ messages: [], sessionId: req.params.sessionId });
    }
    res.json({
      sessionId: conversation.sessionId,
      messages: conversation.messages,
      context: conversation.context,
      appointmentId: conversation.appointmentId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/appointments - Create appointment directly
router.post('/appointments', async (req, res) => {
  try {
    const { sessionId, ownerName, petName, phone, dateTime } = req.body;
    if (!sessionId || !ownerName || !petName || !phone || !dateTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const appointment = await Appointment.create({ sessionId, ownerName, petName, phone, dateTime });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /api/appointments/:sessionId - Get appointments for session
router.get('/appointments/:sessionId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ sessionId: req.params.sessionId });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;
