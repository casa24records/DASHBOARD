// Drum Machine Pro - MVP Max Mode with Maximum Capabilities
(function() {
  'use strict';
  
  // Configuration
  let STEPS = 16;
  let currentBarMode = 4;
  
  // Audio constants
  const REFERENCE_LEVEL = -18; // dBFS
  const HEADROOM = 6; // dB
  const MASTER_GAIN_DEFAULT = 0.7;
  
  // Enhanced instrument configurations with redesigned, musically distinct kits
  const instrumentConfigs = {
    "Panama Heat": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 55, subFreq: 32, noiseAmount: 0.02, layerFreq: 28 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 240, subFreq: 95, noiseAmount: 0.22, layerFreq: 185 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 8500, subFreq: 0, noiseAmount: 0.5, layerFreq: 7000 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7500, subFreq: 0, noiseAmount: 0.6, layerFreq: 6500 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1600, subFreq: 0, noiseAmount: 0.14, layerFreq: 2100 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 11500, subFreq: 0, noiseAmount: 0.75, layerFreq: 13000 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 600, subFreq: 0, noiseAmount: 0.06, layerFreq: 800 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 1050, subFreq: 0, noiseAmount: 0, layerFreq: 1250 }
    ],
    "Trap Quantum": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 42, subFreq: 25, noiseAmount: 0.01, layerFreq: 30 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 280, subFreq: 110, noiseAmount: 0.25, layerFreq: 220 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 12000, subFreq: 0, noiseAmount: 0.7, layerFreq: 10000 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 10000, subFreq: 0, noiseAmount: 0.8, layerFreq: 8500 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2000, subFreq: 0, noiseAmount: 0.15, layerFreq: 2500 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 14000, subFreq: 0, noiseAmount: 0.9, layerFreq: 12000 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 550, subFreq: 0, noiseAmount: 0.04, layerFreq: 700 },
      { id: 'cowbell', label: '808', icon: '🎵', frequency: 900, subFreq: 35, noiseAmount: 0, layerFreq: 1100 }
    ],
    "Boom Circuit": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 65, subFreq: 38, noiseAmount: 0.03, layerFreq: 45 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 210, subFreq: 85, noiseAmount: 0.28, layerFreq: 180 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 9000, subFreq: 0, noiseAmount: 0.45, layerFreq: 7500 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 7800, subFreq: 0, noiseAmount: 0.55, layerFreq: 6200 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2200, subFreq: 0, noiseAmount: 0.18, layerFreq: 1800 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 12000, subFreq: 0, noiseAmount: 0.7, layerFreq: 10500 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 1100, subFreq: 0, noiseAmount: 0.1, layerFreq: 900 },
      { id: 'cowbell', label: 'BELL', icon: '🔔', frequency: 950, subFreq: 0, noiseAmount: 0.02, layerFreq: 850 }
    ],
    "Lo-Fi Dreams": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 48, subFreq: 28, noiseAmount: 0.08, layerFreq: 35 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 175, subFreq: 65, noiseAmount: 0.35, layerFreq: 150 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 5500, subFreq: 0, noiseAmount: 0.5, layerFreq: 4500 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4000, subFreq: 0, noiseAmount: 0.6, layerFreq: 3500 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 900, subFreq: 0, noiseAmount: 0.25, layerFreq: 1100 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 8000, subFreq: 0, noiseAmount: 0.7, layerFreq: 7000 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 750, subFreq: 0, noiseAmount: 0.12, layerFreq: 650 },
      { id: 'cowbell', label: 'VINYL', icon: '💿', frequency: 650, subFreq: 0, noiseAmount: 0.4, layerFreq: 550 }
    ],
    "Future Breaks": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 50, subFreq: 30, noiseAmount: 0.05, layerFreq: 35 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 290, subFreq: 130, noiseAmount: 0.3, layerFreq: 250 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 11500, subFreq: 0, noiseAmount: 0.7, layerFreq: 9500 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 10500, subFreq: 0, noiseAmount: 0.8, layerFreq: 8800 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2100, subFreq: 0, noiseAmount: 0.2, layerFreq: 2400 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 13500, subFreq: 0, noiseAmount: 0.85, layerFreq: 11000 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 480, subFreq: 0, noiseAmount: 0.08, layerFreq: 650 },
      { id: 'cowbell', label: 'SYNTH', icon: '🎹', frequency: 980, subFreq: 490, noiseAmount: 0.03, layerFreq: 1470 }
    ],
    "Latin Fuego": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 68, subFreq: 40, noiseAmount: 0.04, layerFreq: 48 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 235, subFreq: 88, noiseAmount: 0.2, layerFreq: 195 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 7800, subFreq: 0, noiseAmount: 0.38, layerFreq: 6800 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 6300, subFreq: 0, noiseAmount: 0.48, layerFreq: 5500 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2600, subFreq: 0, noiseAmount: 0.1, layerFreq: 2900 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 10500, subFreq: 0, noiseAmount: 0.72, layerFreq: 9200 },
      { id: 'rim', label: 'CLAVE', icon: '🥢', frequency: 1250, subFreq: 0, noiseAmount: 0.05, layerFreq: 1500 },
      { id: 'cowbell', label: 'CONGA', icon: '🪘', frequency: 980, subFreq: 200, noiseAmount: 0.02, layerFreq: 750 }
    ],
    "Neon Tokyo": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 45, subFreq: 26, noiseAmount: 0.1, layerFreq: 32 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 265, subFreq: 115, noiseAmount: 0.32, layerFreq: 230 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 13000, subFreq: 0, noiseAmount: 0.75, layerFreq: 11000 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 11000, subFreq: 0, noiseAmount: 0.85, layerFreq: 9000 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2300, subFreq: 0, noiseAmount: 0.28, layerFreq: 2700 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 15000, subFreq: 0, noiseAmount: 0.95, layerFreq: 12500 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 720, subFreq: 0, noiseAmount: 0.18, layerFreq: 900 },
      { id: 'cowbell', label: 'LASER', icon: '⚡', frequency: 880, subFreq: 1760, noiseAmount: 0.08, layerFreq: 3520 }
    ],
    "Analog Dust": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 72, subFreq: 48, noiseAmount: 0, layerFreq: 55 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 195, subFreq: 78, noiseAmount: 0.12, layerFreq: 165 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 5200, subFreq: 0, noiseAmount: 0.25, layerFreq: 4400 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 4200, subFreq: 0, noiseAmount: 0.35, layerFreq: 3600 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1250, subFreq: 0, noiseAmount: 0.08, layerFreq: 1450 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 8500, subFreq: 0, noiseAmount: 0.45, layerFreq: 7200 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 360, subFreq: 0, noiseAmount: 0.03, layerFreq: 480 },
      { id: 'cowbell', label: 'TOM', icon: '🥁', frequency: 700, subFreq: 350, noiseAmount: 0, layerFreq: 525 }
    ],
    "Cyber Punk": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 38, subFreq: 22, noiseAmount: 0.12, layerFreq: 28 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 270, subFreq: 125, noiseAmount: 0.35, layerFreq: 240 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 14000, subFreq: 0, noiseAmount: 0.8, layerFreq: 12000 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 12000, subFreq: 0, noiseAmount: 0.9, layerFreq: 10000 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 2400, subFreq: 0, noiseAmount: 0.3, layerFreq: 2800 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 16000, subFreq: 0, noiseAmount: 1.0, layerFreq: 13500 },
      { id: 'rim', label: 'GLITCH', icon: '🔧', frequency: 750, subFreq: 375, noiseAmount: 0.25, layerFreq: 1125 },
      { id: 'cowbell', label: 'ACID', icon: '🧪', frequency: 660, subFreq: 330, noiseAmount: 0.1, layerFreq: 990 }
    ],
    "Smooth Groove": [
      { id: 'kick', label: 'KICK', icon: '🥁', frequency: 75, subFreq: 50, noiseAmount: 0, layerFreq: 60 },
      { id: 'snare', label: 'SNARE', icon: '🎯', frequency: 200, subFreq: 80, noiseAmount: 0.08, layerFreq: 170 },
      { id: 'hihat', label: 'HI-HAT', icon: '🎩', frequency: 4800, subFreq: 0, noiseAmount: 0.18, layerFreq: 4000 },
      { id: 'openhat', label: 'OPEN', icon: '🔓', frequency: 3800, subFreq: 0, noiseAmount: 0.28, layerFreq: 3200 },
      { id: 'clap', label: 'CLAP', icon: '👏', frequency: 1100, subFreq: 0, noiseAmount: 0.04, layerFreq: 1300 },
      { id: 'crash', label: 'CRASH', icon: '💥', frequency: 7500, subFreq: 0, noiseAmount: 0.35, layerFreq: 6500 },
      { id: 'rim', label: 'RIM', icon: '🗑️', frequency: 340, subFreq: 0, noiseAmount: 0.01, layerFreq: 450 },
      { id: 'cowbell', label: 'RIDE', icon: '🎵', frequency: 650, subFreq: 0, noiseAmount: 0, layerFreq: 780 }
    ]
  };
  
  // Current configuration
  let currentConfig = "Panama Heat";
  let instruments = instrumentConfigs[currentConfig];

  // Default parameters with expanded creative options
  const defaultGlobalParams = {
    masterVolume: MASTER_GAIN_DEFAULT,
    instrumentParams: {},
    // Standard effects
    reverb: { 
      enabled: false, 
      mix: 0.25,
      preset: 'room',
      predelay: 0,
      damping: 0.5
    },
    delay: { 
      enabled: false, 
      time: 250,
      feedback: 0.3,
      mix: 0.2,
      pingPong: false,
      sync: false
    },
    filter: { 
      enabled: false, 
      frequency: 20000,
      type: 'lowpass',
      resonance: 1,
      sweep: false,
      sweepSpeed: 0.5
    },
    compression: { 
      enabled: false, 
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      makeup: 0
    },
    distortion: {
      enabled: false,
      amount: 0.1,
      tone: 0.5,
      type: 'soft'
    },
    chorus: {
      enabled: false,
      rate: 1.5,
      depth: 0.3,
      mix: 0.3
    },
    phaser: {
      enabled: false,
      rate: 0.5,
      depth: 0.5,
      stages: 4,
      mix: 0.5
    },
    bitcrusher: {
      enabled: false,
      bits: 8,
      downsample: 1
    },
    stereoWidth: {
      enabled: false,
      width: 1.0
    },
    // Creative effects
    gatedReverb: {
      enabled: false,
      threshold: -20,
      hold: 0.1,
      decay: 0.05
    },
    tapeStop: {
      enabled: false,
      speed: 0.5,
      active: false
    },
    stutter: {
      enabled: false,
      division: 16,
      probability: 0.5
    },
    glitch: {
      enabled: false,
      intensity: 0.5,
      frequency: 0.3
    },
    reverse: {
      enabled: false,
      probability: 0.2
    },
    granular: {
      enabled: false,
      grainSize: 50,
      overlap: 0.5,
      pitch: 0
    },
    // Global modulation
    swing: 0,
    humanize: 0,
    layering: false,
    // Automation
    automation: {
      enabled: false,
      recording: false,
      data: {}
    }
  };

  // Global parameters
  let globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));

  // Initialize instrument parameters with layering support
  function initializeInstrumentParams() {
    instruments.forEach(inst => {
      globalParams.instrumentParams[inst.id] = {
        volume: 0.7,
        pitch: 0,
        decay: 1.0,
        pan: 0,
        layer: false,
        layerVolume: 0.5,
        layerPitch: 12
      };
    });
  }

  initializeInstrumentParams();

  // Preset patterns with improved grooves
  const presets = {
    "Panama Classic": {
      bpm: 105,
      kick:    [1,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1],
      openhat: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
      cowbell: [0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0]
    },
    "Trap Mode": {
      bpm: 140,
      kick:    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    "Boom Bap": {
      bpm: 90,
      kick:    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    "Future Funk": {
      bpm: 120,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,1,0,0,1,0,1,0,1,1,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
      cowbell: [0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0]
    }
  };

  // State management
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
  let automationData = {};
  let recordedSamples = {};

  // Initialize empty pattern
  instruments.forEach(inst => {
    pattern[inst.id] = new Array(32).fill(0);
    isMuted[inst.id] = false;
  });

  // Utility functions
  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function gainToDb(gain) {
    return 20 * Math.log10(Math.max(0.0001, gain));
  }

  // Create the drum machine HTML
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dm-wrapper">
        <style>
          /* Drum Machine Pro Styles - MVP Max Mode */
          .dm-wrapper {
            font-family: 'Space Mono', monospace;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          }

          /* Header */
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
            margin: 0;
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

          .dm-kit-selector, .dm-bar-selector {
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

          .dm-btn.random {
            background: #9b59b6;
            border-color: #9b59b6;
            color: #fff;
          }

          .dm-btn.random:hover {
            background: #8e44ad;
            border-color: #8e44ad;
            box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
          }

          .dm-btn.record {
            background: #e74c3c;
            border-color: #e74c3c;
            color: #fff;
          }

          .dm-btn.record:hover {
            background: #c0392b;
            border-color: #c0392b;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

          /* Creative Controls */
          .dm-creative-controls {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
          }

          .dm-creative-btn {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #444;
            color: #999;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.75rem;
            text-transform: uppercase;
          }

          .dm-creative-btn:hover {
            border-color: #00a651;
            color: #00a651;
            background: rgba(0, 166, 81, 0.1);
          }

          .dm-creative-btn.active {
            background: #00a651;
            color: #1a1a1a;
            border-color: #00a651;
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
            align-items: center;
          }

          .dm-track-btn {
            width: 20px;
            height: 20px;
            border-radius: 0.25rem;
            border: 1px solid #444;
            background: #2a2a2a;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.625rem;
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

          .dm-step.accent {
            background: #ff6b00;
            border-color: #ff6b00;
          }

          .dm-step.ghost {
            opacity: 0.5;
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
          .dm-panel-toggle {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
            gap: 0.25rem;
          }

          .dm-toggle-btn {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #444;
            color: #999;
            padding: 0.5rem 1.5rem;
            border-radius: 0.5rem 0.5rem 0 0;
            cursor: pointer;
            transition: all 0.2s;
            margin: 0;
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

          .dm-layer-toggle {
            margin-top: 0.5rem;
            text-align: center;
          }

          .dm-layer-btn {
            background: #2a2a2a;
            border: 1px solid #444;
            color: #666;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 0.625rem;
            transition: all 0.2s;
          }

          .dm-layer-btn.active {
            background: #9b59b6;
            color: #fff;
            border-color: #9b59b6;
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

          /* Creative Effects Panel */
          .dm-creative-panel {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            display: none;
          }

          .dm-creative-panel.active {
            display: block;
            animation: slideDown 0.3s ease-out;
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
                  `<option value="${kit}" ${kit === currentConfig ? 'selected' : ''}>${kit.toUpperCase()}</option>`
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

          <button class="dm-btn random" id="dmRandomBtn">
            <span class="dm-btn-icon">🎲</span>
            <span>RANDOM</span>
          </button>
          <button class="dm-btn record" id="dmRecordBtn">
            <span class="dm-btn-icon">⏺</span>
            <span>REC</span>
          </button>
          <button class="dm-btn" id="dmDownloadBtn">
            <span class="dm-btn-icon">💾</span>
            <span>EXPORT</span>
          </button>
        </div>

        <!-- Creative Controls -->
        <div class="dm-creative-controls">
          <button class="dm-creative-btn" id="dmTapeStopBtn">TAPE STOP</button>
          <button class="dm-creative-btn" id="dmStutterBtn">STUTTER</button>
          <button class="dm-creative-btn" id="dmGlitchBtn">GLITCH</button>
          <button class="dm-creative-btn" id="dmReverseBtn">REVERSE</button>
          <button class="dm-creative-btn" id="dmGranularBtn">GRANULAR</button>
          <button class="dm-creative-btn" id="dmLayeringBtn">LAYERING</button>
        </div>

        <!-- Preset Buttons -->
        <div class="dm-presets">
          <div class="dm-preset-section-title">PATTERNS</div>
          <button class="dm-preset-btn" data-preset="Panama Classic">Panama Classic</button>
          <button class="dm-preset-btn" data-preset="Trap Mode">Trap Mode</button>
          <button class="dm-preset-btn" data-preset="Boom Bap">Boom Bap</button>
          <button class="dm-preset-btn" data-preset="Future Funk">Future Funk</button>
        </div>

        <!-- Panel Toggle -->
        <div class="dm-panel-toggle">
          <button class="dm-toggle-btn active" id="dmMixerToggle">MIXER</button>
          <button class="dm-toggle-btn" id="dmEffectsToggle">EFFECTS</button>
          <button class="dm-toggle-btn" id="dmCreativeToggle">CREATIVE FX</button>
        </div>

        <!-- Mixer Panel -->
        <div class="dm-mixer-panel active" id="dmMixerPanel">
          <div class="dm-mixer-tracks" id="dmMixerTracks">
            <!-- Mixer channels will be generated here -->
          </div>
        </div>

        <!-- Effects Panel -->
        <div class="dm-effects-panel" id="dmEffectsPanel">
          <div class="dm-effects-grid" id="dmEffectsGrid">
            <!-- Effects will be generated here -->
          </div>
        </div>

        <!-- Creative Panel -->
        <div class="dm-creative-panel" id="dmCreativePanel">
          <div class="dm-effects-grid" id="dmCreativeGrid">
            <!-- Creative effects will be generated here -->
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
    createEffectsPanel();
    createCreativePanel();
    setupEventListeners();
    loadPreset('Panama Classic');
  }

  // Create pattern grid
  function createPatternGrid() {
    const grid = document.getElementById('dmPatternGrid');
    const stepIndicator = document.getElementById('dmStepIndicator');
    if (!grid || !stepIndicator) return;

    document.documentElement.style.setProperty('--step-count', STEPS);

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

      // Track header with proper spacing for M and S buttons
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
        step.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleAccent(e);
        });
        track.appendChild(step);
      }

      grid.appendChild(track);
    });

    updatePattern();
  }

  // Create mixer channels with layering support
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
        
        <div class="dm-layer-toggle">
          <button class="dm-layer-btn ${params.layer ? 'active' : ''}" data-instrument="${inst.id}">
            LAYER ${params.layer ? 'ON' : 'OFF'}
          </button>
        </div>
      `;

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

    // Setup layer buttons
    document.querySelectorAll('.dm-layer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const inst = e.target.dataset.instrument;
        globalParams.instrumentParams[inst].layer = !globalParams.instrumentParams[inst].layer;
        e.target.classList.toggle('active');
        e.target.textContent = `LAYER ${globalParams.instrumentParams[inst].layer ? 'ON' : 'OFF'}`;
      });
    });

    setupKnobControls();
  }

  // Create effects panel
  function createEffectsPanel() {
    const grid = document.getElementById('dmEffectsGrid');
    if (!grid) return;

    grid.innerHTML = `
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
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">PreDelay</span>
            <span class="dm-effect-param-value" id="dmReverbPredelayVal">0ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmReverbPredelay" min="0" max="100" value="0">
          <div class="dm-effect-preset-selector">
            <button class="dm-effect-preset-btn active" data-preset="room">ROOM</button>
            <button class="dm-effect-preset-btn" data-preset="hall">HALL</button>
            <button class="dm-effect-preset-btn" data-preset="plate">PLATE</button>
            <button class="dm-effect-preset-btn" data-preset="cathedral">CATHEDRAL</button>
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
          <input type="range" class="dm-effect-slider" id="dmDelayTime" min="10" max="2000" value="250">
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
            <button class="dm-filter-mode-btn" data-mode="bandpass">BAND-PASS</button>
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
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Attack</span>
            <span class="dm-effect-param-value" id="dmCompAttackVal">3ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompAttack" min="0" max="100" value="3">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Release</span>
            <span class="dm-effect-param-value" id="dmCompReleaseVal">250ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompRelease" min="10" max="1000" value="250">
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
          <div class="dm-effect-preset-selector">
            <button class="dm-effect-preset-btn active" data-type="soft">SOFT</button>
            <button class="dm-effect-preset-btn" data-type="hard">HARD</button>
            <button class="dm-effect-preset-btn" data-type="fuzz">FUZZ</button>
          </div>
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

      <!-- Phaser -->
      <div class="dm-effect-unit" id="dmPhaserUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">PHASER</span>
          <div class="dm-effect-toggle" id="dmPhaserToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Rate</span>
            <span class="dm-effect-param-value" id="dmPhaserRateVal">0.5Hz</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserRate" min="0.1" max="10" value="0.5" step="0.1">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Depth</span>
            <span class="dm-effect-param-value" id="dmPhaserDepthVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserDepth" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Stages</span>
            <span class="dm-effect-param-value" id="dmPhaserStagesVal">4</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserStages" min="2" max="8" value="4" step="2">
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
          <input type="range" class="dm-effect-slider" id="dmBitcrusherDownsample" min="1" max="20" value="1">
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
    `;
  }

  // Create creative effects panel
  function createCreativePanel() {
    const grid = document.getElementById('dmCreativeGrid');
    if (!grid) return;

    grid.innerHTML = `
      <!-- Gated Reverb -->
      <div class="dm-effect-unit" id="dmGatedReverbUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">GATED REVERB</span>
          <div class="dm-effect-toggle" id="dmGatedReverbToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Threshold</span>
            <span class="dm-effect-param-value" id="dmGatedReverbThresholdVal">-20dB</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbThreshold" min="-60" max="0" value="-20">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Hold</span>
            <span class="dm-effect-param-value" id="dmGatedReverbHoldVal">100ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbHold" min="10" max="500" value="100">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Decay</span>
            <span class="dm-effect-param-value" id="dmGatedReverbDecayVal">50ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbDecay" min="10" max="200" value="50">
        </div>
      </div>

      <!-- Tape Stop -->
      <div class="dm-effect-unit" id="dmTapeStopUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">TAPE STOP</span>
          <div class="dm-effect-toggle" id="dmTapeStopToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Speed</span>
            <span class="dm-effect-param-value" id="dmTapeStopSpeedVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmTapeStopSpeed" min="10" max="100" value="50">
          <button class="dm-effect-preset-btn" id="dmTapeStopTrigger">TRIGGER</button>
        </div>
      </div>

      <!-- Stutter -->
      <div class="dm-effect-unit" id="dmStutterUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">STUTTER</span>
          <div class="dm-effect-toggle" id="dmStutterToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Division</span>
            <span class="dm-effect-param-value" id="dmStutterDivisionVal">1/16</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmStutterDivision" min="2" max="32" value="16" step="2">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Probability</span>
            <span class="dm-effect-param-value" id="dmStutterProbabilityVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmStutterProbability" min="0" max="100" value="50">
        </div>
      </div>

      <!-- Glitch -->
      <div class="dm-effect-unit" id="dmGlitchUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">GLITCH</span>
          <div class="dm-effect-toggle" id="dmGlitchToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Intensity</span>
            <span class="dm-effect-param-value" id="dmGlitchIntensityVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGlitchIntensity" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Frequency</span>
            <span class="dm-effect-param-value" id="dmGlitchFrequencyVal">30%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGlitchFrequency" min="0" max="100" value="30">
        </div>
      </div>

      <!-- Reverse -->
      <div class="dm-effect-unit" id="dmReverseUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">REVERSE</span>
          <div class="dm-effect-toggle" id="dmReverseToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Probability</span>
            <span class="dm-effect-param-value" id="dmReverseProbabilityVal">20%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmReverseProbability" min="0" max="100" value="20">
        </div>
      </div>

      <!-- Granular -->
      <div class="dm-effect-unit" id="dmGranularUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">GRANULAR</span>
          <div class="dm-effect-toggle" id="dmGranularToggle"></div>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Grain Size</span>
            <span class="dm-effect-param-value" id="dmGranularGrainSizeVal">50ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGranularGrainSize" min="10" max="200" value="50">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Overlap</span>
            <span class="dm-effect-param-value" id="dmGranularOverlapVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGranularOverlap" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <span class="dm-effect-param-label">Pitch</span>
            <span class="dm-effect-param-value" id="dmGranularPitchVal">0</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGranularPitch" min="-24" max="24" value="0">
        </div>
      </div>
    `;
  }

  // Initialize audio and setup modular effect creation functions
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      masterGain = audioContext.createGain();
      masterGain.gain.value = globalParams.masterVolume;
      
      const limiter = audioContext.createDynamicsCompressor();
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.01;
      
      effectsChain = {
        reverb: createReverb(),
        delay: createDelay(),
        filter: createFilter(),
        compressor: createCompressor(),
        distortion: createDistortion(),
        chorus: createChorus(),
        phaser: createPhaser(),
        bitcrusher: createBitcrusher(),
        stereoWidth: createStereoWidth(),
        gatedReverb: createGatedReverb(),
        tapeStop: createTapeStop(),
        stutter: createStutter(),
        glitch: createGlitch(),
        granular: createGranular(),
        limiter: limiter
      };
      
      masterGain.connect(limiter);
      limiter.connect(audioContext.destination);
    }
  }

  // Standard effects creation (modularized)
  function createReverb() {
    const convolver = audioContext.createConvolver();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const presets = {};
    
    // Room impulse
    const roomLength = audioContext.sampleRate * 0.5;
    const roomImpulse = audioContext.createBuffer(2, roomLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = roomImpulse.getChannelData(channel);
      for (let i = 0; i < roomLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / roomLength, 1.5);
      }
    }
    presets.room = roomImpulse;
    
    // Hall impulse
    const hallLength = audioContext.sampleRate * 2;
    const hallImpulse = audioContext.createBuffer(2, hallLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = hallImpulse.getChannelData(channel);
      for (let i = 0; i < hallLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hallLength, 2);
      }
    }
    presets.hall = hallImpulse;
    
    // Plate impulse
    const plateLength = audioContext.sampleRate * 1;
    const plateImpulse = audioContext.createBuffer(2, plateLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = plateImpulse.getChannelData(channel);
      for (let i = 0; i < plateLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / plateLength, 0.8);
      }
    }
    presets.plate = plateImpulse;
    
    // Cathedral impulse
    const cathedralLength = audioContext.sampleRate * 4;
    const cathedralImpulse = audioContext.createBuffer(2, cathedralLength, audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = cathedralImpulse.getChannelData(channel);
      for (let i = 0; i < cathedralLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / cathedralLength, 2.5);
      }
    }
    presets.cathedral = cathedralImpulse;
    
    convolver.buffer = presets[globalParams.reverb.preset];
    wetGain.gain.value = 0;
    dryGain.gain.value = 1;
    
    return { convolver, wetGain, dryGain, presets };
  }

  function createDelay() {
    const delay = audioContext.createDelay(2);
    const feedback = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
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
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    splitter.connect(delayL, 0);
    splitter.connect(delayR, 1);
    delayL.connect(feedbackL);
    delayR.connect(feedbackR);
    feedbackL.connect(merger, 0, 1);
    feedbackR.connect(merger, 0, 0);
    merger.connect(splitter);
    
    return { 
      delay, feedback, wetGain,
      delayL, delayR, feedbackL, feedbackR,
      merger, splitter
    };
  }

  function createFilter() {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 1;
    
    // LFO for filter sweep
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 0;
    lfo.connect(lfoGain);
    lfo.start();
    
    return { filter, lfo, lfoGain };
  }

  function createCompressor() {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

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
    
    const updateCurve = (type) => {
      const samples = 44100;
      const curve = new Float32Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        
        switch(type) {
          case 'soft':
            curve[i] = Math.tanh(x * 2);
            break;
          case 'hard':
            curve[i] = Math.sign(x) * Math.min(Math.abs(x * 5), 1);
            break;
          case 'fuzz':
            curve[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x * 10)));
            break;
          default:
            curve[i] = x;
        }
      }
      
      waveshaper.curve = curve;
    };
    
    updateCurve(globalParams.distortion.type);
    waveshaper.oversample = '4x';
    
    return { waveshaper, inputGain, outputGain, toneFilter, updateCurve };
  }

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

  function createPhaser() {
    const stages = [];
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 1000;
    
    for (let i = 0; i < 8; i++) {
      const allpass = audioContext.createBiquadFilter();
      allpass.type = 'allpass';
      allpass.frequency.value = 1000 + i * 500;
      stages.push(allpass);
      
      lfo.connect(lfoGain);
      lfoGain.connect(allpass.frequency);
    }
    
    lfo.start();
    
    return { stages, lfo, lfoGain };
  }

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

  function createStereoWidth() {
    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    const midGain = audioContext.createGain();
    const sideGain = audioContext.createGain();
    
    midGain.gain.value = 1;
    sideGain.gain.value = 1;
    
    return { splitter, merger, midGain, sideGain };
  }

  // Creative effects
  function createGatedReverb() {
    const convolver = audioContext.createConvolver();
    const gate = audioContext.createGain();
    
    // Create short burst impulse
    const length = audioContext.sampleRate * 0.5;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.1));
      }
    }
    
    convolver.buffer = impulse;
    gate.gain.value = 0;
    
    return { convolver, gate };
  }

  function createTapeStop() {
    const delayNode = audioContext.createDelay(1);
    const feedbackGain = audioContext.createGain();
    const outputGain = audioContext.createGain();
    
    delayNode.delayTime.value = 0;
    feedbackGain.gain.value = 0.9;
    outputGain.gain.value = 1;
    
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    
    return { delayNode, feedbackGain, outputGain };
  }

  function createStutter() {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    const bufferSource = audioContext.createBufferSource();
    
    bufferSource.buffer = buffer;
    bufferSource.loop = true;
    
    return { buffer, bufferSource };
  }

  function createGlitch() {
    const scriptNode = audioContext.createScriptProcessor(2048, 1, 1);
    let glitchIntensity = 0.5;
    let glitchFrequency = 0.3;
    
    scriptNode.onaudioprocess = function(e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      
      for (let i = 0; i < input.length; i++) {
        if (Math.random() < glitchFrequency) {
          // Apply random glitch effect
          const glitchType = Math.floor(Math.random() * 4);
          switch(glitchType) {
            case 0: // Bit reduction
              output[i] = Math.round(input[i] * 4) / 4 * glitchIntensity + input[i] * (1 - glitchIntensity);
              break;
            case 1: // Sample repeat
              output[i] = input[Math.floor(i / 4) * 4] * glitchIntensity + input[i] * (1 - glitchIntensity);
              break;
            case 2: // Amplitude modulation
              output[i] = input[i] * (Math.random() * glitchIntensity + (1 - glitchIntensity));
              break;
            case 3: // Silence
              output[i] = input[i] * (1 - glitchIntensity);
              break;
          }
        } else {
          output[i] = input[i];
        }
      }
    };
    
    return {
      scriptNode,
      setIntensity: (val) => { glitchIntensity = val; },
      setFrequency: (val) => { glitchFrequency = val; }
    };
  }

  function createGranular() {
    const grainSize = 50; // ms
    const overlap = 0.5;
    const grains = [];
    
    // Create grain windows
    for (let i = 0; i < 8; i++) {
      const gain = audioContext.createGain();
      gain.gain.value = 0;
      grains.push(gain);
    }
    
    return { grains, grainSize, overlap };
  }

  // Play sound with full effects chain and layering
  function playSound(instId) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;

    const params = globalParams.instrumentParams[instId];
    const now = audioContext.currentTime;

    // Apply reverse probability
    const shouldReverse = globalParams.reverse.enabled && Math.random() < globalParams.reverse.probability;

    // Create main sound
    playSoundCore(inst, params, now, shouldReverse);

    // Create layer if enabled
    if (params.layer && inst.layerFreq) {
      const layerInst = Object.assign({}, inst, { 
        frequency: inst.layerFreq,
        subFreq: inst.layerFreq / 2
      });
      const layerParams = Object.assign({}, params, {
        volume: params.volume * params.layerVolume,
        pitch: params.pitch + params.layerPitch
      });
      playSoundCore(layerInst, layerParams, now, shouldReverse);
    }

    // Apply stutter effect
    if (globalParams.stutter.enabled && Math.random() < globalParams.stutter.probability) {
      const stutterCount = Math.floor(globalParams.stutter.division / 4);
      const stutterInterval = (60 / parseInt(document.getElementById('dmTempoSlider').value) / globalParams.stutter.division);
      
      for (let i = 1; i < stutterCount; i++) {
        setTimeout(() => {
          playSoundCore(inst, Object.assign({}, params, { volume: params.volume * 0.7 }), 
                       audioContext.currentTime, false);
        }, stutterInterval * i * 1000);
      }
    }
  }

  // Core sound generation
  function playSoundCore(inst, params, startTime, reverse = false) {
    const osc = audioContext.createOscillator();
    const oscGain = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    const referenceGain = dbToGain(REFERENCE_LEVEL);
    panner.pan.value = params.pan;
    
    const pitchMultiplier = Math.pow(2, Math.max(-24, Math.min(24, params.pitch)) / 12);
    
    osc.connect(oscGain);
    oscGain.connect(panner);
    
    // Apply effects chain
    let currentNode = panner;
    let compensationGain = 1;
    
    // Glitch effect
    if (globalParams.glitch.enabled && effectsChain.glitch) {
      effectsChain.glitch.setIntensity(globalParams.glitch.intensity);
      effectsChain.glitch.setFrequency(globalParams.glitch.frequency);
      currentNode.connect(effectsChain.glitch.scriptNode);
      currentNode = effectsChain.glitch.scriptNode;
    }
    
    // Bitcrusher
    if (globalParams.bitcrusher.enabled && effectsChain.bitcrusher) {
      currentNode.connect(effectsChain.bitcrusher.scriptNode);
      currentNode = effectsChain.bitcrusher.scriptNode;
      effectsChain.bitcrusher.setBits(globalParams.bitcrusher.bits);
      effectsChain.bitcrusher.setDownsample(globalParams.bitcrusher.downsample);
    }
    
    // Distortion
    if (globalParams.distortion.enabled && effectsChain.distortion) {
      effectsChain.distortion.updateCurve(globalParams.distortion.type);
      effectsChain.distortion.inputGain.gain.value = 1 + globalParams.distortion.amount;
      effectsChain.distortion.outputGain.gain.value = 1 / (1 + globalParams.distortion.amount * 0.5);
      effectsChain.distortion.toneFilter.gain.value = globalParams.distortion.tone * 12 - 6;
      
      currentNode.connect(effectsChain.distortion.inputGain);
      effectsChain.distortion.inputGain.connect(effectsChain.distortion.waveshaper);
      effectsChain.distortion.waveshaper.connect(effectsChain.distortion.toneFilter);
      effectsChain.distortion.toneFilter.connect(effectsChain.distortion.outputGain);
      currentNode = effectsChain.distortion.outputGain;
      
      compensationGain *= 0.8;
    }
    
    // Filter with sweep
    if (globalParams.filter.enabled && effectsChain.filter) {
      effectsChain.filter.filter.frequency.value = globalParams.filter.frequency;
      effectsChain.filter.filter.Q.value = globalParams.filter.resonance;
      effectsChain.filter.filter.type = globalParams.filter.type;
      
      if (globalParams.filter.sweep) {
        effectsChain.filter.lfo.frequency.value = globalParams.filter.sweepSpeed;
        effectsChain.filter.lfoGain.gain.value = globalParams.filter.frequency * 0.5;
        effectsChain.filter.lfoGain.connect(effectsChain.filter.filter.frequency);
      }
      
      currentNode.connect(effectsChain.filter.filter);
      currentNode = effectsChain.filter.filter;
      
      if (globalParams.filter.resonance > 5) {
        compensationGain *= 1 / (1 + (globalParams.filter.resonance - 5) * 0.05);
      }
    }
    
    // Phaser
    if (globalParams.phaser.enabled && effectsChain.phaser) {
      effectsChain.phaser.lfo.frequency.value = globalParams.phaser.rate;
      effectsChain.phaser.lfoGain.gain.value = 1000 * globalParams.phaser.depth;
      
      const activeStages = globalParams.phaser.stages;
      for (let i = 0; i < activeStages; i++) {
        if (i === 0) {
          currentNode.connect(effectsChain.phaser.stages[i]);
        } else {
          effectsChain.phaser.stages[i-1].connect(effectsChain.phaser.stages[i]);
        }
      }
      currentNode = effectsChain.phaser.stages[activeStages - 1];
    }
    
    // Compression
    if (globalParams.compression.enabled && effectsChain.compressor) {
      effectsChain.compressor.threshold.value = globalParams.compression.threshold;
      effectsChain.compressor.ratio.value = globalParams.compression.ratio;
      effectsChain.compressor.attack.value = globalParams.compression.attack / 1000;
      effectsChain.compressor.release.value = globalParams.compression.release / 1000;
      currentNode.connect(effectsChain.compressor);
      currentNode = effectsChain.compressor;
      
      const reductionDb = Math.abs(globalParams.compression.threshold) / globalParams.compression.ratio;
      compensationGain *= dbToGain(reductionDb * 0.5 + globalParams.compression.makeup);
    }
    
    // Create dry/wet paths
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const postEffectGain = audioContext.createGain();
    
    currentNode.connect(dryGain);
    currentNode.connect(wetGain);
    
    dryGain.gain.value = 1;
    wetGain.gain.value = 1;
    
    postEffectGain.gain.value = compensationGain;
    
    dryGain.connect(postEffectGain);
    wetGain.connect(postEffectGain);
    
    // Send effects
    const sendBus = audioContext.createGain();
    postEffectGain.connect(sendBus);
    
    // Reverb send
    if (globalParams.reverb.enabled && effectsChain.reverb) {
      const reverbSend = audioContext.createGain();
      reverbSend.gain.value = globalParams.reverb.mix;
      
      if (effectsChain.reverb.currentPreset !== globalParams.reverb.preset) {
        effectsChain.reverb.convolver.buffer = effectsChain.reverb.presets[globalParams.reverb.preset];
        effectsChain.reverb.currentPreset = globalParams.reverb.preset;
      }
      
      sendBus.connect(reverbSend);
      reverbSend.connect(effectsChain.reverb.convolver);
      effectsChain.reverb.convolver.connect(masterGain);
    }
    
    // Gated reverb send
    if (globalParams.gatedReverb.enabled && effectsChain.gatedReverb) {
      const gatedSend = audioContext.createGain();
      gatedSend.gain.value = 0.8;
      
      sendBus.connect(gatedSend);
      gatedSend.connect(effectsChain.gatedReverb.convolver);
      
      // Gate control
      const gateEnv = audioContext.createGain();
      gateEnv.gain.setValueAtTime(1, startTime);
      gateEnv.gain.setValueAtTime(1, startTime + globalParams.gatedReverb.hold / 1000);
      gateEnv.gain.exponentialRampToValueAtTime(0.01, startTime + globalParams.gatedReverb.hold / 1000 + globalParams.gatedReverb.decay / 1000);
      
      effectsChain.gatedReverb.convolver.connect(gateEnv);
      gateEnv.connect(masterGain);
    }
    
    // Delay send
    if (globalParams.delay.enabled && effectsChain.delay) {
      const delaySend = audioContext.createGain();
      delaySend.gain.value = globalParams.delay.mix;
      
      if (globalParams.delay.pingPong) {
        sendBus.connect(delaySend);
        delaySend.connect(effectsChain.delay.splitter);
        effectsChain.delay.delayL.delayTime.value = globalParams.delay.time / 1000;
        effectsChain.delay.delayR.delayTime.value = globalParams.delay.time / 1000;
        effectsChain.delay.feedbackL.gain.value = globalParams.delay.feedback;
        effectsChain.delay.feedbackR.gain.value = globalParams.delay.feedback;
        effectsChain.delay.merger.connect(masterGain);
      } else {
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
      effectsChain.stereoWidth.midGain.gain.value = 2 - width;
      effectsChain.stereoWidth.sideGain.gain.value = width;
    }
    
    postEffectGain.connect(masterGain);
    
    // Generate sound
    const baseVolume = params.volume * referenceGain;
    
    // Apply reverse envelope if needed
    const duration = getInstrumentDuration(inst.id);
    
    if (reverse) {
      oscGain.gain.setValueAtTime(0.01, startTime);
      oscGain.gain.exponentialRampToValueAtTime(baseVolume, startTime + duration);
    } else {
      oscGain.gain.setValueAtTime(baseVolume, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    }
    
    // Generate instrument-specific sound
    generateInstrumentSound(inst, osc, oscGain, panner, dryGain, wetGain, 
                           startTime, baseVolume, pitchMultiplier, params);
  }

  // Get instrument duration
  function getInstrumentDuration(instId) {
    const durations = {
      kick: 0.5,
      snare: 0.2,
      hihat: 0.05,
      openhat: 0.3,
      clap: 0.1,
      crash: 1.5,
      rim: 0.05,
      cowbell: 0.2
    };
    return durations[instId] || 0.1;
  }

  // Generate instrument-specific sounds
  function generateInstrumentSound(inst, osc, oscGain, panner, dryGain, wetGain, 
                                  startTime, baseVolume, pitchMultiplier, params) {
    const now = startTime;
    
    switch(inst.id) {
      case 'kick':
        osc.frequency.setValueAtTime(150 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'snare':
        osc.frequency.setValueAtTime(inst.frequency * pitchMultiplier, now);
        
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
        
        const hihatFilter = audioContext.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 5000;
        hihatFilter.Q.value = 1;
        
        panner.disconnect();
        panner.connect(hihatFilter);
        hihatFilter.connect(dryGain);
        hihatFilter.connect(wetGain);
        
        const duration = inst.id === 'openhat' ? 0.3 : 0.05;
        osc.start(now);
        osc.stop(now + duration);
        break;

      case 'clap':
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
          
          const startT = now + i * 0.01;
          clapGain.gain.setValueAtTime(baseVolume * 0.3, startT);
          clapGain.gain.exponentialRampToValueAtTime(0.01, startT + 0.02);
          
          clapOsc.start(startT);
          clapOsc.stop(startT + 0.02);
        }
        
        osc.frequency.value = inst.frequency * pitchMultiplier;
        oscGain.gain.setValueAtTime(0, now);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'crash':
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
        
        oscGain.gain.value = 0;
        osc.start(now);
        osc.stop(now + 0.01);
        break;

      case 'rim':
        osc.type = 'sine';
        osc.frequency.value = inst.frequency * pitchMultiplier;
        
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
        
        osc.start(now);
        osc.stop(now + 0.05);
        clickOsc.start(now);
        clickOsc.stop(now + 0.01);
        break;

      case 'cowbell':
        const cowbellOsc2 = audioContext.createOscillator();
        const cowbellGain2 = audioContext.createGain();
        
        osc.frequency.value = inst.frequency * pitchMultiplier;
        cowbellOsc2.frequency.value = inst.frequency * 1.48 * pitchMultiplier;
        
        cowbellOsc2.connect(cowbellGain2);
        cowbellGain2.connect(panner);
        
        cowbellGain2.gain.setValueAtTime(baseVolume * 0.3, now);
        cowbellGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        cowbellOsc2.start(now);
        cowbellOsc2.stop(now + 0.2);
        break;

      default:
        osc.frequency.value = inst.frequency * pitchMultiplier;
        osc.start(now);
        osc.stop(now + 0.1);
    }
  }

  // Sequencer functions
  function advanceSequencer() {
    document.querySelectorAll('.dm-step').forEach(el => {
      el.classList.remove('playing');
    });

    // Apply swing and humanize
    let swingDelay = 0;
    if (globalParams.swing > 0 && currentStep % 2 === 1) {
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const stepTime = (60 / tempo / 4);
      swingDelay = stepTime * (globalParams.swing / 100) * 0.5;
    }

    // Add humanize timing
    const humanizeDelay = globalParams.humanize ? (Math.random() - 0.5) * globalParams.humanize * 0.01 : 0;

    setTimeout(() => {
      instruments.forEach(inst => {
        const el = document.querySelector(`[data-instrument="${inst.id}"][data-step="${currentStep}"]`);
        if (el) {
          el.classList.add('playing');
          if (pattern[inst.id][currentStep]) {
            // Add humanize velocity
            const humanizeVelocity = globalParams.humanize ? 
              1 + (Math.random() - 0.5) * globalParams.humanize * 0.02 : 1;
            
            const originalVolume = globalParams.instrumentParams[inst.id].volume;
            globalParams.instrumentParams[inst.id].volume *= humanizeVelocity;
            
            playSound(inst.id);
            
            globalParams.instrumentParams[inst.id].volume = originalVolume;
          }
        }
      });

      // Tape stop effect
      if (globalParams.tapeStop.enabled && globalParams.tapeStop.active) {
        const currentTempo = parseInt(document.getElementById('dmTempoSlider').value);
        const slowdown = currentTempo * (1 - globalParams.tapeStop.speed / 100);
        document.getElementById('dmTempoSlider').value = slowdown;
        document.getElementById('dmTempoDisplay').textContent = `${Math.round(slowdown)} BPM`;
        
        setTimeout(() => {
          globalParams.tapeStop.active = false;
          document.getElementById('dmTempoSlider').value = currentTempo;
          document.getElementById('dmTempoDisplay').textContent = `${currentTempo} BPM`;
          if (isPlaying) {
            pause();
            play();
          }
        }, 2000);
      }
    }, (swingDelay + humanizeDelay) * 1000);

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

  // Pattern manipulation functions
  function toggleStep(e) {
    const inst = e.target.dataset.instrument;
    const step = parseInt(e.target.dataset.step);
    
    pattern[inst][step] = pattern[inst][step] ? 0 : 1;
    e.target.classList.toggle('active');
  }

  function toggleAccent(e) {
    e.target.classList.toggle('accent');
  }

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

  // Random pattern generation
  function randomizePattern() {
    instruments.forEach(inst => {
      for (let i = 0; i < STEPS; i++) {
        // Different probability for different instruments
        let probability = 0.3;
        if (inst.id === 'kick') probability = 0.4;
        if (inst.id === 'hihat') probability = 0.5;
        if (inst.id === 'crash') probability = 0.05;
        
        pattern[inst.id][i] = Math.random() < probability ? 1 : 0;
      }
    });
    updatePattern();
  }

  function randomizeKit() {
    const kits = Object.keys(instrumentConfigs);
    const randomKit = kits[Math.floor(Math.random() * kits.length)];
    document.getElementById('dmKitSelect').value = randomKit;
    changeConfiguration(randomKit);
  }

  function randomizeEffects() {
    // Randomly enable/disable effects
    globalParams.reverb.enabled = Math.random() > 0.5;
    globalParams.delay.enabled = Math.random() > 0.5;
    globalParams.filter.enabled = Math.random() > 0.5;
    globalParams.distortion.enabled = Math.random() > 0.7;
    globalParams.chorus.enabled = Math.random() > 0.7;
    
    // Randomize some parameters
    if (globalParams.reverb.enabled) {
      globalParams.reverb.mix = Math.random() * 0.5;
    }
    if (globalParams.delay.enabled) {
      globalParams.delay.time = Math.random() * 500 + 100;
      globalParams.delay.feedback = Math.random() * 0.5;
    }
    if (globalParams.filter.enabled) {
      globalParams.filter.frequency = Math.random() * 10000 + 500;
    }
    
    updateAllControls();
  }

  // Preset management
  function loadPreset(presetName) {
    if (presets[presetName]) {
      currentPreset = presetName;
      
      instruments.forEach(inst => {
        const presetData = presets[presetName][inst.id];
        if (presetData) {
          for (let i = 0; i < 32; i++) {
            if (i < 16) {
              pattern[inst.id][i] = presetData[i] || 0;
            } else {
              pattern[inst.id][i] = presetData[i - 16] || 0;
            }
          }
        }
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

  // Configuration changes
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
            pan: 0,
            layer: false,
            layerVolume: 0.5,
            layerPitch: 12
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
    
    if (currentBarMode === 4 && bars === 8) {
      instruments.forEach(inst => {
        for (let i = 16; i < 32; i++) {
          pattern[inst.id][i] = pattern[inst.id][i - 16];
        }
      });
    }
    
    currentBarMode = bars;
    STEPS = newSteps;
    
    const wrapper = document.querySelector('.dm-wrapper');
    if (bars === 8) {
      wrapper.classList.add('bars-8');
    } else {
      wrapper.classList.remove('bars-8');
    }
    
    createPatternGrid();
    
    if (currentStep >= STEPS) {
      currentStep = 0;
    }
  }

  // Reset to defaults
  function resetToDefaults() {
    if (confirm('Reset all settings to defaults? This will not clear your pattern.')) {
      globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));
      initializeInstrumentParams();
      updateAllControls();
      
      if (isPlaying) {
        pause();
        play();
      }
    }
  }

  // Update all UI controls
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
    
    // Update all effect toggles
    Object.keys(globalParams).forEach(key => {
      if (typeof globalParams[key] === 'object' && 'enabled' in globalParams[key]) {
        const effectName = key.charAt(0).toUpperCase() + key.slice(1);
        updateEffectUI(effectName, globalParams[key]);
      }
    });
    
    createMixerChannels();
  }

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
  }

  // Knob controls setup
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
          const panValue = Math.max(-50, Math.min(50, Math.round((value - 50) * 50 / 50)));
          const rotation = panValue * 2.7;
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pan = panValue / 50;
          valueDisplay.textContent = panValue === 0 ? 'C' : panValue > 0 ? panValue + 'R' : Math.abs(panValue) + 'L';
        } else if (param === 'pitch') {
          const pitchValue = Math.max(-24, Math.min(24, Math.round((value - 50) * 24 / 50)));
          const rotation = pitchValue * 5.625;
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pitch = pitchValue;
          valueDisplay.textContent = pitchValue > 0 ? '+' + pitchValue : pitchValue.toString();
        }
      };

      const inst = knob.dataset.instrument;
      const param = knob.dataset.param;
      if (param === 'pan') {
        updateKnob(50 + globalParams.instrumentParams[inst].pan * 50);
      } else if (param === 'pitch') {
        updateKnob(50 + globalParams.instrumentParams[inst].pitch * 50 / 24);
      }

      knob.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        
        if (param === 'pan') {
          startValue = 50 + globalParams.instrumentParams[inst].pan * 50;
        } else if (param === 'pitch') {
          startValue = 50 + globalParams.instrumentParams[inst].pitch * 50 / 24;
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

  // WAV export with high quality
  async function downloadLoop() {
    initAudio();

    const downloadBtn = document.getElementById('dmDownloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.querySelector('span:last-child').textContent = 'RENDERING...';

    try {
      const tempo = parseInt(document.getElementById('dmTempoSlider').value);
      const stepDuration = (60 / tempo / 4);
      const loopDuration = stepDuration * STEPS;
      const sampleRate = 48000;
      const numberOfChannels = 2;
      const length = Math.ceil(sampleRate * loopDuration);

      const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      
      const offlineMaster = offlineContext.createGain();
      offlineMaster.gain.value = globalParams.masterVolume;
      
      const offlineLimiter = offlineContext.createDynamicsCompressor();
      offlineLimiter.threshold.value = -1;
      offlineLimiter.knee.value = 0;
      offlineLimiter.ratio.value = 20;
      offlineLimiter.attack.value = 0.001;
      offlineLimiter.release.value = 0.01;
      
      offlineMaster.connect(offlineLimiter);
      offlineLimiter.connect(offlineContext.destination);

      for (let step = 0; step < STEPS; step++) {
        const stepTime = step * stepDuration;
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step]) {
            // Simplified offline rendering
            const osc = offlineContext.createOscillator();
            const gain = offlineContext.createGain();
            
            osc.frequency.value = inst.frequency;
            gain.gain.setValueAtTime(0.5, stepTime);
            gain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.1);
            
            osc.connect(gain);
            gain.connect(offlineMaster);
            
            osc.start(stepTime);
            osc.stop(stepTime + 0.1);
          }
        });
      }

      const renderedBuffer = await offlineContext.startRendering();
      
      // Normalize
      let maxLevel = 0;
      for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
        const channelData = renderedBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          maxLevel = Math.max(maxLevel, Math.abs(channelData[i]));
        }
      }
      
      const normalizeGain = maxLevel > 0.95 ? 0.95 / maxLevel : 1;
      
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

  // Setup all event listeners
  function setupEventListeners() {
    // Transport
    document.getElementById('dmPlayBtn')?.addEventListener('click', play);
    document.getElementById('dmStopBtn')?.addEventListener('click', stop);
    document.getElementById('dmClearBtn')?.addEventListener('click', clear);
    document.getElementById('dmResetBtn')?.addEventListener('click', resetToDefaults);
    document.getElementById('dmDownloadBtn')?.addEventListener('click', downloadLoop);
    
    // Random buttons
    document.getElementById('dmRandomBtn')?.addEventListener('click', () => {
      const randomType = Math.floor(Math.random() * 3);
      switch(randomType) {
        case 0:
          randomizePattern();
          break;
        case 1:
          randomizeKit();
          break;
        case 2:
          randomizeEffects();
          break;
      }
    });
    
    // Record button (automation placeholder)
    document.getElementById('dmRecordBtn')?.addEventListener('click', () => {
      globalParams.automation.recording = !globalParams.automation.recording;
      document.getElementById('dmRecordBtn').classList.toggle('active');
    });

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

    // Panel toggles
    document.getElementById('dmMixerToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.add('active');
      document.getElementById('dmEffectsPanel').classList.remove('active');
      document.getElementById('dmCreativePanel').classList.remove('active');
      document.getElementById('dmMixerToggle').classList.add('active');
      document.getElementById('dmEffectsToggle').classList.remove('active');
      document.getElementById('dmCreativeToggle').classList.remove('active');
    });

    document.getElementById('dmEffectsToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.remove('active');
      document.getElementById('dmEffectsPanel').classList.add('active');
      document.getElementById('dmCreativePanel').classList.remove('active');
      document.getElementById('dmMixerToggle').classList.remove('active');
      document.getElementById('dmEffectsToggle').classList.add('active');
      document.getElementById('dmCreativeToggle').classList.remove('active');
    });

    document.getElementById('dmCreativeToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.remove('active');
      document.getElementById('dmEffectsPanel').classList.remove('active');
      document.getElementById('dmCreativePanel').classList.add('active');
      document.getElementById('dmMixerToggle').classList.remove('active');
      document.getElementById('dmEffectsToggle').classList.remove('active');
      document.getElementById('dmCreativeToggle').classList.add('active');
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

    // Creative effect buttons
    document.getElementById('dmTapeStopBtn')?.addEventListener('click', () => {
      globalParams.tapeStop.enabled = !globalParams.tapeStop.enabled;
      document.getElementById('dmTapeStopBtn').classList.toggle('active');
    });

    document.getElementById('dmStutterBtn')?.addEventListener('click', () => {
      globalParams.stutter.enabled = !globalParams.stutter.enabled;
      document.getElementById('dmStutterBtn').classList.toggle('active');
    });

    document.getElementById('dmGlitchBtn')?.addEventListener('click', () => {
      globalParams.glitch.enabled = !globalParams.glitch.enabled;
      document.getElementById('dmGlitchBtn').classList.toggle('active');
    });

    document.getElementById('dmReverseBtn')?.addEventListener('click', () => {
      globalParams.reverse.enabled = !globalParams.reverse.enabled;
      document.getElementById('dmReverseBtn').classList.toggle('active');
    });

    document.getElementById('dmGranularBtn')?.addEventListener('click', () => {
      globalParams.granular.enabled = !globalParams.granular.enabled;
      document.getElementById('dmGranularBtn').classList.toggle('active');
    });

    document.getElementById('dmLayeringBtn')?.addEventListener('click', () => {
      globalParams.layering = !globalParams.layering;
      document.getElementById('dmLayeringBtn').classList.toggle('active');
    });

    // Tape stop trigger
    document.getElementById('dmTapeStopTrigger')?.addEventListener('click', () => {
      globalParams.tapeStop.active = true;
    });

    // Setup all effect controls
    setupAllEffectControls();
  }

  // Setup effect controls
  function setupAllEffectControls() {
    // Standard effects
    setupEffectToggle('dmReverbToggle', 'reverb');
    setupEffectSliders('Reverb', 'reverb');
    
    setupEffectToggle('dmDelayToggle', 'delay');
    setupEffectSliders('Delay', 'delay');
    
    setupEffectToggle('dmFilterToggle', 'filter');
    setupEffectSliders('Filter', 'filter');
    
    setupEffectToggle('dmCompToggle', 'compression');
    setupEffectSliders('Comp', 'compression');
    
    setupEffectToggle('dmDistToggle', 'distortion');
    setupEffectSliders('Dist', 'distortion');
    
    setupEffectToggle('dmChorusToggle', 'chorus');
    setupEffectSliders('Chorus', 'chorus');
    
    setupEffectToggle('dmPhaserToggle', 'phaser');
    setupEffectSliders('Phaser', 'phaser');
    
    setupEffectToggle('dmBitcrusherToggle', 'bitcrusher');
    setupEffectSliders('Bitcrusher', 'bitcrusher');
    
    setupEffectToggle('dmStereoWidthToggle', 'stereoWidth');
    setupEffectSliders('StereoWidth', 'stereoWidth');
    
    // Creative effects
    setupEffectToggle('dmGatedReverbToggle', 'gatedReverb');
    setupEffectSliders('GatedReverb', 'gatedReverb');
    
    setupEffectToggle('dmTapeStopToggle', 'tapeStop');
    setupEffectSliders('TapeStop', 'tapeStop');
    
    setupEffectToggle('dmStutterToggle', 'stutter');
    setupEffectSliders('Stutter', 'stutter');
    
    setupEffectToggle('dmGlitchToggle', 'glitch');
    setupEffectSliders('Glitch', 'glitch');
    
    setupEffectToggle('dmReverseToggle', 'reverse');
    setupEffectSliders('Reverse', 'reverse');
    
    setupEffectToggle('dmGranularToggle', 'granular');
    setupEffectSliders('Granular', 'granular');
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

  function setupEffectSliders(effectPrefix, effectName) {
    const sliders = document.querySelectorAll(`[id^="dm${effectPrefix}"]`);
    sliders.forEach(slider => {
      if (slider.type === 'range') {
        slider.addEventListener('input', (e) => {
          const paramName = slider.id.replace(`dm${effectPrefix}`, '').toLowerCase();
          const valueDisplay = document.getElementById(slider.id + 'Val');
          
          if (valueDisplay) {
            const value = parseFloat(e.target.value);
            valueDisplay.textContent = formatEffectValue(effectName, paramName, value);
            updateEffectParameter(effectName, paramName, value);
          }
        });
      }
    });
  }

  function formatEffectValue(effectName, paramName, value) {
    // Format based on parameter type
    if (paramName.includes('time') || paramName.includes('delay') || 
        paramName.includes('hold') || paramName.includes('decay') || 
        paramName.includes('release') || paramName.includes('attack')) {
      return `${value}ms`;
    } else if (paramName.includes('frequency') || paramName.includes('cutoff')) {
      return value >= 1000 ? `${(value/1000).toFixed(1)}kHz` : `${value}Hz`;
    } else if (paramName.includes('rate')) {
      return `${value}Hz`;
    } else if (paramName.includes('threshold')) {
      return `${value}dB`;
    } else if (paramName.includes('ratio')) {
      return `${value}:1`;
    } else if (paramName.includes('bits')) {
      return value.toString();
    } else if (paramName.includes('downsample')) {
      return `${value}x`;
    } else if (paramName.includes('stages')) {
      return value.toString();
    } else if (paramName.includes('division')) {
      return `1/${value}`;
    } else if (paramName.includes('grainsize')) {
      return `${value}ms`;
    } else if (paramName.includes('pitch')) {
      return value > 0 ? `+${value}` : value.toString();
    } else {
      return `${Math.round(value)}%`;
    }
  }

  function updateEffectParameter(effectName, paramName, value) {
    // Update the actual parameter value
    const param = paramName.charAt(0).toLowerCase() + paramName.slice(1);
    
    if (globalParams[effectName] && param in globalParams[effectName]) {
      // Convert percentage values
      if (param.includes('mix') || param.includes('probability') || 
          param.includes('depth') || param.includes('overlap') || 
          param.includes('intensity') || param.includes('frequency')) {
        globalParams[effectName][param] = value / 100;
      } else {
        globalParams[effectName][param] = value;
      }
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
    resetToDefaults: resetToDefaults,
    randomizePattern: randomizePattern,
    randomizeKit: randomizeKit,
    randomizeEffects: randomizeEffects
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
