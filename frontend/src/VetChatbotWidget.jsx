import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:ital,wght@0,400;0,600;1,300&display=swap');

  #vet-chatbot-root * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'DM Sans', sans-serif;
  }

  .vcb-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    pointer-events: all;
  }

  /* Toggle Button */
  .vcb-toggle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2D6A4F 0%, #40916C 60%, #52B788 100%);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(45, 106, 79, 0.45), 0 2px 8px rgba(0,0,0,0.15);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    flex-shrink: 0;
  }
  .vcb-toggle:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba(45, 106, 79, 0.55), 0 4px 12px rgba(0,0,0,0.2);
  }
  .vcb-toggle:active { transform: scale(0.96); }
  .vcb-toggle svg { transition: transform 0.3s ease; }
  .vcb-toggle.open svg { transform: rotate(90deg); }

  .vcb-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: #E63946;
    border-radius: 50%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: white;
  }

  /* Chat Window */
  .vcb-window {
    width: 380px;
    height: 560px;
    background: #FAFAF8;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(45,106,79,0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform-origin: bottom right;
    animation: vcb-open 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    border: 1px solid rgba(45,106,79,0.15);
  }
  .vcb-window.closing {
    animation: vcb-close 0.25s ease-in forwards;
  }

  @keyframes vcb-open {
    from { opacity: 0; transform: scale(0.5) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes vcb-close {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.5) translateY(20px); }
  }

  /* Header */
  .vcb-header {
    background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
  }
  .vcb-header-avatar {
    width: 42px;
    height: 42px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .vcb-header-info { flex: 1; }
  .vcb-header-name {
    font-family: 'Fraunces', serif;
    font-size: 16px;
    font-weight: 600;
    color: white;
    letter-spacing: -0.3px;
  }
  .vcb-header-status {
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
  }
  .vcb-status-dot {
    width: 7px;
    height: 7px;
    background: #74C69D;
    border-radius: 50%;
    animation: vcb-pulse 2s infinite;
  }
  @keyframes vcb-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.85); }
  }
  .vcb-close-btn {
    background: rgba(255,255,255,0.15);
    border: none;
    cursor: pointer;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background 0.2s;
  }
  .vcb-close-btn:hover { background: rgba(255,255,255,0.25); }

  /* Messages */
  .vcb-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
  }
  .vcb-messages::-webkit-scrollbar { width: 4px; }
  .vcb-messages::-webkit-scrollbar-track { background: transparent; }
  .vcb-messages::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }

  /* Message bubbles */
  .vcb-message {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    animation: vcb-msg-in 0.3s ease forwards;
  }
  @keyframes vcb-msg-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .vcb-message.user { flex-direction: row-reverse; }

  .vcb-msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
  }
  .vcb-message.bot .vcb-msg-avatar { background: linear-gradient(135deg, #40916C, #52B788); }
  .vcb-message.user .vcb-msg-avatar { background: linear-gradient(135deg, #457B9D, #1D3557); }

  .vcb-bubble {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .vcb-message.bot .vcb-bubble {
    background: white;
    color: #1A1A1A;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .vcb-message.user .vcb-bubble {
    background: linear-gradient(135deg, #2D6A4F, #40916C);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .vcb-bubble strong { font-weight: 600; }
  .vcb-bubble em { font-style: italic; }

  .vcb-timestamp {
    font-size: 10px;
    color: #9CA3AF;
    margin-top: 3px;
    padding: 0 4px;
  }
  .vcb-message.user .vcb-timestamp { text-align: right; }

  /* Typing indicator */
  .vcb-typing {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .vcb-typing-bubble {
    background: white;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    padding: 12px 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .vcb-dot {
    width: 7px; height: 7px;
    background: #9CA3AF;
    border-radius: 50%;
    animation: vcb-bounce 1.2s infinite;
  }
  .vcb-dot:nth-child(2) { animation-delay: 0.2s; }
  .vcb-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes vcb-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30% { transform: translateY(-5px); opacity: 1; }
  }

  /* Appointment confirmed card */
  .vcb-apt-card {
    background: linear-gradient(135deg, #D8F3DC, #B7E4C7);
    border: 1px solid #74C69D;
    border-radius: 12px;
    padding: 12px 14px;
    margin-top: 8px;
    font-size: 12px;
    color: #1B4332;
  }
  .vcb-apt-card-title {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 6px;
    color: #1B4332;
  }

  /* Welcome message */
  .vcb-welcome {
    text-align: center;
    padding: 20px 16px;
  }
  .vcb-welcome-icon {
    width: 60px; height: 60px;
    background: linear-gradient(135deg, #D8F3DC, #B7E4C7);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
    font-size: 28px;
  }
  .vcb-welcome h3 {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 600;
    color: #1A1A1A;
    margin-bottom: 6px;
  }
  .vcb-welcome p {
    font-size: 13px;
    color: #6B7280;
    line-height: 1.5;
  }
  .vcb-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 14px;
  }
  .vcb-quick-btn {
    background: white;
    border: 1px solid #D1FAE5;
    color: #2D6A4F;
    padding: 7px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .vcb-quick-btn:hover {
    background: #D8F3DC;
    border-color: #74C69D;
  }

  /* Input area */
  .vcb-input-area {
    padding: 12px 16px;
    background: white;
    border-top: 1px solid #F0F0EE;
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }
  .vcb-input-wrap {
    flex: 1;
    background: #F5F5F3;
    border: 1.5px solid transparent;
    border-radius: 14px;
    padding: 10px 14px;
    transition: border-color 0.2s;
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .vcb-input-wrap:focus-within {
    border-color: #40916C;
    background: white;
    box-shadow: 0 0 0 3px rgba(64,145,108,0.1);
  }
  .vcb-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #1A1A1A;
    resize: none;
    max-height: 100px;
    line-height: 1.4;
    font-family: 'DM Sans', sans-serif;
  }
  .vcb-input::placeholder { color: #9CA3AF; }
  .vcb-send {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2D6A4F, #40916C);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .vcb-send:hover { transform: scale(1.05); background: linear-gradient(135deg, #1B4332, #2D6A4F); }
  .vcb-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* Error message */
  .vcb-error {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    color: #B91C1C;
    margin: 0 16px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Booking progress */
  .vcb-booking-bar {
    background: linear-gradient(135deg, #D8F3DC, #B7E4C7);
    padding: 8px 16px;
    font-size: 11.5px;
    color: #1B4332;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid #A8DADC20;
  }

  /* Mobile */
  @media (max-width: 480px) {
    .vcb-container { bottom: 16px; right: 16px; }
    .vcb-window { width: calc(100vw - 32px); height: calc(100vh - 100px); }
  }
`;

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMarkdown(text) {
  // Simple markdown rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/🐾|✅|👤|📞|📅|😊|📱|🐶|🐱/g, (m) => m);
}

const QUICK_ACTIONS = [
  '🐾 Book appointment',
  '💉 Vaccination info',
  '🍽️ Pet nutrition tips',
  '🚨 Emergency signs'
];

function TypingIndicator() {
  return (
    <div className="vcb-typing">
      <div className="vcb-msg-avatar" style={{ background: 'linear-gradient(135deg, #40916C, #52B788)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐾</div>
      <div className="vcb-typing-bubble">
        <div className="vcb-dot" />
        <div className="vcb-dot" />
        <div className="vcb-dot" />
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`vcb-message ${isUser ? 'user' : 'bot'}`}>
      <div className="vcb-msg-avatar" style={{ 
        width: 28, height: 28, borderRadius: '50%', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0,
        background: isUser ? 'linear-gradient(135deg, #457B9D, #1D3557)' : 'linear-gradient(135deg, #40916C, #52B788)'
      }}>
        {isUser ? '👤' : '🐾'}
      </div>
      <div>
        <div 
          className="vcb-bubble"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />
        <div className="vcb-timestamp">{formatTime(msg.timestamp)}</div>
      </div>
    </div>
  );
}

export default function VetChatbotWidget({ config }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('vcb_session_id');
    if (stored) return stored;
    const id = uuidv4();
    sessionStorage.setItem('vcb_session_id', id);
    return id;
  });
  const [bookingActive, setBookingActive] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  const apiUrl = config.apiUrl || 'http://localhost:3001/api';

  // Inject styles
  useEffect(() => {
    if (!document.getElementById('vcb-styles')) {
      const style = document.createElement('style');
      style.id = 'vcb-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // Load history on first open
  useEffect(() => {
    if (isOpen && !hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      loadHistory();
    }
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function loadHistory() {
    try {
      const res = await fetch(`${apiUrl}/history/${sessionId}`);
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages(data.messages.map(m => ({ ...m, timestamp: m.timestamp || new Date() })));
      }
    } catch (e) {
      // Silently fail - fresh start
    }
  }

  function handleClose() {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  }

  async function sendMessage(text) {
    if (!text?.trim() || isLoading) return;
    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text.trim(),
          context: {
            userId: config.userId,
            userName: config.userName,
            petName: config.petName
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json();
      const botMsg = { role: 'bot', content: data.message, timestamp: data.timestamp || new Date() };
      setMessages(prev => [...prev, botMsg]);
      setBookingActive(data.bookingActive || false);
      
      if (!isOpen) setUnreadCount(c => c + 1);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className="vcb-container">
      {/* Chat window */}
      {isOpen && (
        <div className={`vcb-window ${isClosing ? 'closing' : ''}`}>
          {/* Header */}
          <div className="vcb-header">
            <div className="vcb-header-avatar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="white"/>
              </svg>
            </div>
            <div className="vcb-header-info">
              <div className="vcb-header-name">{config.clinicName}</div>
              <div className="vcb-header-status">
                <div className="vcb-status-dot" />
                Veterinary Assistant
              </div>
            </div>
            <button className="vcb-close-btn" onClick={handleClose} aria-label="Close chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Booking progress bar */}
          {bookingActive && (
            <div className="vcb-booking-bar">
              📅 Appointment booking in progress...
            </div>
          )}

          {/* Messages */}
          <div className="vcb-messages" role="log" aria-live="polite">
            {showWelcome && (
              <div className="vcb-welcome">
                <div className="vcb-welcome-icon">🐾</div>
                <h3>Hello{config.userName ? `, ${config.userName}` : ''}!</h3>
                <p>I'm your veterinary assistant. Ask me anything about pet health, care, or book an appointment.</p>
                <div className="vcb-quick-actions">
                  {QUICK_ACTIONS.map(action => (
                    <button key={action} className="vcb-quick-btn" onClick={() => sendMessage(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="vcb-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Input */}
          <div className="vcb-input-area">
            <div className="vcb-input-wrap">
              <textarea
                ref={inputRef}
                className="vcb-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={bookingActive ? "Type your response..." : "Ask about your pet's health..."}
                rows={1}
                disabled={isLoading}
                aria-label="Chat message input"
              />
            </div>
            <button
              className="vcb-send"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        className={`vcb-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        aria-label={isOpen ? 'Close veterinary chatbot' : 'Open veterinary chatbot'}
        aria-expanded={isOpen}
      >
        {!isOpen ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
        {unreadCount > 0 && !isOpen && (
          <span className="vcb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
    </div>
  );
}
