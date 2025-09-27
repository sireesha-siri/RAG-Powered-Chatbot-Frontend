# Voosh News Chatbot - Frontend

A modern, responsive chat interface for the RAG-powered news chatbot that provides intelligent responses about current events with source attribution.

## 🎯 What This Is

An AI-powered news chatbot frontend that connects to a RAG (Retrieval-Augmented Generation) backend to provide:
- **Real-time news insights** from major outlets (Reuters, CNN, BBC, etc.)
- **AI-generated responses** using Google Gemini
- **Source attribution** with clickable links to original articles
- **Persistent chat sessions** that survive page refreshes
- **Modern, responsive design** with dark/light theme support

## ✨ Features

### 🤖 **Intelligent Chat**
- RAG-powered responses with real news data
- Source attribution for every answer
- Streaming response animation
- Session persistence across page refreshes

### 🎨 **Modern UI/UX**
- Responsive design (mobile-first)
- Dark/light theme toggle
- Smooth animations and transitions
- Professional gradient header
- Typing indicators and loading states

### 🔧 **Technical Features**
- Session management with backend API
- Error handling and connection status
- Character limit (1000) with counter
- Accessibility support (ARIA labels, keyboard navigation)
- High contrast mode support

### 📱 **Mobile Optimized**
- Touch-friendly interface
- Responsive breakpoints
- Optimized font sizes
- Mobile-specific interactions

## 🏗️ Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── ChatUI.js          # Main chat component
│   ├── styles/
│   │   └── chat-ui.scss       # Complete styling
│   ├── config/
│   │   └── api.js             # API configuration
│   ├── App.js
│   └── index.js
├── package.json
├── .env                       # Environment variables
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16+ recommended)
- **npm** or **yarn**
- **Backend running** on `http://localhost:5000`

### Installation

```bash
# Clone the project
git clone <your-repo-url>
cd voosh-chatbot-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Setup

Create `.env` file:
```bash
# Backend API URL
VITE_API_URL=http://localhost:5000

# Optional: WebSocket URL for future features
VITE_WEBSOCKET_URL=ws://localhost:5000

# App Configuration
VITE_APP_NAME="Voosh News Chatbot"
VITE_APP_VERSION=1.0.0

```

### Start Development Server

```bash
npm start
# Opens http://localhost:3000
```

## 🔌 Backend Integration

### API Endpoints Used

```javascript
// Session Management
POST   /api/sessions                    # Create new session
GET    /api/sessions/:id/history        # Load chat history  
DELETE /api/sessions/:id/history        # Clear chat history

// Chat Communication  
POST   /api/chat/:sessionId             # Send message, get AI response
POST   /api/chat/:sessionId/stream      # Streaming responses (future)
```

### Response Format
```javascript
{
  "response": "Apple stock rose 3% following strong iPhone sales...",
  "sources": [
    {
      "title": "Apple Stock Surges on iPhone Sales",
      "source": "Reuters", 
      "url": "https://reuters.com/...",
      "similarity": 0.89
    }
  ],
  "sessionId": "abc-123-def",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 Styling Architecture

### SCSS Organization
- **CSS Custom Properties** for theming
- **Mobile-first** responsive design
- **BEM methodology** for class naming
- **Theme variables** for dark/light modes

### Color Palette
```scss
:root {
  --bg-light: #f8f9fc;        // Light background
  --bg-dark: #1c1c28;         // Dark background  
  --primary: #51acaa;         //Primary color
  --accent: #00312f;         // Accent color
  --text-light: #111827;      // Dark text
  --text-dark: #f9fafb;       // Light text
}
```

### Component Structure
```scss
.chat-ui {
  &__header { }              // Header with title and controls
  &__messages { }            // Scrollable message area
  &__message { }             // Individual message bubble
  &__input-container { }     // Input area with send button
  &__sources { }             // News source links
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 480px (small phones)
- **Tablet**: 481px - 767px 
- **Desktop**: 768px - 1023px
- **Large**: 1024px+

### Key Responsive Features
- Flexible message bubble widths
- Scalable font sizes
- Touch-friendly button sizes
- Adaptive spacing and padding

## 🔧 Configuration

### API Configuration (`src/config/api.js`)
```javascript
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  MESSAGE_MAX_LENGTH: 1000,
  TYPING_SPEED: 100,
  MAX_SOURCES_DISPLAY: 3,
  SESSION_STORAGE_KEY: 'voosh_chat_session_id',
  THEME_STORAGE_KEY: 'voosh_chat_theme'
};
```

### Theme Persistence
- Light/dark theme choice saved to localStorage
- Automatic system theme detection (future enhancement)
- Smooth transitions between themes

### Session Management
- Automatic session creation on app load
- Session ID stored in localStorage
- Chat history restored on page refresh
- Session expires after 1 hour (backend controlled)

## 🧪 Testing

### Manual Testing Checklist
- [ ] App loads and creates session
- [ ] Can send messages and receive AI responses
- [ ] Sources display as clickable links
- [ ] Chat history persists on refresh
- [ ] Reset session button works
- [ ] Theme toggle works
- [ ] Mobile responsive design
- [ ] Error states display properly

### Test Questions
Try these to verify RAG functionality:
```
"What's the latest news about technology?"
"Tell me about recent developments in AI"
"What happened in the stock market today?" 
"Any breaking news about climate change?"
"How is Apple stock performing?"
```

### Expected Behavior
- AI responses should be contextual and informative
- Sources should appear with clickable links
- Responses should be different each time
- Should handle follow-up questions intelligently

## 🐛 Troubleshooting

### Common Issues

#### **"Connecting..." Forever**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check CORS configuration in backend
# Verify REACT_APP_API_URL in .env
```

