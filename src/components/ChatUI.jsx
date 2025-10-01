import React, { useState, useRef, useEffect } from 'react';
import '../styles/chat-ui.scss';

// Configuration for API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ChatUI = () => {
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
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

  // Improved health check with proper timeout handling
  useEffect(() => {
    if (!sessionId) return;

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${API_BASE_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (!isConnected) {
            console.log('Backend reconnected');
            setIsConnected(true);
            setError(null);
          }
        } else {
          setIsConnected(false);
          setError('Backend service returned an error');
        }
      } catch (error) {
        if (isConnected) {
          console.log('Backend disconnected:', error.message);
          setIsConnected(false);
          setError('Cannot reach backend service');
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [sessionId, isConnected]);

  // Create or load session with backend
  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setIsConnected(false);

      const savedSessionId = localStorage.getItem('voosh_chat_session_id');

      // Check backend health first with longer timeout for cold starts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for cold start
      
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (!healthResponse.ok) throw new Error('Backend service is not available');

      let currentSessionId = savedSessionId;

      // Create new session if none exists
      if (!savedSessionId) {
        const sessionController = new AbortController();
        const sessionTimeoutId = setTimeout(() => sessionController.abort(), 60000); // 60 seconds

        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: sessionController.signal
        });
        clearTimeout(sessionTimeoutId);

        if (!response.ok) throw new Error(`Failed to create session: ${response.statusText}`);
        const data = await response.json();
        currentSessionId = data.sessionId;
        localStorage.setItem('voosh_chat_session_id', currentSessionId);
      }

      setSessionId(currentSessionId);
      setIsConnected(true);
      setIsFirstLoad(false); // Mark first load complete

      // Load existing chat history
      const historyMessages = await loadChatHistory(currentSessionId);

      if (historyMessages.length > 0) {
        setMessages(historyMessages);
      } else {
        setMessages([{
          id: Date.now(),
          text: "Hello! I'm Siri's News Assistant. I can help you find the latest news and answer questions about current events. What would you like to know?",
          sender: 'bot',
          timestamp: new Date(),
          isWelcome: true
        }]);
      }

    } catch (error) {
      console.error('Session initialization failed:', error);
      setIsConnected(false);
      
      // Different error handling for first load vs reconnection
      if (isFirstLoad && error.name === 'AbortError') {
        // Cold start timeout - show friendly message and retry
        setError('Backend is starting up (free tier). Retrying in 5 seconds...');
        setTimeout(() => {
          setError(null);
          initializeSession(); // Retry
        }, 5000);
      } else {
        // Real error
        localStorage.removeItem('voosh_chat_session_id');
        setSessionId(null);
        setMessages([{
          id: Date.now(),
          text: "I'm unable to connect to the chat service. Please make sure the backend server is running and refresh the page to try again.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        }]);
        setError(
          error.name === 'AbortError' 
            ? 'Connection timed out. The backend may be starting up on free tier (takes 30-60s). Please wait and refresh.' 
            : 'Failed to connect to chat service.'
        );
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Load chat history from backend
  const loadChatHistory = async (sessionIdToLoad) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionIdToLoad}/history`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          return data.history.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            text: msg.content,
            sender: msg.type === 'user' ? 'user' : 'bot',
            timestamp: new Date(msg.timestamp),
            sources: msg.sources || undefined
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  };

  // Send message to backend
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId || !isConnected) return;

    const userMessage = { id: Date.now(), text: inputValue.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const typingMessage = { id: Date.now() + 1, text: '', sender: 'bot', timestamp: new Date(), isStreaming: true };
      setMessages(prev => [...prev, typingMessage]);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Chat request failed: ${response.statusText}`);

      const data = await response.json();
      setIsConnected(true);

      // Remove typing indicator & show real response
      simulateStreamingResponse(data.response, data.sources);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsConnected(false);
      setMessages(prev => [...prev.filter(msg => !msg.isStreaming), {
        id: Date.now(),
        text: error.name === 'AbortError'
          ? "Request timed out. Please try again or check if the backend is responding."
          : "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate streaming response
  const simulateStreamingResponse = (fullText, sources) => {
    setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), text: '', sender: 'bot', timestamp: new Date(), isStreaming: true, sources }]);
    const words = fullText.split(' ');
    let currentText = '', wordIndex = 0;

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) lastMessage.text = currentText;
          return newMessages;
        });
        wordIndex++;
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) lastMessage.isStreaming = false;
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

  // Reset session
  const handleResetSession = async () => {
    if (!sessionId || !isConnected) return;
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/history`, { method: 'DELETE', signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to reset session on backend');

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
      setIsConnected(false);
      setError(error.name === 'AbortError' ? 'Reset request timed out.' : 'Failed to reset session.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('voosh_chat_theme', !isDarkTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('voosh_chat_theme');
    if (savedTheme) setIsDarkTheme(savedTheme === 'dark');
  }, []);

  const formatTime = (timestamp) => timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isInitializing) return (
    <div className={`chat-ui ${isDarkTheme ? 'chat-ui--dark' : 'chat-ui--light'}`}>
      <div className="chat-ui__loading">
        <div className="chat-ui__loading-spinner"></div>
        {isFirstLoad ? (
          <>
            <p style={{ fontWeight: 'bold', margin: '8px 0' }}>Starting Siri's News Assistant...</p>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: '8px 0' }}>
              Free tier may take 30-60 seconds on first load
            </p>
          </>
        ) : (
          <p style={{ margin: '8px 0' }}>Reconnecting to Siri's News Assistant...</p>
        )}
      </div>
    </div>
  );

  return (
    <div className={`chat-ui ${isDarkTheme ? 'chat-ui--dark' : 'chat-ui--light'}`}>
      <header className="chat-ui__header">
        <div className="chat-ui__header-content">
          <div className="chat-ui__header-left">
            <h1 className="chat-ui__title">Siri's News Assistant</h1>
            <div className="chat-ui__status">
              {isConnected ? <span className="chat-ui__status-indicator chat-ui__status-indicator--connected">Connected</span>
                          : <span className="chat-ui__status-indicator chat-ui__status-indicator--disconnected" style={{ color: '#d32020ff' }}>Disconnected</span>}
            </div>
          </div>
          <div className="chat-ui__header-controls">
            <button className="chat-ui__theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}>
              {isDarkTheme ? '☀︎' : '☾'}
            </button>
            <button className="chat-ui__reset-btn" onClick={handleResetSession} disabled={isLoading || !isConnected}>Reset Chat</button>
          </div>
        </div>
      </header>

      {error && (
        <div className={`chat-ui__error ${isFirstLoad ? 'chat-ui__error--info' : ''}`}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chat-ui__messages" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-ui__message chat-ui__message--${message.sender} ${message.isError ? 'chat-ui__message--error' : ''} ${message.isWelcome ? 'chat-ui__message--welcome' : ''}`}>
            <div className="chat-ui__message-bubble">
              {message.isStreaming && message.text === '' ? (
                <div className="chat-ui__typing-dots"><span></span><span></span><span></span></div>
              ) : (
                <div>
                  <p className="chat-ui__message-text">{message.text}{message.isStreaming && message.text !== '' && <span className="chat-ui__typing-indicator">|</span>}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="chat-ui__message-sources">
                      <h4>Sources:</h4>
                      {message.sources.slice(0, 3).map((source, idx) => (
                        <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="chat-ui__source-link">
                          <span className="chat-ui__source-title">{source.title}</span>
                          <span className="chat-ui__source-name">({source.source})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="chat-ui__message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-ui__input-container">
        <div className="chat-ui__input-wrapper">
          <textarea ref={inputRef} className="chat-ui__input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Ask me about the latest news..." : "Backend service disconnected..."} rows="1" aria-label="Message input" disabled={isLoading || !isConnected} maxLength={1000} />
          <button className="chat-ui__send-btn" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading || !isConnected} aria-label="Send message">
            {isLoading ? <div className="chat-ui__send-spinner"></div> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <div className="chat-ui__input-footer"><span className="chat-ui__input-counter">{inputValue.length}/1000 characters</span></div>
      </div>
    </div>
  );
};

export default ChatUI;