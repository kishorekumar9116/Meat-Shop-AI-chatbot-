import React, { useState, useRef, useEffect } from 'react';
import { Send, Store, Menu, Plus, MessageSquare, Mic, User, X } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [appLang, setAppLang] = useState('Auto');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getVoiceLangCode = (lang) => {
    if (lang === 'Tamil') return 'ta-IN';
    return 'en-US'; // Default to English for Auto or English
  };

  // Web Speech API for voice assistant
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getVoiceLangCode(appLang);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
      // Ensure the text box gets focus so the user can just hit Enter
      if(inputRef.current) inputRef.current.focus();
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleListen = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    let currentMessages = [...messages];

    // Inject initial greeting if this is the first message
    if (currentMessages.length === 0) {
      currentMessages = [
        { role: 'assistant', content: 'Hi, welcome to Karikadai' }
      ];
    }

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...currentMessages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages, preferredLanguage: appLang }),
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
      if(inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSidebarOpen(false);
  };

  // Reusable component for the text box area so we can render it in two different layouts (Claude style)
  const renderInputArea = (isFixedBottom = false) => (
    <div className={`input-area ${isFixedBottom ? 'fixed-bottom' : ''}`}>
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="I can help you with information about our fresh chicken, mutton, and fish..."
          rows={1}
        />
        <div className="input-buttons">
          <button 
            className={`action-btn ${isListening ? 'active' : ''}`}
            onClick={toggleListen}
            title="Use Microphone"
          >
            <Mic size={20} />
          </button>
          <button 
            className={`action-btn ${input.trim() ? 'send-btn' : ''}`}
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Store size={20} />
          Karikadai
        </div>
        <button className="new-chat-btn" onClick={startNewChat}>
          <Plus size={16} />
          New Chat
        </button>
        
        {/* Language Selector for Voice & App Preference */}
        <select 
          className="lang-select" 
          value={appLang} 
          onChange={(e) => setAppLang(e.target.value)}
          title="Select Preferred Language"
        >
          <option value="Auto">Auto-Detect Language</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
        </select>

        <div className="history-list">
          <div className="history-item">
            <MessageSquare size={16} />
            Previous Order
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 style={{fontSize: '1.2rem', color: 'var(--orange-primary)', fontWeight: '700'}}>Karikadai</h2>
          <div style={{width: 24}}></div>
        </div>

        {/* If chat is empty, show Claude-style centered greeting and input */}
        {messages.length === 0 ? (
          <div className="empty-state">
            <h1 className="empty-greeting">Vanakam 🙏</h1>
            {renderInputArea(false)}
          </div>
        ) : (
          /* If chat has messages, show conversation flow with fixed-bottom input */
          <>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  <div className="message-content">
                    <div className={`avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                      {msg.role === 'user' ? <User size={18} color="white" /> : <Store size={18} color="white" />}
                    </div>
                    <div className="message-text">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message-wrapper bot">
                  <div className="message-content">
                    <div className="avatar bot">
                      <Store size={18} color="white" />
                    </div>
                    <div className="message-text" style={{color: 'var(--orange-primary)'}}>
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {renderInputArea(true)}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
