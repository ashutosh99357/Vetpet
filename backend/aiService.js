const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY !== 'AIzaSyCRfl3-LAgiU2OqOMhHWuvYJ1goJJDgDaI') {
  console.error('❌ GEMINI_API_KEY is missing or not set in .env file!');
}
console.log(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("genAI : ", genAI);

const SYSTEM_PROMPT = `You are a friendly, professional veterinary assistant chatbot for a veterinary clinic. Your role is to:

1. Answer ONLY veterinary-related questions about:
   - Pet health, symptoms, and diseases
   - Pet nutrition and diet
   - Vaccinations and preventive care
   - Pet behavior and training
   - Emergency signs that require immediate vet attention
   - General pet care advice (dogs, cats, birds, rabbits, fish, reptiles, etc.)
   - Appointment booking for veterinary services

2. For NON-veterinary questions, politely respond: "I'm specialized in veterinary topics only. I can help you with pet health questions, care advice, or booking an appointment. Is there something pet-related I can assist you with?"

3. APPOINTMENT BOOKING: When a user wants to book an appointment, respond with JSON in this exact format (and nothing else before the JSON):
   BOOKING_INTENT_DETECTED
   
4. Always be warm, empathetic, and reassuring — pet owners are often worried about their animals.

5. If a pet seems to have a medical emergency (difficulty breathing, seizures, heavy bleeding, collapse), always advise seeking immediate emergency vet care.

6. Keep responses concise but thorough. Use simple language, avoid excessive medical jargon.`;

const BOOKING_STEPS = {
  OWNER_NAME: 'owner_name',
  PET_NAME: 'pet_name', 
  PHONE: 'phone',
  DATETIME: 'datetime',
  CONFIRM: 'confirm'
};

function detectBookingIntent(message) {
  const bookingKeywords = [
    'book', 'appointment', 'schedule', 'reserve', 'visit', 
    'bring.*in', 'come in', 'make.*appointment', 'set up.*appointment',
    'when can', 'available', 'slot', 'consultation'
  ];
  const lower = message.toLowerCase();
  return bookingKeywords.some(kw => new RegExp(kw).test(lower));
}

function validatePhone(phone) {
  return /^[\+]?[\d\s\-\(\)]{7,15}$/.test(phone.trim());
}

function validateDateTime(dateTime) {
  // Accept various formats, just check it's not empty and somewhat reasonable
  return dateTime.trim().length >= 5;
}

async function getBookingResponse(step, userMessage, bookingData, context) {
  const petName = bookingData.petName || context?.petName || 'your pet';
  const ownerName = bookingData.ownerName || context?.userName || '';

  switch (step) {
    case null:
    case undefined:
      return {
        message: `I'd be happy to help you book an appointment! 🐾\n\nLet's get that scheduled. Could you please provide your **full name**?`,
        nextStep: BOOKING_STEPS.OWNER_NAME
      };
    
    case BOOKING_STEPS.OWNER_NAME:
      if (userMessage.trim().length < 2) {
        return { message: "Please enter your full name to continue.", nextStep: BOOKING_STEPS.OWNER_NAME };
      }
      return {
        message: `Great, ${userMessage.trim()}! 😊\n\nWhat is your **pet's name** and **species** (e.g., "Max, golden retriever")?`,
        nextStep: BOOKING_STEPS.PET_NAME,
        updateData: { ownerName: userMessage.trim() }
      };
    
    case BOOKING_STEPS.PET_NAME:
      if (userMessage.trim().length < 2) {
        return { message: "Please tell me your pet's name and type.", nextStep: BOOKING_STEPS.PET_NAME };
      }
      return {
        message: `${userMessage.trim()} sounds adorable! 🐶🐱\n\nWhat is your **phone number** so we can confirm the appointment?`,
        nextStep: BOOKING_STEPS.PHONE,
        updateData: { petName: userMessage.trim() }
      };
    
    case BOOKING_STEPS.PHONE:
      if (!validatePhone(userMessage)) {
        return { 
          message: "That doesn't look like a valid phone number. Please enter a valid phone number (e.g., +1 555-123-4567).",
          nextStep: BOOKING_STEPS.PHONE 
        };
      }
      return {
        message: `Perfect! 📞\n\nWhen would you like the appointment? Please provide your **preferred date and time** (e.g., "June 20th at 2 PM" or "Tomorrow afternoon").`,
        nextStep: BOOKING_STEPS.DATETIME,
        updateData: { phone: userMessage.trim() }
      };
    
    case BOOKING_STEPS.DATETIME:
      if (!validateDateTime(userMessage)) {
        return { 
          message: "Please provide a valid date and time for your appointment.",
          nextStep: BOOKING_STEPS.DATETIME 
        };
      }
      const data = { ...bookingData, dateTime: userMessage.trim() };
      return {
        message: `Almost done! Please **confirm** the following details:\n\n👤 **Owner:** ${data.ownerName}\n🐾 **Pet:** ${data.petName}\n📞 **Phone:** ${data.phone}\n📅 **Date/Time:** ${data.dateTime}\n\nType **"confirm"** to book this appointment or **"cancel"** to start over.`,
        nextStep: BOOKING_STEPS.CONFIRM,
        updateData: { dateTime: userMessage.trim() }
      };
    
    case BOOKING_STEPS.CONFIRM:
      if (userMessage.toLowerCase().includes('confirm')) {
        return { message: 'CONFIRMED', nextStep: null };
      } else if (userMessage.toLowerCase().includes('cancel')) {
        return { 
          message: "No problem! Your booking has been cancelled. Is there anything else I can help you with?",
          nextStep: null,
          cancelled: true
        };
      } else {
        return { 
          message: 'Please type **"confirm"** to complete your booking or **"cancel"** to start over.',
          nextStep: BOOKING_STEPS.CONFIRM 
        };
      }
  }
}

async function getVetResponse(messages, userMessage, context) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    // Build chat history for context
    const history = messages.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add context prefix if available
    let contextPrefix = '';
    if (context?.userName) contextPrefix += `[User: ${context.userName}] `;
    if (context?.petName) contextPrefix += `[Pet: ${context.petName}] `;

    const chat = model.startChat({ history: history.slice(0, -1) });
    const result = await chat.sendMessage(contextPrefix + userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('AI service temporarily unavailable. Please try again.');
  }
}

module.exports = { 
  getVetResponse, 
  getBookingResponse,
  detectBookingIntent,
  BOOKING_STEPS 
};
