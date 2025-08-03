// Casa 24 Drum Machine Pro - Enhanced Version with Better UI/UX
(function() {
  // Configuration
  const STEPS = 16;
  
  // Enhanced instrument configuration with multi-layer support
  const instrumentConfigs = {
    "Robocop": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 60, subFreq: 40, noiseAmount: 0 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 200, subFreq: 80, noiseAmount: 0.2 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 800, subFreq: 0, noiseAmount: 0.3 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 800, subFreq: 0, noiseAmount: 0.4 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1500, subFreq: 0, noiseAmount: 0.1 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 2000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 400, subFreq: 0, noiseAmount: 0.05 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 800, subFreq: 0, noiseAmount: 0 }
    ],
    "Boom-bap": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 60, subFreq: 35, noiseAmount: 0.02 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 220, subFreq: 90, noiseAmount: 0.25 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 8000, subFreq: 0, noiseAmount: 0.4 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2000, subFreq: 0, noiseAmount: 0.15 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11000, subFreq: 0, noiseAmount: 0.6 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 1000, subFreq: 0, noiseAmount: 0.08 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 900, subFreq: 0, noiseAmount: 0 }
    ],
    "Lo-fi": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 50, subFreq: 30, noiseAmount: 0.05 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 180, subFreq: 70, noiseAmount: 0.3 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 6500, subFreq: 0, noiseAmount: 0.45 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4500, subFreq: 0, noiseAmount: 0.55 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1000, subFreq: 0, noiseAmount: 0.2 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 9000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 800, subFreq: 0, noiseAmount: 0.1 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 700, subFreq: 0, noiseAmount: 0.02 }
    ]
  };
  
  // Current configuration
  let currentConfig = "Robocop";
  let instruments = instrumentConfigs[currentConfig];

  // Global effects parameters
  let globalParams = {
    // Per-instrument parameters
    instrumentParams: {},
    // Global effects with simplified defaults
    reverb: { enabled: false, wetness: 0.3 },
    delay: { enabled: false, time: 0.25, feedback: 0.3 },
    filter: { enabled: false, frequency: 20000, type: 'lowpass' },
    compression: { enabled: false, threshold: -20, ratio: 4 },
    swing: 0,
    humanize: 0
  };

  // Initialize instrument parameters
  instruments.forEach(inst => {
    globalParams.instrumentParams[inst.id] = {
      volume: 0.7,
      pitch: 0,
      decay: 1.0,
      pan: 0
    };
  });

  // Preset patterns
  const presets = {
    "Classic": {
      bpm: 120,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    "Funk": {
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
    "Trap": {
      bpm: 140,
      kick:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    "House": {
      bpm: 128,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
  };

  // State
  let audioContext;
  let isPlaying = false;
  let currentStep = 0;
  let intervalId = null;
  let pattern = {};
  let isRecording = false;
  let currentPreset = null;
  let masterGain;
  let effectsChain = {};
  let isMuted = {};
  let isSolo = false;
  let soloTrack = null;
  let selectedInstrument = null;
  let showEffects = false;
  let showMixer = true;

  // Initialize empty pattern
  instruments.forEach(inst => {
    pattern[inst.id] = new Array(STEPS).fill(0);
    isMuted[inst.id] = false;
  });

  // Create the drum machine HTML with improved UI
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dm-wrapper">
        <style>
          /* Modern, clean drum machine styles */
          .dm-wrapper {
            font-family: 'Space Mono', monospace;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          }

          /* Header Section */
          .dm-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(0, 166, 81, 0.3);
          }

          .dm-title {
            font-family: 'VT323', monospace;
            font-size: 2rem;
            color: #00a651;
            text-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
          }

          .dm-kit-selector {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .dm-kit-label {
            color: #999;
            font-size: 0.875rem;
            text-transform: uppercase;
          }

          .dm-kit-select {
            background: #2a2a2a;
            border: 1px solid #00a651;
            color: #00a651;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-family: 'Space Mono', monospace;
            transition: all 0.2s;
          }

          .dm-kit-select:hover {
            background: rgba(0, 166, 81, 0.1);
            box-shadow: 0 0 10px rgba(0, 166, 81, 0.3);
          }

          /* Transport Controls */
          .dm-transport {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.75rem;
          }

          .dm-btn {
            background: #2a2a2a;
            border: 2px solid #444;
            color: #999;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-transform: uppercase;
          }

          .dm-btn:hover {
            border-color: #00a651;
            color: #00a651;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 166, 81, 0.3);
          }

          .dm-btn.active {
            background: #00a651;
            color: #1a1a1a;
            border-color: #00a651;
            box-shadow: 0 0 20px rgba(0, 166, 81, 0.5);
          }

          .dm-btn-icon {
            font-size: 1.25rem;
          }

          .dm-tempo-control {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0 1rem;
            border-left: 2px solid #333;
            border-right: 2px solid #333;
          }

          .dm-tempo-display {
            background: #1a1a1a;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            color: #00a651;
            font-weight: bold;
            min-width: 80px;
            text-align: center;
            border: 1px solid #00a651;
          }

          .dm-tempo-slider {
            width: 120px;
            height: 4px;
            background: #333;
            outline: none;
            border-radius: 2px;
            cursor: pointer;
            -webkit-appearance: none;
          }

          .dm-tempo-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #00a651;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
          }

          /* Preset Buttons */
          .dm-presets {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
          }

          .dm-preset-btn {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #444;
            color: #999;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
          }

          .dm-preset-btn:hover {
            border-color: #00a651;
            color: #00a651;
            background: rgba(0, 166, 81, 0.1);
          }

          .dm-preset-btn.active {
            background: #00a651;
            color: #1a1a1a;
            border-color: #00a651;
          }

          /* Pattern Grid */
          .dm-pattern-container {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .dm-pattern-grid {
            display: grid;
            gap: 0.5rem;
          }

          .dm-track {
            display: grid;
            grid-template-columns: 120px repeat(16, 1fr);
            gap: 0.25rem;
            align-items: center;
            padding: 0.25rem 0;
          }

          .dm-track-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.5rem;
            border: 1px solid #333;
          }

          .dm-track-icon {
            font-size: 1.25rem;
          }

          .dm-track-label {
            color: #999;
            font-size: 0.875rem;
            font-weight: bold;
            text-transform: uppercase;
            flex: 1;
          }

          .dm-track-controls {
            display: flex;
            gap: 0.25rem;
          }

          .dm-track-btn {
            width: 24px;
            height: 24px;
            border-radius: 0.25rem;
            border: 1px solid #444;
            background: #2a2a2a;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.2s;
          }

          .dm-track-btn:hover {
            border-color: #00a651;
            color: #00a651;
          }

          .dm-track-btn.active {
            background: #00a651;
            color: #1a1a1a;
            border-color: #00a651;
          }

          .dm-track-btn.muted {
            background: #ff4444;
            color: #fff;
            border-color: #ff4444;
          }

          .dm-track-btn.solo {
            background: #ffaa00;
            color: #1a1a1a;
            border-color: #ffaa00;
          }

          .dm-step {
            aspect-ratio: 1;
            border-radius: 0.25rem;
            border: 1px solid #333;
            background: #1a1a1a;
            cursor: pointer;
            transition: all 0.15s;
            position: relative;
            overflow: hidden;
          }

          .dm-step:hover {
            border-color: #00a651;
            transform: scale(1.1);
            box-shadow: 0 0 10px rgba(0, 166, 81, 0.3);
          }

          .dm-step.active {
            background: #00a651;
            border-color: #00a651;
            box-shadow: 0 0 15px rgba(0, 166, 81, 0.5);
          }

          .dm-step.playing {
            animation: step-pulse 0.2s ease-out;
          }

          .dm-step.beat-1 {
            border-color: #444;
            background: #222;
          }

          @keyframes step-pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(0, 166, 81, 0.7);
            }
            100% {
              transform: scale(1.15);
              box-shadow: 0 0 0 10px rgba(0, 166, 81, 0);
            }
          }

          /* Step indicator */
          .dm-step-indicator {
            display: grid;
            grid-template-columns: 120px repeat(16, 1fr);
            gap: 0.25rem;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #333;
          }

          .dm-step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 0.75rem;
            height: 20px;
          }

          .dm-step-number.beat-1 {
            color: #00a651;
            font-weight: bold;
          }

          /* Mixer Panel */
          .dm-mixer-toggle {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
          }

          .dm-toggle-btn {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #444;
            color: #999;
            padding: 0.5rem 1.5rem;
            border-radius: 0.5rem 0.5rem 0 0;
            cursor: pointer;
            transition: all 0.2s;
            margin: 0 0.25rem;
          }

          .dm-toggle-btn.active {
            background: rgba(0, 166, 81, 0.1);
            border-color: #00a651;
            color: #00a651;
            border-bottom: none;
          }

          .dm-mixer-panel {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            display: none;
          }

          .dm-mixer-panel.active {
            display: block;
            animation: slideDown 0.3s ease-out;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dm-mixer-tracks {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 1rem;
          }

          .dm-mixer-track {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 0.5rem;
            padding: 1rem 0.5rem;
            border: 1px solid #333;
            transition: all 0.2s;
          }

          .dm-mixer-track.selected {
            border-color: #00a651;
            box-shadow: 0 0 20px rgba(0, 166, 81, 0.3);
          }

          .dm-mixer-track-name {
            text-align: center;
            color: #999;
            font-size: 0.75rem;
            margin-bottom: 0.5rem;
            font-weight: bold;
          }

          .dm-mixer-fader {
            writing-mode: bt-lr; /* IE */
            -webkit-appearance: slider-vertical; /* WebKit */
            width: 30px;
            height: 100px;
            background: #333;
            outline: none;
            margin: 0 auto;
            display: block;
          }

          .dm-mixer-value {
            text-align: center;
            color: #00a651;
            font-size: 0.75rem;
            margin-top: 0.5rem;
          }

          .dm-mixer-knobs {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
          }

          .dm-knob {
            flex: 1;
            text-align: center;
          }

          .dm-knob-label {
            color: #666;
            font-size: 0.625rem;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
          }

          .dm-knob-control {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #2a2a2a;
            border: 2px solid #444;
            margin: 0 auto;
            position: relative;
            cursor: pointer;
          }

          .dm-knob-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 40%;
            background: #00a651;
            transform-origin: bottom;
            transform: translate(-50%, -100%) rotate(0deg);
            transition: transform 0.2s;
          }

          /* Effects Panel */
          .dm-effects-panel {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            display: none;
          }

          .dm-effects-panel.active {
            display: block;
            animation: slideDown 0.3s ease-out;
          }

          .dm-effects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }

          .dm-effect-unit {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 0.5rem;
            padding: 1rem;
            border: 1px solid #333;
            transition: all 0.2s;
          }

          .dm-effect-unit.active {
            border-color: #00a651;
            box-shadow: 0 0 20px rgba(0, 166, 81, 0.3);
          }

          .dm-effect-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .dm-effect-title {
            color: #999;
            font-size: 0.875rem;
            font-weight: bold;
            text-transform: uppercase;
          }

          .dm-effect-toggle {
            width: 40px;
            height: 20px;
            background: #333;
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s;
          }

          .dm-effect-toggle.active {
            background: #00a651;
          }

          .dm-effect-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: #999;
            border-radius: 50%;
            transition: transform 0.3s;
          }

          .dm-effect-toggle.active::after {
            transform: translateX(20px);
            background: #fff;
          }

          .dm-effect-controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .dm-effect-param {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .dm-effect-param-label {
            color: #666;
            font-size: 0.75rem;
            text-transform: uppercase;
          }

          .dm-effect-param-value {
            color: #00a651;
            font-size: 0.75rem;
            min-width: 40px;
            text-align: right;
          }

          .dm-effect-slider {
            width: 100%;
            height: 4px;
            background: #333;
            outline: none;
            border-radius: 2px;
            cursor: pointer;
            -webkit-appearance: none;
            margin: 0.25rem 0;
          }

          .dm-effect-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #00a651;
            border-radius: 50%;
            cursor: pointer;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .dm-header {
              flex-direction: column;
              gap: 1rem;
            }

            .dm-transport {
              flex-wrap: wrap;
              justify-content: center;
            }

            .dm-tempo-control {
              border: none;
              padding: 0;
            }

            .dm-track {
              grid-template-columns: 80px repeat(16, 1fr);
            }

            .dm-step-indicator {
              grid-template-columns: 80px repeat(16, 1fr);
            }

            .dm-mixer-tracks {
              grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            }

            .dm-btn {
              padding: 0.5rem 1rem;
              font-size: 0.75rem;
            }
          }

          @media (max-width: 480px) {
            .dm-track-label {
              display: none;
            }

            .dm-track-header {
              padding: 0.25rem;
            }

            .dm-step {
              border-radius: 2px;
            }
          }
        </style>

        <!-- Header -->
        <div class="dm-header">
          <h2 class="dm-title">BEAT LAB PRO</h2>
          <div class="dm-kit-selector">
            <span class="dm-kit-label">Sound Kit:</span>
            <select class="dm-kit-select" id="dmKitSelect">
              <option value="Robocop">ROBOCOP</option>
              <option value="Boom-bap">BOOM-BAP</option>
              <option value="Lo-fi">LO-FI</option>
            </select>
          </div>
        </div>

        <!-- Transport Controls -->
        <div class="dm-transport">
          <button class="dm-btn" id="dmPlayBtn">
            <span class="dm-btn-icon">▶</span>
            <span>PLAY</span>
          </button>
          <button class="dm-btn" id="dmStopBtn">
            <span class="dm-btn-icon">■</span>
            <span>STOP</span>
          </button>
          <button class="dm-btn" id="dmClearBtn">
            <span class="dm-btn-icon">✕</span>
            <span>CLEAR</span>
          </button>
          
          <div class="dm-tempo-control">
            <input type="range" class="dm-tempo-slider" id="dmTempoSlider" min="60" max="200" value="120">
            <div class="dm-tempo-display" id="dmTempoDisplay">120 BPM</div>
          </div>

          <button class="dm-btn" id="dmRecordBtn">
            <span class="dm-btn-icon">⏺</span>
            <span>REC</span>
          </button>
          <button class="dm-btn" id="dmDownloadBtn">
            <span class="dm-btn-icon">💾</span>
            <span>EXPORT</span>
          </button>
        </div>

        <!-- Preset Buttons -->
        <div class="dm-presets">
          <button class="dm-preset-btn" data-preset="Classic">Classic</button>
          <button class="dm-preset-btn" data-preset="Funk">Funk</button>
          <button class="dm-preset-btn" data-preset="Trap">Trap</button>
          <button class="dm-preset-btn" data-preset="House">House</button>
        </div>

        <!-- Mixer/Effects Toggle -->
        <div class="dm-mixer-toggle">
          <button class="dm-toggle-btn active" id="dmMixerToggle">MIXER</button>
          <button class="dm-toggle-btn" id="dmEffectsToggle">EFFECTS</button>
        </div>

        <!-- Mixer Panel -->
        <div class="dm-mixer-panel active" id="dmMixerPanel">
          <div class="dm-mixer-tracks" id="dmMixerTracks">
            <!-- Mixer channels will be generated here -->
          </div>
        </div>

        <!-- Effects Panel -->
        <div class="dm-effects-panel" id="dmEffectsPanel">
          <div class="dm-effects-grid">
            <!-- Reverb -->
            <div class="dm-effect-unit" id="dmReverbUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">REVERB</span>
                <div class="dm-effect-toggle" id="dmReverbToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Mix</span>
                  <span class="dm-effect-param-value" id="dmReverbMixVal">30%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmReverbMix" min="0" max="100" value="30">
              </div>
            </div>

            <!-- Delay -->
            <div class="dm-effect-unit" id="dmDelayUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">DELAY</span>
                <div class="dm-effect-toggle" id="dmDelayToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Time</span>
                  <span class="dm-effect-param-value" id="dmDelayTimeVal">250ms</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDelayTime" min="10" max="500" value="250">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Feedback</span>
                  <span class="dm-effect-param-value" id="dmDelayFeedbackVal">30%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDelayFeedback" min="0" max="90" value="30">
              </div>
            </div>

            <!-- Filter -->
            <div class="dm-effect-unit" id="dmFilterUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">FILTER</span>
                <div class="dm-effect-toggle" id="dmFilterToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Cutoff</span>
                  <span class="dm-effect-param-value" id="dmFilterCutoffVal">20kHz</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmFilterCutoff" min="20" max="20000" value="20000">
              </div>
            </div>

            <!-- Compression -->
            <div class="dm-effect-unit" id="dmCompUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">COMPRESSOR</span>
                <div class="dm-effect-toggle" id="dmCompToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Threshold</span>
                  <span class="dm-effect-param-value" id="dmCompThresholdVal">-20dB</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmCompThreshold" min="-60" max="0" value="-20">
              </div>
            </div>
          </div>
        </div>

        <!-- Pattern Grid -->
        <div class="dm-pattern-container">
          <!-- Step Numbers -->
          <div class="dm-step-indicator">
            <div></div>
            ${Array.from({length: 16}, (_, i) => 
              `<div class="dm-step-number ${i % 4 === 0 ? 'beat-1' : ''}">${i + 1}</div>`
            ).join('')}
          </div>

          <!-- Pattern Grid -->
          <div class="dm-pattern-grid" id="dmPatternGrid">
            <!-- Tracks will be generated here -->
          </div>
        </div>
      </div>
    `;

    createPatternGrid();
    createMixerChannels();
    setupEventListeners();
    loadPreset('Classic');
  }

  // Create pattern grid
  function createPatternGrid() {
    const grid = document.getElementById('dmPatternGrid');
    if (!grid) return;

    grid.innerHTML = '';

    instruments.forEach(inst => {
      const track = document.createElement('div');
      track.className = 'dm-track';

      // Track header
      const header = document.createElement('div');
      header.className = 'dm-track-header';
      header.innerHTML = `
        <span class="dm-track-icon">${inst.icon}</span>
        <span class="dm-track-label">${inst.label}</span>
        <div class="dm-track-controls">
          <button class="dm-track-btn" data-track="${inst.id}" data-action="mute" title="Mute">M</button>
          <button class="dm-track-btn" data-track="${inst.id}" data-action="solo" title="Solo">S</button>
        </div>
      `;
      track.appendChild(header);

      // Step buttons
      for (let i = 0; i < STEPS; i++) {
        const step = document.createElement('button');
        step.className = `dm-step ${i % 4 === 0 ? 'beat-1' : ''}`;
        step.dataset.instrument = inst.id;
        step.dataset.step = i;
        step.addEventListener('click', toggleStep);
        track.appendChild(step);
      }

      grid.appendChild(track);
    });
  }

  // Create mixer channels
  function createMixerChannels() {
    const mixerTracks = document.getElementById('dmMixerTracks');
    if (!mixerTracks) return;

    mixerTracks.innerHTML = '';

    instruments.forEach(inst => {
      const channel = document.createElement('div');
      channel.className = 'dm-mixer-track';
      channel.dataset.instrument = inst.id;
      
      channel.innerHTML = `
        <div class="dm-mixer-track-name">${inst.icon} ${inst.label}</div>
        <input type="range" class="dm-mixer-fader" 
               orient="vertical"
               min="0" max="100" value="70"
               data-instrument="${inst.id}"
               data-param="volume">
        <div class="dm-mixer-value">70%</div>
        
        <div class="dm-mixer-knobs">
          <div class="dm-knob">
            <div class="dm-knob-label">PAN</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pan">
              <div class="dm-knob-indicator"></div>
            </div>
          </div>
          <div class="dm-knob">
            <div class="dm-knob-label">PITCH</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pitch">
              <div class="dm-knob-indicator"></div>
            </div>
          </div>
        </div>
      `;

      // Add click handler for selection
      channel.addEventListener('click', () => {
        document.querySelectorAll('.dm-mixer-track').forEach(t => t.classList.remove('selected'));
        channel.classList.add('selected');
        selectedInstrument = inst.id;
      });

      mixerTracks.appendChild(channel);
    });

    // Setup fader listeners
    document.querySelectorAll('.dm-mixer-fader').forEach(fader => {
      fader.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = e.target.value;
        globalParams.instrumentParams[inst].volume = value / 100;
        e.target.parentElement.querySelector('.dm-mixer-value').textContent = `${value}%`;
      });
    });

    // Setup knob controls
    setupKnobControls();
  }

  // Setup knob controls
  function setupKnobControls() {
    document.querySelectorAll('.dm-knob-control').forEach(knob => {
      let isDragging = false;
      let startY = 0;
      let startValue = 0;

      const updateKnob = (value) => {
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        const indicator = knob.querySelector('.dm-knob-indicator');
        
        if (param === 'pan') {
          const rotation = value * 135; // -135 to +135 degrees
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pan = value / 100;
        } else if (param === 'pitch') {
          const rotation = value * 270 - 135; // -135 to +135 degrees
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pitch = (value - 50) / 50 * 12; // -12 to +12 semitones
        }
      };

      knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startValue = param === 'pan' ? 
          globalParams.instrumentParams[knob.dataset.instrument].pan * 100 :
          (globalParams.instrumentParams[knob.dataset.instrument].pitch / 12 * 50 + 50);
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = startY - e.clientY;
        const newValue = Math.max(0, Math.min(100, startValue + deltaY));
        updateKnob(newValue);
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    });
  }

  // Toggle step
  function toggleStep(e) {
    const inst = e.target.dataset.instrument;
    const step = parseInt(e.target.dataset.step);
    
    pattern[inst][step] = pattern[inst][step] ? 0 : 1;
    e.target.classList.toggle('active');
    
    // Play sound preview
    if (pattern[inst][step] && audioContext) {
      playSound(inst);
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
          } else {
            element.classList.remove('active');
          }
        }
      });
    });
  }

  // Initialize audio context and effects
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(audioContext.destination);

      // Create effects nodes
      effectsChain.reverb = createReverb();
      effectsChain.delay = createDelay();
      effectsChain.filter = createFilter();
      effectsChain.compressor = createCompressor();
    }
  }

  // Create reverb effect
  function createReverb() {
    const convolver = audioContext.createConvolver();
    const length = audioContext.sampleRate * 3;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  // Create delay effect
  function createDelay() {
    const delay = audioContext.createDelay(1);
    const feedback = audioContext.createGain();
    const wet = audioContext.createGain();
    
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    wet.gain.value = 0;
    
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    
    return { delay, feedback, wet };
  }

  // Create filter effect
  function createFilter() {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 1;
    return filter;
  }

  // Create compressor effect
  function createCompressor() {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  // Play sound (simplified version)
  function playSound(instId, destination = null) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    // Check mute/solo
    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;

    const params = globalParams.instrumentParams[instId];
    const target = destination || masterGain || audioContext.destination;
    const now = audioContext.currentTime;

    // Create oscillator and gain
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Apply effects chain if enabled
    let currentNode = gain;
    
    if (globalParams.filter.enabled && effectsChain.filter) {
      currentNode.connect(effectsChain.filter);
      currentNode = effectsChain.filter;
    }
    
    if (globalParams.compression.enabled && effectsChain.compressor) {
      currentNode.connect(effectsChain.compressor);
      currentNode = effectsChain.compressor;
    }
    
    currentNode.connect(target);

    // Apply reverb and delay as sends
    if (globalParams.reverb.enabled && effectsChain.reverb) {
      currentNode.connect(effectsChain.reverb);
      effectsChain.reverb.connect(target);
    }
    
    if (globalParams.delay.enabled && effectsChain.delay) {
      currentNode.connect(effectsChain.delay.delay);
      effectsChain.delay.wet.connect(target);
    }

    // Setup oscillator
    osc.connect(gain);

    // Calculate pitch adjustment
    const pitchMultiplier = Math.pow(2, params.pitch / 12);

    // Simple synthesis based on instrument type
    switch(instId) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        gain.gain.setValueAtTime(params.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'snare':
        // Tone
        osc.frequency.setValueAtTime(inst.frequency * pitchMultiplier, now);
        gain.gain.setValueAtTime(params.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // Add noise
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        
        const noiseGain = audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(target);
        noiseGain.gain.setValueAtTime(params.volume * inst.noiseAmount, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        noise.start(now);
        noise.stop(now + 0.2);
        break;

      case 'hihat':
      case 'openhat':
        osc.type = 'square';
        osc.frequency.value = inst.frequency * pitchMultiplier;
        const duration = instId === 'openhat' ? 0.3 : 0.05;
        gain.gain.setValueAtTime(params.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        osc.start(now);
        osc.stop(now + duration);
        break;

      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(params.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  }

  // Sequencer advance
  function advanceSequencer() {
    // Remove playing class
    document.querySelectorAll('.dm-step').forEach(el => {
      el.classList.remove('playing');
    });

    // Apply swing
    let swingDelay = 0;
    if (globalParams.swing > 0 && currentStep % 2 === 1) {
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const stepTime = (60 / tempo / 4);
      swingDelay = stepTime * (globalParams.swing / 100) * 0.5;
    }

    setTimeout(() => {
      // Add playing class and trigger sounds
      instruments.forEach(inst => {
        const el = document.querySelector(`[data-instrument="${inst.id}"][data-step="${currentStep}"]`);
        if (el) {
          el.classList.add('playing');
          if (pattern[inst.id][currentStep]) {
            playSound(inst.id);
          }
        }
      });
    }, swingDelay * 1000);

    currentStep = (currentStep + 1) % STEPS;
  }

  // Transport controls
  function play() {
    initAudio();

    if (!isPlaying) {
      isPlaying = true;
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const interval = (60 / tempo / 4) * 1000;

      const playBtn = document.getElementById('dmPlayBtn');
      playBtn.classList.add('active');
      playBtn.querySelector('span:last-child').textContent = 'PAUSE';

      advanceSequencer();
      intervalId = setInterval(advanceSequencer, interval);
    } else {
      pause();
    }
  }

  function pause() {
    isPlaying = false;
    clearInterval(intervalId);
    const playBtn = document.getElementById('dmPlayBtn');
    if (playBtn) {
      playBtn.classList.remove('active');
      playBtn.querySelector('span:last-child').textContent = 'PLAY';
    }
  }

  function stop() {
    pause();
    currentStep = 0;
    document.querySelectorAll('.dm-step').forEach(el => {
      el.classList.remove('playing');
    });
  }

  function clear() {
    instruments.forEach(inst => {
      pattern[inst.id].fill(0);
    });
    updatePattern();
  }

  function loadPreset(presetName) {
    if (presets[presetName]) {
      currentPreset = presetName;
      
      pattern = {};
      instruments.forEach(inst => {
        pattern[inst.id] = [...presets[presetName][inst.id]];
      });
      
      if (presets[presetName].bpm) {
        const tempoSlider = document.getElementById('dmTempoSlider');
        const tempoDisplay = document.getElementById('dmTempoDisplay');
        if (tempoSlider && tempoDisplay) {
          tempoSlider.value = presets[presetName].bpm;
          tempoDisplay.textContent = `${presets[presetName].bpm} BPM`;
          
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
    document.querySelectorAll('.dm-preset-btn').forEach(btn => {
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
      instruments.forEach(inst => {
        tempPattern[inst.id] = pattern[inst.id] || new Array(STEPS).fill(0);
        
        if (!globalParams.instrumentParams[inst.id]) {
          globalParams.instrumentParams[inst.id] = {
            volume: 0.7,
            pitch: 0,
            decay: 1.0,
            pan: 0
          };
        }
      });
      pattern = tempPattern;
      
      createPatternGrid();
      createMixerChannels();
      updatePattern();
    }
  }

  // Download functionality
  async function downloadLoop() {
    initAudio();

    const downloadBtn = document.getElementById('dmDownloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.querySelector('span:last-child').textContent = 'RENDERING...';

    try {
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const stepDuration = (60 / tempo / 4);
      const loopDuration = stepDuration * STEPS;
      const sampleRate = 44100;
      const numberOfChannels = 2;
      const length = sampleRate * loopDuration;

      const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);

      // Simplified offline rendering
      for (let step = 0; step < STEPS; step++) {
        const stepTime = step * stepDuration;
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step]) {
            // Simple offline sound rendering
            const osc = offlineContext.createOscillator();
            const gain = offlineContext.createGain();
            
            osc.connect(gain);
            gain.connect(offlineContext.destination);
            
            osc.frequency.value = inst.frequency;
            gain.gain.setValueAtTime(0.5, stepTime);
            gain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.2);
            
            osc.start(stepTime);
            osc.stop(stepTime + 0.2);
          }
        });
      }

      const renderedBuffer = await offlineContext.startRendering();
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casa24-beat-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      downloadBtn.querySelector('span:last-child').textContent = 'EXPORT';
    } catch (error) {
      console.error('Error downloading:', error);
      downloadBtn.querySelector('span:last-child').textContent = 'ERROR';
      setTimeout(() => {
        downloadBtn.querySelector('span:last-child').textContent = 'EXPORT';
      }, 2000);
    } finally {
      downloadBtn.disabled = false;
    }
  }

  // Convert AudioBuffer to WAV
  function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
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

  // Setup event listeners
  function setupEventListeners() {
    // Transport
    document.getElementById('dmPlayBtn')?.addEventListener('click', play);
    document.getElementById('dmStopBtn')?.addEventListener('click', stop);
    document.getElementById('dmClearBtn')?.addEventListener('click', clear);
    document.getElementById('dmDownloadBtn')?.addEventListener('click', downloadLoop);

    // Tempo
    const tempoSlider = document.getElementById('dmTempoSlider');
    const tempoDisplay = document.getElementById('dmTempoDisplay');
    if (tempoSlider) {
      tempoSlider.addEventListener('input', (e) => {
        const tempo = e.target.value;
        if (tempoDisplay) tempoDisplay.textContent = `${tempo} BPM`;
        
        if (isPlaying) {
          pause();
          play();
        }
      });
    }

    // Kit selector
    document.getElementById('dmKitSelect')?.addEventListener('change', (e) => {
      changeConfiguration(e.target.value);
    });

    // Presets
    document.querySelectorAll('.dm-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });

    // Mixer/Effects toggle
    document.getElementById('dmMixerToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.add('active');
      document.getElementById('dmEffectsPanel').classList.remove('active');
      document.getElementById('dmMixerToggle').classList.add('active');
      document.getElementById('dmEffectsToggle').classList.remove('active');
    });

    document.getElementById('dmEffectsToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.remove('active');
      document.getElementById('dmEffectsPanel').classList.add('active');
      document.getElementById('dmMixerToggle').classList.remove('active');
      document.getElementById('dmEffectsToggle').classList.add('active');
    });

    // Track mute/solo
    document.querySelectorAll('.dm-track-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const track = e.target.dataset.track;
        const action = e.target.dataset.action;
        
        if (action === 'mute') {
          isMuted[track] = !isMuted[track];
          e.target.classList.toggle('muted');
        } else if (action === 'solo') {
          if (soloTrack === track) {
            isSolo = false;
            soloTrack = null;
            e.target.classList.remove('solo');
          } else {
            isSolo = true;
            soloTrack = track;
            document.querySelectorAll('[data-action="solo"]').forEach(s => s.classList.remove('solo'));
            e.target.classList.add('solo');
          }
        }
      });
    });

    // Effects toggles
    setupEffectToggle('dmReverbToggle', 'reverb');
    setupEffectToggle('dmDelayToggle', 'delay');
    setupEffectToggle('dmFilterToggle', 'filter');
    setupEffectToggle('dmCompToggle', 'compression');

    // Effects controls
    setupEffectSlider('dmReverbMix', 'dmReverbMixVal', (val) => {
      globalParams.reverb.wetness = val / 100;
      return `${val}%`;
    });

    setupEffectSlider('dmDelayTime', 'dmDelayTimeVal', (val) => {
      globalParams.delay.time = val / 1000;
      if (effectsChain.delay) effectsChain.delay.delay.delayTime.value = val / 1000;
      return `${val}ms`;
    });

    setupEffectSlider('dmDelayFeedback', 'dmDelayFeedbackVal', (val) => {
      globalParams.delay.feedback = val / 100;
      if (effectsChain.delay) effectsChain.delay.feedback.gain.value = val / 100;
      return `${val}%`;
    });

    setupEffectSlider('dmFilterCutoff', 'dmFilterCutoffVal', (val) => {
      globalParams.filter.frequency = val;
      if (effectsChain.filter) effectsChain.filter.frequency.value = val;
      return val >= 1000 ? `${(val/1000).toFixed(1)}kHz` : `${val}Hz`;
    });

    setupEffectSlider('dmCompThreshold', 'dmCompThresholdVal', (val) => {
      globalParams.compression.threshold = val;
      if (effectsChain.compressor) effectsChain.compressor.threshold.value = val;
      return `${val}dB`;
    });
  }

  function setupEffectToggle(toggleId, effectName) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', () => {
        globalParams[effectName].enabled = !globalParams[effectName].enabled;
        toggle.classList.toggle('active');
        
        if (globalParams[effectName].enabled) {
          toggle.parentElement.parentElement.classList.add('active');
        } else {
          toggle.parentElement.parentElement.classList.remove('active');
        }
      });
    }
  }

  function setupEffectSlider(sliderId, valueId, updateFunc) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (slider && valueDisplay) {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        valueDisplay.textContent = updateFunc(value);
      });
    }
  }

  // Initialize
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
    loadPreset: loadPreset
  };
})();
