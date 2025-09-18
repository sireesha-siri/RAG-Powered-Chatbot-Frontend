// config/api.js
// Configuration file for API endpoints and settings

const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  
  // Chat Configuration
  MESSAGE_MAX_LENGTH: 1000,
  TYPING_SPEED: 100, // milliseconds between words in streaming
  SESSION_STORAGE_KEY: 'voosh_chat_session_id',
  THEME_STORAGE_KEY: 'voosh_chat_theme',
  
  // UI Configuration
  MAX_SOURCES_DISPLAY: 3,
  AUTO_SCROLL_BEHAVIOR: 'smooth',
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // WebSocket Configuration (for future enhancement)
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000",
  RECONNECT_INTERVAL: 3000,
  
  // Default Messages
  WELCOME_MESSAGE: "Hello! I'm the Voosh News Chatbot. I can help you find the latest news and answer questions about current events. What would you like to know?",
  ERROR_MESSAGE: "I'm sorry, I encountered an error processing your request. Please try again or check your connection.",
  CONNECTING_MESSAGE: "Connecting to Voosh News Chatbot...",
  DISCONNECTED_MESSAGE: "Disconnected from chat service",
  RESET_MESSAGE: "Session reset! I'm ready to help you with fresh news and information. What would you like to know?"
};

export default config;