// Drum Machine Pro - Complete MVP Implementation with Repository Integration
(function() {
  'use strict';
  
  // Configuration
  let STEPS = 16;
  let currentBarMode = 4;
  
  // Audio constants
  const REFERENCE_LEVEL = -18; // dBFS
  const HEADROOM = 6; // dB
  const MASTER_GAIN_DEFAULT = 0.7;
  
  // Repository configuration
  const REPO_BASE_URL = 'https://casa24records.github.io/Drum-Machine-PRO';
  const MANIFEST_URL = `${REPO_BASE_URL}/manifest.json`;
  
  // Instrument mapping (UI labels to repository instrument IDs)
  const instrumentMapping = [
    { id: 'kick', label: 'KICK', icon: '🥁', repoId: 'kick' },
    { id: 'snare', label: 'SNARE', icon: '🎯', repoId: 'snare' },
    { id: 'hihat', label: 'HI-HAT', icon: '🎩', repoId: 'hihat' },
    { id: 'openhat', label: 'OPEN', icon: '🔓', repoId: 'open' },
    { id: 'clap', label: 'CLAP', icon: '👏', repoId: 'clap' },
    { id: 'crash', label: 'CRASH', icon: '💥', repoId: 'crash' },
    { id: 'rim', label: 'RIM', icon: '🗑️', repoId: 'rim' },
    { id: 'cowbell', label: 'BELL', icon: '🔔', repoId: 'bell' }
  ];
  
  // Current configuration
  let currentSoundkit = null;
  let availableSoundkits = [];
  let instruments = instrumentMapping;
  let audioBuffers = {};

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

  // Updated preset patterns with the three specified patterns
  const presets = {
    "Traffic jam groove": {
      bpm: 109,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
      cowbell: [0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0]
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
    },
    "Minimal": {
      bpm: 120,
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      hihat:   [0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0]
    },
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
  let schedulerTimer = null;
  let nextStepTime = 0.0;
  let lookahead = 25.0; // ms
  let scheduleAheadTime = 0.1; // seconds
  let stepQueue = [];

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

  // Load soundkits from repository
  async function loadAvailableSoundkits() {
    try {
      const response = await fetch(MANIFEST_URL);
      const manifest = await response.json();
      
      availableSoundkits = manifest.soundkits;
      
      // Update the dropdown
      const kitSelect = document.getElementById('dmKitSelect');
      if (kitSelect) {
        kitSelect.innerHTML = availableSoundkits.map(kit => 
          `<option value="${kit.id}">${kit.name.toUpperCase()}</option>`
        ).join('');
        
        // Load the first soundkit
        if (availableSoundkits.length > 0) {
          await loadSoundkit(availableSoundkits[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load soundkits:', error);
    }
  }

  // Load a specific soundkit
  async function loadSoundkit(soundkitId) {
    const kit = availableSoundkits.find(k => k.id === soundkitId);
    if (!kit) return;
    
    currentSoundkit = kit;
    
    if (!audioContext) {
      initAudio();
    }
    
    // Clear existing buffers
    audioBuffers = {};
    
    // Load all instrument samples
    const loadPromises = instruments.map(async (inst) => {
      const repoInstrument = kit.instruments[inst.repoId];
      if (repoInstrument) {
        const url = `${REPO_BASE_URL}/samples/${repoInstrument}`;
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers[inst.id] = audioBuffer;
        } catch (error) {
          console.error(`Failed to load ${inst.id}:`, error);
        }
      }
    });
    
    await Promise.all(loadPromises);
    console.log(`Loaded soundkit: ${kit.name}`);
  }

  // Create the drum machine HTML
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;

    container.innerHTML = `
      <div class="dm-wrapper">
        <style>
          /* Drum Machine Pro Styles - Complete MVP Implementation */
          .dm-wrapper {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            user-select: none;
            -webkit-user-select: none;
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
            font-family: 'Courier New', monospace;
            font-size: 2.5rem;
            font-weight: bold;
            color: #00a651;
            text-shadow: 0 0 10px rgba(0, 166, 81, 0.5);
            margin: 0;
            letter-spacing: 2px;
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
            font-family: inherit;
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
            font-family: inherit;
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

          /* Creative Effects Section */
          .dm-creative-section {
            background: rgba(0, 0, 0, 0.4);
            border-radius: 0.75rem;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .dm-creative-header {
            text-align: center;
            color: #00a651;
            font-size: 1rem;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 1rem;
            letter-spacing: 2px;
          }

          .dm-creative-controls {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
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
            font-weight: bold;
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
            border: none;
            outline: none;
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

          /* Visually hidden for accessibility */
          .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
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
              <label for="dmMasterSlider" class="dm-master-label">MASTER</label>
              <input type="range" class="dm-master-slider" id="dmMasterSlider" 
                     min="0" max="100" value="${Math.round(globalParams.masterVolume * 100)}"
                     aria-label="Master volume">
              <span class="dm-master-value" id="dmMasterValue">${Math.round(globalParams.masterVolume * 100)}%</span>
            </div>
            <div class="dm-kit-selector">
              <label for="dmKitSelect" class="dm-kit-label">Sound Kit:</label>
              <select class="dm-kit-select" id="dmKitSelect" aria-label="Sound kit selector">
                <!-- Will be populated dynamically -->
              </select>
            </div>
            <div class="dm-bar-selector">
              <label for="dmBarSelect" class="dm-bar-label">Pattern:</label>
              <select class="dm-bar-select" id="dmBarSelect" aria-label="Pattern length selector">
                <option value="4">4 BARS</option>
                <option value="8">8 BARS</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Transport Controls -->
        <div class="dm-transport">
          <button class="dm-btn" id="dmPlayBtn" aria-label="Play or pause playback">
            <span class="dm-btn-icon" aria-hidden="true">▶</span>
            <span>PLAY</span>
          </button>
          <button class="dm-btn" id="dmStopBtn" aria-label="Stop playback">
            <span class="dm-btn-icon" aria-hidden="true">■</span>
            <span>STOP</span>
          </button>
          <button class="dm-btn" id="dmClearBtn" aria-label="Clear all patterns">
            <span class="dm-btn-icon" aria-hidden="true">✕</span>
            <span>CLEAR PATTERN</span>
          </button>
          <button class="dm-btn reset" id="dmResetBtn" aria-label="Reset all settings to defaults">
            <span class="dm-btn-icon" aria-hidden="true">↺</span>
            <span>RESET</span>
          </button>
          
          <div class="dm-tempo-control">
            <label for="dmTempoSlider" class="visually-hidden">Tempo</label>
            <input type="range" class="dm-tempo-slider" id="dmTempoSlider" 
                   min="60" max="200" value="120" aria-label="Tempo in BPM">
            <div class="dm-tempo-display" id="dmTempoDisplay" aria-live="polite">120 BPM</div>
          </div>

          <button class="dm-btn" id="dmDownloadBtn" aria-label="Export pattern as WAV file">
            <span class="dm-btn-icon" aria-hidden="true">💾</span>
            <span>EXPORT</span>
          </button>
        </div>

        <!-- Creative FX Section -->
        <div class="dm-creative-section">
          <div class="dm-creative-header">CREATIVE FX</div>
          <div class="dm-creative-controls">
            <button class="dm-creative-btn" id="dmTapeStopBtn" aria-label="Toggle tape stop effect">TAPE STOP</button>
            <button class="dm-creative-btn" id="dmStutterBtn" aria-label="Toggle stutter effect">STUTTER</button>
            <button class="dm-creative-btn" id="dmGlitchBtn" aria-label="Toggle glitch effect">GLITCH</button>
            <button class="dm-creative-btn" id="dmReverseBtn" aria-label="Toggle reverse effect">REVERSE</button>
            <button class="dm-creative-btn" id="dmGranularBtn" aria-label="Toggle granular effect">GRANULAR</button>
            <button class="dm-creative-btn" id="dmLayeringBtn" aria-label="Toggle layering">LAYERING</button>
          </div>
        </div>

        <!-- Preset Buttons -->
        <div class="dm-presets">
          <div class="dm-preset-section-title">PATTERNS</div>
          <button class="dm-preset-btn" data-preset="Traffic jam groove" aria-label="Load Traffic jam groove preset">Traffic jam groove</button>
          <button class="dm-preset-btn" data-preset="Robofunk" aria-label="Load Robofunk preset">Robofunk</button>
          <button class="dm-preset-btn" data-preset="Power pose" aria-label="Load Power pose preset">Power pose</button>
          <button class="dm-preset-btn" data-preset="Future Funk" aria-label="Load Future Funk preset">Future Funk</button>
        </div>

        <!-- Panel Toggle -->
        <div class="dm-panel-toggle" role="tablist">
          <button class="dm-toggle-btn active" id="dmMixerToggle" role="tab" aria-selected="true" aria-controls="dmMixerPanel">MIXER</button>
          <button class="dm-toggle-btn" id="dmEffectsToggle" role="tab" aria-selected="false" aria-controls="dmEffectsPanel">EFFECTS</button>
          <button class="dm-toggle-btn" id="dmCreativeToggle" role="tab" aria-selected="false" aria-controls="dmCreativePanel">CREATIVE FX</button>
        </div>

        <!-- Mixer Panel -->
        <div class="dm-mixer-panel active" id="dmMixerPanel" role="tabpanel" aria-labelledby="dmMixerToggle">
          <div class="dm-mixer-tracks" id="dmMixerTracks">
            <!-- Mixer channels will be generated here -->
          </div>
        </div>

        <!-- Effects Panel -->
        <div class="dm-effects-panel" id="dmEffectsPanel" role="tabpanel" aria-labelledby="dmEffectsToggle">
          <div class="dm-effects-grid" id="dmEffectsGrid">
            <!-- Effects will be generated here -->
          </div>
        </div>

        <!-- Creative Panel -->
        <div class="dm-creative-panel" id="dmCreativePanel" role="tabpanel" aria-labelledby="dmCreativeToggle">
          <div class="dm-effects-grid" id="dmCreativeGrid">
            <!-- Creative effects will be generated here -->
          </div>
        </div>

        <!-- Pattern Grid -->
        <div class="dm-pattern-container">
          <!-- Step Numbers -->
          <div class="dm-step-indicator" id="dmStepIndicator" aria-hidden="true">
            <!-- Will be generated dynamically -->
          </div>

          <!-- Pattern Grid -->
          <div class="dm-pattern-grid" id="dmPatternGrid" role="grid" aria-label="Drum pattern sequencer">
            <!-- Tracks will be generated here -->
          </div>
        </div>
      </div>
    `;

    // Initialize after creating HTML
    loadAvailableSoundkits().then(() => {
      createPatternGrid();
      createMixerChannels();
      createEffectsPanel();
      createCreativePanel();
      setupEventListeners();
      loadPreset('Traffic jam groove');
    });
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
      track.setAttribute('role', 'row');

      // Track header with proper spacing for M and S buttons
      const header = document.createElement('div');
      header.className = 'dm-track-header';
      header.setAttribute('role', 'rowheader');
      header.innerHTML = `
        <span class="dm-track-icon" aria-hidden="true">${inst.icon}</span>
        <span class="dm-track-label">${inst.label}</span>
        <div class="dm-track-controls">
          <button class="dm-track-btn" data-track="${inst.id}" data-action="mute" 
                  title="Mute ${inst.label}" aria-label="Mute ${inst.label}">M</button>
          <button class="dm-track-btn" data-track="${inst.id}" data-action="solo" 
                  title="Solo ${inst.label}" aria-label="Solo ${inst.label}">S</button>
        </div>
      `;
      track.appendChild(header);

      // Step buttons
      for (let i = 0; i < STEPS; i++) {
        const step = document.createElement('button');
        step.className = `dm-step`;
        step.dataset.instrument = inst.id;
        step.dataset.step = i;
        step.setAttribute('role', 'gridcell');
        step.setAttribute('aria-label', `${inst.label} step ${i + 1}`);
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
        <label for="fader-${inst.id}" class="visually-hidden">Volume for ${inst.label}</label>
        <input type="range" class="dm-mixer-fader" 
               id="fader-${inst.id}"
               orient="vertical"
               min="0" max="100" value="${Math.round(params.volume * 100)}"
               data-instrument="${inst.id}"
               data-param="volume"
               aria-label="Volume for ${inst.label}">
        <div class="dm-mixer-value">${Math.round(params.volume * 100)}%</div>
        
        <div class="dm-mixer-knobs">
          <div class="dm-knob">
            <div class="dm-knob-label">PAN</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pan"
                 role="slider" aria-label="Pan for ${inst.label}" 
                 aria-valuenow="${panValue}" aria-valuemin="-50" aria-valuemax="50"
                 tabindex="0">
              <div class="dm-knob-indicator"></div>
            </div>
            <div class="dm-knob-value">${panValue === 0 ? 'C' : panValue > 0 ? panValue + 'R' : Math.abs(panValue) + 'L'}</div>
          </div>
          <div class="dm-knob">
            <div class="dm-knob-label">PITCH</div>
            <div class="dm-knob-control" data-instrument="${inst.id}" data-param="pitch"
                 role="slider" aria-label="Pitch for ${inst.label}"
                 aria-valuenow="${pitchValue}" aria-valuemin="-24" aria-valuemax="24"
                 tabindex="0">
              <div class="dm-knob-indicator"></div>
            </div>
            <div class="dm-knob-value">${pitchValue > 0 ? '+' : ''}${pitchValue}</div>
          </div>
        </div>
        
        <div class="dm-layer-toggle">
          <button class="dm-layer-btn ${params.layer ? 'active' : ''}" 
                  data-instrument="${inst.id}"
                  aria-label="Toggle layer for ${inst.label}"
                  aria-pressed="${params.layer}">
            LAYER ${params.layer ? 'ON' : 'OFF'}
          </button>
        </div>
      `;

      mixerTracks.appendChild(channel);
    });

    // Setup fader listeners with real-time updates
    document.querySelectorAll('.dm-mixer-fader').forEach(fader => {
      fader.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseInt(e.target.value);
        globalParams.instrumentParams[inst].volume = value / 100;
        e.target.parentElement.querySelector('.dm-mixer-value').textContent = `${value}%`;
      });
    });

    // Setup layer buttons with real-time response
    document.querySelectorAll('.dm-layer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const inst = e.target.dataset.instrument;
        globalParams.instrumentParams[inst].layer = !globalParams.instrumentParams[inst].layer;
        e.target.classList.toggle('active');
        e.target.setAttribute('aria-pressed', globalParams.instrumentParams[inst].layer);
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
          <button class="dm-effect-toggle" id="dmReverbToggle" 
                  aria-label="Toggle reverb effect" 
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmReverbMix" class="dm-effect-param-label">Mix</label>
            <span class="dm-effect-param-value" id="dmReverbMixVal">25%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmReverbMix" min="0" max="100" value="25">
          <div class="dm-effect-param">
            <label for="dmReverbPredelay" class="dm-effect-param-label">PreDelay</label>
            <span class="dm-effect-param-value" id="dmReverbPredelayVal">0ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmReverbPredelay" min="0" max="100" value="0">
          <div class="dm-effect-preset-selector">
            <button class="dm-effect-preset-btn active" data-preset="room" aria-label="Room reverb preset">ROOM</button>
            <button class="dm-effect-preset-btn" data-preset="hall" aria-label="Hall reverb preset">HALL</button>
            <button class="dm-effect-preset-btn" data-preset="plate" aria-label="Plate reverb preset">PLATE</button>
            <button class="dm-effect-preset-btn" data-preset="cathedral" aria-label="Cathedral reverb preset">CATHEDRAL</button>
          </div>
        </div>
      </div>

      <!-- Delay -->
      <div class="dm-effect-unit" id="dmDelayUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">DELAY</span>
          <button class="dm-effect-toggle" id="dmDelayToggle"
                  aria-label="Toggle delay effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmDelayTime" class="dm-effect-param-label">Time</label>
            <span class="dm-effect-param-value" id="dmDelayTimeVal">250ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmDelayTime" min="10" max="2000" value="250">
          <div class="dm-effect-param">
            <label for="dmDelayFeedback" class="dm-effect-param-label">Feedback</label>
            <span class="dm-effect-param-value" id="dmDelayFeedbackVal">30%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmDelayFeedback" min="0" max="85" value="30">
          <div class="dm-effect-param">
            <label for="dmDelayMixSlider" class="dm-effect-param-label">Mix</label>
            <span class="dm-effect-param-value" id="dmDelayMixVal">20%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmDelayMixSlider" min="0" max="100" value="20">
          <div class="dm-effect-preset-selector">
            <button class="dm-effect-preset-btn active" data-mode="normal" aria-label="Normal delay mode">NORMAL</button>
            <button class="dm-effect-preset-btn" data-mode="pingpong" aria-label="Ping-pong delay mode">PING-PONG</button>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="dm-effect-unit" id="dmFilterUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">FILTER</span>
          <button class="dm-effect-toggle" id="dmFilterToggle"
                  aria-label="Toggle filter effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmFilterCutoff" class="dm-effect-param-label">Cutoff</label>
            <span class="dm-effect-param-value" id="dmFilterCutoffVal">20.0kHz</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmFilterCutoff" min="20" max="20000" value="20000" step="1">
          <div class="dm-effect-param">
            <label for="dmFilterResonance" class="dm-effect-param-label">Resonance</label>
            <span class="dm-effect-param-value" id="dmFilterResonanceVal">1.0</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmFilterResonance" min="1" max="30" value="1">
          <div class="dm-filter-mode-selector">
            <button class="dm-filter-mode-btn active" data-mode="lowpass" aria-label="Low-pass filter mode">LOW-PASS</button>
            <button class="dm-filter-mode-btn" data-mode="highpass" aria-label="High-pass filter mode">HIGH-PASS</button>
            <button class="dm-filter-mode-btn" data-mode="bandpass" aria-label="Band-pass filter mode">BAND-PASS</button>
          </div>
        </div>
      </div>

      <!-- Compression -->
      <div class="dm-effect-unit" id="dmCompUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">COMPRESSOR</span>
          <button class="dm-effect-toggle" id="dmCompToggle"
                  aria-label="Toggle compressor effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmCompThreshold" class="dm-effect-param-label">Threshold</label>
            <span class="dm-effect-param-value" id="dmCompThresholdVal">-20dB</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompThreshold" min="-60" max="0" value="-20">
          <div class="dm-effect-param">
            <label for="dmCompRatio" class="dm-effect-param-label">Ratio</label>
            <span class="dm-effect-param-value" id="dmCompRatioVal">4:1</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompRatio" min="1" max="20" value="4">
          <div class="dm-effect-param">
            <label for="dmCompAttack" class="dm-effect-param-label">Attack</label>
            <span class="dm-effect-param-value" id="dmCompAttackVal">3ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompAttack" min="0" max="100" value="3">
          <div class="dm-effect-param">
            <label for="dmCompRelease" class="dm-effect-param-label">Release</label>
            <span class="dm-effect-param-value" id="dmCompReleaseVal">250ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmCompRelease" min="10" max="1000" value="250">
        </div>
      </div>

      <!-- Distortion -->
      <div class="dm-effect-unit" id="dmDistUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">DISTORTION</span>
          <button class="dm-effect-toggle" id="dmDistToggle"
                  aria-label="Toggle distortion effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmDistDrive" class="dm-effect-param-label">Drive</label>
            <span class="dm-effect-param-value" id="dmDistDriveVal">10%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmDistDrive" min="0" max="100" value="10">
          <div class="dm-effect-param">
            <label for="dmDistTone" class="dm-effect-param-label">Tone</label>
            <span class="dm-effect-param-value" id="dmDistToneVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmDistTone" min="0" max="100" value="50">
          <div class="dm-effect-preset-selector">
            <button class="dm-effect-preset-btn active" data-type="soft" aria-label="Soft distortion type">SOFT</button>
            <button class="dm-effect-preset-btn" data-type="hard" aria-label="Hard distortion type">HARD</button>
            <button class="dm-effect-preset-btn" data-type="fuzz" aria-label="Fuzz distortion type">FUZZ</button>
          </div>
        </div>
      </div>

      <!-- Chorus -->
      <div class="dm-effect-unit" id="dmChorusUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">CHORUS</span>
          <button class="dm-effect-toggle" id="dmChorusToggle"
                  aria-label="Toggle chorus effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmChorusRate" class="dm-effect-param-label">Rate</label>
            <span class="dm-effect-param-value" id="dmChorusRateVal">1.5Hz</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmChorusRate" min="0.1" max="10" value="1.5" step="0.1">
          <div class="dm-effect-param">
            <label for="dmChorusDepth" class="dm-effect-param-label">Depth</label>
            <span class="dm-effect-param-value" id="dmChorusDepthVal">30%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmChorusDepth" min="0" max="100" value="30">
          <div class="dm-effect-param">
            <label for="dmChorusMix" class="dm-effect-param-label">Mix</label>
            <span class="dm-effect-param-value" id="dmChorusMixVal">30%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmChorusMix" min="0" max="100" value="30">
        </div>
      </div>

      <!-- Phaser -->
      <div class="dm-effect-unit" id="dmPhaserUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">PHASER</span>
          <button class="dm-effect-toggle" id="dmPhaserToggle"
                  aria-label="Toggle phaser effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmPhaserRate" class="dm-effect-param-label">Rate</label>
            <span class="dm-effect-param-value" id="dmPhaserRateVal">0.5Hz</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserRate" min="0.1" max="10" value="0.5" step="0.1">
          <div class="dm-effect-param">
            <label for="dmPhaserDepth" class="dm-effect-param-label">Depth</label>
            <span class="dm-effect-param-value" id="dmPhaserDepthVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserDepth" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <label for="dmPhaserStages" class="dm-effect-param-label">Stages</label>
            <span class="dm-effect-param-value" id="dmPhaserStagesVal">4</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmPhaserStages" min="2" max="8" value="4" step="2">
        </div>
      </div>

      <!-- Bitcrusher -->
      <div class="dm-effect-unit" id="dmBitcrusherUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">BITCRUSHER</span>
          <button class="dm-effect-toggle" id="dmBitcrusherToggle"
                  aria-label="Toggle bitcrusher effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmBitcrusherBits" class="dm-effect-param-label">Bits</label>
            <span class="dm-effect-param-value" id="dmBitcrusherBitsVal">8</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmBitcrusherBits" min="1" max="16" value="8">
          <div class="dm-effect-param">
            <label for="dmBitcrusherDownsample" class="dm-effect-param-label">Downsample</label>
            <span class="dm-effect-param-value" id="dmBitcrusherDownsampleVal">1x</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmBitcrusherDownsample" min="1" max="20" value="1">
        </div>
      </div>

      <!-- Stereo Width -->
      <div class="dm-effect-unit" id="dmStereoWidthUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">STEREO WIDTH</span>
          <button class="dm-effect-toggle" id="dmStereoWidthToggle"
                  aria-label="Toggle stereo width effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmStereoWidth" class="dm-effect-param-label">Width</label>
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
          <button class="dm-effect-toggle" id="dmGatedReverbToggle"
                  aria-label="Toggle gated reverb effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmGatedReverbThreshold" class="dm-effect-param-label">Threshold</label>
            <span class="dm-effect-param-value" id="dmGatedReverbThresholdVal">-20dB</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbThreshold" min="-60" max="0" value="-20">
          <div class="dm-effect-param">
            <label for="dmGatedReverbHold" class="dm-effect-param-label">Hold</label>
            <span class="dm-effect-param-value" id="dmGatedReverbHoldVal">100ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbHold" min="10" max="500" value="100">
          <div class="dm-effect-param">
            <label for="dmGatedReverbDecay" class="dm-effect-param-label">Decay</label>
            <span class="dm-effect-param-value" id="dmGatedReverbDecayVal">50ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGatedReverbDecay" min="10" max="200" value="50">
        </div>
      </div>

      <!-- Tape Stop -->
      <div class="dm-effect-unit" id="dmTapeStopUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">TAPE STOP</span>
          <button class="dm-effect-toggle" id="dmTapeStopToggle"
                  aria-label="Toggle tape stop effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmTapeStopSpeed" class="dm-effect-param-label">Speed</label>
            <span class="dm-effect-param-value" id="dmTapeStopSpeedVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmTapeStopSpeed" min="10" max="100" value="50">
          <button class="dm-effect-preset-btn" id="dmTapeStopTrigger" aria-label="Trigger tape stop effect">TRIGGER</button>
        </div>
      </div>

      <!-- Stutter -->
      <div class="dm-effect-unit" id="dmStutterUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">STUTTER</span>
          <button class="dm-effect-toggle" id="dmStutterToggle"
                  aria-label="Toggle stutter effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmStutterDivision" class="dm-effect-param-label">Division</label>
            <span class="dm-effect-param-value" id="dmStutterDivisionVal">1/16</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmStutterDivision" min="2" max="32" value="16" step="2">
          <div class="dm-effect-param">
            <label for="dmStutterProbability" class="dm-effect-param-label">Probability</label>
            <span class="dm-effect-param-value" id="dmStutterProbabilityVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmStutterProbability" min="0" max="100" value="50">
        </div>
      </div>

      <!-- Glitch -->
      <div class="dm-effect-unit" id="dmGlitchUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">GLITCH</span>
          <button class="dm-effect-toggle" id="dmGlitchToggle"
                  aria-label="Toggle glitch effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmGlitchIntensity" class="dm-effect-param-label">Intensity</label>
            <span class="dm-effect-param-value" id="dmGlitchIntensityVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGlitchIntensity" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <label for="dmGlitchFrequency" class="dm-effect-param-label">Frequency</label>
            <span class="dm-effect-param-value" id="dmGlitchFrequencyVal">30%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGlitchFrequency" min="0" max="100" value="30">
        </div>
      </div>

      <!-- Reverse -->
      <div class="dm-effect-unit" id="dmReverseUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">REVERSE</span>
          <button class="dm-effect-toggle" id="dmReverseToggle"
                  aria-label="Toggle reverse effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmReverseProbability" class="dm-effect-param-label">Probability</label>
            <span class="dm-effect-param-value" id="dmReverseProbabilityVal">20%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmReverseProbability" min="0" max="100" value="20">
        </div>
      </div>

      <!-- Granular -->
      <div class="dm-effect-unit" id="dmGranularUnit">
        <div class="dm-effect-header">
          <span class="dm-effect-title">GRANULAR</span>
          <button class="dm-effect-toggle" id="dmGranularToggle"
                  aria-label="Toggle granular effect"
                  role="switch" aria-checked="false"></button>
        </div>
        <div class="dm-effect-controls">
          <div class="dm-effect-param">
            <label for="dmGranularGrainSize" class="dm-effect-param-label">Grain Size</label>
            <span class="dm-effect-param-value" id="dmGranularGrainSizeVal">50ms</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGranularGrainSize" min="10" max="200" value="50">
          <div class="dm-effect-param">
            <label for="dmGranularOverlap" class="dm-effect-param-label">Overlap</label>
            <span class="dm-effect-param-value" id="dmGranularOverlapVal">50%</span>
          </div>
          <input type="range" class="dm-effect-slider" id="dmGranularOverlap" min="0" max="100" value="50">
          <div class="dm-effect-param">
            <label for="dmGranularPitch" class="dm-effect-param-label">Pitch</label>
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

  // Replace deprecated ScriptProcessorNode with AudioWorkletProcessor
  function createBitcrusher() {
    // For now, we'll use a workaround with existing nodes
    // In production, you'd register an AudioWorkletProcessor
    const waveshaper = audioContext.createWaveShaper();
    let bits = 8;
    let downsample = 1;
    
    const updateCurve = () => {
      const samples = 256;
      const curve = new Float32Array(samples);
      const step = Math.pow(0.5, bits);
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = step * Math.floor(x / step + 0.5);
      }
      
      waveshaper.curve = curve;
    };
    
    updateCurve();
    
    return { 
      scriptNode: waveshaper, // Using waveshaper as replacement
      setBits: (b) => { bits = b; updateCurve(); },
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
    // Replace with waveshaper-based glitch effect
    const waveshaper = audioContext.createWaveShaper();
    let glitchIntensity = 0.5;
    let glitchFrequency = 0.3;
    
    const updateCurve = () => {
      const samples = 256;
      const curve = new Float32Array(samples);
      
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        
        if (Math.random() < glitchFrequency) {
          // Apply glitch distortion
          curve[i] = Math.round(x * 4) / 4 * glitchIntensity + x * (1 - glitchIntensity);
        } else {
          curve[i] = x;
        }
      }
      
      waveshaper.curve = curve;
    };
    
    updateCurve();
    
    return {
      scriptNode: waveshaper,
      setIntensity: (val) => { glitchIntensity = val; updateCurve(); },
      setFrequency: (val) => { glitchFrequency = val; updateCurve(); }
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

  // Play sound with full effects chain and layering - USING AUDIO BUFFERS
  function playSound(instId, time) {
    if (!audioContext) return;
    if (!audioBuffers[instId]) return;

    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;

    const params = globalParams.instrumentParams[instId];
    const now = time || audioContext.currentTime;

    // Apply reverse probability
    const shouldReverse = globalParams.reverse.enabled && Math.random() < globalParams.reverse.probability;

    // Create main sound
    playSoundCore(instId, params, now, shouldReverse);

    // Create layer if enabled
    if (params.layer) {
      playSoundCore(instId, Object.assign({}, params, {
        volume: params.volume * params.layerVolume,
        pitch: params.pitch + params.layerPitch
      }), now, shouldReverse);
    }

    // Apply stutter effect
    if (globalParams.stutter.enabled && Math.random() < globalParams.stutter.probability) {
      const stutterCount = Math.floor(globalParams.stutter.division / 4);
      const stutterInterval = (60 / parseInt(document.getElementById('dmTempoSlider').value) / globalParams.stutter.division);
      
      for (let i = 1; i < stutterCount; i++) {
        setTimeout(() => {
          playSoundCore(instId, Object.assign({}, params, { volume: params.volume * 0.7 }), 
                       audioContext.currentTime, false);
        }, stutterInterval * i * 1000);
      }
    }
  }

  // Core sound generation using audio buffers
  function playSoundCore(instId, params, startTime, reverse = false) {
    const buffer = audioBuffers[instId];
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    const referenceGain = dbToGain(REFERENCE_LEVEL);
    panner.pan.value = params.pan;
    
    const pitchMultiplier = Math.pow(2, Math.max(-24, Math.min(24, params.pitch)) / 12);
    source.playbackRate.value = pitchMultiplier;
    
    // Reverse the buffer if needed
    if (reverse) {
      const reversedBuffer = audioContext.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
      );
      
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const reversedData = reversedBuffer.getChannelData(channel);
        for (let i = 0; i < buffer.length; i++) {
          reversedData[i] = channelData[buffer.length - 1 - i];
        }
      }
      source.buffer = reversedBuffer;
    } else {
      source.buffer = buffer;
    }
    
    source.connect(gainNode);
    gainNode.connect(panner);
    
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
    
    // Set volume
    const baseVolume = params.volume * referenceGain;
    gainNode.gain.value = baseVolume;
    
    // Start playback
    source.start(startTime);
  }

  // Sequencer functions with lookahead scheduling
  function scheduler() {
    if (!isPlaying) return;
    
    while (nextStepTime < audioContext.currentTime + scheduleAheadTime) {
      scheduleNote(currentStep, nextStepTime);
      nextStep();
    }
    
    schedulerTimer = setTimeout(scheduler, lookahead);
  }

  function scheduleNote(beatNumber, time) {
    // Queue the visual update
    stepQueue.push({ step: beatNumber, time: time });
    
    // Schedule sounds for this step
    instruments.forEach(inst => {
      if (pattern[inst.id][beatNumber]) {
        playSound(inst.id, time);
      }
    });
  }

  function nextStep() {
    const tempo = parseInt(document.getElementById('dmTempoSlider').value);
    const secondsPerBeat = 60.0 / tempo / 4; // 16th notes
    
    // Apply swing if needed
    if (globalParams.swing > 0 && currentStep % 2 === 1) {
      const swingAmount = secondsPerBeat * (globalParams.swing / 100) * 0.5;
      nextStepTime += secondsPerBeat + swingAmount;
    } else if (globalParams.swing > 0 && currentStep % 2 === 0) {
      const swingAmount = secondsPerBeat * (globalParams.swing / 100) * 0.5;
      nextStepTime += secondsPerBeat - swingAmount;
    } else {
      nextStepTime += secondsPerBeat;
    }
    
    currentStep = (currentStep + 1) % STEPS;
  }

  function processStepQueue() {
    const currentTime = audioContext.currentTime;
    const lookaheadTime = 0.1;
    
    while (stepQueue.length && stepQueue[0].time < currentTime + lookaheadTime) {
      const currentNote = stepQueue.shift();
      
      // Calculate delay for visual update
      const delay = Math.max(0, (currentNote.time - currentTime) * 1000);
      
      setTimeout(() => {
        updateStepVisual(currentNote.step);
      }, delay);
    }
    
    requestAnimationFrame(processStepQueue);
  }

  function updateStepVisual(stepNumber) {
    // Clear previous playing states
    document.querySelectorAll('.dm-step').forEach(el => {
      el.classList.remove('playing');
    });
    
    // Highlight current step
    instruments.forEach(inst => {
      const el = document.querySelector(`[data-instrument="${inst.id}"][data-step="${stepNumber}"]`);
      if (el) {
        el.classList.add('playing');
      }
    });
  }

  // Transport controls
  function play() {
    initAudio();

    if (!isPlaying) {
      isPlaying = true;
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      nextStepTime = audioContext.currentTime;
      scheduler();
      requestAnimationFrame(processStepQueue);
      
      const playBtn = document.getElementById('dmPlayBtn');
      playBtn.classList.add('active');
      playBtn.querySelector('span:last-child').textContent = 'PAUSE';
    } else {
      pause();
    }
  }

  function pause() {
    isPlaying = false;
    clearTimeout(schedulerTimer);
    
    const playBtn = document.getElementById('dmPlayBtn');
    if (playBtn) {
      playBtn.classList.remove('active');
      playBtn.querySelector('span:last-child').textContent = 'PLAY';
    }
  }

  function stop() {
    pause();
    currentStep = 0;
    stepQueue = [];
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
    e.target.setAttribute('aria-pressed', pattern[inst][step] ? 'true' : 'false');
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
            element.setAttribute('aria-pressed', 'true');
          } else {
            element.classList.remove('active');
            element.setAttribute('aria-pressed', 'false');
          }
        }
      }
    });
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
              // For 8-bar mode, duplicate the pattern
              pattern[inst.id][i] = currentBarMode === 8 ? (presetData[i - 16] || 0) : 0;
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

  function changeBarMode(bars) {
    const newSteps = bars * 4;
    
    if (currentBarMode === 4 && bars === 8) {
      // Duplicate pattern when expanding to 8 bars
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

  // Reset to defaults (preserves pattern)
  function resetToDefaults() {
    // Reset all parameters to default without clearing pattern
    globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));
    initializeInstrumentParams();
    updateAllControls();
    
    // Re-initialize effect states
    if (effectsChain.reverb) {
      effectsChain.reverb.wetGain.gain.value = 0;
      effectsChain.reverb.dryGain.gain.value = 1;
    }
    
    if (isPlaying) {
      pause();
      play();
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
    
    // Update creative effect buttons
    document.getElementById('dmTapeStopBtn')?.classList.toggle('active', globalParams.tapeStop.enabled);
    document.getElementById('dmStutterBtn')?.classList.toggle('active', globalParams.stutter.enabled);
    document.getElementById('dmGlitchBtn')?.classList.toggle('active', globalParams.glitch.enabled);
    document.getElementById('dmReverseBtn')?.classList.toggle('active', globalParams.reverse.enabled);
    document.getElementById('dmGranularBtn')?.classList.toggle('active', globalParams.granular.enabled);
    document.getElementById('dmLayeringBtn')?.classList.toggle('active', globalParams.layering);
    
    createMixerChannels();
  }

  function updateEffectUI(effectName, params) {
    const toggle = document.getElementById(`dm${effectName}Toggle`);
    const unit = document.getElementById(`dm${effectName}Unit`);
    
    if (toggle && unit) {
      if (params.enabled) {
        toggle.classList.add('active');
        toggle.setAttribute('aria-checked', 'true');
        unit.classList.add('active');
      } else {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-checked', 'false');
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
          knob.setAttribute('aria-valuenow', panValue);
        } else if (param === 'pitch') {
          const pitchValue = Math.max(-24, Math.min(24, Math.round((value - 50) * 24 / 50)));
          const rotation = pitchValue * 5.625;
          indicator.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
          globalParams.instrumentParams[inst].pitch = pitchValue;
          valueDisplay.textContent = pitchValue > 0 ? '+' + pitchValue : pitchValue.toString();
          knob.setAttribute('aria-valuenow', pitchValue);
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

      // Add keyboard support
      knob.addEventListener('keydown', (e) => {
        const inst = knob.dataset.instrument;
        const param = knob.dataset.param;
        let currentValue;
        
        if (param === 'pan') {
          currentValue = 50 + globalParams.instrumentParams[inst].pan * 50;
        } else if (param === 'pitch') {
          currentValue = 50 + globalParams.instrumentParams[inst].pitch * 50 / 24;
        }
        
        switch(e.key) {
          case 'ArrowUp':
          case 'ArrowRight':
            e.preventDefault();
            updateKnob(Math.min(100, currentValue + 5));
            break;
          case 'ArrowDown':
          case 'ArrowLeft':
            e.preventDefault();
            updateKnob(Math.max(0, currentValue - 5));
            break;
        }
      });
    });
  }

  // WAV export with casa24beat naming
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

      // Load buffers for offline context
      const offlineBuffers = {};
      for (const [instId, buffer] of Object.entries(audioBuffers)) {
        if (buffer) {
          const offlineBuffer = offlineContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
          );
          
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel);
            const targetData = offlineBuffer.getChannelData(channel);
            for (let i = 0; i < buffer.length; i++) {
              targetData[i] = sourceData[i];
            }
          }
          
          offlineBuffers[instId] = offlineBuffer;
        }
      }

      for (let step = 0; step < STEPS; step++) {
        const stepTime = step * stepDuration;
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step] && offlineBuffers[inst.id]) {
            const source = offlineContext.createBufferSource();
            const gain = offlineContext.createGain();
            const panner = offlineContext.createStereoPanner();
            
            source.buffer = offlineBuffers[inst.id];
            
            const params = globalParams.instrumentParams[inst.id];
            gain.gain.value = params.volume * 0.5;
            panner.pan.value = params.pan;
            
            const pitchMultiplier = Math.pow(2, params.pitch / 12);
            source.playbackRate.value = pitchMultiplier;
            
            source.connect(gain);
            gain.connect(panner);
            panner.connect(offlineMaster);
            
            source.start(stepTime);
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
      
      // Generate casa24beat filename with timestamp
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      a.download = `casa24beat-${timestamp}.wav`;
      
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

    // Kit selector - Now loads from repository
    document.getElementById('dmKitSelect')?.addEventListener('change', async (e) => {
      await loadSoundkit(e.target.value);
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
      document.getElementById('dmMixerToggle').setAttribute('aria-selected', 'true');
      document.getElementById('dmEffectsToggle').classList.remove('active');
      document.getElementById('dmEffectsToggle').setAttribute('aria-selected', 'false');
      document.getElementById('dmCreativeToggle').classList.remove('active');
      document.getElementById('dmCreativeToggle').setAttribute('aria-selected', 'false');
    });

    document.getElementById('dmEffectsToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.remove('active');
      document.getElementById('dmEffectsPanel').classList.add('active');
      document.getElementById('dmCreativePanel').classList.remove('active');
      document.getElementById('dmMixerToggle').classList.remove('active');
      document.getElementById('dmMixerToggle').setAttribute('aria-selected', 'false');
      document.getElementById('dmEffectsToggle').classList.add('active');
      document.getElementById('dmEffectsToggle').setAttribute('aria-selected', 'true');
      document.getElementById('dmCreativeToggle').classList.remove('active');
      document.getElementById('dmCreativeToggle').setAttribute('aria-selected', 'false');
    });

    document.getElementById('dmCreativeToggle')?.addEventListener('click', () => {
      document.getElementById('dmMixerPanel').classList.remove('active');
      document.getElementById('dmEffectsPanel').classList.remove('active');
      document.getElementById('dmCreativePanel').classList.add('active');
      document.getElementById('dmMixerToggle').classList.remove('active');
      document.getElementById('dmMixerToggle').setAttribute('aria-selected', 'false');
      document.getElementById('dmEffectsToggle').classList.remove('active');
      document.getElementById('dmEffectsToggle').setAttribute('aria-selected', 'false');
      document.getElementById('dmCreativeToggle').classList.add('active');
      document.getElementById('dmCreativeToggle').setAttribute('aria-selected', 'true');
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

  // Setup effect controls with real-time parameter updates
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
    
    // Setup preset/mode buttons
    setupEffectPresets();
  }

  function setupEffectToggle(toggleId, effectName) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', () => {
        globalParams[effectName].enabled = !globalParams[effectName].enabled;
        toggle.classList.toggle('active');
        toggle.setAttribute('aria-checked', globalParams[effectName].enabled ? 'true' : 'false');
        
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

  function setupEffectPresets() {
    // Reverb presets
    document.querySelectorAll('#dmReverbUnit .dm-effect-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        globalParams.reverb.preset = preset;
        document.querySelectorAll('#dmReverbUnit .dm-effect-preset-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
    
    // Delay modes
    document.querySelectorAll('#dmDelayUnit .dm-effect-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        globalParams.delay.pingPong = mode === 'pingpong';
        document.querySelectorAll('#dmDelayUnit .dm-effect-preset-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
    
    // Filter modes
    document.querySelectorAll('.dm-filter-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        globalParams.filter.type = mode;
        document.querySelectorAll('.dm-filter-mode-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
    
    // Distortion types
    document.querySelectorAll('#dmDistUnit .dm-effect-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        globalParams.distortion.type = type;
        document.querySelectorAll('#dmDistUnit .dm-effect-preset-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
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
          param.includes('intensity') || param.includes('frequency') ||
          param.includes('speed')) {
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
    resetToDefaults: resetToDefaults
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
