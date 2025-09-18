import React, { useState, useRef, useEffect } from 'react';
import '../styles/chat-ui.scss'

// Configuration for API endpoints
const API_BASE_URL= import.meta.env.VITE_API_URL || "http://localhost:5000";

const ChatUI = () => {
  // Session management state
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session when component mounts
  useEffect(() => {
    initializeSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create new session with backend
  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Try to get existing session from localStorage first
      const savedSessionId = localStorage.getItem('voosh_chat_session_id');
      let currentSessionId = savedSessionId;
      
      // If no saved session or we want to verify it exists, create new one
      if (!savedSessionId) {
        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }
        
        const data = await response.json();
        currentSessionId = data.sessionId;
        localStorage.setItem('voosh_chat_session_id', currentSessionId);
      }
      
      setSessionId(currentSessionId);
      
      // Load existing chat history if any
      await loadChatHistory(currentSessionId);
      
      // If no messages, show welcome message
      if (messages.length === 0) {
        setMessages([{
          id: Date.now(),
          text: "Hello! I'm the Voosh News Chatbot. I can help you find the latest news and answer questions about current events. What would you like to know?",
          sender: 'bot',
          timestamp: new Date(),
          isWelcome: true
        }]);
      }
      
    } catch (error) {
      console.error('Session initialization failed:', error);
      setError('Failed to connect to chat service. Please refresh the page.');
      
      // Fallback to local-only mode
      setMessages([{
        id: Date.now(),
        text: "I'm having trouble connecting to the server. Please refresh the page to try again.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
      
    } finally {
      setIsInitializing(false);
    }
  };

  // Load chat history from backend
  const loadChatHistory = async (sessionIdToLoad) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionIdToLoad}/history`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          // Convert backend message format to frontend format
          const convertedMessages = data.history.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            text: msg.content,
            sender: msg.type === 'user' ? 'user' : 'bot',
            timestamp: new Date(msg.timestamp),
            sources: msg.sources || undefined
          }));
          setMessages(convertedMessages);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Continue without history - not a critical error
    }
  };

  // Send message to backend RAG system
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Add typing indicator
      const typingMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
        isStreaming: true
      };
      setMessages(prev => [...prev, typingMessage]);

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Remove typing indicator and add real response
      setMessages(prev => {
        const messagesWithoutTyping = prev.filter(msg => !msg.isStreaming);
        return [
          ...messagesWithoutTyping,
          {
            id: Date.now() + 2,
            text: data.response,
            sender: 'bot',
            timestamp: new Date(data.timestamp),
            sources: data.sources || undefined
          }
        ];
      });

      // Simulate streaming effect for better UX
      if (data.response) {
        simulateStreamingResponse(data.response, data.sources);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const messagesWithoutTyping = prev.filter(msg => !msg.isStreaming);
        return [
          ...messagesWithoutTyping,
          {
            id: Date.now() + 2,
            text: "I'm sorry, I encountered an error processing your request. Please try again or check your connection.",
            sender: 'bot',
            timestamp: new Date(),
            isError: true
          }
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate streaming response for better UX (optional)
  const simulateStreamingResponse = (fullText, sources) => {
    // Remove the non-streaming message first
    setMessages(prev => {
      const messagesWithoutLast = prev.slice(0, -1);
      return [
        ...messagesWithoutLast,
        {
          id: Date.now(),
          text: '',
          sender: 'bot',
          timestamp: new Date(),
          isStreaming: true,
          sources: sources
        }
      ];
    });

    const words = fullText.split(' ');
    let currentText = '';
    let wordIndex = 0;

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
            lastMessage.text = currentText;
          }
          return newMessages;
        });
        wordIndex++;
      } else {
        // Mark streaming as complete
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
        clearInterval(streamInterval);
      }
    }, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset session with backend
  const handleResetSession = async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      
      // Clear session history on backend
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/history`, {
        method: 'DELETE'
      });
      
      // Clear frontend messages
      setMessages([{
        id: Date.now(),
        text: "Session reset! I'm ready to help you with fresh news and information. What would you like to know?",
        sender: 'bot',
        timestamp: new Date(),
        isWelcome: true
      }]);
      
      setError(null);
      
    } catch (error) {
      console.error('Error resetting session:', error);
      setError('Failed to reset session. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('voosh_chat_theme', !isDarkTheme ? 'dark' : 'light');
  };

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('voosh_chat_theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
    }
  }, []);

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className={`chat-ui ${isDarkTheme ? 'chat-ui--dark' : 'chat-ui--light'}`}>
        <div className="chat-ui__loading">
          <div className="chat-ui__loading-spinner"></div>
          <p>Connecting to Voosh News Chatbot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-ui ${isDarkTheme ? 'chat-ui--dark' : 'chat-ui--light'}`}>
      <header className="chat-ui__header">
        <div className="chat-ui__header-content">
          <div className="chat-ui__header-left">
            <h1 className="chat-ui__title">Voosh News Chatbot</h1>
            <div className="chat-ui__status">
              {sessionId ? (
                <span className="chat-ui__status-indicator chat-ui__status-indicator--connected">
                  Connected
                </span>
              ) : (
                <span className="chat-ui__status-indicator chat-ui__status-indicator--disconnected"
                style={{color: 'red'}}>
                  Disconnected
                </span>
              )}
            </div>
          </div>
          <div className="chat-ui__header-controls">
            <button 
              className="chat-ui__theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            >
              {isDarkTheme ? '☀︎' : '☾'}
            </button>
            <button 
              className="chat-ui__reset-btn"
              onClick={handleResetSession}
              disabled={isLoading || !sessionId}
            >
              Reset Chat
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="chat-ui__error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chat-ui__messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`chat-ui__message chat-ui__message--${message.sender} ${
              message.isError ? 'chat-ui__message--error' : ''
            } ${message.isWelcome ? 'chat-ui__message--welcome' : ''}`}
          >
            <div className="chat-ui__message-bubble">
              {message.isStreaming && message.text === '' ? (
                <div className="chat-ui__typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div>
                  <p className="chat-ui__message-text">
                    {message.text}
                    {message.isStreaming && message.text !== '' && (
                      <span className="chat-ui__typing-indicator">|</span>
                    )}
                  </p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="chat-ui__message-sources">
                      <h4>Sources:</h4>
                      {message.sources.slice(0, 3).map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chat-ui__source-link"
                        >
                          <span className="chat-ui__source-title">{source.title}</span>
                          <span className="chat-ui__source-name">({source.source})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="chat-ui__message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-ui__input-container">
        <div className="chat-ui__input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-ui__input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              sessionId 
                ? "Ask me about the latest news..." 
                : "Connecting to chat service..."
            }
            rows="1"
            aria-label="Message input"
            disabled={isLoading || !sessionId}
            maxLength={1000}
          />
          <button 
            className="chat-ui__send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !sessionId}
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="chat-ui__send-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <div className="chat-ui__input-footer">
          <span className="chat-ui__input-counter">
            {inputValue.length}/1000 characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;