// Casa 24 Drum Machine Pro - Optimized Version with All Fixes Applied
(function() {
  // Configuration
  let STEPS = 16; // Now dynamic for 4-bar/8-bar support
  let currentBarMode = 4; // 4 or 8 bars
  
  // Enhanced instrument configuration with 10 kits total
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
    ],
    "Trap Lord": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 45, subFreq: 28, noiseAmount: 0.01 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 250, subFreq: 100, noiseAmount: 0.2 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 10000, subFreq: 0, noiseAmount: 0.6 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 9000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1800, subFreq: 0, noiseAmount: 0.12 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 12000, subFreq: 0, noiseAmount: 0.8 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 500, subFreq: 0, noiseAmount: 0.03 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 850, subFreq: 0, noiseAmount: 0 }
    ],
    "Latin Fusion": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 65, subFreq: 38, noiseAmount: 0.03 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 230, subFreq: 85, noiseAmount: 0.18 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 7500, subFreq: 0, noiseAmount: 0.35 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 6000, subFreq: 0, noiseAmount: 0.45 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2500, subFreq: 0, noiseAmount: 0.08 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 10000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 1200, subFreq: 0, noiseAmount: 0.04 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 950, subFreq: 0, noiseAmount: 0.01 }
    ],
    "Panama Heat": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 55, subFreq: 32, noiseAmount: 0.02 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 240, subFreq: 95, noiseAmount: 0.22 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 8500, subFreq: 0, noiseAmount: 0.5 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7500, subFreq: 0, noiseAmount: 0.6 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1600, subFreq: 0, noiseAmount: 0.14 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11500, subFreq: 0, noiseAmount: 0.75 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 600, subFreq: 0, noiseAmount: 0.06 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 1050, subFreq: 0, noiseAmount: 0 }
    ],
    "Digital Grime": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 40, subFreq: 25, noiseAmount: 0.08 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 260, subFreq: 110, noiseAmount: 0.3 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 12000, subFreq: 0, noiseAmount: 0.7 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 10000, subFreq: 0, noiseAmount: 0.8 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2200, subFreq: 0, noiseAmount: 0.25 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 14000, subFreq: 0, noiseAmount: 0.9 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 700, subFreq: 0, noiseAmount: 0.15 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 750, subFreq: 0, noiseAmount: 0.05 }
    ],
    "Smooth Jazz": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 70, subFreq: 45, noiseAmount: 0 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 190, subFreq: 75, noiseAmount: 0.1 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 5000, subFreq: 0, noiseAmount: 0.2 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4000, subFreq: 0, noiseAmount: 0.3 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1200, subFreq: 0, noiseAmount: 0.05 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 8000, subFreq: 0, noiseAmount: 0.4 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 350, subFreq: 0, noiseAmount: 0.02 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 680, subFreq: 0, noiseAmount: 0 }
    ],
    "Future Bass": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 48, subFreq: 30, noiseAmount: 0.04 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 270, subFreq: 120, noiseAmount: 0.28 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 11000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 9500, subFreq: 0, noiseAmount: 0.75 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2000, subFreq: 0, noiseAmount: 0.18 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 13000, subFreq: 0, noiseAmount: 0.85 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 450, subFreq: 0, noiseAmount: 0.07 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 920, subFreq: 0, noiseAmount: 0.02 }
    ],
    "Street Heat": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 52, subFreq: 33, noiseAmount: 0.015 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 235, subFreq: 88, noiseAmount: 0.24 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 9000, subFreq: 0, noiseAmount: 0.55 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 8000, subFreq: 0, noiseAmount: 0.65 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1700, subFreq: 0, noiseAmount: 0.13 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11800, subFreq: 0, noiseAmount: 0.78 },
      { id: 'rim', label: 'RIM', icon: '⭕', frequency: 550, subFreq: 0, noiseAmount: 0.09 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 880, subFreq: 0, noiseAmount: 0.01 }
    ]
  };
  
  // Current configuration
  let currentConfig = "Robocop";
  let instruments = instrumentConfigs[currentConfig];

  // Global effects parameters with accurate defaults
  let globalParams = {
    // Per-instrument parameters
    instrumentParams: {},
    // Global effects with accurate implementation
    reverb: { enabled: false, mix: 0.3 },
    delay: { enabled: false, time: 250, feedback: 0.3 },
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

  // Updated preset patterns - removed old ones and added new ones
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
    pattern[inst.id] = new Array(32).fill(0); // Max size for 8-bar
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

          .dm-filter-mode-selector {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
          }

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
          }

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
                <input type="range" class="dm-effect-slider" id="dmDelayTime" min="10" max="1000" value="250" step="1">
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
                  <span class="dm-effect-param-value" id="dmFilterCutoffVal">20.0kHz</span>
                </div>
                <input type="range" class="dm-effect-slider" id="dmFilterCutoff" min="20" max="20000" value="20000" step="1">
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

    // Setup fader listeners with reduced sensitivity
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

  // Setup knob controls with reduced sensitivity and proper limits
  function setupKnobControls() {
    document.querySelectorAll('.dm-knob-control').forEach(knob => {
      let isDragging = false;
      let startY = 0;
      let startValue = 0;
      const sensitivity = 0.5; // Reduced sensitivity

      const updateKnob = (value) => {
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        const indicator = knob.querySelector('.dm-knob-indicator');
        const valueDisplay = knob.parentElement.querySelector('.dm-knob-value');
        
        if (param === 'pan') {
          // Limit panning to -50 to +50
          const panValue = Math.max(-50, Math.min(50, Math.round((value - 50) * 50 / 50)));
          const rotation = panValue * 2.7; // Map to rotation
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pan = panValue / 50;
          valueDisplay.textContent = panValue === 0 ? 'C' : panValue > 0 ? panValue + 'R' : Math.abs(panValue) + 'L';
        } else if (param === 'pitch') {
          // Limit pitch to -48 to +48
          const pitchValue = Math.max(-48, Math.min(48, Math.round((value - 50) * 48 / 50)));
          const rotation = pitchValue * 2.8125; // Map to rotation
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
        updateKnob(50 + globalParams.instrumentParams[inst].pitch * 50 / 48);
      }

      knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        
        if (param === 'pan') {
          startValue = 50 + globalParams.instrumentParams[inst].pan * 50;
        } else if (param === 'pitch') {
          startValue = 50 + globalParams.instrumentParams[inst].pitch * 50 / 48;
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

  // Toggle step - no sound on click
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

  // Initialize audio context and effects
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.8;
      
      // Create effects nodes with proper routing
      effectsChain = {
        reverb: createReverb(),
        delay: createDelay(),
        filter: createFilter(),
        compressor: createCompressor(),
        dry: audioContext.createGain(),
        wet: audioContext.createGain()
      };
      
      // Set up routing
      effectsChain.dry.gain.value = 1;
      effectsChain.wet.gain.value = 0;
      
      effectsChain.dry.connect(masterGain);
      effectsChain.wet.connect(masterGain);
      masterGain.connect(audioContext.destination);
    }
  }

  // Create reverb effect with proper wet/dry mix
  function createReverb() {
    const convolver = audioContext.createConvolver();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Create impulse response
    const length = audioContext.sampleRate * 2;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    wetGain.gain.value = 0;
    dryGain.gain.value = 1;
    
    return { convolver, wetGain, dryGain };
  }

  // Create delay effect with accurate time and feedback
  function createDelay() {
    const delay = audioContext.createDelay(2);
    const feedback = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    wetGain.gain.value = 0;
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback, wetGain };
  }

  // Create filter effect with mode switching
  function createFilter() {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 1;
    return filter;
  }

  // Create compressor effect with accurate parameters
  function createCompressor() {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  // Play sound with accurate effects processing
  function playSound(instId) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    // Check mute/solo
    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;

    const params = globalParams.instrumentParams[instId];
    const now = audioContext.currentTime;

    // Create base sound nodes
    const osc = audioContext.createOscillator();
    const oscGain = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    // Set panning (limited to -1 to +1, which maps to 50L to 50R)
    panner.pan.value = params.pan;
    
    // Calculate pitch adjustment (limited to -48 to +48 semitones)
    const pitchMultiplier = Math.pow(2, params.pitch / 12);
    
    // Create sound chain
    osc.connect(oscGain);
    oscGain.connect(panner);
    
    // Apply effects chain
    let currentNode = panner;
    
    // Apply filter if enabled
    if (globalParams.filter.enabled && effectsChain.filter) {
      currentNode.connect(effectsChain.filter);
      currentNode = effectsChain.filter;
    }
    
    // Apply compression if enabled
    if (globalParams.compression.enabled && effectsChain.compressor) {
      currentNode.connect(effectsChain.compressor);
      currentNode = effectsChain.compressor;
    }
    
    // Create dry and wet paths
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
    currentNode.connect(dryGain);
    currentNode.connect(wetGain);
    
    // Apply reverb if enabled
    if (globalParams.reverb.enabled && effectsChain.reverb) {
      const reverbWet = audioContext.createGain();
      reverbWet.gain.value = globalParams.reverb.mix;
      wetGain.connect(effectsChain.reverb.convolver);
      effectsChain.reverb.convolver.connect(reverbWet);
      reverbWet.connect(masterGain);
      
      // Adjust dry gain for reverb mix
      dryGain.gain.value = 1 - globalParams.reverb.mix;
    } else {
      dryGain.gain.value = 1;
    }
    
    // Apply delay if enabled
    if (globalParams.delay.enabled && effectsChain.delay) {
      const delayWet = audioContext.createGain();
      delayWet.gain.value = 0.3;
      wetGain.connect(effectsChain.delay.delay);
      effectsChain.delay.delay.connect(delayWet);
      delayWet.connect(masterGain);
    }
    
    dryGain.connect(masterGain);
    
    // Generate sound based on instrument type
    switch(instId) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscGain.gain.setValueAtTime(params.volume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'snare':
        // Tone component
        osc.frequency.setValueAtTime(inst.frequency * pitchMultiplier, now);
        oscGain.gain.setValueAtTime(params.volume * 0.5, now);
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
        noisePanner.connect(currentNode);
        
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
        
        // Create high-pass filter for metallic sound
        const hihatFilter = audioContext.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 5000;
        hihatFilter.Q.value = 1;
        
        panner.disconnect();
        panner.connect(hihatFilter);
        hihatFilter.connect(currentNode);
        
        const duration = instId === 'openhat' ? 0.3 : 0.05;
        oscGain.gain.setValueAtTime(params.volume * 0.3, now);
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
          clapPanner.connect(currentNode);
          
          const startTime = now + i * 0.01;
          clapGain.gain.setValueAtTime(params.volume * 0.3, startTime);
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
        crashPanner.connect(currentNode);
        
        crashGain.gain.setValueAtTime(params.volume * 0.7, now);
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
        clickPanner.connect(currentNode);
        
        clickGain.gain.setValueAtTime(params.volume * 0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
        
        oscGain.gain.setValueAtTime(params.volume * 0.5, now);
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
        
        oscGain.gain.setValueAtTime(params.volume * 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        cowbellGain2.gain.setValueAtTime(params.volume * 0.3, now);
        cowbellGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        cowbellOsc2.start(now);
        cowbellOsc2.stop(now + 0.2);
        break;

      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        oscGain.gain.setValueAtTime(params.volume * 0.5, now);
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

  // High-quality WAV export
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
      
      // Create master gain in offline context
      const offlineMaster = offlineContext.createGain();
      offlineMaster.gain.value = 0.8;
      offlineMaster.connect(offlineContext.destination);

      // Recreate effects chain in offline context
      const offlineEffects = {
        reverb: createOfflineReverb(offlineContext),
        delay: createOfflineDelay(offlineContext),
        filter: createOfflineFilter(offlineContext),
        compressor: createOfflineCompressor(offlineContext)
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
    const length = context.sampleRate * 2;
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
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
    feedback.gain.value = globalParams.delay.feedback;
    wetGain.gain.value = globalParams.delay.enabled ? 0.3 : 0;
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback, wetGain };
  }

  function createOfflineFilter(context) {
    const filter = context.createBiquadFilter();
    filter.type = globalParams.filter.type;
    filter.frequency.value = globalParams.filter.frequency;
    filter.Q.value = 1;
    return filter;
  }

  function createOfflineCompressor(context) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = globalParams.compression.threshold;
    compressor.ratio.value = globalParams.compression.ratio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  function renderOfflineSound(context, inst, startTime, destination, effects) {
    const params = globalParams.instrumentParams[inst.id];
    
    const osc = context.createOscillator();
    const gain = context.createGain();
    const panner = context.createStereoPanner();
    
    panner.pan.value = params.pan;
    
    const pitchMultiplier = Math.pow(2, params.pitch / 12);
    
    // Build signal chain
    osc.connect(gain);
    gain.connect(panner);
    
    let currentNode = panner;
    
    if (globalParams.filter.enabled) {
      currentNode.connect(effects.filter);
      currentNode = effects.filter;
    }
    
    if (globalParams.compression.enabled) {
      currentNode.connect(effects.compressor);
      currentNode = effects.compressor;
    }
    
    // Apply effects with accurate wet/dry mix
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    
    currentNode.connect(dryGain);
    
    if (globalParams.reverb.enabled) {
      currentNode.connect(effects.reverb);
      const reverbOut = context.createGain();
      reverbOut.gain.value = globalParams.reverb.mix;
      effects.reverb.connect(reverbOut);
      reverbOut.connect(destination);
      dryGain.gain.value = 1 - globalParams.reverb.mix;
    } else {
      dryGain.gain.value = 1;
    }
    
    if (globalParams.delay.enabled) {
      currentNode.connect(effects.delay.delay);
      effects.delay.wetGain.connect(destination);
    }
    
    dryGain.connect(destination);
    
    // Generate sound based on type
    switch(inst.id) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, startTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        gain.gain.setValueAtTime(params.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
        break;
        
      // Add other instrument cases similar to playSound function
      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        gain.gain.setValueAtTime(params.volume * 0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
    }
  }

  // Convert AudioBuffer to WAV with high quality
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

    // Tempo with reduced sensitivity
    const tempoSlider = document.getElementById('dmTempoSlider');
    const tempoDisplay = document.getElementById('dmTempoDisplay');
    if (tempoSlider) {
      let lastValue = tempoSlider.value;
      tempoSlider.addEventListener('input', (e) => {
        const tempo = parseInt(e.target.value);
        if (Math.abs(tempo - lastValue) >= 1) {
          lastValue = tempo;
          if (tempoDisplay) tempoDisplay.textContent = `${tempo} BPM`;
          
          if (isPlaying) {
            pause();
            play();
          }
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

    // Effects toggles
    setupEffectToggle('dmReverbToggle', 'reverb');
    setupEffectToggle('dmDelayToggle', 'delay');
    setupEffectToggle('dmFilterToggle', 'filter');
    setupEffectToggle('dmCompToggle', 'compression');

    // Effects controls with accurate value mapping
    setupEffectSlider('dmReverbMix', 'dmReverbMixVal', (val) => {
      globalParams.reverb.mix = val / 100;
      return `${val}%`;
    });

    setupEffectSlider('dmDelayTime', 'dmDelayTimeVal', (val) => {
      globalParams.delay.time = val;
      if (effectsChain.delay) {
        effectsChain.delay.delay.delayTime.value = val / 1000;
      }
      return `${val}ms`;
    });

    setupEffectSlider('dmDelayFeedback', 'dmDelayFeedbackVal', (val) => {
      globalParams.delay.feedback = val / 100;
      if (effectsChain.delay) {
        effectsChain.delay.feedback.gain.value = val / 100;
      }
      return `${val}%`;
    });

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

    setupEffectSlider('dmCompThreshold', 'dmCompThresholdVal', (val) => {
      globalParams.compression.threshold = val;
      if (effectsChain.compressor) {
        effectsChain.compressor.threshold.value = val;
      }
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
      // Reduce input event frequency for better performance
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
    loadPreset: loadPreset
  };
})();
