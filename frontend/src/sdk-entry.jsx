import React from 'react';
import { createRoot } from 'react-dom/client';
import VetChatbotWidget from './VetChatbotWidget';

function initVetChatbot() {
  // Get config from window or use defaults
  const config = window.VetChatbotConfig || {};
  
  // Create mount point
  const container = document.createElement('div');
  container.id = 'vet-chatbot-root';
  container.style.cssText = 'position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(container);

  // Mount React app
  const root = createRoot(container);
  root.render(
    React.createElement(VetChatbotWidget, {
      config: {
        userId: config.userId || null,
        userName: config.userName || null,
        petName: config.petName || null,
        apiUrl: config.apiUrl || 'http://localhost:3001/api',
        theme: config.theme || 'default',
        clinicName: config.clinicName || 'VetCare Clinic',
        welcomeMessage: config.welcomeMessage || null
      }
    })
  );
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVetChatbot);
} else {
  initVetChatbot();
}

export { initVetChatbot };
