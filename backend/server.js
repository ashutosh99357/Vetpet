require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for SDK embeddability
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Serve the built SDK script
const path = require('path');
app.use('/sdk', express.static(path.join(__dirname, '../frontend/dist')));

// Serve chatbot.js as the embeddable script
app.get('/chatbot.js', (req, res) => {
  const sdkPath = path.join(__dirname, '../frontend/dist/chatbot.umd.js');
  const fs = require('fs');
  if (fs.existsSync(sdkPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(sdkPath);
  } else {
    res.status(404).send('// SDK not built yet. Run: cd frontend && npm run build');
  }
});

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'VetChatbot API',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 VetChatbot server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🤖 SDK: http://localhost:${PORT}/chatbot.js`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
