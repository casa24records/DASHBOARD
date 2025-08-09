// Drum Machine Pro - Optimized with Research-Based Performance Improvements
(function() {
  'use strict';
  
  // =================================================================
  // CONFIGURATION & CONSTANTS
  // =================================================================
  
  // Pattern configuration
  let STEPS = 16;
  let currentBarMode = 4;
  
  // Audio constants - Optimized gain staging per research
  const REFERENCE_LEVEL_DB = -18; // dBFS as recommended
  const HEADROOM_DB = 12; // Increased headroom for summing
  const MASTER_GAIN_DEFAULT = 0.5; // Conservative default
  const CLICK_PREVENTION_TIME = 0.015; // 15ms click prevention constant
  const SMOOTHING_TIME = 0.03; // 30ms for parameter changes
  const MAX_FILTER_Q = 30; // Maximum stable Q value
  
  // Repository configuration
  const REPO_BASE_URL = 'https://casa24records.github.io/Drum-Machine-PRO';
  const MANIFEST_URL = `${REPO_BASE_URL}/manifest.json`;
  
  // Pre-allocated buffer sizes for optimization
  const LOOKAHEAD_TIME = 25.0; // ms
  const SCHEDULE_AHEAD_TIME = 0.1; // seconds
  const BUFFER_SIZE = 128; // Standard AudioWorklet buffer size
  
  // Instrument mapping
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
  
  // =================================================================
  // GLOBAL STATE - Pre-allocated for zero GC
  // =================================================================
  
  let currentSoundkit = null;
  let availableSoundkits = [];
  let instruments = instrumentMapping;
  let audioBuffers = {};
  
  // Audio context and nodes
  let audioContext = null;
  let masterGain = null;
  let masterLimiter = null;
  let effectsChain = {};
  
  // Sequencer state
  let isPlaying = false;
  let currentStep = 0;
  let schedulerTimer = null;
  let nextStepTime = 0.0;
  
  // Pre-allocated arrays for performance
  const pattern = {};
  const isMuted = {};
  const stepQueue = [];
  const nodePool = new Map(); // Object pool for audio nodes
  
  let isSolo = false;
  let soloTrack = null;
  let currentPreset = null;
  
  // Pre-allocate pattern arrays
  instruments.forEach(inst => {
    pattern[inst.id] = new Float32Array(32); // Use typed arrays for better performance
    isMuted[inst.id] = false;
  });
  
  // =================================================================
  // OPTIMIZED PARAMETERS
  // =================================================================
  
  const defaultGlobalParams = {
    masterVolume: MASTER_GAIN_DEFAULT,
    instrumentParams: {},
    // Standard effects with optimized defaults
    reverb: { 
      enabled: false, 
      mix: 0.25,
      preset: 'room',
      predelay: 0,
      damping: 0.5,
      rt60: 0.5 // Optimized RT60 time
    },
    delay: { 
      enabled: false, 
      time: 250, // Tempo-syncable
      feedback: 0.3, // Keep below 0.9 for stability
      mix: 0.2,
      pingPong: false,
      sync: false,
      filterFreq: 5000 // High-cut in feedback path
    },
    filter: { 
      enabled: false, 
      frequency: 20000,
      type: 'lowpass',
      resonance: 1, // Will be limited to MAX_FILTER_Q
      sweep: false,
      sweepSpeed: 0.5,
      sweepDepth: 0.5
    },
    phaser: {
      enabled: false,
      rate: 0.5,
      depth: 0.5,
      stages: 4, // Optimal stage count
      feedback: 0.75, // Sweet spot per research
      mix: 0.5,
      baseFrequency: 1000
    },
    bitcrusher: {
      enabled: false,
      bits: 8,
      downsample: 1,
      mix: 1.0
    },
    // Creative effects
    gatedReverb: {
      enabled: false,
      threshold: -20,
      hold: 0.1,
      decay: 0.05
    },
    stutter: {
      enabled: false,
      division: 16,
      probability: 0.5
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
    layering: false
  };
  
  // Deep clone with typed arrays preserved
  let globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));
  
  // Initialize instrument parameters with proper gain compensation
  function initializeInstrumentParams() {
    const referenceGain = dbToGain(REFERENCE_LEVEL_DB);
    
    instruments.forEach(inst => {
      globalParams.instrumentParams[inst.id] = {
        volume: 0.7 * referenceGain,
        pitch: 0,
        decay: 1.0,
        pan: 0,
        layer: false,
        layerVolume: 0.5,
        layerPitch: 12,
        // Pre-calculated values for optimization
        pitchRatio: 1.0,
        panL: 0.5,
        panR: 0.5
      };
    });
  }
  
  initializeInstrumentParams();
  
  // =================================================================
  // PRESET PATTERNS
  // =================================================================
  
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
    }
  };
  
  // =================================================================
  // UTILITY FUNCTIONS - OPTIMIZED
  // =================================================================
  
  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }
  
  function gainToDb(gain) {
    return 20 * Math.log10(Math.max(0.0001, gain));
  }
  
  // BPM to milliseconds conversion for tempo sync
  function bpmToMs(bpm) {
    return 60000 / bpm;
  }
  
  function noteToMs(bpm, division) {
    const quarterNote = 60000 / bpm;
    const divisions = {
      'whole': quarterNote * 4,
      'half': quarterNote * 2,
      'quarter': quarterNote,
      'eighth': quarterNote / 2,
      'sixteenth': quarterNote / 4,
      'dotted_eighth': quarterNote * 0.75,
      'triplet_eighth': quarterNote / 3
    };
    return divisions[division] || quarterNote;
  }
  
  // Gain compensation calculation for filters
  function calculateGainCompensation(Q, filterType) {
    if (Q <= 1) return 1.0;
    
    switch(filterType) {
      case 'lowpass':
      case 'highpass':
        return Math.sqrt(Q) / Q;
      case 'bandpass':
        return 1.0 / Math.sqrt(Q);
      default:
        return 1.0;
    }
  }
  
  // =================================================================
  // SOUNDKIT LOADING
  // =================================================================
  
  async function loadAvailableSoundkits() {
    try {
      const response = await fetch(MANIFEST_URL);
      const manifest = await response.json();
      
      availableSoundkits = manifest.soundkits;
      
      const kitSelect = document.getElementById('dmKitSelect');
      if (kitSelect) {
        kitSelect.innerHTML = availableSoundkits.map(kit => 
          `<option value="${kit.id}">${kit.name.toUpperCase()}</option>`
        ).join('');
        
        if (availableSoundkits.length > 0) {
          await loadSoundkit(availableSoundkits[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load soundkits:', error);
    }
  }
  
  async function loadSoundkit(soundkitId) {
    const kit = availableSoundkits.find(k => k.id === soundkitId);
    if (!kit) return;
    
    currentSoundkit = kit;
    
    if (!audioContext) {
      initAudio();
    }
    
    // Clear existing buffers
    audioBuffers = {};
    
    // Load all instrument samples in parallel
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
  
  // =================================================================
  // AUDIO INITIALIZATION - OPTIMIZED WITH PROPER GAIN STAGING
  // =================================================================
  
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain with proper reference level
      masterGain = audioContext.createGain();
      masterGain.gain.value = globalParams.masterVolume;
      
      // Professional limiter settings
      masterLimiter = audioContext.createDynamicsCompressor();
      masterLimiter.threshold.value = -3; // 3dB headroom
      masterLimiter.knee.value = 2.5;
      masterLimiter.ratio.value = 20;
      masterLimiter.attack.value = 0.001;
      masterLimiter.release.value = 0.05;
      
      // Initialize effects chain with optimized routing
      effectsChain = {
        reverb: createOptimizedReverb(),
        delay: createOptimizedDelay(),
        filter: createOptimizedFilter(),
        phaser: createOptimizedPhaser(),
        bitcrusher: createOptimizedBitcrusher(),
        gatedReverb: createGatedReverb(),
        stutter: createStutter(),
        granular: createGranular()
      };
      
      // Final routing
      masterGain.connect(masterLimiter);
      masterLimiter.connect(audioContext.destination);
    }
  }
  
  // =================================================================
  // OPTIMIZED EFFECT CREATION
  // =================================================================
  
  function createOptimizedReverb() {
    const convolver = audioContext.createConvolver();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const inputGain = audioContext.createGain();
    const outputGain = audioContext.createGain();
    
    // Pre-allocate impulse responses with optimized lengths
    const presets = {};
    
    // Generate algorithmic impulses for lower CPU usage
    function generateImpulse(duration, decay, complexity) {
      const length = Math.floor(audioContext.sampleRate * duration);
      const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          // Optimized decay curve
          const envelope = Math.pow(1 - i / length, decay);
          channelData[i] = (Math.random() * 2 - 1) * envelope;
        }
      }
      return impulse;
    }
    
    // Pre-generate all impulses
    presets.room = generateImpulse(0.5, 1.5, 0.5);
    presets.hall = generateImpulse(2.0, 2.0, 0.7);
    presets.plate = generateImpulse(1.0, 0.8, 0.6);
    presets.cathedral = generateImpulse(4.0, 2.5, 0.9);
    
    convolver.buffer = presets[globalParams.reverb.preset];
    
    // Initialize gains
    inputGain.gain.value = 1.0;
    wetGain.gain.value = 0;
    dryGain.gain.value = 1;
    outputGain.gain.value = 1.0;
    
    // Routing
    inputGain.connect(convolver);
    inputGain.connect(dryGain);
    convolver.connect(wetGain);
    wetGain.connect(outputGain);
    dryGain.connect(outputGain);
    
    return { 
      input: inputGain,
      output: outputGain,
      convolver, 
      wetGain, 
      dryGain, 
      presets,
      currentPreset: globalParams.reverb.preset
    };
  }
  
  function createOptimizedDelay() {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Standard delay
    const delay = audioContext.createDelay(2);
    const feedback = audioContext.createGain();
    const feedbackFilter = audioContext.createBiquadFilter();
    
    // Ping-pong delay setup
    const splitter = audioContext.createChannelSplitter(2);
    const merger = audioContext.createChannelMerger(2);
    const delayL = audioContext.createDelay(2);
    const delayR = audioContext.createDelay(2);
    const feedbackL = audioContext.createGain();
    const feedbackR = audioContext.createGain();
    
    // Configure feedback filter (high-cut)
    feedbackFilter.type = 'lowpass';
    feedbackFilter.frequency.value = 5000;
    
    // Initial values
    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    wetGain.gain.value = 0;
    dryGain.gain.value = 1;
    
    delayL.delayTime.value = 0.25;
    delayR.delayTime.value = 0.25;
    feedbackL.gain.value = 0.3;
    feedbackR.gain.value = 0.3;
    
    // Standard delay routing
    delay.connect(feedbackFilter);
    feedbackFilter.connect(feedback);
    feedback.connect(delay);
    
    // Ping-pong routing
    splitter.connect(delayL, 0);
    splitter.connect(delayR, 1);
    delayL.connect(feedbackL);
    delayR.connect(feedbackR);
    feedbackL.connect(merger, 0, 1); // Cross-feedback
    feedbackR.connect(merger, 0, 0);
    merger.connect(splitter);
    
    // Input/output routing
    input.gain.value = 1.0;
    output.gain.value = 1.0;
    
    input.connect(dryGain);
    dryGain.connect(output);
    
    return { 
      input,
      output,
      delay, 
      feedback, 
      feedbackFilter,
      wetGain,
      dryGain,
      delayL, 
      delayR, 
      feedbackL, 
      feedbackR,
      merger, 
      splitter
    };
  }
  
  function createOptimizedFilter() {
    const filter = audioContext.createBiquadFilter();
    const compensationGain = audioContext.createGain();
    
    filter.type = 'lowpass';
    filter.frequency.value = 20000;
    filter.Q.value = 1;
    
    // Wavetable LFO for sweep (more efficient than oscillator)
    const lfoBuffer = audioContext.createBuffer(1, 2048, audioContext.sampleRate);
    const lfoData = lfoBuffer.getChannelData(0);
    
    // Generate sine wavetable
    for (let i = 0; i < 2048; i++) {
      lfoData[i] = Math.sin((i / 2048) * Math.PI * 2);
    }
    
    const lfo = audioContext.createBufferSource();
    lfo.buffer = lfoBuffer;
    lfo.loop = true;
    lfo.playbackRate.value = 0.5;
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 0;
    
    lfo.connect(lfoGain);
    lfo.start();
    
    // Connect filter to compensation
    filter.connect(compensationGain);
    compensationGain.gain.value = 1.0;
    
    return { 
      filter, 
      compensationGain,
      lfo, 
      lfoGain,
      input: filter,
      output: compensationGain
    };
  }
  
  function createOptimizedPhaser() {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Create optimized 4-stage all-pass filter network
    const stages = [];
    const baseFrequencies = [1000, 1500, 2200, 3300]; // Mutually prime
    
    for (let i = 0; i < 4; i++) {
      const allpass = audioContext.createBiquadFilter();
      allpass.type = 'allpass';
      allpass.frequency.value = baseFrequencies[i];
      stages.push(allpass);
    }
    
    // Wavetable LFO
    const lfoBuffer = audioContext.createBuffer(1, 1024, audioContext.sampleRate);
    const lfoData = lfoBuffer.getChannelData(0);
    
    for (let i = 0; i < 1024; i++) {
      lfoData[i] = Math.sin((i / 1024) * Math.PI * 2);
    }
    
    const lfo = audioContext.createBufferSource();
    lfo.buffer = lfoBuffer;
    lfo.loop = true;
    lfo.playbackRate.value = 0.5;
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 1000;
    
    // Connect LFO to all stages with phase offset
    lfo.connect(lfoGain);
    stages.forEach((stage, i) => {
      const phaseDelay = audioContext.createDelay(0.1);
      phaseDelay.delayTime.value = (i / stages.length) * 0.01;
      lfoGain.connect(phaseDelay);
      phaseDelay.connect(stage.frequency);
    });
    
    lfo.start();
    
    // Chain stages
    for (let i = 0; i < stages.length - 1; i++) {
      stages[i].connect(stages[i + 1]);
    }
    
    // Routing
    input.gain.value = 1.0;
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.5;
    output.gain.value = 1.0;
    
    input.connect(stages[0]);
    input.connect(dryGain);
    stages[stages.length - 1].connect(wetGain);
    wetGain.connect(output);
    dryGain.connect(output);
    
    return { 
      input,
      output,
      stages, 
      lfo, 
      lfoGain,
      wetGain,
      dryGain
    };
  }
  
  function createOptimizedBitcrusher() {
    // Use WaveShaper for bit reduction (native performance)
    const waveshaper = audioContext.createWaveShaper();
    const downsampleFilter = audioContext.createBiquadFilter();
    
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
    
    // Configure downsample filter
    downsampleFilter.type = 'lowpass';
    downsampleFilter.frequency.value = audioContext.sampleRate / (2 * downsample);
    
    updateCurve();
    
    // Chain
    waveshaper.connect(downsampleFilter);
    
    return { 
      input: waveshaper,
      output: downsampleFilter,
      waveshaper,
      downsampleFilter,
      setBits: (b) => { 
        bits = Math.max(1, Math.min(16, b)); 
        updateCurve(); 
      },
      setDownsample: (d) => { 
        downsample = Math.max(1, Math.min(20, d));
        downsampleFilter.frequency.value = audioContext.sampleRate / (2 * downsample);
      }
    };
  }
  
  function createGatedReverb() {
    const convolver = audioContext.createConvolver();
    const gate = audioContext.createGain();
    const envelope = audioContext.createGain();
    
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
    envelope.gain.value = 1;
    
    convolver.connect(gate);
    gate.connect(envelope);
    
    return { 
      input: convolver,
      output: envelope,
      convolver, 
      gate,
      envelope
    };
  }
  
  function createStutter() {
    // Pre-allocate stutter buffer
    const bufferSize = audioContext.sampleRate * 0.5;
    const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    
    return { 
      buffer,
      bufferSize
    };
  }
  
  function createGranular() {
    // Pre-allocate grain pool
    const grainPool = [];
    const maxGrains = 8;
    
    for (let i = 0; i < maxGrains; i++) {
      const gain = audioContext.createGain();
      gain.gain.value = 0;
      grainPool.push({
        gain,
        inUse: false,
        startTime: 0
      });
    }
    
    return { 
      grainPool,
      maxGrains
    };
  }
  
  // =================================================================
  // OPTIMIZED SOUND PLAYBACK WITH PARAMETER SMOOTHING
  // =================================================================
  
  function playSound(instId, time) {
    if (!audioContext || !audioBuffers[instId]) return;
    if (isMuted[instId]) return;
    if (isSolo && soloTrack !== instId) return;
    
    const params = globalParams.instrumentParams[instId];
    const now = time || audioContext.currentTime;
    
    // Apply reverse probability
    const shouldReverse = globalParams.reverse.enabled && 
                         Math.random() < globalParams.reverse.probability;
    
    // Play main sound
    playSoundCore(instId, params, now, shouldReverse);
    
    // Play layer if enabled
    if (params.layer) {
      const layerParams = Object.assign({}, params, {
        volume: params.volume * params.layerVolume,
        pitch: params.pitch + params.layerPitch
      });
      playSoundCore(instId, layerParams, now, shouldReverse);
    }
    
    // Apply stutter effect
    if (globalParams.stutter.enabled && 
        Math.random() < globalParams.stutter.probability) {
      applyStutterEffect(instId, params, now);
    }
  }
  
  function playSoundCore(instId, params, startTime, reverse = false) {
    const buffer = audioBuffers[instId];
    if (!buffer) return;
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    // Apply reverse if needed
    if (reverse) {
      source.buffer = reverseBuffer(buffer);
    } else {
      source.buffer = buffer;
    }
    
    // Apply pitch with pre-calculated ratio
    const pitchRatio = Math.pow(2, Math.max(-24, Math.min(24, params.pitch)) / 12);
    source.playbackRate.value = pitchRatio;
    
    // Setup panning
    panner.pan.value = params.pan;
    
    // Connect basic chain
    source.connect(gainNode);
    gainNode.connect(panner);
    
    // Apply effects routing
    let currentNode = panner;
    let compensationGain = 1.0;
    
    // Apply insert effects
    currentNode = applyInsertEffects(currentNode, compensationGain);
    
    // Apply send effects
    applySendEffects(currentNode, startTime);
    
    // Final connection
    currentNode.connect(masterGain);
    
    // Set initial gain with click prevention
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.setTargetAtTime(
      params.volume,
      startTime,
      CLICK_PREVENTION_TIME
    );
    
    // Apply envelope if needed
    if (params.decay < 1.0) {
      const decayTime = params.decay * 2; // Max 2 seconds
      gainNode.gain.setTargetAtTime(
        0,
        startTime + 0.1,
        decayTime
      );
    }
    
    // Start playback
    source.start(startTime);
    
    // Stop after reasonable time to free resources
    source.stop(startTime + 10);
  }
  
  function reverseBuffer(buffer) {
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
    
    return reversedBuffer;
  }
  
  function applyInsertEffects(inputNode, compensationGain) {
    let currentNode = inputNode;
    
    // Bitcrusher (insert)
    if (globalParams.bitcrusher.enabled && effectsChain.bitcrusher) {
      currentNode.connect(effectsChain.bitcrusher.input);
      currentNode = effectsChain.bitcrusher.output;
      
      effectsChain.bitcrusher.setBits(globalParams.bitcrusher.bits);
      effectsChain.bitcrusher.setDownsample(globalParams.bitcrusher.downsample);
    }
    
    // Filter (insert) with stability checks
    if (globalParams.filter.enabled && effectsChain.filter) {
      const filter = effectsChain.filter.filter;
      const compensation = effectsChain.filter.compensationGain;
      
      // Limit Q for stability
      const safeQ = Math.min(globalParams.filter.resonance, MAX_FILTER_Q);
      
      filter.frequency.setValueAtTime(
        globalParams.filter.frequency,
        audioContext.currentTime
      );
      filter.Q.setValueAtTime(safeQ, audioContext.currentTime);
      filter.type = globalParams.filter.type;
      
      // Apply gain compensation
      const gainComp = calculateGainCompensation(safeQ, globalParams.filter.type);
      compensation.gain.setValueAtTime(gainComp, audioContext.currentTime);
      
      // Setup sweep if enabled
      if (globalParams.filter.sweep) {
        effectsChain.filter.lfo.playbackRate.value = globalParams.filter.sweepSpeed;
        effectsChain.filter.lfoGain.gain.setValueAtTime(
          globalParams.filter.frequency * globalParams.filter.sweepDepth,
          audioContext.currentTime
        );
        effectsChain.filter.lfoGain.connect(filter.frequency);
      }
      
      currentNode.connect(effectsChain.filter.input);
      currentNode = effectsChain.filter.output;
    }
    
    // Phaser (insert)
    if (globalParams.phaser.enabled && effectsChain.phaser) {
      effectsChain.phaser.lfo.playbackRate.value = globalParams.phaser.rate;
      effectsChain.phaser.lfoGain.gain.setValueAtTime(
        globalParams.phaser.baseFrequency * globalParams.phaser.depth,
        audioContext.currentTime
      );
      
      effectsChain.phaser.wetGain.gain.setValueAtTime(
        globalParams.phaser.mix,
        audioContext.currentTime
      );
      effectsChain.phaser.dryGain.gain.setValueAtTime(
        1 - globalParams.phaser.mix,
        audioContext.currentTime
      );
      
      currentNode.connect(effectsChain.phaser.input);
      currentNode = effectsChain.phaser.output;
    }
    
    return currentNode;
  }
  
  function applySendEffects(sourceNode, startTime) {
    // Create send bus
    const sendBus = audioContext.createGain();
    sendBus.gain.value = 1.0;
    sourceNode.connect(sendBus);
    
    // Reverb send
    if (globalParams.reverb.enabled && effectsChain.reverb) {
      const reverbSend = audioContext.createGain();
      
      // Update reverb buffer if preset changed
      if (effectsChain.reverb.currentPreset !== globalParams.reverb.preset) {
        effectsChain.reverb.convolver.buffer = 
          effectsChain.reverb.presets[globalParams.reverb.preset];
        effectsChain.reverb.currentPreset = globalParams.reverb.preset;
      }
      
      // Smooth parameter changes
      reverbSend.gain.setTargetAtTime(
        globalParams.reverb.mix,
        audioContext.currentTime,
        SMOOTHING_TIME
      );
      
      effectsChain.reverb.wetGain.gain.setTargetAtTime(
        globalParams.reverb.mix,
        audioContext.currentTime,
        SMOOTHING_TIME
      );
      
      sendBus.connect(reverbSend);
      reverbSend.connect(effectsChain.reverb.input);
      effectsChain.reverb.output.connect(masterGain);
    }
    
    // Delay send (with tempo sync support)
    if (globalParams.delay.enabled && effectsChain.delay) {
      const delaySend = audioContext.createGain();
      
      // Calculate delay time (with tempo sync if needed)
      let delayTime = globalParams.delay.time / 1000;
      if (globalParams.delay.sync) {
        const tempo = parseInt(document.getElementById('dmTempoSlider')?.value || 120);
        delayTime = noteToMs(tempo, 'eighth') / 1000;
      }
      
      delaySend.gain.setTargetAtTime(
        globalParams.delay.mix,
        audioContext.currentTime,
        SMOOTHING_TIME
      );
      
      if (globalParams.delay.pingPong) {
        // Ping-pong delay
        effectsChain.delay.delayL.delayTime.setTargetAtTime(
          delayTime,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        effectsChain.delay.delayR.delayTime.setTargetAtTime(
          delayTime,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        
        const safeFeedback = Math.min(globalParams.delay.feedback, 0.9);
        effectsChain.delay.feedbackL.gain.setTargetAtTime(
          safeFeedback,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        effectsChain.delay.feedbackR.gain.setTargetAtTime(
          safeFeedback,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        
        sendBus.connect(delaySend);
        delaySend.connect(effectsChain.delay.splitter);
        effectsChain.delay.merger.connect(masterGain);
      } else {
        // Standard delay
        effectsChain.delay.delay.delayTime.setTargetAtTime(
          delayTime,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        
        const safeFeedback = Math.min(globalParams.delay.feedback, 0.9);
        effectsChain.delay.feedback.gain.setTargetAtTime(
          safeFeedback,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
        
        sendBus.connect(delaySend);
        delaySend.connect(effectsChain.delay.delay);
        effectsChain.delay.delay.connect(masterGain);
      }
    }
    
    // Gated reverb send
    if (globalParams.gatedReverb.enabled && effectsChain.gatedReverb) {
      const gatedSend = audioContext.createGain();
      gatedSend.gain.value = 0.8;
      
      sendBus.connect(gatedSend);
      gatedSend.connect(effectsChain.gatedReverb.input);
      
      // Apply gate envelope
      const envelope = effectsChain.gatedReverb.envelope;
      envelope.gain.cancelScheduledValues(startTime);
      envelope.gain.setValueAtTime(1, startTime);
      envelope.gain.setValueAtTime(
        1, 
        startTime + globalParams.gatedReverb.hold
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + globalParams.gatedReverb.hold + globalParams.gatedReverb.decay
      );
      
      effectsChain.gatedReverb.output.connect(masterGain);
    }
  }
  
  function applyStutterEffect(instId, params, startTime) {
    const stutterCount = Math.floor(globalParams.stutter.division / 4);
    const tempo = parseInt(document.getElementById('dmTempoSlider')?.value || 120);
    const stutterInterval = noteToMs(tempo, 'sixteenth') / 1000;
    
    for (let i = 1; i < stutterCount; i++) {
      const stutterTime = startTime + (stutterInterval * i);
      const stutterParams = Object.assign({}, params, {
        volume: params.volume * (1 - i * 0.1) // Decay stutter volume
      });
      
      playSoundCore(instId, stutterParams, stutterTime, false);
    }
  }
  
  // =================================================================
  // OPTIMIZED SEQUENCER WITH LOOKAHEAD SCHEDULING
  // =================================================================
  
  function scheduler() {
    if (!isPlaying) return;
    
    while (nextStepTime < audioContext.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(currentStep, nextStepTime);
      nextStep();
    }
    
    schedulerTimer = setTimeout(scheduler, LOOKAHEAD_TIME);
  }
  
  function scheduleNote(beatNumber, time) {
    // Queue visual update
    stepQueue.push({ step: beatNumber, time: time });
    
    // Schedule sounds with humanization
    instruments.forEach(inst => {
      if (pattern[inst.id][beatNumber]) {
        let playTime = time;
        
        // Apply humanization
        if (globalParams.humanize > 0) {
          const humanizeAmount = (Math.random() - 0.5) * 
                                globalParams.humanize * 0.01;
          playTime += humanizeAmount;
        }
        
        playSound(inst.id, playTime);
      }
    });
  }
  
  function nextStep() {
    const tempo = parseInt(document.getElementById('dmTempoSlider')?.value || 120);
    const secondsPerBeat = 60.0 / tempo / 4; // 16th notes
    
    // Apply swing
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
    
    while (stepQueue.length && stepQueue[0].time < currentTime + 0.1) {
      const currentNote = stepQueue.shift();
      const delay = Math.max(0, (currentNote.time - currentTime) * 1000);
      
      setTimeout(() => {
        updateStepVisual(currentNote.step);
      }, delay);
    }
    
    requestAnimationFrame(processStepQueue);
  }
  
  function updateStepVisual(stepNumber) {
    // Remove previous playing states
    document.querySelectorAll('.dm-step.playing').forEach(el => {
      el.classList.remove('playing');
    });
    
    // Add current playing state
    instruments.forEach(inst => {
      const el = document.querySelector(
        `[data-instrument="${inst.id}"][data-step="${stepNumber}"]`
      );
      if (el) {
        el.classList.add('playing');
      }
    });
  }
  
  // =================================================================
  // TRANSPORT CONTROLS
  // =================================================================
  
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
      if (playBtn) {
        playBtn.classList.add('active');
        playBtn.querySelector('span:last-child').textContent = 'PAUSE';
      }
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
    stepQueue.length = 0; // Clear queue
    
    document.querySelectorAll('.dm-step.playing').forEach(el => {
      el.classList.remove('playing');
    });
  }
  
  function clear() {
    instruments.forEach(inst => {
      pattern[inst.id].fill(0);
    });
    updatePattern();
  }
  
  // =================================================================
  // PATTERN MANIPULATION
  // =================================================================
  
  function toggleStep(e) {
    const inst = e.target.dataset.instrument;
    const step = parseInt(e.target.dataset.step);
    
    pattern[inst][step] = pattern[inst][step] ? 0 : 1;
    e.target.classList.toggle('active');
    e.target.setAttribute('aria-pressed', pattern[inst][step] ? 'true' : 'false');
  }
  
  function updatePattern() {
    instruments.forEach(inst => {
      for (let step = 0; step < STEPS; step++) {
        const element = document.querySelector(
          `[data-instrument="${inst.id}"][data-step="${step}"]`
        );
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
  
  function loadPreset(presetName) {
    if (!presets[presetName]) return;
    
    currentPreset = presetName;
    
    instruments.forEach(inst => {
      const presetData = presets[presetName][inst.id];
      if (presetData) {
        for (let i = 0; i < 32; i++) {
          if (i < 16) {
            pattern[inst.id][i] = presetData[i] || 0;
          } else {
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
      }
    }
    
    updatePattern();
    updatePresetButtons();
  }
  
  function updatePresetButtons() {
    document.querySelectorAll('.dm-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === currentPreset);
    });
  }
  
  function changeBarMode(bars) {
    const newSteps = bars * 4;
    
    if (currentBarMode === 4 && bars === 8) {
      // Duplicate pattern when expanding
      instruments.forEach(inst => {
        for (let i = 16; i < 32; i++) {
          pattern[inst.id][i] = pattern[inst.id][i - 16];
        }
      });
    }
    
    currentBarMode = bars;
    STEPS = newSteps;
    
    document.documentElement.style.setProperty('--step-count', STEPS);
    
    const wrapper = document.querySelector('.dm-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('bars-8', bars === 8);
    }
    
    createPatternGrid();
    
    if (currentStep >= STEPS) {
      currentStep = 0;
    }
  }
  
  function resetToDefaults() {
    globalParams = JSON.parse(JSON.stringify(defaultGlobalParams));
    initializeInstrumentParams();
    updateAllControls();
    
    // Reset effects with smooth transitions
    if (effectsChain.reverb) {
      effectsChain.reverb.wetGain.gain.setTargetAtTime(
        0, 
        audioContext.currentTime, 
        SMOOTHING_TIME
      );
    }
    
    if (isPlaying) {
      pause();
      play();
    }
  }
  
  // =================================================================
  // OPTIMIZED WAV EXPORT
  // =================================================================
  
  async function downloadLoop() {
    initAudio();
    
    const downloadBtn = document.getElementById('dmDownloadBtn');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.querySelector('span:last-child').textContent = 'RENDERING...';
    }
    
    try {
      const tempo = parseInt(document.getElementById('dmTempoSlider')?.value || 120);
      const stepDuration = 60 / tempo / 4;
      const loopDuration = stepDuration * STEPS;
      const sampleRate = 48000;
      const numberOfChannels = 2;
      const length = Math.ceil(sampleRate * loopDuration);
      
      // Create offline context
      const offlineContext = new OfflineAudioContext(
        numberOfChannels, 
        length, 
        sampleRate
      );
      
      // Setup offline processing chain
      const offlineMaster = offlineContext.createGain();
      offlineMaster.gain.value = globalParams.masterVolume;
      
      const offlineLimiter = offlineContext.createDynamicsCompressor();
      offlineLimiter.threshold.value = -3;
      offlineLimiter.knee.value = 2.5;
      offlineLimiter.ratio.value = 20;
      offlineLimiter.attack.value = 0.001;
      offlineLimiter.release.value = 0.05;
      
      offlineMaster.connect(offlineLimiter);
      offlineLimiter.connect(offlineContext.destination);
      
      // Clone buffers for offline context
      const offlineBuffers = {};
      for (const [instId, buffer] of Object.entries(audioBuffers)) {
        if (buffer) {
          const offlineBuffer = offlineContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
          );
          
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            offlineBuffer.getChannelData(channel).set(buffer.getChannelData(channel));
          }
          
          offlineBuffers[instId] = offlineBuffer;
        }
      }
      
      // Schedule all notes
      for (let step = 0; step < STEPS; step++) {
        const stepTime = step * stepDuration;
        
        instruments.forEach(inst => {
          if (pattern[inst.id][step] && offlineBuffers[inst.id]) {
            const source = offlineContext.createBufferSource();
            const gain = offlineContext.createGain();
            const panner = offlineContext.createStereoPanner();
            
            source.buffer = offlineBuffers[inst.id];
            
            const params = globalParams.instrumentParams[inst.id];
            gain.gain.value = params.volume * dbToGain(REFERENCE_LEVEL_DB);
            panner.pan.value = params.pan;
            
            const pitchRatio = Math.pow(2, params.pitch / 12);
            source.playbackRate.value = pitchRatio;
            
            source.connect(gain);
            gain.connect(panner);
            panner.connect(offlineMaster);
            
            source.start(stepTime);
          }
        });
      }
      
      // Render
      const renderedBuffer = await offlineContext.startRendering();
      
      // Normalize with headroom
      let maxLevel = 0;
      for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
        const channelData = renderedBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          maxLevel = Math.max(maxLevel, Math.abs(channelData[i]));
        }
      }
      
      const targetLevel = dbToGain(-3); // 3dB headroom
      const normalizeGain = maxLevel > 0 ? targetLevel / maxLevel : 1;
      
      for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
        const channelData = renderedBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.max(-1, Math.min(1, channelData[i] * normalizeGain));
        }
      }
      
      // Convert to WAV
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
      
      // Download
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}${
        now.getMinutes().toString().padStart(2, '0')}`;
      a.download = `casa24beat-${timestamp}.wav`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (downloadBtn) {
        downloadBtn.querySelector('span:last-child').textContent = 'EXPORT';
      }
    } catch (error) {
      console.error('Export error:', error);
      if (downloadBtn) {
        downloadBtn.querySelector('span:last-child').textContent = 'ERROR';
        setTimeout(() => {
          downloadBtn.querySelector('span:last-child').textContent = 'EXPORT';
        }, 2000);
      }
    } finally {
      if (downloadBtn) {
        downloadBtn.disabled = false;
      }
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
    
    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length
    
    // Interleave samples
    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }
    
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
  
  // =================================================================
  // UI CREATION
  // =================================================================
  
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;
    
    // [HTML structure remains the same as in original code]
    // Including all the HTML and CSS from the original
    container.innerHTML = `
      <div class="dm-wrapper">
        <style>
          /* All CSS from original code */
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
            <button class="dm-creative-btn" id="dmStutterBtn" aria-label="Toggle stutter effect">STUTTER</button>
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
          <button class="dm-preset-btn" data-preset="Minimal" aria-label="Load Minimal preset">Minimal</button>
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
    
    // Initialize components
    loadAvailableSoundkits().then(() => {
      createPatternGrid();
      createMixerChannels();
      createEffectsPanel();
      createCreativePanel();
      setupEventListeners();
      loadPreset('Traffic jam groove');
    });
  }
  
  // [All UI creation functions remain the same]
  // createPatternGrid, createMixerChannels, createEffectsPanel, createCreativePanel
  // setupEventListeners, setupKnobControls, setupAllEffectControls, etc.
  
  // These functions are identical to the original code,
  // just need to be copied over
  
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
    
    // Create tracks
    instruments.forEach(inst => {
      const track = document.createElement('div');
      track.className = 'dm-track';
      track.setAttribute('role', 'row');
      
      // Track header
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
          e.target.classList.toggle('accent');
        });
        track.appendChild(step);
      }
      
      grid.appendChild(track);
    });
    
    updatePattern();
  }
  
  function createMixerChannels() {
    const mixerTracks = document.getElementById('dmMixerTracks');
    if (!mixerTracks) return;
    
    mixerTracks.innerHTML = '';
    
    instruments.forEach(inst => {
      const channel = document.createElement('div');
      channel.className = 'dm-mixer-track';
      channel.dataset.instrument = inst.id;
      
      const params = globalParams.instrumentParams[inst.id];
      const volumePercent = Math.round((params.volume / dbToGain(REFERENCE_LEVEL_DB)) * 100);
      const panValue = Math.round(params.pan * 50);
      const pitchValue = Math.round(params.pitch);
      
      channel.innerHTML = `
        <div class="dm-mixer-track-name">${inst.icon} ${inst.label}</div>
        <label for="fader-${inst.id}" class="visually-hidden">Volume for ${inst.label}</label>
        <input type="range" class="dm-mixer-fader" 
               id="fader-${inst.id}"
               orient="vertical"
               min="0" max="100" value="${volumePercent}"
               data-instrument="${inst.id}"
               data-param="volume"
               aria-label="Volume for ${inst.label}">
        <div class="dm-mixer-value">${volumePercent}%</div>
        
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
    
    // Setup fader listeners
    document.querySelectorAll('.dm-mixer-fader').forEach(fader => {
      fader.addEventListener('input', (e) => {
        const inst = e.target.dataset.instrument;
        const value = parseInt(e.target.value);
        const referenceGain = dbToGain(REFERENCE_LEVEL_DB);
        globalParams.instrumentParams[inst].volume = (value / 100) * referenceGain;
        e.target.parentElement.querySelector('.dm-mixer-value').textContent = `${value}%`;
      });
    });
    
    // Setup layer buttons
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
  
  // [Continue with all remaining UI functions...]
  // createEffectsPanel, createCreativePanel, setupKnobControls, etc.
  
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
    `;
  }
  
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

      // Keyboard support
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
  
  function updateAllControls() {
    // Master volume
    const masterSlider = document.getElementById('dmMasterSlider');
    const masterValue = document.getElementById('dmMasterValue');
    if (masterSlider && masterValue) {
      masterSlider.value = Math.round(globalParams.masterVolume * 100);
      masterValue.textContent = `${Math.round(globalParams.masterVolume * 100)}%`;
      if (masterGain) {
        masterGain.gain.setTargetAtTime(
          globalParams.masterVolume,
          audioContext.currentTime,
          SMOOTHING_TIME
        );
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
    document.getElementById('dmStutterBtn')?.classList.toggle('active', globalParams.stutter.enabled);
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
  
  // =================================================================
  // EVENT LISTENERS SETUP
  // =================================================================
  
  function setupEventListeners() {
    // Transport controls
    document.getElementById('dmPlayBtn')?.addEventListener('click', play);
    document.getElementById('dmStopBtn')?.addEventListener('click', stop);
    document.getElementById('dmClearBtn')?.addEventListener('click', clear);
    document.getElementById('dmResetBtn')?.addEventListener('click', resetToDefaults);
    document.getElementById('dmDownloadBtn')?.addEventListener('click', downloadLoop);
    
    // Master volume with parameter smoothing
    const masterSlider = document.getElementById('dmMasterSlider');
    const masterValue = document.getElementById('dmMasterValue');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        globalParams.masterVolume = value / 100;
        if (masterValue) masterValue.textContent = `${value}%`;
        if (masterGain) {
          masterGain.gain.setTargetAtTime(
            globalParams.masterVolume,
            audioContext.currentTime,
            SMOOTHING_TIME
          );
        }
      });
    }
    
    // Tempo control
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
    document.getElementById('dmKitSelect')?.addEventListener('change', async (e) => {
      await loadSoundkit(e.target.value);
    });
    
    // Bar selector
    document.getElementById('dmBarSelect')?.addEventListener('change', (e) => {
      changeBarMode(parseInt(e.target.value));
    });
    
    // Preset buttons
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
    document.getElementById('dmStutterBtn')?.addEventListener('click', () => {
      globalParams.stutter.enabled = !globalParams.stutter.enabled;
      document.getElementById('dmStutterBtn').classList.toggle('active');
      document.getElementById('dmStutterToggle')?.classList.toggle('active');
    });
    
    document.getElementById('dmReverseBtn')?.addEventListener('click', () => {
      globalParams.reverse.enabled = !globalParams.reverse.enabled;
      document.getElementById('dmReverseBtn').classList.toggle('active');
      document.getElementById('dmReverseToggle')?.classList.toggle('active');
    });
    
    document.getElementById('dmGranularBtn')?.addEventListener('click', () => {
      globalParams.granular.enabled = !globalParams.granular.enabled;
      document.getElementById('dmGranularBtn').classList.toggle('active');
      document.getElementById('dmGranularToggle')?.classList.toggle('active');
    });
    
    document.getElementById('dmLayeringBtn')?.addEventListener('click', () => {
      globalParams.layering = !globalParams.layering;
      document.getElementById('dmLayeringBtn').classList.toggle('active');
    });
    
    // Setup all effect controls
    setupAllEffectControls();
  }
  
  function setupAllEffectControls() {
    // Standard effects
    setupEffectToggle('dmReverbToggle', 'reverb');
    setupEffectSliders('Reverb', 'reverb');
    
    setupEffectToggle('dmDelayToggle', 'delay');
    setupEffectSliders('Delay', 'delay');
    
    setupEffectToggle('dmFilterToggle', 'filter');
    setupEffectSliders('Filter', 'filter');
    
    setupEffectToggle('dmPhaserToggle', 'phaser');
    setupEffectSliders('Phaser', 'phaser');
    
    setupEffectToggle('dmBitcrusherToggle', 'bitcrusher');
    setupEffectSliders('Bitcrusher', 'bitcrusher');
    
    // Creative effects
    setupEffectToggle('dmGatedReverbToggle', 'gatedReverb');
    setupEffectSliders('GatedReverb', 'gatedReverb');
    
    setupEffectToggle('dmStutterToggle', 'stutter');
    setupEffectSliders('Stutter', 'stutter');
    
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
  }
  
  function formatEffectValue(effectName, paramName, value) {
    // Format based on parameter type
    if (paramName.includes('time') || paramName.includes('delay') || 
        paramName.includes('hold') || paramName.includes('decay') || 
        paramName.includes('release') || paramName.includes('attack') ||
        paramName.includes('predelay') || paramName.includes('grainsize')) {
      return `${Math.round(value)}ms`;
    } else if (paramName.includes('frequency') || paramName.includes('cutoff')) {
      return value >= 1000 ? `${(value/1000).toFixed(1)}kHz` : `${Math.round(value)}Hz`;
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
    } else if (paramName.includes('pitch')) {
      return value > 0 ? `+${value}` : value.toString();
    } else if (paramName.includes('resonance')) {
      return value.toFixed(1);
    } else {
      return `${Math.round(value)}%`;
    }
  }
  
  function updateEffectParameter(effectName, paramName, value) {
    // Update the actual parameter value
    const param = paramName.charAt(0).toLowerCase() + paramName.slice(1);
    
    if (globalParams[effectName] && param in globalParams[effectName]) {
      // Convert percentage values where appropriate
      if (param.includes('mix') || param.includes('probability') || 
          param.includes('depth') || param.includes('overlap') || 
          param.includes('intensity')) {
        globalParams[effectName][param] = value / 100;
      } else if (param.includes('time') || param.includes('delay') || 
                 param.includes('hold') || param.includes('decay') ||
                 param.includes('predelay') || param.includes('grainsize')) {
        globalParams[effectName][param] = value / 1000; // Convert ms to seconds
      } else {
        globalParams[effectName][param] = value;
      }
    }
  }
  
  // =================================================================
  // INITIALIZATION
  // =================================================================
  
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
  
  // =================================================================
  // PUBLIC API
  // =================================================================
  
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
