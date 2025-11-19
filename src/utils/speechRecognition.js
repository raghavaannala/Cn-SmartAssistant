class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isListening = false;
    this.callbacks = {
      onResult: null,
      onError: null,
      onStart: null,
      onEnd: null
    };

    this.initializeRecognition();
  }

  initializeRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.isSupported = true;

      // Configure recognition settings
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.setupEventListeners();
    } else {
      console.warn('Speech Recognition not supported in this browser');
    }
  }

  setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
    };

    this.recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      console.log('Speech recognition result:', transcript, 'Confidence:', confidence);
      
      if (this.callbacks.onResult) {
        this.callbacks.onResult({
          transcript,
          confidence,
          isFinal: result.isFinal
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: event.error,
          message: this.getErrorMessage(event.error)
        });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
      
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd();
      }
    };

    this.recognition.onnomatch = () => {
      console.log('No speech was recognized');
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'no-match',
          message: 'No speech was recognized. Please try again.'
        });
      }
    };
  }

  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': 'No speech was detected. Please try again.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'not-allowed': 'Microphone access was denied. Please allow microphone access.',
      'network': 'Network error occurred. Please check your connection.',
      'aborted': 'Speech recognition was aborted.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech recognition service not allowed.'
    };

    return errorMessages[error] || 'An unknown error occurred during speech recognition.';
  }

  start() {
    if (!this.isSupported) {
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'not-supported',
          message: 'Speech recognition is not supported in this browser.'
        });
      }
      return false;
    }

    if (this.isListening) {
      console.log('Speech recognition is already active');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError({
          error: 'start-failed',
          message: 'Failed to start speech recognition.'
        });
      }
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  setLanguage(language) {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  setContinuous(continuous) {
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  setInterimResults(interimResults) {
    if (this.recognition) {
      this.recognition.interimResults = interimResults;
    }
  }

  onResult(callback) {
    this.callbacks.onResult = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  onStart(callback) {
    this.callbacks.onStart = callback;
  }

  onEnd(callback) {
    this.callbacks.onEnd = callback;
  }

  isRecognitionSupported() {
    return this.isSupported;
  }

  isCurrentlyListening() {
    return this.isListening;
  }
}

export default new SpeechRecognitionService();
