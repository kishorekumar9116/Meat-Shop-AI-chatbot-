import React, { useState, useRef, useEffect } from 'react';
import { Send, Store } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Welcome to FreshMeat. I can help you with information about our fresh chicken, mutton, and fish. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Network response was not ok');
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I am having trouble connecting to the server right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="chat-header">
        <div className="avatar">
          <Store size={24} color="white" />
        </div>
        <div className="header-info">
          <h1>FreshMeat Assistant</h1>
          <p><span className="status-dot"></span> Online</p>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'bot'}`}>
            <div className="message">
              {msg.content}
            </div>
            <div className="time">{formatTime()}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="message">
              <div className="typing-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <span>Thinking</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="chat-input-area">
        <div className="input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about chicken, mutton, fish..."
            rows={1}
          />
        </div>
        <button 
          className="send-btn" 
          onClick={handleSend} 
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </footer>
    </div>
  );
}

export default App;
