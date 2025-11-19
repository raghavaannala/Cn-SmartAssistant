import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './SmartAssistant.css';

const SmartAssistant = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState([]);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      addMessage('system', 'Connected to Smart Assistant Server! 🚀');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addMessage('system', 'Disconnected from server');
    });

    newSocket.on('welcome', (data) => {
      addMessage('assistant', data.message);
      setCapabilities(data.capabilities || []);
    });

    newSocket.on('assistant_response', (response) => {
      setIsLoading(false);
      addMessage('assistant', response.response, response.type, response.data);
    });

    newSocket.on('error', (error) => {
      setIsLoading(false);
      addMessage('error', error.message || 'An error occurred');
    });

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        addMessage('error', 'Speech recognition error: ' + event.error);
      };
    }

    return () => {
      newSocket.close();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (sender, content, type = 'text', data = null) => {
    const message = {
      id: Date.now(),
      sender,
      content,
      type,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = (text = inputText) => {
    if (!text.trim() || !socket || !isConnected) return;

    addMessage('user', text);
    setIsLoading(true);
    setInputText('');

    socket.emit('voice_command', {
      command: text,
      userId: 'user-' + Date.now()
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addMessage('error', 'Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const isError = message.sender === 'error';

    return (
      <div
        key={message.id}
        className={`message ${isUser ? 'message-user' : ''}`}
      >
        {!isUser && (
          <div className={`message-avatar ${
            isSystem ? 'avatar-system' : 
            isError ? 'avatar-error' : 
            'avatar-assistant'
          }`}>
            {isSystem ? '⚡' : isError ? '!' : '🤖'}
          </div>
        )}
        
        <div className={`message-content ${
          isUser ? 'content-user' :
          isSystem ? 'content-system' :
          isError ? 'content-error' :
          'content-assistant'
        }`}>
          <p className="message-text">{message.content}</p>
          {message.data && message.type === 'weather' && (
            <div className="message-data weather-data">
              <p>🌡️ {message.data.temperature}°C</p>
              <p>💧 Humidity: {message.data.humidity}%</p>
              <p>💨 Wind: {message.data.windSpeed} km/h</p>
            </div>
          )}
          {message.data && message.type === 'calculation' && (
            <div className="calculation-data">
              {message.data.expression} = {message.data.result}
            </div>
          )}
          <p className="message-timestamp">{message.timestamp}</p>
        </div>

        {isUser && (
          <div className="message-avatar avatar-user">
            👤
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="smart-assistant">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              🤖
            </div>
            <div>
              <h1 className="title">Smart Assistant</h1>
              <p className="status">
                <span className={`status-dot ${isConnected ? 'status-connected' : 'status-disconnected'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div>
            <button className="settings-button">
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="chat-container">
          {/* Capabilities Banner */}
          {capabilities.length > 0 && (
            <div className="capabilities-banner">
              <h3 className="capabilities-title">I can help you with:</h3>
              <div className="capabilities-list">
                {capabilities.map((capability, index) => (
                  <span key={index} className="capability-tag">
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="messages-empty">
                <div className="empty-icon">🤖</div>
                <p className="empty-title">Welcome to Smart Assistant!</p>
                <p className="empty-subtitle">Start by typing a message or use voice commands</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            
            {isLoading && (
              <div className="loading-message">
                <div className="message-avatar avatar-assistant">
                  🤖
                </div>
                <div className="loading-content">
                  <div className="loading-spinner">⏳</div>
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-controls">
              <button
                onClick={toggleListening}
                disabled={!isConnected}
                className={`mic-button ${
                  isListening ? 'mic-active' : 'mic-inactive'
                }`}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
              
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message or use voice command..."
                  disabled={!isConnected}
                  className="text-input"
                />
              </div>
              
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || !isConnected || isLoading}
                className="send-button"
              >
                📤
              </button>
            </div>
            
            <div className="input-hint">
              {isListening ? (
                <span className="hint-listening">🎤 Listening... Speak now</span>
              ) : (
                <span>Press Enter to send • Click mic for voice input</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistant;
