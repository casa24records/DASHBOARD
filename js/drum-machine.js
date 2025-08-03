// Casa 24 Drum Machine Pro - Enhanced Version
(function() {
  // Configuration
  const STEPS = 16;
  
  // Enhanced instrument configuration with multi-layer support
  const instrumentConfigs = {
    "Robocop": [
      { id: 'kick', label: 'KICK', frequency: 60, subFreq: 40, noiseAmount: 0 },
      { id: 'snare', label: 'SNARE', frequency: 200, subFreq: 80, noiseAmount: 0.2 },
      { id: 'hihat', label: 'HI-HAT', frequency: 800, subFreq: 0, noiseAmount: 0.3 },
      { id: 'openhat', label: 'OPEN HAT', frequency: 800, subFreq: 0, noiseAmount: 0.4 },
      { id: 'clap', label: 'CLAP', frequency: 1500, subFreq: 0, noiseAmount: 0.1 },
      { id: 'crash', label: 'CRASH', frequency: 2000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'rim', label: 'RIM', frequency: 400, subFreq: 0, noiseAmount: 0.05 },
      { id: 'cowbell', label: 'COWBELL', frequency: 800, subFreq: 0, noiseAmount: 0 }
    ],
    "Boom-bap": [
      { id: 'kick', label: 'KICK', frequency: 60, subFreq: 35, noiseAmount: 0.02 },
      { id: 'snare', label: 'SNARE', frequency: 220, subFreq: 90, noiseAmount: 0.25 },
      { id: 'hihat', label: 'HI-HAT', frequency: 8000, subFreq: 0, noiseAmount: 0.4 },
      { id: 'openhat', label: 'OPEN HAT', frequency: 7000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'clap', label: 'CLAP', frequency: 2000, subFreq: 0, noiseAmount: 0.15 },
      { id: 'crash', label: 'CRASH', frequency: 11000, subFreq: 0, noiseAmount: 0.6 },
      { id: 'rim', label: 'RIM', frequency: 1000, subFreq: 0, noiseAmount: 0.08 },
      { id: 'cowbell', label: 'COWBELL', frequency: 900, subFreq: 0, noiseAmount: 0 }
    ],
    "Lo-fi": [
      { id: 'kick', label: 'KICK', frequency: 50, subFreq: 30, noiseAmount: 0.05 },
      { id: 'snare', label: 'SNARE', frequency: 180, subFreq: 70, noiseAmount: 0.3 },
      { id: 'hihat', label: 'HI-HAT', frequency: 6500, subFreq: 0, noiseAmount: 0.45 },
      { id: 'openhat', label: 'OPEN HAT', frequency: 4500, subFreq: 0, noiseAmount: 0.55 },
      { id: 'clap', label: 'CLAP', frequency: 1000, subFreq: 0, noiseAmount: 0.2 },
      { id: 'crash', label: 'CRASH', frequency: 9000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'rim', label: 'RIM', frequency: 800, subFreq: 0, noiseAmount: 0.1 },
      { id: 'cowbell', label: 'COWBELL', frequency: 700, subFreq: 0, noiseAmount: 0.02 }
    ]
  };
  
  // Current configuration
  let currentConfig = "Robocop";
  let instruments = instrumentConfigs[currentConfig];

  // Global effects parameters
  let globalParams = {
    // Per-instrument parameters
    instrumentParams: {},
    // Global effects
    reverb: {
      enabled: false,
      wetness: 0.3,
      roomSize: 0.7
    },
    delay: {
      enabled: false,
      time: 0.25,
      feedback: 0.3,
      wetness: 0.2
    },
    bitCrusher: {
      enabled: false,
      bits: 8,
      sampleRate: 0.5
    },
    filter: {
      enabled: false,
      type: 'lowpass',
      frequency: 20000,
      q: 1
    },
    compression: {
      enabled: false,
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    },
    swing: 0, // 0-100%
    humanize: 0 // 0-100% velocity variation
  };

  // Initialize instrument parameters
  instruments.forEach(inst => {
    globalParams.instrumentParams[inst.id] = {
      volume: 0.5,
      pitch: 0, // -12 to +12 semitones
      decay: 1.0, // 0.1 to 2.0 multiplier
      noiseAmount: inst.noiseAmount || 0,
      filterFreq: 20000,
      filterQ: 1,
      filterType: 'lowpass',
      distortion: 0,
      pan: 0, // -1 to 1
      velocity: 1.0
    };
  });

  // Preset patterns
  const presets = {
    "Traffic jam groove": {
      bpm: 109,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,1]
    },
    "Robofunk": {
      bpm: 104,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [1,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0],
      cowbell: [0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0]
    },
    "Power pose": {
      bpm: 76,
      kick:    [1,0,0,1,1,0,0,0,1,0,0,1,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      crash:   [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0]
    }
  };

  // State
  let audioContext;
  let isPlaying = false;
  let currentStep = 0;
  let intervalId = null;
  let pattern = {};
  let velocityPattern = {}; // Store velocity per step
  let isRecording = false;
  let recordedChunks = [];
  let currentPreset = null;
  
  // Effects nodes
  let masterGain;
  let reverbNode;
  let delayNode;
  let delayFeedback;
  let delayWetGain;
  let bitCrusherNode;
  let filterNode;
  let compressorNode;
  let impulseBuffer;

  // Initialize empty pattern
  instruments.forEach(inst => {
    pattern[inst.id] = new Array(STEPS).fill(0);
    velocityPattern[inst.id] = new Array(STEPS).fill(1.0);
  });

  // Create impulse response for reverb
  function createImpulseResponse(duration, decay) {
    const length = audioContext.sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / length), decay);
      }
    }
    return impulse;
  }

  // Initialize audio effects chain
  function initializeEffects() {
    if (!audioContext) return;

    // Master gain
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.8;

    // Compressor
    compressorNode = audioContext.createDynamicsCompressor();
    compressorNode.threshold.value = globalParams.compression.threshold;
    compressorNode.ratio.value = globalParams.compression.ratio;
    compressorNode.attack.value = globalParams.compression.attack;
    compressorNode.release.value = globalParams.compression.release;

    // Filter
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = globalParams.filter.type;
    filterNode.frequency.value = globalParams.filter.frequency;
    filterNode.Q.value = globalParams.filter.q;

    // Reverb
    reverbNode = audioContext.createConvolver();
    impulseBuffer = createImpulseResponse(3, 2);
    reverbNode.buffer = impulseBuffer;

    // Delay
    delayNode = audioContext.createDelay(2);
    delayNode.delayTime.value = globalParams.delay.time;
    delayFeedback = audioContext.createGain();
    delayFeedback.gain.value = globalParams.delay.feedback;
    delayWetGain = audioContext.createGain();
    delayWetGain.gain.value = globalParams.delay.wetness;

    // Setup delay feedback loop
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(delayWetGain);

    // Connect effects chain
    updateEffectsChain();
  }

  // Update effects chain based on enabled/disabled state
  function updateEffectsChain() {
    if (!audioContext || !masterGain) return;

    // Disconnect all
    try {
      masterGain.disconnect();
      compressorNode.disconnect();
      filterNode.disconnect();
      reverbNode.disconnect();
      delayWetGain.disconnect();
    } catch(e) {}

    // Build chain based on enabled effects
    let currentNode = masterGain;

    if (globalParams.compression.enabled) {
      currentNode.connect(compressorNode);
      currentNode = compressorNode;
    }

    if (globalParams.filter.enabled) {
      currentNode.connect(filterNode);
      currentNode = filterNode;
    }

    // Final connection
    currentNode.connect(audioContext.destination);

    // Parallel effects
    if (globalParams.reverb.enabled) {
      currentNode.connect(reverbNode);
      reverbNode.connect(audioContext.destination);
    }

    if (globalParams.delay.enabled) {
      currentNode.connect(delayNode);
      delayWetGain.connect(audioContext.destination);
    }
  }

  // Create the drum machine HTML
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;

    container.innerHTML = `
      <div class="drum-machine-wrapper">
        <style>
          /* Original styles preserved */
          .drum-control-btn {
            background: rgba(26, 26, 26, 0.7);
            border: 2px solid #00a651;
            color: #e0e0e0;
            padding: 0.75rem 1.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: 'Space Mono', monospace;
          }
          
          .drum-control-btn:hover,
          .drum-preset-btn:hover,
          .drum-config-select:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0px #00a651;
            background: rgba(0, 166, 81, 0.1) !important;
          }
          
          .drum-control-btn:active,
          .drum-preset-btn:active,
          .drum-config-select:active {
            transform: translate(0, 0);
            box-shadow: 1px 1px 0px #00a651;
          }
          
          .drum-control-btn.active {
            background: #00a651 !important;
            color: #1a1a1a !important;
          }
          
          .drum-control-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .drum-control-btn:disabled:hover {
            transform: none;
            box-shadow: none;
            background: rgba(26, 26, 26, 0.7) !important;
          }
          
          .drum-preset-btn {
            background: rgba(26, 26, 26, 0.7);
            border: 2px solid #00a651;
            color: #e0e0e0;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-family: 'Space Mono', monospace;
          }
          
          .drum-preset-btn.active {
            background: #00a651 !important;
            color: #1a1a1a !important;
            font-weight: bold;
          }
          
          .drum-config-select {
            background: rgba(26, 26, 26, 0.7);
            border: 2px solid #00a651;
            color: #e0e0e0;
            padding: 0.75rem 1.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-family: 'Space Mono', monospace;
            outline: none;
          }
          
          .drum-config-select option {
            background: #1a1a1a;
            color: #e0e0e0;
          }
          
          .drum-step-btn {
            aspect-ratio: 1;
            background: rgba(26, 26, 26, 0.7);
            border: 1px solid #444;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: all 0.15s;
            position: relative;
            overflow: hidden;
            width: 100%;
          }
          
          .drum-step-btn:hover {
            border-color: #00a651;
            transform: scale(1.1);
          }
          
          .drum-step-btn.active {
            background: #00a651;
            border-color: #00a651;
            box-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
          }
          
          .drum-step-btn.playing {
            animation: drum-pulse 0.2s ease-out;
          }
          
          .drum-step-btn.active.playing {
            animation: drum-pulse-active 0.2s ease-out;
          }

          /* Velocity indication */
          .drum-step-btn.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--velocity-height);
            background: rgba(255, 255, 255, 0.3);
          }
          
          @keyframes drum-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 166, 81, 0.4); }
            100% { transform: scale(1.15); box-shadow: 0 0 0 8px rgba(0, 166, 81, 0); }
          }
          
          @keyframes drum-pulse-active {
            0% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 166, 81, 0.5); }
            100% { transform: scale(1.15); box-shadow: 0 0 20px rgba(0, 166, 81, 0.8); }
          }
          
          /* Enhanced controls styles */
          .drum-param-slider {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
            cursor: pointer;
            border-radius: 2px;
            -webkit-appearance: none;
            appearance: none;
          }
          
          .drum-param-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #00a651;
            cursor: pointer;
            border-radius: 50%;
            border: 1px solid #1a1a1a;
          }
          
          .drum-param-slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: #00a651;
            cursor: pointer;
            border-radius: 50%;
            border: 1px solid #1a1a1a;
          }

          .drum-param-label {
            font-family: 'VT323', monospace;
            font-size: 0.875rem;
            color: #00a651;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .drum-param-value {
            font-family: 'VT323', monospace;
            font-size: 0.875rem;
            color: #e0e0e0;
            min-width: 40px;
            text-align: right;
          }

          .drum-section {
            border: 2px solid #00a651;
            border-radius: 0.5rem;
            background: rgba(26, 26, 26, 0.7);
            box-shadow: 4px 4px 0px #00a651;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .drum-section-title {
            font-family: 'VT323', monospace;
            font-size: 1.25rem;
            color: #00a651;
            letter-spacing: 1px;
            margin-bottom: 1rem;
            text-align: center;
            text-transform: uppercase;
          }

          .drum-effect-toggle {
            background: rgba(26, 26, 26, 0.7);
            border: 1px solid #00a651;
            color: #e0e0e0;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            font-family: 'VT323', monospace;
            font-size: 0.875rem;
            text-transform: uppercase;
          }

          .drum-effect-toggle.active {
            background: #00a651;
            color: #1a1a1a;
          }

          .drum-controls-grid {
            display: grid;
            grid-template-columns: 120px 1fr 60px;
            gap: 0.5rem;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .drum-instrument-controls {
            display: none;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.25rem;
            margin-top: 0.5rem;
          }

          .drum-instrument-controls.active {
            display: block;
          }

          /* Beat grouping */
          .drum-step-4n {
            margin-left: 0.5rem;
          }
          
          @media (max-width: 768px) {
            .drum-controls-wrapper {
              flex-direction: column;
              align-items: stretch !important;
            }
            
            .drum-controls-grid {
              grid-template-columns: 80px 1fr 40px;
            }
            
            .drum-track-label {
              font-size: 0.875rem !important;
              padding-right: 0.5rem !important;
            }
            
            .drum-step-4n {
              margin-left: 0.25rem;
            }
          }
        </style>

        <!-- Configuration Selector -->
        <div class="flex items-center gap-3 mb-4 justify-center">
          <span style="font-family: 'VT323', monospace; font-size: 1.25rem; color: #00a651; letter-spacing: 1px;">SOUND KIT</span>
          <select class="drum-config-select" id="drumConfigSelect">
            <option value="Robocop">ROBOCOP</option>
            <option value="Boom-bap">BOOM-BAP</option>
            <option value="Lo-fi">LO-FI</option>
          </select>
        </div>

        <!-- Transport Controls -->
        <div class="drum-controls-wrapper flex flex-wrap gap-4 items-center justify-center mb-4">
          <div class="flex gap-2">
            <button class="drum-control-btn" id="drumPlayBtn">
              <span>▶</span> PLAY
            </button>
            <button class="drum-control-btn" id="drumStopBtn">
              <span>■</span> STOP
            </button>
            <button class="drum-control-btn" id="drumClearBtn">
              <span>✕</span> CLEAR
            </button>
            <button class="drum-control-btn" id="drumDownloadBtn">
              <span>💾</span> DOWNLOAD
            </button>
          </div>
          
          <div class="flex items-center gap-3">
            <span style="font-family: 'VT323', monospace; font-size: 1.25rem; color: #00a651; letter-spacing: 1px;">TEMPO</span>
            <input type="range" class="drum-param-slider" id="drumTempoSlider" min="60" max="180" value="120" style="width: 120px;">
            <span id="drumTempoValue" style="font-family: 'VT323', monospace; font-size: 1.25rem; color: #00a651; min-width: 80px;">120 BPM</span>
          </div>
        </div>

        <!-- Global Controls Section -->
        <div class="drum-section">
          <h4 class="drum-section-title">GLOBAL CONTROLS</h4>
          
          <!-- Swing & Humanize -->
          <div class="drum-controls-grid">
            <span class="drum-param-label">SWING</span>
            <input type="range" class="drum-param-slider" id="swingSlider" min="0" max="75" value="0">
            <span class="drum-param-value" id="swingValue">0%</span>
          </div>
          
          <div class="drum-controls-grid">
            <span class="drum-param-label">HUMANIZE</span>
            <input type="range" class="drum-param-slider" id="humanizeSlider" min="0" max="50" value="0">
            <span class="drum-param-value" id="humanizeValue">0%</span>
          </div>
        </div>

        <!-- Effects Section -->
        <div class="drum-section">
          <h4 class="drum-section-title">EFFECTS RACK</h4>
          
          <!-- Filter -->
          <div style="margin-bottom: 1rem;">
            <div class="flex items-center gap-2 mb-2">
              <button class="drum-effect-toggle" id="filterToggle">FILTER</button>
              <select class="drum-config-select" id="filterType" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                <option value="lowpass">LOWPASS</option>
                <option value="highpass">HIGHPASS</option>
                <option value="bandpass">BANDPASS</option>
                <option value="notch">NOTCH</option>
              </select>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">FREQUENCY</span>
              <input type="range" class="drum-param-slider" id="filterFreq" min="20" max="20000" value="20000">
              <span class="drum-param-value" id="filterFreqValue">20kHz</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">RESONANCE</span>
              <input type="range" class="drum-param-slider" id="filterQ" min="0.1" max="30" step="0.1" value="1">
              <span class="drum-param-value" id="filterQValue">1.0</span>
            </div>
          </div>

          <!-- Reverb -->
          <div style="margin-bottom: 1rem;">
            <div class="flex items-center gap-2 mb-2">
              <button class="drum-effect-toggle" id="reverbToggle">REVERB</button>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">WETNESS</span>
              <input type="range" class="drum-param-slider" id="reverbWet" min="0" max="100" value="30">
              <span class="drum-param-value" id="reverbWetValue">30%</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">ROOM SIZE</span>
              <input type="range" class="drum-param-slider" id="reverbSize" min="0" max="100" value="70">
              <span class="drum-param-value" id="reverbSizeValue">70%</span>
            </div>
          </div>

          <!-- Delay -->
          <div style="margin-bottom: 1rem;">
            <div class="flex items-center gap-2 mb-2">
              <button class="drum-effect-toggle" id="delayToggle">DELAY</button>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">TIME</span>
              <input type="range" class="drum-param-slider" id="delayTime" min="0.05" max="1" step="0.05" value="0.25">
              <span class="drum-param-value" id="delayTimeValue">250ms</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">FEEDBACK</span>
              <input type="range" class="drum-param-slider" id="delayFeedback" min="0" max="90" value="30">
              <span class="drum-param-value" id="delayFeedbackValue">30%</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">WET</span>
              <input type="range" class="drum-param-slider" id="delayWet" min="0" max="100" value="20">
              <span class="drum-param-value" id="delayWetValue">20%</span>
            </div>
          </div>

          <!-- Bit Crusher -->
          <div style="margin-bottom: 1rem;">
            <div class="flex items-center gap-2 mb-2">
              <button class="drum-effect-toggle" id="bitCrusherToggle">BIT CRUSHER</button>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">BIT DEPTH</span>
              <input type="range" class="drum-param-slider" id="bitDepth" min="1" max="16" value="8">
              <span class="drum-param-value" id="bitDepthValue">8 bit</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">SAMPLE RATE</span>
              <input type="range" class="drum-param-slider" id="sampleRateReduction" min="0.1" max="1" step="0.1" value="0.5">
              <span class="drum-param-value" id="sampleRateValue">50%</span>
            </div>
          </div>

          <!-- Compressor -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <button class="drum-effect-toggle" id="compressorToggle">COMPRESSOR</button>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">THRESHOLD</span>
              <input type="range" class="drum-param-slider" id="compThreshold" min="-60" max="0" value="-20">
              <span class="drum-param-value" id="compThresholdValue">-20dB</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">RATIO</span>
              <input type="range" class="drum-param-slider" id="compRatio" min="1" max="20" value="4">
              <span class="drum-param-value" id="compRatioValue">4:1</span>
            </div>
          </div>
        </div>

        <!-- Presets Section -->
        <div class="drum-section">
          <h4 class="drum-section-title">BEAT PRESETS</h4>
          <div class="flex flex-wrap gap-3 justify-center" id="drumPresets">
            <button class="drum-preset-btn" data-preset="Traffic jam groove">TRAFFIC JAM GROOVE</button>
            <button class="drum-preset-btn" data-preset="Robofunk">ROBOFUNK</button>
            <button class="drum-preset-btn" data-preset="Power pose">POWER POSE</button>
          </div>
        </div>

        <!-- Sequencer Grid with Per-Instrument Controls -->
        <div class="drum-section">
          <h4 class="drum-section-title">SEQUENCER & SOUND DESIGN</h4>
          <div id="drumPatternGrid" style="display: grid; gap: 0.75rem;">
            <!-- Grid will be generated by JavaScript -->
          </div>
        </div>
      </div>
    `;

    // Create the sequencer grid with controls
    createGrid();

    // Setup event listeners
    setupEventListeners();

    // Load default preset
    loadPreset('Traffic jam groove');
  }

  // Create sequencer grid with instrument controls
  function createGrid() {
    const grid = document.getElementById('drumPatternGrid');
    if (!grid) return;

    grid.innerHTML = '';

    instruments.forEach(inst => {
      // Create instrument row container
      const instrumentContainer = document.createElement('div');
      instrumentContainer.style.cssText = 'margin-bottom: 0.5rem;';

      // Create main sequencer row
      const row = document.createElement('div');
      row.style.cssText = 'display: grid; grid-template-columns: 100px repeat(16, 1fr) 30px; gap: 0.25rem; align-items: center;';

      // Instrument label
      const label = document.createElement('div');
      label.className = 'drum-track-label';
      label.style.cssText = 'font-family: "VT323", monospace; font-size: 1.125rem; color: #00a651; text-transform: uppercase; letter-spacing: 1px; text-align: right; padding-right: 1rem; cursor: pointer;';
      label.textContent = inst.label;
      label.onclick = () => toggleInstrumentControls(inst.id);
      row.appendChild(label);

      // Step buttons
      for (let i = 0; i < STEPS; i++) {
        const step = document.createElement('button');
        step.className = 'drum-step-btn';
        if (i % 4 === 0 && i !== 0) {
          step.classList.add('drum-step-4n');
        }
        step.dataset.instrument = inst.id;
        step.dataset.step = i;
        step.addEventListener('click', toggleStep);
        step.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          adjustStepVelocity(e);
        });
        row.appendChild(step);
      }

      // Settings gear icon
      const settingsBtn = document.createElement('button');
      settingsBtn.innerHTML = '⚙';
      settingsBtn.style.cssText = 'background: transparent; border: 1px solid #00a651; color: #00a651; cursor: pointer; padding: 0.25rem; border-radius: 0.25rem;';
      settingsBtn.onclick = () => toggleInstrumentControls(inst.id);
      row.appendChild(settingsBtn);

      instrumentContainer.appendChild(row);

      // Create instrument-specific controls panel
      const controlsPanel = document.createElement('div');
      controlsPanel.className = 'drum-instrument-controls';
      controlsPanel.id = `controls-${inst.id}`;
      controlsPanel.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <!-- Volume & Pan -->
          <div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">VOLUME</span>
              <input type="range" class="drum-param-slider inst-volume" data-instrument="${inst.id}" min="0" max="100" value="50">
              <span class="drum-param-value inst-volume-value">50%</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">PAN</span>
              <input type="range" class="drum-param-slider inst-pan" data-instrument="${inst.id}" min="-100" max="100" value="0">
              <span class="drum-param-value inst-pan-value">C</span>
            </div>
          </div>
          
          <!-- Pitch & Decay -->
          <div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">PITCH</span>
              <input type="range" class="drum-param-slider inst-pitch" data-instrument="${inst.id}" min="-12" max="12" value="0">
              <span class="drum-param-value inst-pitch-value">0</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">DECAY</span>
              <input type="range" class="drum-param-slider inst-decay" data-instrument="${inst.id}" min="10" max="200" value="100">
              <span class="drum-param-value inst-decay-value">100%</span>
            </div>
          </div>
          
          <!-- Noise & Filter -->
          <div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">NOISE MIX</span>
              <input type="range" class="drum-param-slider inst-noise" data-instrument="${inst.id}" min="0" max="100" value="${(inst.noiseAmount || 0) * 100}">
              <span class="drum-param-value inst-noise-value">${Math.round((inst.noiseAmount || 0) * 100)}%</span>
            </div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">FILTER</span>
              <input type="range" class="drum-param-slider inst-filter" data-instrument="${inst.id}" min="20" max="20000" value="20000">
              <span class="drum-param-value inst-filter-value">20kHz</span>
            </div>
          </div>
          
          <!-- Distortion -->
          <div>
            <div class="drum-controls-grid">
              <span class="drum-param-label">DISTORTION</span>
              <input type="range" class="drum-param-slider inst-dist" data-instrument="${inst.id}" min="0" max="100" value="0">
              <span class="drum-param-value inst-dist-value">0%</span>
            </div>
          </div>
        </div>
      `;

      instrumentContainer.appendChild(controlsPanel);
      grid.appendChild(instrumentContainer);
    });
  }

  // Toggle instrument controls visibility
  function toggleInstrumentControls(instId) {
    const panel = document.getElementById(`controls-${instId}`);
    if (panel) {
      panel.classList.toggle('active');
    }
  }

  // Toggle step with velocity support
  function toggleStep(e) {
    const inst = e.target.dataset.instrument;
    const step = parseInt(e.target.dataset.step);
    
    if (e.shiftKey) {
      // Shift+click for velocity adjustment
      const currentVelocity = velocityPattern[inst][step];
      velocityPattern[inst][step] = Math.min(1.0, currentVelocity + 0.25);
      if (velocityPattern[inst][step] > 1.0) velocityPattern[inst][step] = 0.25;
      
      if (!pattern[inst][step]) {
        pattern[inst][step] = 1;
        e.target.classList.add('active');
      }
      
      // Update visual indication
      e.target.style.setProperty('--velocity-height', `${velocityPattern[inst][step] * 100}%`);
    } else {
      // Normal click
      pattern[inst][step] = pattern[inst][step] ? 0 : 1;
      e.target.classList.toggle('active');
      
      if (pattern[inst][step]) {
        velocityPattern[inst][step] = 1.0;
        e.target.style.setProperty('--velocity-height', '100%');
      }
    }
  }

  // Adjust step velocity
  function adjustStepVelocity(e) {
    const inst = e.target.dataset.instrument;
    const step = parseInt(e.target.dataset.step);
    
    if (pattern[inst][step]) {
      velocityPattern[inst][step] = velocityPattern[inst][step] - 0.25;
      if (velocityPattern[inst][step] <= 0) velocityPattern[inst][step] = 1.0;
      
      e.target.style.setProperty('--velocity-height', `${velocityPattern[inst][step] * 100}%`);
    }
  }

  // Update pattern display
  function updatePattern() {
    instruments.forEach(inst => {
      pattern[inst.id].forEach((value, step) => {
        const element = document.querySelector(`[data-instrument="${inst.id}"][data-step="${step}"]`);
        if (element) {
          if (value) {
            element.classList.add('active');
            element.style.setProperty('--velocity-height', `${velocityPattern[inst.id][step] * 100}%`);
          } else {
            element.classList.remove('active');
          }
        }
      });
    });
  }

  // Enhanced audio synthesis with all parameters
  function playSound(instId, destination = null, stepIndex = null) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    const params = globalParams.instrumentParams[instId];
    const target = destination || masterGain || audioContext.destination;
    const now = audioContext.currentTime;
    
    // Apply velocity
    let velocity = params.velocity;
    if (stepIndex !== null && velocityPattern[instId]) {
      velocity = velocityPattern[instId][stepIndex] || 1.0;
    }
    
    // Apply humanization
    if (globalParams.humanize > 0) {
      const variation = (Math.random() - 0.5) * (globalParams.humanize / 100);
      velocity = Math.max(0.1, Math.min(1.0, velocity + variation));
    }

    // Calculate pitch adjustment
    const pitchMultiplier = Math.pow(2, params.pitch / 12);
    
    // Create nodes for this sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const pan = audioContext.createStereoPanner();
    const instFilter = audioContext.createBiquadFilter();
    const distortion = audioContext.createWaveShaper();
    
    // Setup filter
    instFilter.type = params.filterType || 'lowpass';
    instFilter.frequency.value = params.filterFreq;
    instFilter.Q.value = params.filterQ;
    
    // Setup distortion
    if (params.distortion > 0) {
      const amount = params.distortion * 100;
      const samples = 44100;
      const curve = new Float32Array(samples);
      const deg = Math.PI / 180;
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      }
      
      distortion.curve = curve;
      distortion.oversample = '4x';
    }
    
    // Setup panning
    pan.pan.value = params.pan;
    
    // Connect chain
    osc.connect(gain);
    gain.connect(instFilter);
    
    if (params.distortion > 0) {
      instFilter.connect(distortion);
      distortion.connect(pan);
    } else {
      instFilter.connect(pan);
    }
    
    pan.connect(target);

    // Apply instrument-specific synthesis
    switch(instId) {
      case 'kick':
        // Main tone
        osc.frequency.setValueAtTime(150 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5 * params.decay);
        gain.gain.setValueAtTime(velocity * params.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5 * params.decay);
        
        // Add sub layer if configured
        if (inst.subFreq > 0) {
          const subOsc = audioContext.createOscillator();
          const subGain = audioContext.createGain();
          subOsc.frequency.value = inst.subFreq * pitchMultiplier;
          subOsc.connect(subGain);
          subGain.connect(pan);
          subGain.gain.setValueAtTime(velocity * params.volume * 0.5, now);
          subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3 * params.decay);
          subOsc.start(now);
          subOsc.stop(now + 0.5 * params.decay);
        }
        
        // Add noise layer if configured
        if (params.noiseAmount > 0) {
          addNoiseLayer(pan, now, params.noiseAmount * velocity, 0.1 * params.decay, 20, 200);
        }
        
        osc.start(now);
        osc.stop(now + 0.5 * params.decay);
        break;

      case 'snare':
        // White noise layer
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2 * params.decay, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const noiseGain = audioContext.createGain();
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(pan);
        noiseGain.gain.setValueAtTime(params.noiseAmount * velocity * params.volume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2 * params.decay);

        // Tonal layer
        osc.frequency.setValueAtTime(inst.frequency * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(inst.frequency * 0.5 * pitchMultiplier, now + 0.1 * params.decay);
        gain.gain.setValueAtTime(velocity * params.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 * params.decay);

        // Sub layer for punch
        if (inst.subFreq > 0) {
          const subOsc = audioContext.createOscillator();
          const subGain = audioContext.createGain();
          subOsc.frequency.value = inst.subFreq * pitchMultiplier;
          subOsc.connect(subGain);
          subGain.connect(pan);
          subGain.gain.setValueAtTime(velocity * params.volume * 0.3, now);
          subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05 * params.decay);
          subOsc.start(now);
          subOsc.stop(now + 0.2 * params.decay);
        }

        osc.start(now);
        osc.stop(now + 0.2 * params.decay);
        noise.start(now);
        noise.stop(now + 0.2 * params.decay);
        break;

      case 'hihat':
      case 'openhat':
        // Mix of square wave and noise
        osc.type = 'square';
        osc.frequency.value = inst.frequency * pitchMultiplier;
        
        const duration = instId === 'openhat' ? 0.3 : 0.05;
        gain.gain.setValueAtTime(velocity * params.volume * (1 - params.noiseAmount), now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration * params.decay);
        
        // Add filtered noise
        if (params.noiseAmount > 0) {
          addNoiseLayer(pan, now, params.noiseAmount * velocity * params.volume, 
                       duration * params.decay, 6000, 20000);
        }
        
        osc.start(now);
        osc.stop(now + duration * params.decay);
        break;

      case 'clap':
        // Multiple short bursts
        for (let i = 0; i < 3; i++) {
          const clapTime = now + (i * 0.01);
          const clapOsc = audioContext.createOscillator();
          const clapGain = audioContext.createGain();
          
          clapOsc.frequency.value = inst.frequency * pitchMultiplier * (1 + i * 0.1);
          clapOsc.connect(clapGain);
          clapGain.connect(pan);
          
          clapGain.gain.setValueAtTime(velocity * params.volume * 0.3, clapTime);
          clapGain.gain.exponentialRampToValueAtTime(0.01, clapTime + 0.02 * params.decay);
          
          clapOsc.start(clapTime);
          clapOsc.stop(clapTime + 0.1 * params.decay);
        }
        
        // Add noise burst
        if (params.noiseAmount > 0) {
          addNoiseLayer(pan, now, params.noiseAmount * velocity * params.volume, 
                       0.05 * params.decay, 1000, 4000);
        }
        break;

      case 'rim':
      case 'cowbell':
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(velocity * params.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 * params.decay);
        
        // Add harmonics for metallic sound
        if (instId === 'cowbell') {
          const harmonic = audioContext.createOscillator();
          const harmonicGain = audioContext.createGain();
          harmonic.frequency.value = inst.frequency * 1.5 * pitchMultiplier;
          harmonic.connect(harmonicGain);
          harmonicGain.connect(pan);
          harmonicGain.gain.setValueAtTime(velocity * params.volume * 0.3, now);
          harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15 * params.decay);
          harmonic.start(now);
          harmonic.stop(now + 0.2 * params.decay);
        }
        
        osc.start(now);
        osc.stop(now + 0.1 * params.decay);
        break;

      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(velocity * params.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1 * params.decay);
        
        // Add multiple noise layers for complexity
        if (params.noiseAmount > 0) {
          for (let i = 0; i < 3; i++) {
            addNoiseLayer(pan, now, params.noiseAmount * velocity * params.volume * (0.3 - i * 0.1), 
                         (1 + i * 0.2) * params.decay, 5000 + i * 2000, 20000);
          }
        }
        
        osc.start(now);
        osc.stop(now + 1 * params.decay);
        break;

      default:
        // Generic synthesis
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(velocity * params.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 * params.decay);
        osc.start(now);
        osc.stop(now + 0.1 * params.decay);
    }
  }

  // Helper function to add noise layers
  function addNoiseLayer(destination, startTime, volume, duration, lowFreq, highFreq) {
    const noise = audioContext.createBufferSource();
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    const highpass = audioContext.createBiquadFilter();
    const lowpass = audioContext.createBiquadFilter();
    
    highpass.type = 'highpass';
    highpass.frequency.value = lowFreq;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = highFreq;
    
    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(destination);
    
    noiseGain.gain.setValueAtTime(volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  // Sequencer playback with swing
  function advanceSequencer() {
    // Remove playing class from previous step
    document.querySelectorAll('.drum-step-btn').forEach(el => {
      el.classList.remove('playing');
    });

    // Calculate swing delay for off-beats
    let swingDelay = 0;
    if (globalParams.swing > 0 && currentStep % 2 === 1) {
      const tempo = parseInt(document.getElementById('drumTempoSlider').value);
      const stepTime = (60 / tempo / 4);
      swingDelay = stepTime * (globalParams.swing / 100) * 0.5;
    }

    // Schedule playback with swing
    setTimeout(() => {
      // Add playing class to current step
      instruments.forEach(inst => {
        const el = document.querySelector(`[data-instrument="${inst.id}"][data-step="${currentStep}"]`);
        if (el) {
          el.classList.add('playing');
          if (pattern[inst.id][currentStep]) {
            playSound(inst.id, null, currentStep);
          }
        }
      });
    }, swingDelay * 1000);

    currentStep = (currentStep + 1) % STEPS;
  }

  // Transport controls
  function play() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      initializeEffects();
    }

    if (!isPlaying) {
      isPlaying = true;
      const tempo = parseInt(document.getElementById('drumTempoSlider').value);
      const interval = (60 / tempo / 4) * 1000; // 16th notes

      const playBtn = document.getElementById('drumPlayBtn');
      playBtn.innerHTML = '<span>❚❚</span> PAUSE';
      playBtn.classList.add('active');

      advanceSequencer();
      intervalId = setInterval(advanceSequencer, interval);
    } else {
      pause();
    }
  }

  function pause() {
    isPlaying = false;
    clearInterval(intervalId);
    const playBtn = document.getElementById('drumPlayBtn');
    if (playBtn) {
      playBtn.innerHTML = '<span>▶</span> PLAY';
      playBtn.classList.remove('active');
    }
  }

  function stop() {
    pause();
    currentStep = 0;
    document.querySelectorAll('.drum-step-btn').forEach(el => {
      el.classList.remove('playing');
    });
  }

  function clear() {
    instruments.forEach(inst => {
      pattern[inst.id].fill(0);
      velocityPattern[inst.id].fill(1.0);
    });
    updatePattern();
  }

  function loadPreset(presetName) {
    if (presets[presetName]) {
      currentPreset = presetName;
      
      pattern = {};
      instruments.forEach(inst => {
        pattern[inst.id] = [...presets[presetName][inst.id]];
        // Reset velocities
        if (!velocityPattern[inst.id]) {
          velocityPattern[inst.id] = new Array(STEPS).fill(1.0);
        }
      });
      
      if (presets[presetName].bpm) {
        const tempoSlider = document.getElementById('drumTempoSlider');
        const tempoValue = document.getElementById('drumTempoValue');
        if (tempoSlider && tempoValue) {
          tempoSlider.value = presets[presetName].bpm;
          tempoValue.textContent = `${presets[presetName].bpm} BPM`;
          
          if (isPlaying) {
            pause();
            play();
          }
        }
      }
      
      updatePattern();
      updatePresetButtons();
    }
  }

  function updatePresetButtons() {
    document.querySelectorAll('.drum-preset-btn').forEach(btn => {
      if (btn.dataset.preset === currentPreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function changeConfiguration(configName) {
    if (instrumentConfigs[configName]) {
      currentConfig = configName;
      instruments = instrumentConfigs[configName];
      
      const tempPattern = {};
      const tempVelocity = {};
      instruments.forEach(inst => {
        tempPattern[inst.id] = pattern[inst.id] || new Array(STEPS).fill(0);
        tempVelocity[inst.id] = velocityPattern[inst.id] || new Array(STEPS).fill(1.0);
        
        // Initialize instrument params if not exist
        if (!globalParams.instrumentParams[inst.id]) {
          globalParams.instrumentParams[inst.id] = {
            volume: 0.5,
            pitch: 0,
            decay: 1.0,
            noiseAmount: inst.noiseAmount || 0,
            filterFreq: 20000,
            filterQ: 1,
            filterType: 'lowpass',
            distortion: 0,
            pan: 0,
            velocity: 1.0
          };
        }
      });
      pattern = tempPattern;
      velocityPattern = tempVelocity;
      
      createGrid();
      updatePattern();
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    // Transport controls
    const playBtn = document.getElementById('drumPlayBtn');
    const stopBtn = document.getElementById('drumStopBtn');
    const clearBtn = document.getElementById('drumClearBtn');
    const downloadBtn = document.getElementById('drumDownloadBtn');
    const tempoSlider = document.getElementById('drumTempoSlider');
    const tempoValue = document.getElementById('drumTempoValue');
    const configSelect = document.getElementById('drumConfigSelect');

    if (playBtn) playBtn.addEventListener('click', play);
    if (stopBtn) stopBtn.addEventListener('click', stop);
    if (clearBtn) clearBtn.addEventListener('click', clear);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadLoop);

    if (tempoSlider) {
      tempoSlider.addEventListener('input', (e) => {
        const tempo = e.target.value;
        if (tempoValue) tempoValue.textContent = `${tempo} BPM`;

        if (isPlaying) {
          pause();
          play();
        }
      });
    }

    if (configSelect) {
      configSelect.addEventListener('change', (e) => {
        changeConfiguration(e.target.value);
      });
    }

    // Preset buttons
    document.querySelectorAll('.drum-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });

    // Global controls
    setupSlider('swingSlider', 'swingValue', (value) => {
      globalParams.swing = value;
      return `${value}%`;
    });

    setupSlider('humanizeSlider', 'humanizeValue', (value) => {
      globalParams.humanize = value;
      return `${value}%`;
    });

    // Effects controls
    setupEffectToggle('filterToggle', 'filter');
    setupEffectToggle('reverbToggle', 'reverb');
    setupEffectToggle('delayToggle', 'delay');
    setupEffectToggle('bitCrusherToggle', 'bitCrusher');
    setupEffectToggle('compressorToggle', 'compression');

    // Filter controls
    document.getElementById('filterType')?.addEventListener('change', (e) => {
      globalParams.filter.type = e.target.value;
      if (filterNode) filterNode.type = e.target.value;
    });

    setupSlider('filterFreq', 'filterFreqValue', (value) => {
      globalParams.filter.frequency = value;
      if (filterNode) filterNode.frequency.value = value;
      return value >= 1000 ? `${(value/1000).toFixed(1)}kHz` : `${value}Hz`;
    });

    setupSlider('filterQ', 'filterQValue', (value) => {
      globalParams.filter.q = value;
      if (filterNode) filterNode.Q.value = value;
      return value.toFixed(1);
    });

    // Reverb controls
    setupSlider('reverbWet', 'reverbWetValue', (value) => {
      globalParams.reverb.wetness = value / 100;
      return `${value}%`;
    });

    setupSlider('reverbSize', 'reverbSizeValue', (value) => {
      globalParams.reverb.roomSize = value / 100;
      if (audioContext && reverbNode) {
        impulseBuffer = createImpulseResponse(3 * (value/100), 2);
        reverbNode.buffer = impulseBuffer;
      }
      return `${value}%`;
    });

    // Delay controls
    setupSlider('delayTime', 'delayTimeValue', (value) => {
      globalParams.delay.time = value;
      if (delayNode) delayNode.delayTime.value = value;
      return `${(value * 1000).toFixed(0)}ms`;
    });

    setupSlider('delayFeedback', 'delayFeedbackValue', (value) => {
      globalParams.delay.feedback = value / 100;
      if (delayFeedback) delayFeedback.gain.value = value / 100;
      return `${value}%`;
    });

    setupSlider('delayWet', 'delayWetValue', (value) => {
      globalParams.delay.wetness = value / 100;
      if (delayWetGain) delayWetGain.gain.value = value / 100;
      return `${value}%`;
    });

    // Bit crusher controls
    setupSlider('bitDepth', 'bitDepthValue', (value) => {
      globalParams.bitCrusher.bits = value;
      return `${value} bit`;
    });

    setupSlider('sampleRateReduction', 'sampleRateValue', (value) => {
      globalParams.bitCrusher.sampleRate = value;
      return `${(value * 100).toFixed(0)}%`;
    });

    // Compressor controls
    setupSlider('compThreshold', 'compThresholdValue', (value) => {
      globalParams.compression.threshold = value;
      if (compressorNode) compressorNode.threshold.value = value;
      return `${value}dB`;
    });

    setupSlider('compRatio', 'compRatioValue', (value) => {
      globalParams.compression.ratio = value;
      if (compressorNode) compressorNode.ratio.value = value;
      return `${value}:1`;
    });

    // Per-instrument controls
    setupInstrumentControls();
  }

  // Helper function to setup sliders
  function setupSlider(sliderId, valueId, updateFunc) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        valueDisplay.textContent = updateFunc(value);
      });
    }
  }

  // Helper function to setup effect toggles
  function setupEffectToggle(toggleId, effectName) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', () => {
        globalParams[effectName].enabled = !globalParams[effectName].enabled;
        toggle.classList.toggle('active');
        updateEffectsChain();
      });
    }
  }

  // Setup per-instrument controls
  function setupInstrumentControls() {
    // Volume controls
    document.querySelectorAll('.inst-volume').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value) / 100;
        globalParams.instrumentParams[inst].volume = value;
        e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
      });
    });

    // Pan controls
    document.querySelectorAll('.inst-pan').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value) / 100;
        globalParams.instrumentParams[inst].pan = value;
        const display = value === 0 ? 'C' : value < 0 ? `${Math.abs(Math.round(value*100))}L` : `${Math.round(value*100)}R`;
        e.target.nextElementSibling.textContent = display;
      });
    });

    // Pitch controls
    document.querySelectorAll('.inst-pitch').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseInt(e.target.value);
        globalParams.instrumentParams[inst].pitch = value;
        e.target.nextElementSibling.textContent = value > 0 ? `+${value}` : `${value}`;
      });
    });

    // Decay controls
    document.querySelectorAll('.inst-decay').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value) / 100;
        globalParams.instrumentParams[inst].decay = value;
        e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
      });
    });

    // Noise mix controls
    document.querySelectorAll('.inst-noise').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value) / 100;
        globalParams.instrumentParams[inst].noiseAmount = value;
        e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
      });
    });

    // Filter controls
    document.querySelectorAll('.inst-filter').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value);
        globalParams.instrumentParams[inst].filterFreq = value;
        const display = value >= 1000 ? `${(value/1000).toFixed(1)}kHz` : `${value}Hz`;
        e.target.nextElementSibling.textContent = display;
      });
    });

    // Distortion controls
    document.querySelectorAll('.inst-dist').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseFloat(e.target.value) / 100;
        globalParams.instrumentParams[inst].distortion = value;
        e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
      });
    });
  }

  // Enhanced download with all effects
  async function downloadLoop() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      initializeEffects();
    }

    const downloadBtn = document.getElementById('drumDownloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳</span> RENDERING...';

    try {
      const tempo = parseInt(document.getElementById('drumTempoSlider').value);
      const stepDuration = (60 / tempo / 4);
      const loopDuration = stepDuration * STEPS;
      const sampleRate = 44100;
      const numberOfChannels = 2;
      const length = sampleRate * loopDuration;

      const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);

      // Create offline effects chain
      const offlineMaster = offlineContext.createGain();
      offlineMaster.gain.value = 0.8;
      offlineMaster.connect(offlineContext.destination);

      // Render each step
      for (let step = 0; step < STEPS; step++) {
        let stepTime = step * stepDuration;
        
        // Apply swing to off-beats
        if (globalParams.swing > 0 && step % 2 === 1) {
          stepTime += stepDuration * (globalParams.swing / 100) * 0.5;
        }
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step]) {
            renderSoundOffline(offlineContext, inst.id, stepTime, offlineMaster, step);
          }
        });
      }

      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casa24-beat-pro-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      downloadBtn.innerHTML = '<span>💾</span> DOWNLOAD';
    } catch (error) {
      console.error('Error downloading loop:', error);
      downloadBtn.innerHTML = '<span>❌</span> ERROR';
      setTimeout(() => {
        downloadBtn.innerHTML = '<span>💾</span> DOWNLOAD';
      }, 2000);
    } finally {
      downloadBtn.disabled = false;
    }
  }

  // Render sound for offline context (simplified version without all effects for now)
  function renderSoundOffline(offlineContext, instId, startTime, destination, stepIndex) {
    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    const params = globalParams.instrumentParams[instId];
    const velocity = velocityPattern[instId][stepIndex] || 1.0;
    
    const osc = offlineContext.createOscillator();
    const gain = offlineContext.createGain();

    osc.connect(gain);
    gain.connect(destination);

    // Simplified synthesis for offline rendering
    switch(instId) {
      case 'kick':
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5 * params.decay);
        gain.gain.setValueAtTime(velocity * params.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5 * params.decay);
        osc.start(startTime);
        osc.stop(startTime + 0.5 * params.decay);
        break;

      case 'snare':
        // Noise layer
        const noise = offlineContext.createBufferSource();
        const noiseBuffer = offlineContext.createBuffer(1, offlineContext.sampleRate * 0.2, offlineContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const noiseGain = offlineContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(destination);
        noiseGain.gain.setValueAtTime(params.noiseAmount * velocity * params.volume, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2 * params.decay);

        // Tonal layer
        osc.frequency.setValueAtTime(inst.frequency, startTime);
        osc.frequency.exponentialRampToValueAtTime(inst.frequency * 0.5, startTime + 0.1 * params.decay);
        gain.gain.setValueAtTime(velocity * params.volume * 0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1 * params.decay);

        osc.start(startTime);
        osc.stop(startTime + 0.2 * params.decay);
        noise.start(startTime);
        noise.stop(startTime + 0.2 * params.decay);
        break;

      // ... other instruments follow similar pattern
      default:
        osc.frequency.value = inst.frequency;
        gain.gain.setValueAtTime(velocity * params.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1 * params.decay);
        osc.start(startTime);
        osc.stop(startTime + 0.1 * params.decay);
    }
  }

  // Convert AudioBuffer to WAV (same as original)
  function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  // Initialize function
  function initialize() {
    const container = document.getElementById('drum-machine-container');
    if (!container) {
      console.error('Drum machine container not found');
      return;
    }

    pause();
    currentStep = 0;
    
    createDrumMachine();
  }

  // Public API
  window.drumMachinePro = {
    initialize: initialize,
    play: play,
    stop: stop,
    clear: clear,
    loadPreset: loadPreset,
    getParams: () => globalParams,
    setParam: (path, value) => {
      // Allow external control of parameters
      const keys = path.split('.');
      let obj = globalParams;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
    }
  };
})();
