# Smart Assistant Server - Setup Guide

## Quick Start (Windows)

### Option 1: Automated Setup
1. Double-click `start.bat` to automatically install dependencies and start the application
2. Wait for both server and client to start
3. Open your browser to `http://localhost:3000`

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Modern web browser (Chrome, Firefox, Edge)

#### Installation Steps

1. **Install Server Dependencies**
   ```bash
   npm install
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend client on `http://localhost:3000`

## Features Overview

### 🎤 Voice Commands
- Click the microphone button to start voice recognition
- Speak naturally: "What's the weather?", "Calculate 15 * 7", etc.
- Voice recognition works in Chrome, Edge, and Safari

### 💬 Text Commands
- Type commands in the input field
- Press Enter to send
- Real-time responses via WebSocket

### 🧠 AI Capabilities
- **Weather**: "What's the weather in London?"
- **Math**: "Calculate 2 + 2 * 5"
- **Time**: "What time is it?"
- **Search**: "Search for Node.js tutorials"
- **System**: "Show system information"
- **Fun**: "Tell me a joke"
- **Help**: "What can you do?"

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change PORT in `.env` file
   - Or kill existing processes on ports 3000/5000

2. **Microphone Not Working**
   - Allow microphone permissions in browser
   - Check browser compatibility (Chrome recommended)

3. **Dependencies Not Installing**
   - Ensure Node.js is installed: `node --version`
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **WebSocket Connection Failed**
   - Check if server is running on port 5000
   - Verify firewall settings
   - Try refreshing the browser

### Browser Compatibility

| Feature | Chrome | Firefox | Edge | Safari |
|---------|--------|---------|------|--------|
| Voice Recognition | ✅ | ❌ | ✅ | ✅ |
| WebSocket | ✅ | ✅ | ✅ | ✅ |
| Modern UI | ✅ | ✅ | ✅ | ✅ |

## Development

### Project Structure
```
smart-assistant-server/
├── server/                 # Backend Node.js server
│   ├── index.js           # Main server file
│   ├── services/          # Business logic
│   └── utils/             # Utilities
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── utils/         # Client utilities
│   └── public/            # Static assets
└── package.json           # Root dependencies
```

### Adding New Commands

1. **Backend** (`server/services/assistantEngine.js`):
   ```javascript
   // Add NLP training
   this.nlp.addDocument('en', 'your command pattern', 'your_intent');
   
   // Add handler
   case 'your_intent':
     return this.handleYourCommand(result.entities);
   ```

2. **Frontend** (optional UI updates in `SmartAssistant.js`)

### Environment Variables
Copy `.env.example` to `.env` and configure:
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- API keys for external services (optional)

## Deployment

### Local Production Build
```bash
cd client
npm run build
cd ..
npm start
```

### Cloud Deployment
- Deploy to Heroku, Vercel, or similar platforms
- Set environment variables in platform settings
- Ensure WebSocket support is enabled

## Performance Tips

1. **Optimize for Production**
   - Build client: `cd client && npm run build`
   - Use PM2 for process management
   - Enable gzip compression

2. **Scaling**
   - Use Redis for session storage
   - Implement horizontal scaling with load balancers
   - Add database for persistent data

## Security Considerations

- Enable HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Use environment variables for secrets
- Enable CORS properly for production domains

## Support

For issues or questions:
1. Check this setup guide
2. Review console logs for errors
3. Ensure all dependencies are installed
4. Verify Node.js version compatibility

---

**Happy coding! 🚀**
