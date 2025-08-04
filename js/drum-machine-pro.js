// Drum Machine Pro - Production MVP with Industry Standards Applied
(function() {
  // Configuration
  let STEPS = 16; // Dynamic for 4-bar/8-bar support
  let currentBarMode = 4; // 4 or 8 bars
  
  // Industry-standard gain staging constants
  const REFERENCE_LEVEL = -18; // dBFS average operating level
  const HEADROOM = 6; // dB of headroom
  const MASTER_GAIN_DEFAULT = 0.7; // ~-3dB from unity for safety
  
  // Enhanced instrument configuration with 10 kits
  const instrumentConfigs = {
    "Robocop": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 60, subFreq: 40, noiseAmount: 0 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 200, subFreq: 80, noiseAmount: 0.2 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 800, subFreq: 0, noiseAmount: 0.3 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 800, subFreq: 0, noiseAmount: 0.4 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1500, subFreq: 0, noiseAmount: 0.1 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 2000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 400, subFreq: 0, noiseAmount: 0.05 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 800, subFreq: 0, noiseAmount: 0 }
    ],
    "Boom-bap": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 60, subFreq: 35, noiseAmount: 0.02 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 220, subFreq: 90, noiseAmount: 0.25 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 8000, subFreq: 0, noiseAmount: 0.4 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7000, subFreq: 0, noiseAmount: 0.5 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2000, subFreq: 0, noiseAmount: 0.15 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11000, subFreq: 0, noiseAmount: 0.6 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 1000, subFreq: 0, noiseAmount: 0.08 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 900, subFreq: 0, noiseAmount: 0 }
    ],
    "Lo-fi": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 50, subFreq: 30, noiseAmount: 0.05 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 180, subFreq: 70, noiseAmount: 0.3 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 6500, subFreq: 0, noiseAmount: 0.45 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4500, subFreq: 0, noiseAmount: 0.55 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1000, subFreq: 0, noiseAmount: 0.2 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 9000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 800, subFreq: 0, noiseAmount: 0.1 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 700, subFreq: 0, noiseAmount: 0.02 }
    ],
    "Trap Lord": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 45, subFreq: 28, noiseAmount: 0.01 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 250, subFreq: 100, noiseAmount: 0.2 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 10000, subFreq: 0, noiseAmount: 0.6 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 9000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1800, subFreq: 0, noiseAmount: 0.12 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 12000, subFreq: 0, noiseAmount: 0.8 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 500, subFreq: 0, noiseAmount: 0.03 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 850, subFreq: 0, noiseAmount: 0 }
    ],
    "Latin Fusion": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 65, subFreq: 38, noiseAmount: 0.03 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 230, subFreq: 85, noiseAmount: 0.18 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 7500, subFreq: 0, noiseAmount: 0.35 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 6000, subFreq: 0, noiseAmount: 0.45 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2500, subFreq: 0, noiseAmount: 0.08 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 10000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 1200, subFreq: 0, noiseAmount: 0.04 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 950, subFreq: 0, noiseAmount: 0.01 }
    ],
    "Panama Heat": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 55, subFreq: 32, noiseAmount: 0.02 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 240, subFreq: 95, noiseAmount: 0.22 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 8500, subFreq: 0, noiseAmount: 0.5 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7500, subFreq: 0, noiseAmount: 0.6 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1600, subFreq: 0, noiseAmount: 0.14 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11500, subFreq: 0, noiseAmount: 0.75 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 600, subFreq: 0, noiseAmount: 0.06 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 1050, subFreq: 0, noiseAmount: 0 }
    ],
    "Digital Grime": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 40, subFreq: 25, noiseAmount: 0.08 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 260, subFreq: 110, noiseAmount: 0.3 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 12000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 10000, subFreq: 0, noiseAmount: 0.8 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2200, subFreq: 0, noiseAmount: 0.25 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 14000, subFreq: 0, noiseAmount: 0.9 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 700, subFreq: 0, noiseAmount: 0.15 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 750, subFreq: 0, noiseAmount: 0.05 }
    ],
    "Smooth Jazz": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 70, subFreq: 45, noiseAmount: 0 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 190, subFreq: 75, noiseAmount: 0.1 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 5000, subFreq: 0, noiseAmount: 0.2 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4000, subFreq: 0, noiseAmount: 0.3 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1200, subFreq: 0, noiseAmount: 0.05 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 8000, subFreq: 0, noiseAmount: 0.4 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 350, subFreq: 0, noiseAmount: 0.02 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 680, subFreq: 0, noiseAmount: 0 }
    ],
    "Future Bass": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 48, subFreq: 30, noiseAmount: 0.04 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 270, subFreq: 120, noiseAmount: 0.28 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 11000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 9500, subFreq: 0, noiseAmount: 0.75 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2000, subFreq: 0, noiseAmount: 0.18 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 13000, subFreq: 0, noiseAmount: 0.85 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 450, subFreq: 0, noiseAmount: 0.07 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 920, subFreq: 0, noiseAmount: 0.02 }
    ],
    "Street Heat": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 52, subFreq: 33, noiseAmount: 0.015 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 235, subFreq: 88, noiseAmount: 0.24 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 9000, subFreq: 0, noiseAmount: 0.55 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 8000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1700, subFreq: 0, noiseAmount: 0.13 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11800, subFreq: 0, noiseAmount: 0.78 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 550, subFreq: 0, noiseAmount: 0.09 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 880, subFreq: 0, noiseAmount: 0.01 }
    ]
  };
  
  // Current configuration
  let currentConfig = "Robocop";
  let instruments = instrumentConfigs[currentConfig];

  // Default parameters with industry-standard values
  const defaultGlobalParams = {
    masterVolume: MASTER_GAIN_DEFAULT,
    instrumentParams: {},
    // Effects with professional defaults
    reverb: { 
      enabled: false, 
      mix: 0.25, // 25% typical for drums
      preset: 'room' // room, hall, plate
    },
    delay: { 
      enabled: false, 
      time: 250, // ms
      feedback: 0.3, // 30% safe from self-oscillation
      mix: 0.2,
      pingPong: false
    },
    filter: { 
      enabled: false, 
      frequency: 20000, // Hz
      type: 'lowpass',
      resonance: 1 // Q factor
    },
    compression: { 
      enabled: false, 
      threshold: -20, // dB
      ratio: 4, // 4:1 moderate compression
      attack: 0.003,
      release: 0.25
    },
    distortion: {
      enabled: false,
      amount: 0.1, // 10% drive
      tone: 0.5
    },
    chorus: {
      enabled: false,
      rate: 1.5, // Hz
      depth: 0.3,
      mix: 0.3
    },
    bitcrusher: {
      enabled: false,
      bits: 8,
      downsample: 1
    },
    stereoWidth: {
      enabled: false,
      width: 1.0 // 0 = mono, 1 = normal, 2 = extra wide
    },
    swing: 0,
    humanize: 0
  };

  // Global parameters (deep clone of defaults)
  let globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));

  // Initialize instrument parameters with defaults
  function initializeInstrumentParams() {
    instruments.forEach(inst => {
      globalParams.instrumentParams[inst.id] = {
        volume: 0.7,
        pitch: 0, // semitones (-12 to +12 standard)
        decay: 1.0,
        pan: 0 // -1 to +1
      };
    });
  }

  initializeInstrumentParams();

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
    pattern[inst.id] = new Array(32).fill(0);
    isMuted[inst.id] = false;
  });

  // Utility: Convert dB to linear gain
  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  // Utility: Convert linear gain to dB
  function gainToDb(gain) {
    return 20 * Math.log10(Math.max(0.0001, gain));
  }

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
            flex-wrap: wrap;
            gap: 1rem;
          }

          .dm-title {
            font-family: 'VT323', monospace;
            font-size: 2rem;
            color: #00a651;
            text-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
          }

          .dm-header-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
          }

          .dm-master-volume {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 0.5rem;
            border: 1px solid #00a651;
          }

          .dm-master-label {
            color: #00a651;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
          }

          .dm-master-slider {
            width: 100px;
            height: 4px;
            background: #333;
            outline: none;
            border-radius: 2px;
            cursor: pointer;
            -webkit-appearance: none;
          }

          .dm-master-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #00a651;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
          }

          .dm-master-value {
            color: #00a651;
            font-size: 0.75rem;
            min-width: 40px;
            text-align: right;
          }

          .dm-kit-selector {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .dm-bar-selector {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .dm-kit-label, .dm-bar-label {
            color: #999;
            font-size: 0.875rem;
            text-transform: uppercase;
          }

          .dm-kit-select, .dm-bar-select {
            background: #2a2a2a;
            border: 1px solid #00a651;
            color: #00a651;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-family: 'Space Mono', monospace;
            transition: all 0.2s;
          }

          .dm-kit-select:hover, .dm-bar-select:hover {
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
            flex-wrap: wrap;
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

          .dm-btn.reset {
            background: #ff6b00;
            border-color: #ff6b00;
            color: #1a1a1a;
          }

          .dm-btn.reset:hover {
            background: #ff8533;
            border-color: #ff8533;
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
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

          .dm-preset-section-title {
            width: 100%;
            text-align: center;
            color: #666;
            font-size: 0.75rem;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
            letter-spacing: 2px;
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
            overflow-x: auto;
          }

          .dm-pattern-grid {
            display: grid;
            gap: 0.5rem;
            min-width: max-content;
          }

          .dm-track {
            display: grid;
            grid-template-columns: 140px repeat(var(--step-count, 16), 1fr);
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
            position: sticky;
            left: 0;
            z-index: 10;
            min-width: 130px;
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
            z-index: 11;
            position: relative;
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
            min-width: 30px;
            min-height: 30px;
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
            grid-template-columns: 140px repeat(var(--step-count, 16), 1fr);
            gap: 0.25rem;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #333;
            min-width: max-content;
          }

          .dm-step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 0.75rem;
            height: 20px;
            min-width: 30px;
          }

          .dm-step-number.beat-1 {
            color: #00a651;
            font-weight: bold;
          }

          /* 8-bar mode adjustments */
          .dm-wrapper.bars-8 .dm-step {
            min-width: 20px;
            min-height: 20px;
          }

          .dm-wrapper.bars-8 .dm-step-number {
            min-width: 20px;
            font-size: 0.625rem;
          }

          /* Mixer/Effects Toggle */
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

          /* Mixer Panel */
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
            writing-mode: bt-lr;
            -webkit-appearance: slider-vertical;
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
            transition: transform 0.1s;
          }

          .dm-knob-value {
            color: #00a651;
            font-size: 0.625rem;
            margin-top: 0.25rem;
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
            min-width: 50px;
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

          .dm-effect-preset-selector,
          .dm-filter-mode-selector {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }

          .dm-effect-preset-btn,
          .dm-filter-mode-btn {
            flex: 1;
            padding: 0.25rem;
            background: #2a2a2a;
            border: 1px solid #444;
            color: #666;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 0.625rem;
            transition: all 0.2s;
            text-transform: uppercase;
          }

          .dm-effect-preset-btn.active,
          .dm-filter-mode-btn.active {
            background: #00a651;
            color: #1a1a1a;
            border-color: #00a651;
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
              min-width: 80px;
            }

            .dm-step {
              border-radius: 2px;
            }
          }
        </style>

        <!-- Header -->
        <div class="dm-header">
          <h2 class="dm-title">DRUM MACHINE PRO</h2>
          <div class="dm-header-controls">
            <div class="dm-master-volume">
              <span class="dm-master-label">MASTER</span>
              <input type="range" class="dm-master-slider" id="dmMasterSlider" 
                     min="0" max="100" value="${Math.round(globalParams.masterVolume * 100)}">
              <span class="dm-master-value" id="dmMasterValue">${Math.round(globalParams.masterVolume * 100)}%</span>
            </div>
            <div class="dm-kit-selector">
              <span class="dm-kit-label">Sound Kit:</span>
              <select class="dm-kit-select" id="dmKitSelect">
                ${Object.keys(instrumentConfigs).map(kit => 
                  `<option value="${kit}">${kit.toUpperCase()}</option>`
                ).join('')}
              </select>
            </div>
            <div class="dm-bar-selector">
              <span class="dm-bar-label">Pattern:</span>
              <select class="dm-bar-select" id="dmBarSelect">
                <option value="4">4 BARS</option>
                <option value="8">8 BARS</option>
              </select>
            </div>
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
          <button class="dm-btn reset" id="dmResetBtn">
            <span class="dm-btn-icon">↺</span>
            <span>RESET</span>
          </button>
          
          <div class="dm-tempo-control">
            <input type="range" class="dm-tempo-slider" id="dmTempoSlider" min="60" max="200" value="120">
            <div class="dm-tempo-display" id="dmTempoDisplay">120 BPM</div>
          </div>

          <button class="dm-btn" id="dmDownloadBtn">
            <span class="dm-btn-icon">💾</span>
            <span>EXPORT</span>
          </button>
        </div>

        <!-- Preset Buttons -->
        <div class="dm-presets">
          <div class="dm-preset-section-title">PATTERNS</div>
          <button class="dm-preset-btn" data-preset="Traffic jam groove">Traffic jam groove</button>
          <button class="dm-preset-btn" data-preset="Robofunk">Robofunk</button>
          <button class="dm-preset-btn" data-preset="Power pose">Power pose</button>
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
                  <span class="dm-effect-param-value" id="dmReverbMixVal">25%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmReverbMix" min="0" max="100" value="25">
                <div class="dm-effect-preset-selector">
                  <button class="dm-effect-preset-btn active" data-preset="room">ROOM</button>
                  <button class="dm-effect-preset-btn" data-preset="hall">HALL</button>
                  <button class="dm-effect-preset-btn" data-preset="plate">PLATE</button>
                </div>
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
                <input type="range" class="dm-effect-slider" id="dmDelayTime" min="10" max="1000" value="250" step="1">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Feedback</span>
                  <span class="dm-effect-param-value" id="dmDelayFeedbackVal">30%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDelayFeedback" min="0" max="85" value="30">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Mix</span>
                  <span class="dm-effect-param-value" id="dmDelayMixVal">20%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDelayMixSlider" min="0" max="100" value="20">
                <div class="dm-effect-preset-selector">
                  <button class="dm-effect-preset-btn active" data-mode="normal">NORMAL</button>
                  <button class="dm-effect-preset-btn" data-mode="pingpong">PING-PONG</button>
                </div>
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
                  <span class="dm-effect-param-value" id="dmFilterCutoffVal">20.0kHz</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmFilterCutoff" min="20" max="20000" value="20000" step="1">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Resonance</span>
                  <span class="dm-effect-param-value" id="dmFilterResonanceVal">1.0</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmFilterResonance" min="1" max="30" value="1">
                <div class="dm-filter-mode-selector">
                  <button class="dm-filter-mode-btn active" data-mode="lowpass">LOW-PASS</button>
                  <button class="dm-filter-mode-btn" data-mode="highpass">HIGH-PASS</button>
                </div>
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
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Ratio</span>
                  <span class="dm-effect-param-value" id="dmCompRatioVal">4:1</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmCompRatio" min="1" max="20" value="4">
              </div>
            </div>

            <!-- Distortion -->
            <div class="dm-effect-unit" id="dmDistUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">DISTORTION</span>
                <div class="dm-effect-toggle" id="dmDistToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Drive</span>
                  <span class="dm-effect-param-value" id="dmDistDriveVal">10%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDistDrive" min="0" max="100" value="10">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Tone</span>
                  <span class="dm-effect-param-value" id="dmDistToneVal">50%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmDistTone" min="0" max="100" value="50">
              </div>
            </div>

            <!-- Chorus -->
            <div class="dm-effect-unit" id="dmChorusUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">CHORUS</span>
                <div class="dm-effect-toggle" id="dmChorusToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Rate</span>
                  <span class="dm-effect-param-value" id="dmChorusRateVal">1.5Hz</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmChorusRate" min="0.1" max="10" value="1.5" step="0.1">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Depth</span>
                  <span class="dm-effect-param-value" id="dmChorusDepthVal">30%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmChorusDepth" min="0" max="100" value="30">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Mix</span>
                  <span class="dm-effect-param-value" id="dmChorusMixVal">30%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmChorusMix" min="0" max="100" value="30">
              </div>
            </div>

            <!-- Bitcrusher -->
            <div class="dm-effect-unit" id="dmBitcrusherUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">BITCRUSHER</span>
                <div class="dm-effect-toggle" id="dmBitcrusherToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Bits</span>
                  <span class="dm-effect-param-value" id="dmBitcrusherBitsVal">8</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmBitcrusherBits" min="1" max="16" value="8">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Downsample</span>
                  <span class="dm-effect-param-value" id="dmBitcrusherDownsampleVal">1x</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmBitcrusherDownsample" min="1" max="10" value="1">
              </div>
            </div>

            <!-- Stereo Width -->
            <div class="dm-effect-unit" id="dmStereoWidthUnit">
              <div class="dm-effect-header">
                <span class="dm-effect-title">STEREO WIDTH</span>
                <div class="dm-effect-toggle" id="dmStereoWidthToggle"></div>
              </div>
              <div class="dm-effect-controls">
                <div class="dm-effect-param">
                  <span class="dm-effect-param-label">Width</span>
                  <span class="dm-effect-param-value" id="dmStereoWidthVal">100%</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmStereoWidth" min="0" max="200" value="100">
              </div>
            </div>
          </div>
        </div>

        <!-- Pattern Grid -->
        <div class="dm-pattern-container">
          <!-- Step Numbers -->
          <div class="dm-step-indicator" id="dmStepIndicator">
            <!-- Will be generated dynamically -->
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
    loadPreset('Traffic jam groove');
  }

  // Create pattern grid
  function createPatternGrid() {
    const grid = document.getElementById('dmPatternGrid');
    const stepIndicator = document.getElementById('dmStepIndicator');
    if (!grid || !stepIndicator) return;

    // Update CSS variable for step count
    document.documentElement.style.setProperty('--step-count', STEPS);

    // Clear existing content
    grid.innerHTML = '';
    stepIndicator.innerHTML = '<div></div>';

    // Create step numbers
    for (let i = 0; i < STEPS; i++) {
      const stepNum = document.createElement('div');
      stepNum.className = `dm-step-number ${i % 4 === 0 ? 'beat-1' : ''}`;
      stepNum.textContent = i + 1;
      stepIndicator.appendChild(stepNum);
    }

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
        step.className = `dm-step`;
        step.dataset.instrument = inst.id;
        step.dataset.step = i;
        step.addEventListener('click', toggleStep);
        track.appendChild(step);
      }

      grid.appendChild(track);
    });

    // Update pattern display
    updatePattern();
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
      
      const params = globalParams.instrumentParams[inst.id];
      const panValue = Math.round(params.pan * 50);
      const pitchValue = Math.round(params.pitch);
      
      channel.innerHTML = `
        <div class="dm-mixer-track-name">${inst.icon} ${inst.label}</div>
        <input type="range" class="dm-mixer-fader" 
               orient="vertical"
               min="0" max="100" value="${Math.round(params.volume * 100)}"
               data-instrument="${inst.id}"
               data-param="volume">
        <div class="dm-mixer-value">${Math.round(params.volume * 100)}%</div>
        
        <div class="dm-mixer-knobs">
          <div class="dm-knob">
            <div class="dm-knob-label">PAN</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pan">
              <div class="dm-knob-indicator"></div>
            </div>
            <div class="dm-knob-value">${panValue === 0 ? 'C' : panValue > 0 ? panValue + 'R' : Math.abs(panValue) + 'L'}</div>
          </div>
          <div class="dm-knob">
            <div class="dm-knob-label">PITCH</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pitch">
              <div class="dm-knob-indicator"></div>
            </div>
            <div class="dm-knob-value">${pitchValue > 0 ? '+' : ''}${pitchValue}</div>
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
        const value = parseInt(e.target.value);
        globalParams.instrumentParams[inst].volume = value / 100;
        e.target.parentElement.querySelector('.dm-mixer-value').textContent = `${value}%`;
      });
    });

    // Setup knob controls
    setupKnobControls();
  }

  // Setup knob controls with industry-standard limits
  function setupKnobControls() {
    document.querySelectorAll('.dm-knob-control').forEach(knob => {
      let isDragging = false;
      let startY = 0;
      let startValue = 0;
      const sensitivity = 0.5;

      const updateKnob = (value) => {
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        const indicator = knob.querySelector('.dm-knob-indicator');
        const valueDisplay = knob.parentElement.querySelector('.dm-knob-value');
        
        if (param === 'pan') {
          // Industry standard: -1 to +1 (displayed as L50 to R50)
          const panValue = Math.max(-50, Math.min(50, Math.round((value - 50) * 50 / 50)));
          const rotation = panValue * 2.7;
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pan = panValue / 50;
          valueDisplay.textContent = panValue === 0 ? 'C' : panValue > 0 ? panValue + 'R' : Math.abs(panValue) + 'L';
        } else if (param === 'pitch') {
          // Industry standard: -12 to +12 semitones (one octave each way)
          const pitchValue = Math.max(-12, Math.min(12, Math.round((value - 50) * 12 / 50)));
          const rotation = pitchValue * 11.25;
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pitch = pitchValue;
          valueDisplay.textContent = pitchValue > 0 ? '+' + pitchValue : pitchValue.toString();
        }
      };

      // Initialize knob positions
      const inst = knob.dataset.instrument;
      const param = knob.dataset.param;
      if (param === 'pan') {
        updateKnob(50 + globalParams.instrumentParams[inst].pan * 50);
      } else if (param === 'pitch') {
        updateKnob(50 + globalParams.instrumentParams[inst].pitch * 50 / 12);
      }

      knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        
        if (param === 'pan') {
          startValue = 50 + globalParams.instrumentParams[inst].pan * 50;
        } else if (param === 'pitch') {
          startValue = 50 + globalParams.instrumentParams[inst].pitch * 50 / 12;
        }
        
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = (startY - e.clientY) * sensitivity;
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
  }

  // Update pattern display
  function updatePattern() {
    instruments.forEach(inst => {
      for (let step = 0; step < STEPS; step++) {
        const element = document.querySelector(`[data-instrument="${inst.id}"][data-step="${step}"]`);
        if (element) {
          if (pattern[inst.id][step]) {
            element.classList.add('active');
          } else {
            element.classList.remove('active');
          }
        }
      }
    });
  }

  // Initialize audio context and effects with proper gain staging
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain with industry-standard default
      masterGain = audioContext.createGain();
      masterGain.gain.value = globalParams.masterVolume;
      
      // Create limiter to prevent clipping
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.01;
      
      // Create effects nodes with proper gain staging
      effectsChain = {
        reverb: createReverb(),
        delay: createDelay(),
        filter: createFilter(),
        compressor: createCompressor(),
        distortion: createDistortion(),
        chorus: createChorus(),
        bitcrusher: createBitcrusher(),
        stereoWidth: createStereoWidth(),
        limiter: limiter
      };
      
      // Final output chain
      masterGain.connect(limiter);
      limiter.connect(audioContext.destination);
    }
  }

  // Create reverb with presets
  function createReverb() {
    const convolver = audioContext.createConvolver();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Store preset buffers
    const presets = {};
    
    // Create room impulse
    const roomLength = audioContext.sampleRate * 0.5;
    const roomImpulse = audioContext.createBuffer(2, roomLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = roomImpulse.getChannelData(channel);
      for (let i = 0; i < roomLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / roomLength, 1.5);
      }
    }
    presets.room = roomImpulse;
    
    // Create hall impulse
    const hallLength = audioContext.sampleRate * 2;
    const hallImpulse = audioContext.createBuffer(2, hallLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = hallImpulse.getChannelData(channel);
      for (let i = 0; i < hallLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hallLength, 2);
      }
    }
    presets.hall = hallImpulse;
    
    // Create plate impulse
    const plateLength = audioContext.sampleRate * 1;
    const plateImpulse = audioContext.createBuffer(2, plateLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = plateImpulse.getChannelData(channel);
      for (let i = 0; i < plateLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / plateLength, 0.8);
      }
    }
    presets.plate = plateImpulse;
    
    // Set default preset
    convolver.buffer = presets[globalParams.reverb.preset];
    wetGain.gain.value = 0;
    dryGain.gain.value = 1;
    
    return { convolver, wetGain, dryGain, presets };
  }

  // Create delay with ping-pong option
  function createDelay() {
    const delay = audioContext.createDelay(2);
    const feedback = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
    // Ping-pong delay nodes
    const delayL = audioContext.createDelay(2);
    const delayR = audioContext.createDelay(2);
    const feedbackL = audioContext.createGain();
    const feedbackR = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    const splitter = audioContext.createChannelSplitter(2);
    
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    wetGain.gain.value = 0;
    
    delayL.delayTime.value = 0.25;
    delayR.delayTime.value = 0.25;
    feedbackL.gain.value = 0.3;
    feedbackR.gain.value = 0.3;
    
    // Normal delay routing
    delay.connect(feedback);
    feedback.connect(delay);
    
    // Ping-pong routing
    splitter.connect(delayL, 0);
    splitter.connect(delayR, 1);
    delayL.connect(feedbackL);
    delayR.connect(feedbackR);
    feedbackL.connect(merger, 0, 1); // Cross-feed
    feedbackR.connect(merger, 0, 0); // Cross-feed
    merger.connect(splitter);
    
    return { 
      delay, feedback, wetGain,
      delayL, delayR, feedbackL, feedbackR,
      merger, splitter
    };
  }

  // Create filter with resonance
  function createFilter() {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 1;
    return filter;
  }

  // Create compressor with professional settings
  function createCompressor() {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  // Create distortion/saturation
  function createDistortion() {
    const waveshaper = audioContext.createWaveShaper();
    const inputGain = audioContext.createGain();
    const outputGain = audioContext.createGain();
    const toneFilter = audioContext.createBiquadFilter();
    
    inputGain.gain.value = 1;
    outputGain.gain.value = 1;
    toneFilter.type = 'highshelf';
    toneFilter.frequency.value = 3000;
    toneFilter.gain.value = 0;
    
    // Create distortion curve
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + 10) * x * 20 * deg) / (Math.PI + 10 * Math.abs(x));
    }
    
    waveshaper.curve = curve;
    waveshaper.oversample = '4x';
    
    return { waveshaper, inputGain, outputGain, toneFilter };
  }

  // Create chorus effect
  function createChorus() {
    const delay = audioContext.createDelay(0.1);
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
    lfo.type = 'sine';
    lfo.frequency.value = 1.5;
    lfoGain.gain.value = 0.002;
    wetGain.gain.value = 0;
    
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    
    delay.delayTime.value = 0.02;
    
    lfo.start();
    
    return { delay, lfo, lfoGain, wetGain };
  }

  // Create bitcrusher effect
  function createBitcrusher() {
    const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
    let bits = 8;
    let downsample = 1;
    let sampleCount = 0;
    let lastSample = 0;
    
    scriptNode.onaudioprocess = function(e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      
      for (let i = 0; i < input.length; i++) {
        sampleCount++;
        if (sampleCount >= downsample) {
          const step = Math.pow(0.5, bits);
          lastSample = step * Math.floor(input[i] / step + 0.5);
          sampleCount = 0;
        }
        output[i] = lastSample;
      }
    };
    
    return { 
      scriptNode,
      setBits: (b) => { bits = b; },
      setDownsample: (d) => { downsample = d; }
    };
  }

  // Create stereo width control
  function createStereoWidth() {
    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    const midGain = audioContext.createGain();
    const sideGain = audioContext.createGain();
    
    midGain.gain.value = 1;
    sideGain.gain.value = 1;
    
    return { splitter, merger, midGain, sideGain };
  }

  // Play sound with proper gain staging and effects
  function playSound(instId) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    // Check mute/solo
    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;

    const params = globalParams.instrumentParams[instId];
    const now = audioContext.currentTime;

    // Create base sound nodes with gain staging
    const osc = audioContext.createOscillator();
    const oscGain = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    // Apply gain staging (-18dBFS reference level)
    const referenceGain = dbToGain(REFERENCE_LEVEL);
    
    // Set panning
    panner.pan.value = params.pan;
    
    // Calculate pitch adjustment (limited to ±12 semitones)
    const pitchMultiplier = Math.pow(2, Math.max(-12, Math.min(12, params.pitch)) / 12);
    
    // Create signal chain with proper gain staging
    osc.connect(oscGain);
    oscGain.connect(panner);
    
    // Create effect buses
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const postEffectGain = audioContext.createGain();
    
    panner.connect(dryGain);
    panner.connect(wetGain);
    
    // Apply effects chain with auto-gain compensation
    let currentNode = wetGain;
    let compensationGain = 1;
    
    // Bitcrusher
    if (globalParams.bitcrusher.enabled && effectsChain.bitcrusher) {
      currentNode.connect(effectsChain.bitcrusher.scriptNode);
      currentNode = effectsChain.bitcrusher.scriptNode;
      effectsChain.bitcrusher.setBits(globalParams.bitcrusher.bits);
      effectsChain.bitcrusher.setDownsample(globalParams.bitcrusher.downsample);
    }
    
    // Distortion
    if (globalParams.distortion.enabled && effectsChain.distortion) {
      effectsChain.distortion.inputGain.gain.value = 1 + globalParams.distortion.amount;
      effectsChain.distortion.outputGain.gain.value = 1 / (1 + globalParams.distortion.amount * 0.5);
      effectsChain.distortion.toneFilter.gain.value = globalParams.distortion.tone * 12 - 6;
      
      currentNode.connect(effectsChain.distortion.inputGain);
      effectsChain.distortion.inputGain.connect(effectsChain.distortion.waveshaper);
      effectsChain.distortion.waveshaper.connect(effectsChain.distortion.toneFilter);
      effectsChain.distortion.toneFilter.connect(effectsChain.distortion.outputGain);
      currentNode = effectsChain.distortion.outputGain;
      
      compensationGain *= 0.8; // Compensate for distortion loudness
    }
    
    // Filter
    if (globalParams.filter.enabled && effectsChain.filter) {
      effectsChain.filter.frequency.value = globalParams.filter.frequency;
      effectsChain.filter.Q.value = globalParams.filter.resonance;
      effectsChain.filter.type = globalParams.filter.type;
      currentNode.connect(effectsChain.filter);
      currentNode = effectsChain.filter;
      
      // Compensate for filter resonance boost
      if (globalParams.filter.resonance > 5) {
        compensationGain *= 1 / (1 + (globalParams.filter.resonance - 5) * 0.05);
      }
    }
    
    // Compression
    if (globalParams.compression.enabled && effectsChain.compressor) {
      effectsChain.compressor.threshold.value = globalParams.compression.threshold;
      effectsChain.compressor.ratio.value = globalParams.compression.ratio;
      currentNode.connect(effectsChain.compressor);
      currentNode = effectsChain.compressor;
      
      // Makeup gain for compression
      const reductionDb = Math.abs(globalParams.compression.threshold) / globalParams.compression.ratio;
      compensationGain *= dbToGain(reductionDb * 0.5);
    }
    
    // Set wet/dry mix
    dryGain.gain.value = 1;
    wetGain.gain.value = 1;
    
    currentNode.connect(postEffectGain);
    dryGain.connect(postEffectGain);
    
    // Apply auto-gain compensation
    postEffectGain.gain.value = compensationGain;
    
    // Create send effects bus
    const sendBus = audioContext.createGain();
    postEffectGain.connect(sendBus);
    
    // Reverb send
    if (globalParams.reverb.enabled && effectsChain.reverb) {
      const reverbSend = audioContext.createGain();
      reverbSend.gain.value = globalParams.reverb.mix;
      
      // Update reverb preset if needed
      if (effectsChain.reverb.currentPreset !== globalParams.reverb.preset) {
        effectsChain.reverb.convolver.buffer = effectsChain.reverb.presets[globalParams.reverb.preset];
        effectsChain.reverb.currentPreset = globalParams.reverb.preset;
      }
      
      sendBus.connect(reverbSend);
      reverbSend.connect(effectsChain.reverb.convolver);
      effectsChain.reverb.convolver.connect(masterGain);
    }
    
    // Delay send
    if (globalParams.delay.enabled && effectsChain.delay) {
      const delaySend = audioContext.createGain();
      delaySend.gain.value = globalParams.delay.mix;
      
      if (globalParams.delay.pingPong) {
        // Use ping-pong delay
        sendBus.connect(delaySend);
        delaySend.connect(effectsChain.delay.splitter);
        effectsChain.delay.delayL.delayTime.value = globalParams.delay.time / 1000;
        effectsChain.delay.delayR.delayTime.value = globalParams.delay.time / 1000;
        effectsChain.delay.feedbackL.gain.value = globalParams.delay.feedback;
        effectsChain.delay.feedbackR.gain.value = globalParams.delay.feedback;
        effectsChain.delay.merger.connect(masterGain);
      } else {
        // Use normal delay
        sendBus.connect(delaySend);
        delaySend.connect(effectsChain.delay.delay);
        effectsChain.delay.delay.delayTime.value = globalParams.delay.time / 1000;
        effectsChain.delay.feedback.gain.value = globalParams.delay.feedback;
        effectsChain.delay.delay.connect(masterGain);
      }
    }
    
    // Chorus send
    if (globalParams.chorus.enabled && effectsChain.chorus) {
      const chorusSend = audioContext.createGain();
      chorusSend.gain.value = globalParams.chorus.mix;
      
      effectsChain.chorus.lfo.frequency.value = globalParams.chorus.rate;
      effectsChain.chorus.lfoGain.gain.value = globalParams.chorus.depth * 0.01;
      
      sendBus.connect(chorusSend);
      chorusSend.connect(effectsChain.chorus.delay);
      effectsChain.chorus.delay.connect(masterGain);
    }
    
    // Stereo width
    if (globalParams.stereoWidth.enabled && effectsChain.stereoWidth) {
      const width = globalParams.stereoWidth.width;
      // M/S processing for width control
      effectsChain.stereoWidth.midGain.gain.value = 2 - width;
      effectsChain.stereoWidth.sideGain.gain.value = width;
    }
    
    // Connect to master
    postEffectGain.connect(masterGain);
    
    // Generate sound based on instrument type with proper levels
    const baseVolume = params.volume * referenceGain;
    
    switch(instId) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscGain.gain.setValueAtTime(baseVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'snare':
        // Tone component
        osc.frequency.setValueAtTime(inst.frequency * pitchMultiplier, now);
        oscGain.gain.setValueAtTime(baseVolume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // Noise component
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = audioContext.createGain();
        const noisePanner = audioContext.createStereoPanner();
        noisePanner.pan.value = params.pan;
        
        noise.connect(noiseGain);
        noiseGain.connect(noisePanner);
        noisePanner.connect(wetGain);
        noisePanner.connect(dryGain);
        
        noiseGain.gain.setValueAtTime(baseVolume * inst.noiseAmount, now);
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
        
        // Create high-pass filter for metallic sound
        const hihatFilter = audioContext.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 5000;
        hihatFilter.Q.value = 1;
        
        panner.disconnect();
        panner.connect(hihatFilter);
        hihatFilter.connect(dryGain);
        hihatFilter.connect(wetGain);
        
        const duration = instId === 'openhat' ? 0.3 : 0.05;
        oscGain.gain.setValueAtTime(baseVolume * 0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        osc.start(now);
        osc.stop(now + duration);
        break;

      case 'clap':
        // Multiple short bursts for clap sound
        for (let i = 0; i < 3; i++) {
          const clapOsc = audioContext.createOscillator();
          const clapGain = audioContext.createGain();
          const clapPanner = audioContext.createStereoPanner();
          
          clapOsc.frequency.value = inst.frequency * pitchMultiplier;
          clapPanner.pan.value = params.pan;
          
          clapOsc.connect(clapGain);
          clapGain.connect(clapPanner);
          clapPanner.connect(dryGain);
          clapPanner.connect(wetGain);
          
          const startTime = now + i * 0.01;
          clapGain.gain.setValueAtTime(baseVolume * 0.3, startTime);
          clapGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.02);
          
          clapOsc.start(startTime);
          clapOsc.stop(startTime + 0.02);
        }
        
        osc.frequency.value = inst.frequency * pitchMultiplier;
        oscGain.gain.setValueAtTime(0, now);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'crash':
        // White noise through bandpass filter
        const crashBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 1.5, audioContext.sampleRate);
        const crashData = crashBuffer.getChannelData(0);
        for (let i = 0; i < crashBuffer.length; i++) {
          crashData[i] = Math.random() * 2 - 1;
        }
        
        const crashNoise = audioContext.createBufferSource();
        crashNoise.buffer = crashBuffer;
        const crashGain = audioContext.createGain();
        const crashFilter = audioContext.createBiquadFilter();
        const crashPanner = audioContext.createStereoPanner();
        
        crashFilter.type = 'bandpass';
        crashFilter.frequency.value = inst.frequency * pitchMultiplier;
        crashFilter.Q.value = 0.5;
        crashPanner.pan.value = params.pan;
        
        crashNoise.connect(crashGain);
        crashGain.connect(crashFilter);
        crashFilter.connect(crashPanner);
        crashPanner.connect(dryGain);
        crashPanner.connect(wetGain);
        
        crashGain.gain.setValueAtTime(baseVolume * 0.7, now);
        crashGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        
        crashNoise.start(now);
        crashNoise.stop(now + 1.5);
        
        // Don't play oscillator for crash
        oscGain.gain.value = 0;
        osc.start(now);
        osc.stop(now + 0.01);
        break;

      case 'rim':
        osc.type = 'sine';
        osc.frequency.value = inst.frequency * pitchMultiplier;
        
        // Add click transient
        const clickOsc = audioContext.createOscillator();
        const clickGain = audioContext.createGain();
        const clickPanner = audioContext.createStereoPanner();
        
        clickOsc.frequency.value = 2000;
        clickPanner.pan.value = params.pan;
        
        clickOsc.connect(clickGain);
        clickGain.connect(clickPanner);
        clickPanner.connect(dryGain);
        clickPanner.connect(wetGain);
        
        clickGain.gain.setValueAtTime(baseVolume * 0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
        
        oscGain.gain.setValueAtTime(baseVolume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
        clickOsc.start(now);
        clickOsc.stop(now + 0.01);
        break;

      case 'cowbell':
        // Two oscillators for metallic sound
        const cowbellOsc2 = audioContext.createOscillator();
        const cowbellGain2 = audioContext.createGain();
        
        osc.frequency.value = inst.frequency * pitchMultiplier;
        cowbellOsc2.frequency.value = inst.frequency * 1.48 * pitchMultiplier;
        
        cowbellOsc2.connect(cowbellGain2);
        cowbellGain2.connect(panner);
        
        oscGain.gain.setValueAtTime(baseVolume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        cowbellGain2.gain.setValueAtTime(baseVolume * 0.3, now);
        cowbellGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        cowbellOsc2.start(now);
        cowbellOsc2.stop(now + 0.2);
        break;

      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        oscGain.gain.setValueAtTime(baseVolume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
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
      for (let i = 0; i < 32; i++) {
        pattern[inst.id][i] = 0;
      }
    });
    updatePattern();
  }

  // Reset to default settings
  function resetToDefaults() {
    if (confirm('Reset all settings to defaults? This will not clear your pattern.')) {
      // Deep clone default parameters
      globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));
      
      // Re-initialize instrument parameters
      initializeInstrumentParams();
      
      // Update UI to reflect defaults
      updateAllControls();
      
      // If playing, restart to apply changes
      if (isPlaying) {
        pause();
        play();
      }
    }
  }

  // Update all UI controls to match current parameters
  function updateAllControls() {
    // Master volume
    const masterSlider = document.getElementById('dmMasterSlider');
    const masterValue = document.getElementById('dmMasterValue');
    if (masterSlider && masterValue) {
      masterSlider.value = Math.round(globalParams.masterVolume * 100);
      masterValue.textContent = `${Math.round(globalParams.masterVolume * 100)}%`;
      if (masterGain) {
        masterGain.gain.value = globalParams.masterVolume;
      }
    }
    
    // Effects toggles and values
    updateEffectUI('Reverb', globalParams.reverb);
    updateEffectUI('Delay', globalParams.delay);
    updateEffectUI('Filter', globalParams.filter);
    updateEffectUI('Comp', globalParams.compression);
    updateEffectUI('Dist', globalParams.distortion);
    updateEffectUI('Chorus', globalParams.chorus);
    updateEffectUI('Bitcrusher', globalParams.bitcrusher);
    updateEffectUI('StereoWidth', globalParams.stereoWidth);
    
    // Recreate mixer channels to update values
    createMixerChannels();
  }

  // Update effect UI
  function updateEffectUI(effectName, params) {
    const toggle = document.getElementById(`dm${effectName}Toggle`);
    const unit = document.getElementById(`dm${effectName}Unit`);
    
    if (toggle && unit) {
      if (params.enabled) {
        toggle.classList.add('active');
        unit.classList.add('active');
      } else {
        toggle.classList.remove('active');
        unit.classList.remove('active');
      }
    }
    
    // Update specific effect parameters
    switch(effectName) {
      case 'Reverb':
        const reverbMix = document.getElementById('dmReverbMix');
        const reverbMixVal = document.getElementById('dmReverbMixVal');
        if (reverbMix && reverbMixVal) {
          reverbMix.value = Math.round(params.mix * 100);
          reverbMixVal.textContent = `${Math.round(params.mix * 100)}%`;
        }
        break;
      // Add other effects as needed
    }
  }

  function loadPreset(presetName) {
    if (presets[presetName]) {
      currentPreset = presetName;
      
      // Load pattern data
      instruments.forEach(inst => {
        const presetData = presets[presetName][inst.id];
        if (presetData) {
          // Fill pattern based on current bar mode
          for (let i = 0; i < 32; i++) {
            if (i < 16) {
              pattern[inst.id][i] = presetData[i] || 0;
            } else {
              // Auto-fill bars 5-8 by duplicating bars 1-4
              pattern[inst.id][i] = presetData[i - 16] || 0;
            }
          }
        }
      });
      
      // Set BPM
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
        tempPattern[inst.id] = pattern[inst.id] || new Array(32).fill(0);
        
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

  function changeBarMode(bars) {
    const newSteps = bars * 4;
    
    // If switching from 4-bar to 8-bar, duplicate the pattern
    if (currentBarMode === 4 && bars === 8) {
      instruments.forEach(inst => {
        for (let i = 16; i < 32; i++) {
          pattern[inst.id][i] = pattern[inst.id][i - 16];
        }
      });
    }
    
    currentBarMode = bars;
    STEPS = newSteps;
    
    // Update UI class
    const wrapper = document.querySelector('.dm-wrapper');
    if (bars === 8) {
      wrapper.classList.add('bars-8');
    } else {
      wrapper.classList.remove('bars-8');
    }
    
    // Recreate grid
    createPatternGrid();
    
    // Reset step if out of bounds
    if (currentStep >= STEPS) {
      currentStep = 0;
    }
  }

  // High-quality WAV export with proper gain staging
  async function downloadLoop() {
    initAudio();

    const downloadBtn = document.getElementById('dmDownloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.querySelector('span:last-child').textContent = 'RENDERING...';

    try {
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const stepDuration = (60 / tempo / 4);
      const loopDuration = stepDuration * STEPS;
      const sampleRate = 48000; // Professional quality
      const numberOfChannels = 2;
      const length = Math.ceil(sampleRate * loopDuration);

      const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      
      // Create master gain in offline context with proper level
      const offlineMaster = offlineContext.createGain();
      offlineMaster.gain.value = globalParams.masterVolume;
      
      // Create limiter for offline context
      const offlineLimiter = offlineContext.createDynamicsCompressor();
      offlineLimiter.threshold.value = -1;
      offlineLimiter.knee.value = 0;
      offlineLimiter.ratio.value = 20;
      offlineLimiter.attack.value = 0.001;
      offlineLimiter.release.value = 0.01;
      
      offlineMaster.connect(offlineLimiter);
      offlineLimiter.connect(offlineContext.destination);

      // Recreate effects chain in offline context
      const offlineEffects = {
        reverb: createOfflineReverb(offlineContext),
        delay: createOfflineDelay(offlineContext),
        filter: createOfflineFilter(offlineContext),
        compressor: createOfflineCompressor(offlineContext),
        distortion: createOfflineDistortion(offlineContext)
      };

      // Render each step
      for (let step = 0; step < STEPS; step++) {
        const stepTime = step * stepDuration;
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step]) {
            renderOfflineSound(offlineContext, inst, stepTime, offlineMaster, offlineEffects);
          }
        });
      }

      const renderedBuffer = await offlineContext.startRendering();
      
      // Normalize to prevent clipping while maintaining dynamics
      let maxLevel = 0;
      for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
        const channelData = renderedBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          maxLevel = Math.max(maxLevel, Math.abs(channelData[i]));
        }
      }
      
      const normalizeGain = maxLevel > 0.95 ? 0.95 / maxLevel : 1;
      
      // Apply normalization
      for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
        const channelData = renderedBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] *= normalizeGain;
        }
      }
      
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drum-machine-pro-${Date.now()}.wav`;
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

  // Helper functions for offline rendering
  function createOfflineReverb(context) {
    const convolver = context.createConvolver();
    const preset = globalParams.reverb.preset;
    let length, decay;
    
    switch(preset) {
      case 'room':
        length = context.sampleRate * 0.5;
        decay = 1.5;
        break;
      case 'hall':
        length = context.sampleRate * 2;
        decay = 2;
        break;
      case 'plate':
        length = context.sampleRate * 1;
        decay = 0.8;
        break;
      default:
        length = context.sampleRate * 0.5;
        decay = 1.5;
    }
    
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  }

  function createOfflineDelay(context) {
    const delay = context.createDelay(2);
    const feedback = context.createGain();
    const wetGain = context.createGain();
    
    delay.delayTime.value = globalParams.delay.time / 1000;
    feedback.gain.value = Math.min(0.85, globalParams.delay.feedback); // Limit feedback
    wetGain.gain.value = globalParams.delay.enabled ? globalParams.delay.mix : 0;
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback, wetGain };
  }

  function createOfflineFilter(context) {
    const filter = context.createBiquadFilter();
    filter.type = globalParams.filter.type;
    filter.frequency.value = globalParams.filter.frequency;
    filter.Q.value = globalParams.filter.resonance;
    return filter;
  }

  function createOfflineCompressor(context) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = globalParams.compression.threshold;
    compressor.ratio.value = globalParams.compression.ratio;
    compressor.attack.value = globalParams.compression.attack;
    compressor.release.value = globalParams.compression.release;
    return compressor;
  }

  function createOfflineDistortion(context) {
    const waveshaper = context.createWaveShaper();
    const inputGain = context.createGain();
    const outputGain = context.createGain();
    
    inputGain.gain.value = 1 + globalParams.distortion.amount;
    outputGain.gain.value = 1 / (1 + globalParams.distortion.amount * 0.5);
    
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + 10) * x * 20 * deg) / (Math.PI + 10 * Math.abs(x));
    }
    
    waveshaper.curve = curve;
    waveshaper.oversample = '4x';
    
    return { waveshaper, inputGain, outputGain };
  }

  function renderOfflineSound(context, inst, startTime, destination, effects) {
    const params = globalParams.instrumentParams[inst.id];
    const referenceGain = dbToGain(REFERENCE_LEVEL);
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    
    panner.pan.value = params.pan;
    
    const pitchMultiplier = Math.pow(2, Math.max(-12, Math.min(12, params.pitch)) / 12);
    
    // Build signal chain
    osc.connect(gain);
    gain.connect(panner);
    
    let currentNode = panner;
    
    // Apply effects
    if (globalParams.distortion.enabled && effects.distortion) {
      currentNode.connect(effects.distortion.inputGain);
      effects.distortion.inputGain.connect(effects.distortion.waveshaper);
      effects.distortion.waveshaper.connect(effects.distortion.outputGain);
      currentNode = effects.distortion.outputGain;
    }
    
    if (globalParams.filter.enabled && effects.filter) {
      currentNode.connect(effects.filter);
      currentNode = effects.filter;
    }
    
    if (globalParams.compression.enabled && effects.compressor) {
      currentNode.connect(effects.compressor);
      currentNode = effects.compressor;
    }
    
    // Apply reverb and delay as sends
    const dryGain = context.createGain();
    const sendGain = context.createGain();
    
    currentNode.connect(dryGain);
    currentNode.connect(sendGain);
    
    dryGain.gain.value = 1;
    sendGain.gain.value = 1;
    
    if (globalParams.reverb.enabled && effects.reverb) {
      const reverbSend = context.createGain();
      reverbSend.gain.value = globalParams.reverb.mix;
      sendGain.connect(reverbSend);
      reverbSend.connect(effects.reverb);
      effects.reverb.connect(destination);
    }
    
    if (globalParams.delay.enabled && effects.delay) {
      const delaySend = context.createGain();
      delaySend.gain.value = globalParams.delay.mix;
      sendGain.connect(delaySend);
      delaySend.connect(effects.delay.delay);
      effects.delay.delay.connect(destination);
    }
    
    dryGain.connect(destination);
    
    // Generate sound based on type
    const baseVolume = params.volume * referenceGain;
    
    switch(inst.id) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        gain.gain.setValueAtTime(baseVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
        break;
        
      // Add other instrument cases similar to playSound function
      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(baseVolume * 0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
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
    document.getElementById('dmResetBtn')?.addEventListener('click', resetToDefaults);
    document.getElementById('dmDownloadBtn')?.addEventListener('click', downloadLoop);

    // Master volume
    const masterSlider = document.getElementById('dmMasterSlider');
    const masterValue = document.getElementById('dmMasterValue');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        globalParams.masterVolume = value / 100;
        if (masterValue) masterValue.textContent = `${value}%`;
        if (masterGain) {
          masterGain.gain.value = globalParams.masterVolume;
        }
      });
    }

    // Tempo
    const tempoSlider = document.getElementById('dmTempoSlider');
    const tempoDisplay = document.getElementById('dmTempoDisplay');
    if (tempoSlider) {
      tempoSlider.addEventListener('input', (e) => {
        const tempo = parseInt(e.target.value);
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

    // Bar selector
    document.getElementById('dmBarSelect')?.addEventListener('change', (e) => {
      changeBarMode(parseInt(e.target.value));
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
    document.addEventListener('click', (e) => {
      if (e.target.matches('.dm-track-btn')) {
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
      }
    });

    // Reverb controls
    setupEffectToggle('dmReverbToggle', 'reverb');
    setupEffectSlider('dmReverbMix', 'dmReverbMixVal', (val) => {
      globalParams.reverb.mix = val / 100;
      return `${val}%`;
    });
    
    // Reverb preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        if (preset && globalParams.reverb) {
          document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          globalParams.reverb.preset = preset;
        }
      });
    });

    // Delay controls
    setupEffectToggle('dmDelayToggle', 'delay');
    setupEffectSlider('dmDelayTime', 'dmDelayTimeVal', (val) => {
      globalParams.delay.time = val;
      if (effectsChain.delay) {
        effectsChain.delay.delay.delayTime.value = val / 1000;
        effectsChain.delay.delayL.delayTime.value = val / 1000;
        effectsChain.delay.delayR.delayTime.value = val / 1000;
      }
      return `${val}ms`;
    });
    setupEffectSlider('dmDelayFeedback', 'dmDelayFeedbackVal', (val) => {
      globalParams.delay.feedback = val / 100;
      if (effectsChain.delay) {
        effectsChain.delay.feedback.gain.value = val / 100;
        effectsChain.delay.feedbackL.gain.value = val / 100;
        effectsChain.delay.feedbackR.gain.value = val / 100;
      }
      return `${val}%`;
    });
    setupEffectSlider('dmDelayMixSlider', 'dmDelayMixVal', (val) => {
      globalParams.delay.mix = val / 100;
      return `${val}%`;
    });
    
    // Delay mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        if (mode === 'normal' || mode === 'pingpong') {
          document.querySelectorAll('[data-mode="normal"], [data-mode="pingpong"]').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          globalParams.delay.pingPong = (mode === 'pingpong');
        }
      });
    });

    // Filter controls
    setupEffectToggle('dmFilterToggle', 'filter');
    setupEffectSlider('dmFilterCutoff', 'dmFilterCutoffVal', (val) => {
      globalParams.filter.frequency = val;
      if (effectsChain.filter) {
        effectsChain.filter.frequency.value = val;
      }
      if (val >= 1000) {
        return `${(val/1000).toFixed(1)}kHz`;
      } else {
        return `${val}Hz`;
      }
    });
    setupEffectSlider('dmFilterResonance', 'dmFilterResonanceVal', (val) => {
      globalParams.filter.resonance = val;
      if (effectsChain.filter) {
        effectsChain.filter.Q.value = val;
      }
      return val.toFixed(1);
    });
    
    // Filter mode selector
    document.querySelectorAll('.dm-filter-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.dm-filter-mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        globalParams.filter.type = e.target.dataset.mode;
        if (effectsChain.filter) {
          effectsChain.filter.type = e.target.dataset.mode;
        }
      });
    });

    // Compression controls
    setupEffectToggle('dmCompToggle', 'compression');
    setupEffectSlider('dmCompThreshold', 'dmCompThresholdVal', (val) => {
      globalParams.compression.threshold = val;
      if (effectsChain.compressor) {
        effectsChain.compressor.threshold.value = val;
      }
      return `${val}dB`;
    });
    setupEffectSlider('dmCompRatio', 'dmCompRatioVal', (val) => {
      globalParams.compression.ratio = val;
      if (effectsChain.compressor) {
        effectsChain.compressor.ratio.value = val;
      }
      return `${val}:1`;
    });

    // Distortion controls
    setupEffectToggle('dmDistToggle', 'distortion');
    setupEffectSlider('dmDistDrive', 'dmDistDriveVal', (val) => {
      globalParams.distortion.amount = val / 100;
      return `${val}%`;
    });
    setupEffectSlider('dmDistTone', 'dmDistToneVal', (val) => {
      globalParams.distortion.tone = val / 100;
      return `${val}%`;
    });

    // Chorus controls
    setupEffectToggle('dmChorusToggle', 'chorus');
    setupEffectSlider('dmChorusRate', 'dmChorusRateVal', (val) => {
      globalParams.chorus.rate = val;
      if (effectsChain.chorus) {
        effectsChain.chorus.lfo.frequency.value = val;
      }
      return `${val}Hz`;
    });
    setupEffectSlider('dmChorusDepth', 'dmChorusDepthVal', (val) => {
      globalParams.chorus.depth = val / 100;
      if (effectsChain.chorus) {
        effectsChain.chorus.lfoGain.gain.value = (val / 100) * 0.01;
      }
      return `${val}%`;
    });
    setupEffectSlider('dmChorusMix', 'dmChorusMixVal', (val) => {
      globalParams.chorus.mix = val / 100;
      return `${val}%`;
    });

    // Bitcrusher controls
    setupEffectToggle('dmBitcrusherToggle', 'bitcrusher');
    setupEffectSlider('dmBitcrusherBits', 'dmBitcrusherBitsVal', (val) => {
      globalParams.bitcrusher.bits = val;
      if (effectsChain.bitcrusher) {
        effectsChain.bitcrusher.setBits(val);
      }
      return val.toString();
    });
    setupEffectSlider('dmBitcrusherDownsample', 'dmBitcrusherDownsampleVal', (val) => {
      globalParams.bitcrusher.downsample = val;
      if (effectsChain.bitcrusher) {
        effectsChain.bitcrusher.setDownsample(val);
      }
      return `${val}x`;
    });

    // Stereo Width controls
    setupEffectToggle('dmStereoWidthToggle', 'stereoWidth');
    setupEffectSlider('dmStereoWidth', 'dmStereoWidthVal', (val) => {
      globalParams.stereoWidth.width = val / 100;
      return `${val}%`;
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
      let rafId = null;
      slider.addEventListener('input', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const value = parseFloat(e.target.value);
          valueDisplay.textContent = updateFunc(value);
        });
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
    loadPreset: loadPreset,
    resetToDefaults: resetToDefaults
  };
})();