#### **No AI Responses**
- Backend might not have ingested news articles yet
- Run `npm run ingest` in backend directory
- Check backend logs for API key errors

#### **Sources Not Showing**
- Normal for some queries (RAG only shows confident matches)
- Try more specific, news-related questions
- Check if backend has recent articles

#### **Session Expires Quickly**
- Sessions auto-expire after 1 hour (Redis TTL)
- Sessions extend automatically with activity
- Check Redis connection in backend

### Debug Mode
```bash
# Enable React debug mode
REACT_APP_DEBUG=true npm start

# Check browser developer console
# Network tab shows API requests
# Console shows any JavaScript errors
```

## 🚀 Deployment

### Build for Production
```bash
# Create optimized build
npm run build

# Test production build locally  
npm install -g serve
serve -s build -l 3000
```

### Environment Variables (Production)
```bash
# Backend API URL
VITE_API_URL=http://localhost:5000

# Optional: WebSocket URL for future features
VITE_WEBSOCKET_URL=ws://localhost:5000

# App Configuration
VITE_APP_NAME="Voosh News Chatbot"
VITE_APP_VERSION=1.0.0

```

### Hosting Options

#### **Netlify (Recommended)**
```bash
# Build command: npm run build
# Publish directory: build
# Environment variables: Add in Netlify dashboard
```

#### **Vercel**
```bash
# Automatic deployment from Git
# Add environment variables in Vercel dashboard
```

#### **AWS S3 + CloudFront**
```bash
# Upload build/ folder to S3
# Configure CloudFront distribution
# Set up custom domain
```

## ⚡ Performance Optimizations

### Bundle Size
- Code splitting with React.lazy() (future enhancement)
- Tree shaking for unused code
- Optimized images and assets

### Runtime Performance  
- Efficient re-renders with React.memo()
- Debounced input handling
- Smooth scrolling animations
- Optimized CSS animations

### Network Optimization
- API request caching
- Connection keep-alive
- Retry logic for failed requests
- Progressive loading states

## 🔒 Security

### Frontend Security
- Input validation (1000 character limit)
- XSS prevention with React's built-in escaping
- Secure HTTPS communication with backend
- No sensitive data stored in localStorage

### CORS Configuration
Backend should allow your frontend domain:
```javascript
// Backend CORS config
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}));
```

## ♿ Accessibility

### Features Implemented
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support  
- Focus management
- Semantic HTML structure

### Keyboard Shortcuts
- `Enter`: Send message
- `Shift + Enter`: New line in input
- `Tab`: Navigate between elements
- `Escape`: Clear input (future enhancement)

## 🔮 Future Enhancements

### Planned Features
- [ ] **WebSocket Integration**: Real-time messaging
- [ ] **Voice Input**: Speech-to-text capability
- [ ] **Message Export**: Download chat history
- [ ] **Push Notifications**: Breaking news alerts
- [ ] **Multi-language Support**: Internationalization
- [ ] **Chat Templates**: Quick question suggestions
- [ ] **User Preferences**: Customizable settings

### Technical Improvements
- [ ] **Progressive Web App** (PWA) support
- [ ] **Offline Mode**: Cached responses
- [ ] **Advanced Animations**: Framer Motion integration
- [ ] **State Management**: Redux Toolkit integration
- [ ] **Unit Tests**: Jest and React Testing Library
- [ ] **E2E Tests**: Cypress integration

## 📊 Analytics (Optional)

### Google Analytics Integration
```javascript
// Add to src/index.js
import ReactGA from 'react-ga4';

ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID);

// Track page views and interactions
ReactGA.event({
  category: 'Chat',
  action: 'Message Sent',
  label: 'User Interaction'
});
```

### Custom Analytics
Track user interactions:
- Message count per session
- Popular question types
- Response satisfaction
- Theme preference
- Mobile vs desktop usage

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Use semantic commit messages
- Add comments for complex logic

### Testing Requirements
- Test on multiple browsers
- Verify mobile responsiveness
- Check accessibility features
- Validate with backend integration

## 📞 Support

### Getting Help
1. Check troubleshooting section above
2. Review browser developer console
3. Test API endpoints manually
4. Check backend logs

### Common Solutions
- **CORS Issues**: Update backend CORS configuration
- **Build Errors**: Clear node_modules and npm cache
- **API Errors**: Verify backend is running and accessible
- **Style Issues**: Check SCSS compilation

---

## 🎉 Quick Start Summary

```bash
# 1. Setup
npm install
cp .env.example .env
# Edit .env with your backend URL

# 2. Start
npm start

# 3. Test
# Open http://localhost:3000
# Ask: "What's the latest tech news?"
# Should get AI response with news sources
```

Your frontend is now a professional RAG-powered news chatbot with modern UI, intelligent responses, and source attribution! 🚀

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Backend is deployed and accessible
- [ ] Environment variables configured
- [ ] Build process tested locally
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified

### Post-deployment
- [ ] HTTPS certificate configured
- [ ] Custom domain setup
- [ ] Analytics tracking working
- [ ] Error monitoring active
- [ ] Performance monitoring setup


**Ready for production!** Your RAG chatbot frontend provides an enterprise-quality chat experience with real AI intelligence and news source attribution.

