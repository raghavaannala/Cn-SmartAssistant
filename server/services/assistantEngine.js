const { NlpManager } = require('node-nlp');
const axios = require('axios');
const math = require('mathjs');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class AssistantEngine {
  constructor() {
    this.nlp = new NlpManager({ languages: ['en'] });
    this.initializeNLP();
    this.userSessions = new Map();
  }

  async initializeNLP() {
    // Greeting intents
    this.nlp.addDocument('en', 'hello', 'greeting');
    this.nlp.addDocument('en', 'hi', 'greeting');
    this.nlp.addDocument('en', 'hey', 'greeting');
    this.nlp.addDocument('en', 'good morning', 'greeting');
    this.nlp.addDocument('en', 'good evening', 'greeting');

    // Weather intents
    this.nlp.addDocument('en', 'what is the weather', 'weather');
    this.nlp.addDocument('en', 'weather forecast', 'weather');
    this.nlp.addDocument('en', 'how is the weather', 'weather');
    this.nlp.addDocument('en', 'weather in %city%', 'weather.city');

    // Math intents - more variations
    this.nlp.addDocument('en', 'calculate %expression%', 'math');
    this.nlp.addDocument('en', 'what is %expression%', 'math');
    this.nlp.addDocument('en', 'solve %expression%', 'math');
    this.nlp.addDocument('en', '%expression%', 'math');
    this.nlp.addDocument('en', 'compute %expression%', 'math');
    this.nlp.addDocument('en', '%expression% equals', 'math');
    this.nlp.addDocument('en', 'math %expression%', 'math');

    // Time intents
    this.nlp.addDocument('en', 'what time is it', 'time');
    this.nlp.addDocument('en', 'current time', 'time');
    this.nlp.addDocument('en', 'what is the date', 'date');

    // Search intents
    this.nlp.addDocument('en', 'search for %query%', 'search');
    this.nlp.addDocument('en', 'find %query%', 'search');
    this.nlp.addDocument('en', 'look up %query%', 'search');

    // System intents
    this.nlp.addDocument('en', 'system information', 'system');
    this.nlp.addDocument('en', 'system stats', 'system');

    // Entertainment intents
    this.nlp.addDocument('en', 'tell me a joke', 'joke');
    this.nlp.addDocument('en', 'make me laugh', 'joke');

    // Help intents
    this.nlp.addDocument('en', 'help', 'help');
    this.nlp.addDocument('en', 'what can you do', 'help');
    this.nlp.addDocument('en', 'commands', 'help');

    // Add responses
    this.nlp.addAnswer('en', 'greeting', 'Hello! I\'m your smart assistant. How can I help you today?');
    this.nlp.addAnswer('en', 'help', 'I can help you with:\n• Weather information\n• Mathematical calculations\n• Web searches\n• Current time and date\n• System information\n• Jokes and entertainment\n\nJust ask me naturally!');

    await this.nlp.train();
    logger.info('NLP Engine initialized and trained');
  }

  async processCommand(command, userId) {
    try {
      const session = this.getUserSession(userId);
      const cleanCommand = command.toLowerCase().trim();
      
      // Check for simple math expressions first (before NLP)
      if (this.isMathExpression(cleanCommand)) {
        return this.handleMath([{ entity: 'expression', sourceText: cleanCommand }]);
      }
      
      // Check for simple greetings
      if (this.isGreeting(cleanCommand)) {
        return this.handleGreeting(session);
      }
      
      const result = await this.nlp.process('en', cleanCommand);
      
      logger.info(`Intent detected: ${result.intent}, Confidence: ${result.score}, Command: ${cleanCommand}`);

      if (result.score < 0.3) {
        return await this.handleUnknownCommand(command);
      }

      switch (result.intent) {
        case 'greeting':
          return this.handleGreeting(session);
        case 'weather':
        case 'weather.city':
          return await this.handleWeather(result.entities);
        case 'math':
          return this.handleMath(result.entities);
        case 'time':
          return this.handleTime();
        case 'date':
          return this.handleDate();
        case 'search':
          return await this.handleSearch(result.entities);
        case 'system':
          return this.handleSystemInfo();
        case 'joke':
          return this.handleJoke();
        case 'help':
          return this.handleHelp();
        default:
          return await this.handleUnknownCommand(command);
      }
    } catch (error) {
      logger.error('Error in processCommand:', error);
      return {
        success: false,
        response: 'Sorry, I encountered an error processing your request.',
        type: 'error'
      };
    }
  }

  getUserSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        id: userId,
        createdAt: new Date(),
        commandCount: 0
      });
    }
    const session = this.userSessions.get(userId);
    session.commandCount++;
    return session;
  }

  handleGreeting(session) {
    const greetings = [
      'Hello! I\'m your smart assistant. How can I help you today?',
      'Hi there! Ready to assist you with anything you need.',
      'Hey! What would you like me to help you with?',
      'Greetings! I\'m here to make your day easier.'
    ];
    
    return {
      success: true,
      response: greetings[Math.floor(Math.random() * greetings.length)],
      type: 'greeting',
      sessionInfo: {
        commandCount: session.commandCount,
        userId: session.id
      }
    };
  }

  async handleWeather(entities) {
    try {
      // Default city or extract from entities
      let city = 'London'; // Default city
      if (entities && entities.length > 0) {
        const cityEntity = entities.find(e => e.entity === 'city');
        if (cityEntity) city = cityEntity.sourceText;
      }

      // Mock weather data (replace with real API)
      const weatherData = this.getMockWeatherData(city);
      
      return {
        success: true,
        response: `Weather in ${city}: ${weatherData.description}, ${weatherData.temperature}°C. Humidity: ${weatherData.humidity}%, Wind: ${weatherData.windSpeed} km/h`,
        type: 'weather',
        data: weatherData
      };
    } catch (error) {
      return {
        success: false,
        response: 'Sorry, I couldn\'t fetch the weather information right now.',
        type: 'error'
      };
    }
  }

  getMockWeatherData(city) {
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear'];
    return {
      city,
      temperature: Math.floor(Math.random() * 30) + 5,
      description: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 60) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5
    };
  }

  handleMath(entities) {
    try {
      let expression = '';
      if (entities && entities.length > 0) {
        const mathEntity = entities.find(e => e.entity === 'expression');
        if (mathEntity) expression = mathEntity.sourceText;
      }

      if (!expression) {
        return {
          success: false,
          response: 'Please provide a mathematical expression to calculate.',
          type: 'error'
        };
      }

      const result = math.evaluate(expression);
      
      return {
        success: true,
        response: `${expression} = ${result}`,
        type: 'calculation',
        data: { expression, result }
      };
    } catch (error) {
      return {
        success: false,
        response: 'Sorry, I couldn\'t solve that mathematical expression. Please check the format.',
        type: 'error'
      };
    }
  }

  handleTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    return {
      success: true,
      response: `The current time is ${timeString}`,
      type: 'time',
      data: { time: timeString, timestamp: now.toISOString() }
    };
  }

  handleDate() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return {
      success: true,
      response: `Today is ${dateString}`,
      type: 'date',
      data: { date: dateString, timestamp: now.toISOString() }
    };
  }

  async handleSearch(entities) {
    try {
      let query = '';
      if (entities && entities.length > 0) {
        const queryEntity = entities.find(e => e.entity === 'query');
        if (queryEntity) query = queryEntity.sourceText;
      }

      if (!query) {
        return {
          success: false,
          response: 'Please provide a search query.',
          type: 'error'
        };
      }

      // Mock search results (replace with real search API)
      const searchResults = this.getMockSearchResults(query);
      
      return {
        success: true,
        response: `Here are the top results for "${query}": ${searchResults.map(r => r.title).join(', ')}`,
        type: 'search',
        data: { query, results: searchResults }
      };
    } catch (error) {
      return {
        success: false,
        response: 'Sorry, I couldn\'t perform the search right now.',
        type: 'error'
      };
    }
  }

  getMockSearchResults(query) {
    return [
      { title: `${query} - Wikipedia`, url: `https://en.wikipedia.org/wiki/${query}` },
      { title: `${query} Tutorial`, url: `https://example.com/${query}-tutorial` },
      { title: `Learn about ${query}`, url: `https://example.com/learn-${query}` }
    ];
  }

  handleSystemInfo() {
    const os = require('os');
    const systemInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
      cpuCores: os.cpus().length,
      uptime: Math.round(os.uptime() / 3600) + ' hours'
    };

    return {
      success: true,
      response: `System Info: ${systemInfo.platform} ${systemInfo.architecture}, ${systemInfo.cpuCores} CPU cores, ${systemInfo.totalMemory} total memory, ${systemInfo.freeMemory} free memory, uptime: ${systemInfo.uptime}`,
      type: 'system',
      data: systemInfo
    };
  }

  handleJoke() {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the computer go to the doctor? Because it had a virus!",
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "What do you call a computer that sings? A Dell!",
      "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings!"
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    return {
      success: true,
      response: joke,
      type: 'joke'
    };
  }

  handleHelp() {
    return {
      success: true,
      response: `I'm your smart assistant! Here's what I can do:

🌤️ **Weather**: "What's the weather?" or "Weather in Paris"
🧮 **Math**: "Calculate 15 * 7" or "What is 2 + 2?"
🕐 **Time**: "What time is it?" or "What's the date?"
🔍 **Search**: "Search for Node.js" or "Find information about AI"
💻 **System**: "System information" or "System stats"
😄 **Fun**: "Tell me a joke" or "Make me laugh"

Just speak naturally! I understand conversational commands.`,
      type: 'help'
    };
  }

  async handleUnknownCommand(command) {
    const suggestions = [
      "I'm not sure I understand. Try asking about weather, math, time, or search.",
      "Could you rephrase that? I can help with calculations, weather, system info, and more.",
      "I didn't catch that. Type 'help' to see what I can do!",
      "Hmm, I'm not sure about that. Ask me about weather, time, jokes, or calculations!"
    ];

    return {
      success: false,
      response: suggestions[Math.floor(Math.random() * suggestions.length)],
      type: 'unknown',
      originalCommand: command
    };
  }

  // Helper method to detect math expressions
  isMathExpression(command) {
    // Check for basic math patterns
    const mathPatterns = [
      /^\d+[\+\-\*\/\%]\d+$/,  // Simple: 1+2, 5*3, etc.
      /^\d+(\s*[\+\-\*\/\%]\s*\d+)+$/,  // Multiple operations: 1 + 2 * 3
      /^[\d\+\-\*\/\%\(\)\s\.]+$/,  // Complex expressions with parentheses
      /^(calculate|solve|what is|compute)\s+[\d\+\-\*\/\%\(\)\s\.]+$/i
    ];
    
    return mathPatterns.some(pattern => pattern.test(command.trim()));
  }

  // Helper method to detect greetings
  isGreeting(command) {
    const greetings = [
      'hello', 'hi', 'hey', 'hola', 'good morning', 'good afternoon', 
      'good evening', 'greetings', 'howdy', 'sup', 'what\'s up', 'yo'
    ];
    
    return greetings.some(greeting => 
      command.includes(greeting) || 
      command === greeting ||
      command.startsWith(greeting + ' ') ||
      command.endsWith(' ' + greeting)
    );
  }
}

module.exports = AssistantEngine;
