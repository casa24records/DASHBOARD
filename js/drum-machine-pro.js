// Drum Machine Pro - SuperMVP Complete Build
(function() {
  'use strict';

  // === CONFIGURATION ===
  const CONFIG = {
    STEPS_4_BAR: 16,
    STEPS_8_BAR: 32,
    DEFAULT_BPM: 120,
    DEFAULT_VOLUME: 0.7,
    SAMPLE_RATE: 44100
  };

  // === STATE MANAGEMENT ===
  const state = {
    audioContext: null,
    isPlaying: false,
    currentStep: 0,
    currentBarMode: 4,
    steps: CONFIG.STEPS_4_BAR,
    bpm: CONFIG.DEFAULT_BPM,
    intervalId: null,
    masterGain: null,
    currentKit: 'Classic 808',
    pattern: {},
    muted: {},
    solo: null,
    recording: false
  };

  // === DRUM KITS ===
  const drumKits = {
    'Classic 808': {
      kick: { freq: 60, decay: 0.5, tone: 0.8, pitch: 0 },
      snare: { freq: 200, decay: 0.15, noise: 0.8, tone: 0.5, pitch: 0 },
      hihat: { freq: 8000, decay: 0.05, noise: 1, tone: 0.9, pitch: 0 },
      openhat: { freq: 8000, decay: 0.3, noise: 1, tone: 0.9, pitch: 0 },
      clap: { freq: 1500, decay: 0.05, noise: 0.9, tone: 0.7, pitch: 0 },
      crash: { freq: 5000, decay: 1.5, noise: 1, tone: 0.8, pitch: 0 },
      rim: { freq: 800, decay: 0.03, noise: 0.3, tone: 0.9, pitch: 0 },
      cowbell: { freq: 800, decay: 0.1, tone: 0.6, pitch: 0 }
    },
    'Trap Kit': {
      kick: { freq: 45, decay: 0.7, tone: 0.9, pitch: 0 },
      snare: { freq: 250, decay: 0.2, noise: 0.7, tone: 0.6, pitch: 0 },
      hihat: { freq: 10000, decay: 0.03, noise: 1, tone: 1, pitch: 0 },
      openhat: { freq: 10000, decay: 0.25, noise: 1, tone: 1, pitch: 0 },
      clap: { freq: 1800, decay: 0.08, noise: 0.85, tone: 0.8, pitch: 0 },
      crash: { freq: 6000, decay: 2, noise: 1, tone: 0.7, pitch: 0 },
      rim: { freq: 1000, decay: 0.02, noise: 0.4, tone: 1, pitch: 0 },
      cowbell: { freq: 900, decay: 0.15, tone: 0.7, pitch: 0 }
    },
    'Vintage': {
      kick: { freq: 70, decay: 0.4, tone: 0.7, pitch: 0 },
      snare: { freq: 180, decay: 0.12, noise: 0.6, tone: 0.4, pitch: 0 },
      hihat: { freq: 6000, decay: 0.08, noise: 0.9, tone: 0.8, pitch: 0 },
      openhat: { freq: 6000, decay: 0.35, noise: 0.9, tone: 0.8, pitch: 0 },
      clap: { freq: 1200, decay: 0.06, noise: 0.8, tone: 0.6, pitch: 0 },
      crash: { freq: 4000, decay: 1.2, noise: 0.95, tone: 0.75, pitch: 0 },
      rim: { freq: 600, decay: 0.04, noise: 0.2, tone: 0.8, pitch: 0 },
      cowbell: { freq: 700, decay: 0.12, tone: 0.5, pitch: 0 }
    }
  };

  // === PATTERN PRESETS ===
  const patternPresets = {
    'Traffic jam groove': {
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
    'Robofunk': {
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
    'Power pose': {
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

  // === INSTRUMENT PARAMETERS ===
  const instrumentParams = {};
  const instruments = ['kick', 'snare', 'hihat', 'openhat', 'clap', 'crash', 'rim', 'cowbell'];
  
  instruments.forEach(inst => {
    instrumentParams[inst] = {
      volume: 0.7,
      pan: 0,
      pitch: 0,
      reverb: 0,
      delay: 0,
      filter: 20000,
      distortion: 0
    };
    state.pattern[inst] = new Array(32).fill(0);
    state.muted[inst] = false;
  });

  // === EFFECTS PARAMETERS ===
  const effects = {
    reverb: { enabled: false, mix: 0.25, room: 0.5, damp: 0.5, preset: 'room' },
    delay: { enabled: false, time: 0.25, feedback: 0.3, mix: 0.2, sync: false },
    filter: { enabled: false, freq: 20000, res: 1, type: 'lowpass' },
    compressor: { enabled: false, threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, drive: 0.1, tone: 0.5, mix: 0.5 },
    chorus: { enabled: false, rate: 1.5, depth: 0.3, mix: 0.3 },
    bitcrusher: { enabled: false, bits: 8, downsample: 1 },
    stereoWidth: { enabled: false, width: 1 }
  };

  // === CREATIVE FX PARAMETERS ===
  const creativeFX = {
    tapeStop: { enabled: false, speed: 0.5, active: false },
    stutter: { enabled: false, division: 16, probability: 0.5 },
    glitch: { enabled: false, intensity: 0.5, frequency: 0.3 },
    reverse: { enabled: false, probability: 0.2 },
    granular: { enabled: false, grainSize: 50, overlap: 0.5, pitch: 0 },
    layering: { enabled: false, mix: 0.5, detune: 5 }
  };

  // === AUDIO ENGINE ===
  function initAudio() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = CONFIG.DEFAULT_VOLUME;
      state.masterGain.connect(state.audioContext.destination);
    }
  }

  // === SOUND GENERATION ===
  function playDrumSound(instrument, time) {
    if (!state.audioContext) return;
    if (state.muted[instrument]) return;
    if (state.solo && state.solo !== instrument) return;

    const kit = drumKits[state.currentKit][instrument];
    const params = instrumentParams[instrument];
    const ctx = state.audioContext;
    const now = time || ctx.currentTime;

    // Main oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    
    // Setup connections
    osc.connect(gain);
    gain.connect(panner);
    
    // Apply instrument parameters
    panner.pan.value = params.pan;
    const pitchMult = Math.pow(2, params.pitch / 12);
    
    // Create effect chain
    let currentNode = panner;
    
    // Apply filter if enabled
    if (effects.filter.enabled && params.filter < 20000) {
      const filter = ctx.createBiquadFilter();
      filter.type = effects.filter.type;
      filter.frequency.value = params.filter;
      filter.Q.value = effects.filter.res;
      currentNode.connect(filter);
      currentNode = filter;
    }
    
    // Apply distortion if enabled
    if (effects.distortion.enabled && params.distortion > 0) {
      const dist = ctx.createWaveShaper();
      dist.curve = makeDistortionCurve(params.distortion * 100);
      dist.oversample = '4x';
      currentNode.connect(dist);
      currentNode = dist;
    }
    
    // Apply bitcrusher if enabled
    if (effects.bitcrusher.enabled) {
      const bitcrusher = createBitcrusher(ctx, effects.bitcrusher.bits, effects.bitcrusher.downsample);
      currentNode.connect(bitcrusher);
      currentNode = bitcrusher;
    }
    
    // Connect to master
    currentNode.connect(state.masterGain);
    
    // Apply reverb send
    if (effects.reverb.enabled && params.reverb > 0) {
      const reverbSend = ctx.createGain();
      reverbSend.gain.value = params.reverb;
      currentNode.connect(reverbSend);
      reverbSend.connect(createReverb(ctx));
    }
    
    // Apply delay send
    if (effects.delay.enabled && params.delay > 0) {
      const delaySend = ctx.createGain();
      delaySend.gain.value = params.delay;
      currentNode.connect(delaySend);
      delaySend.connect(createDelay(ctx, effects.delay.time, effects.delay.feedback));
    }
    
    // Generate instrument-specific sound
    generateInstrumentSound(instrument, osc, gain, now, kit, params, pitchMult);
    
    // Apply creative FX
    applyCreativeFX(instrument, now);
  }

  function generateInstrumentSound(instrument, osc, gain, time, kit, params, pitchMult) {
    const ctx = state.audioContext;
    const volume = params.volume;
    
    switch(instrument) {
      case 'kick':
        osc.frequency.setValueAtTime(kit.freq * pitchMult, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + kit.decay);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        osc.start(time);
        osc.stop(time + kit.decay);
        break;
        
      case 'snare':
        osc.frequency.value = kit.freq * pitchMult;
        gain.gain.setValueAtTime(volume * (1 - kit.noise), time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        osc.start(time);
        osc.stop(time + kit.decay);
        
        // Add noise
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * kit.decay, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * kit.noise;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(state.masterGain);
        noiseGain.gain.setValueAtTime(volume * kit.noise, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        noise.start(time);
        break;
        
      case 'hihat':
      case 'openhat':
        osc.type = 'square';
        osc.frequency.value = kit.freq * pitchMult;
        const hhFilter = ctx.createBiquadFilter();
        hhFilter.type = 'highpass';
        hhFilter.frequency.value = 7000;
        gain.connect(hhFilter);
        hhFilter.connect(state.masterGain);
        gain.gain.setValueAtTime(volume * kit.noise, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        osc.start(time);
        osc.stop(time + kit.decay);
        break;
        
      case 'clap':
        // Multiple short bursts
        for (let i = 0; i < 3; i++) {
          const clapOsc = ctx.createOscillator();
          const clapGain = ctx.createGain();
          clapOsc.frequency.value = kit.freq * pitchMult;
          clapOsc.connect(clapGain);
          clapGain.connect(state.masterGain);
          const clapTime = time + i * 0.01;
          clapGain.gain.setValueAtTime(volume * 0.5, clapTime);
          clapGain.gain.exponentialRampToValueAtTime(0.01, clapTime + 0.02);
          clapOsc.start(clapTime);
          clapOsc.stop(clapTime + 0.02);
        }
        break;
        
      case 'crash':
        // White noise through filter
        const crashBuffer = ctx.createBuffer(1, ctx.sampleRate * kit.decay, ctx.sampleRate);
        const crashData = crashBuffer.getChannelData(0);
        for (let i = 0; i < crashBuffer.length; i++) {
          crashData[i] = Math.random() * 2 - 1;
        }
        const crash = ctx.createBufferSource();
        crash.buffer = crashBuffer;
        const crashGain = ctx.createGain();
        const crashFilter = ctx.createBiquadFilter();
        crashFilter.type = 'bandpass';
        crashFilter.frequency.value = kit.freq * pitchMult;
        crashFilter.Q.value = 0.5;
        crash.connect(crashGain);
        crashGain.connect(crashFilter);
        crashFilter.connect(state.masterGain);
        crashGain.gain.setValueAtTime(volume, time);
        crashGain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        crash.start(time);
        break;
        
      case 'rim':
        osc.type = 'sine';
        osc.frequency.value = kit.freq * pitchMult;
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        osc.start(time);
        osc.stop(time + kit.decay);
        break;
        
      case 'cowbell':
        osc.frequency.value = kit.freq * pitchMult;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.value = kit.freq * 1.48 * pitchMult;
        osc2.connect(gain2);
        gain2.connect(state.masterGain);
        gain.gain.setValueAtTime(volume * 0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        gain2.gain.setValueAtTime(volume * 0.3, time);
        gain2.gain.exponentialRampToValueAtTime(0.01, time + kit.decay);
        osc.start(time);
        osc.stop(time + kit.decay);
        osc2.start(time);
        osc2.stop(time + kit.decay);
        break;
    }
  }

  // === EFFECTS ===
  function makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function createBitcrusher(ctx, bits, downsample) {
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    let step = Math.pow(0.5, bits);
    let counter = 0;
    let lastSample = 0;
    
    processor.onaudioprocess = function(e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        counter++;
        if (counter >= downsample) {
          lastSample = Math.floor(input[i] / step) * step;
          counter = 0;
        }
        output[i] = lastSample;
      }
    };
    return processor;
  }

  function createReverb(ctx) {
    const convolver = ctx.createConvolver();
    const length = ctx.sampleRate * 2;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;
    convolver.connect(state.masterGain);
    return convolver;
  }

  function createDelay(ctx, time, feedback) {
    const delay = ctx.createDelay(2);
    const feedbackGain = ctx.createGain();
    const wetGain = ctx.createGain();
    
    delay.delayTime.value = time;
    feedbackGain.gain.value = feedback;
    wetGain.gain.value = 0.5;
    
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(state.masterGain);
    
    return delay;
  }

  // === CREATIVE FX ===
  function applyCreativeFX(instrument, time) {
    // Stutter effect
    if (creativeFX.stutter.enabled && Math.random() < creativeFX.stutter.probability) {
      const divisions = creativeFX.stutter.division;
      const interval = (60 / state.bpm / divisions);
      for (let i = 1; i < 4; i++) {
        setTimeout(() => {
          playDrumSound(instrument);
        }, interval * i * 1000);
      }
    }
    
    // Reverse effect
    if (creativeFX.reverse.enabled && Math.random() < creativeFX.reverse.probability) {
      // Implement reverse envelope
      const kit = drumKits[state.currentKit][instrument];
      const params = instrumentParams[instrument];
      const reversedParams = Object.assign({}, params, {
        volume: params.volume * 0.8
      });
      setTimeout(() => {
        playDrumSound(instrument);
      }, 50);
    }
    
    // Glitch effect
    if (creativeFX.glitch.enabled && Math.random() < creativeFX.glitch.frequency) {
      const glitchType = Math.floor(Math.random() * 3);
      switch(glitchType) {
        case 0: // Repeat
          setTimeout(() => playDrumSound(instrument), 25);
          break;
        case 1: // Pitch shift
          const originalPitch = instrumentParams[instrument].pitch;
          instrumentParams[instrument].pitch = Math.random() * 24 - 12;
          playDrumSound(instrument);
          instrumentParams[instrument].pitch = originalPitch;
          break;
        case 2: // Volume cut
          const originalVolume = instrumentParams[instrument].volume;
          instrumentParams[instrument].volume *= creativeFX.glitch.intensity;
          playDrumSound(instrument);
          instrumentParams[instrument].volume = originalVolume;
          break;
      }
    }
  }

  // === SEQUENCER ===
  function startSequencer() {
    if (state.isPlaying) return;
    
    initAudio();
    state.isPlaying = true;
    
    const stepTime = (60 / state.bpm / 4) * 1000;
    
    // Play current step immediately
    playStep();
    
    // Setup interval
    state.intervalId = setInterval(() => {
      state.currentStep = (state.currentStep + 1) % state.steps;
      playStep();
    }, stepTime);
    
    updateUI();
  }

  function stopSequencer() {
    state.isPlaying = false;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.currentStep = 0;
    updateUI();
  }

  function playStep() {
    // Update visual indicator
    document.querySelectorAll('.step').forEach(el => {
      el.classList.remove('playing');
    });
    
    // Play sounds for active steps
    instruments.forEach(inst => {
      if (state.pattern[inst][state.currentStep]) {
        playDrumSound(inst);
      }
      
      // Update visual
      const stepEl = document.querySelector(`[data-inst="${inst}"][data-step="${state.currentStep}"]`);
      if (stepEl && state.pattern[inst][state.currentStep]) {
        stepEl.classList.add('playing');
      }
    });
    
    // Tape stop effect
    if (creativeFX.tapeStop.enabled && creativeFX.tapeStop.active) {
      state.bpm *= (1 - creativeFX.tapeStop.speed);
      if (state.bpm < 20) {
        creativeFX.tapeStop.active = false;
        state.bpm = CONFIG.DEFAULT_BPM;
      }
      if (state.isPlaying) {
        clearInterval(state.intervalId);
        const stepTime = (60 / state.bpm / 4) * 1000;
        state.intervalId = setInterval(() => {
          state.currentStep = (state.currentStep + 1) % state.steps;
          playStep();
        }, stepTime);
      }
    }
  }

  // === PATTERN MANAGEMENT ===
  function clearPattern() {
    instruments.forEach(inst => {
      for (let i = 0; i < 32; i++) {
        state.pattern[inst][i] = 0;
      }
    });
    updateUI();
  }

  function loadPreset(presetName) {
    const preset = patternPresets[presetName];
    if (!preset) return;
    
    // Load BPM
    state.bpm = preset.bpm;
    document.getElementById('tempo-value').textContent = preset.bpm + ' BPM';
    document.getElementById('tempo-slider').value = preset.bpm;
    
    // Load pattern
    instruments.forEach(inst => {
      for (let i = 0; i < state.steps; i++) {
        if (state.currentBarMode === 4) {
          state.pattern[inst][i] = preset[inst][i] || 0;
        } else {
          // 8-bar mode: duplicate pattern
          if (i < 16) {
            state.pattern[inst][i] = preset[inst][i] || 0;
          } else {
            state.pattern[inst][i] = preset[inst][i - 16] || 0;
          }
        }
      }
    });
    
    updateUI();
  }

  // === UI GENERATION ===
  function createUI() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="dm-wrapper">
        <style>
          .dm-wrapper {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            padding: 20px;
            border-radius: 10px;
            color: #fff;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .dm-header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .dm-title {
            font-size: 2.5em;
            margin: 0;
            color: #00ff88;
            text-shadow: 0 0 20px rgba(0,255,136,0.5);
          }
          
          .dm-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          .dm-btn {
            padding: 10px 20px;
            background: #333;
            border: 2px solid #00ff88;
            color: #00ff88;
            cursor: pointer;
            border-radius: 5px;
            font-weight: bold;
            transition: all 0.2s;
          }
          
          .dm-btn:hover {
            background: #00ff88;
            color: #000;
            transform: scale(1.05);
          }
          
          .dm-btn.active {
            background: #00ff88;
            color: #000;
          }
          
          .dm-tempo {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #222;
            border-radius: 5px;
          }
          
          .dm-grid {
            display: grid;
            grid-template-columns: 100px repeat(var(--steps), 1fr);
            gap: 2px;
            margin: 20px 0;
            padding: 10px;
            background: #111;
            border-radius: 5px;
          }
          
          .dm-track-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 10px;
            background: #222;
            border-radius: 3px;
            font-size: 0.9em;
          }
          
          .track-controls {
            display: flex;
            gap: 2px;
          }
          
          .track-btn {
            width: 20px;
            height: 20px;
            border: 1px solid #666;
            background: #333;
            color: #999;
            cursor: pointer;
            border-radius: 2px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .track-btn.active-mute {
            background: #ff3333;
            color: #fff;
          }
          
          .track-btn.active-solo {
            background: #ffaa00;
            color: #000;
          }
          
          .step {
            aspect-ratio: 1;
            background: #222;
            border: 1px solid #444;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.1s;
          }
          
          .step:hover {
            border-color: #00ff88;
            transform: scale(1.1);
          }
          
          .step.active {
            background: #00ff88;
            box-shadow: 0 0 10px rgba(0,255,136,0.5);
          }
          
          .step.playing {
            animation: pulse 0.2s;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          
          .dm-mixer {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
            margin: 20px 0;
            padding: 15px;
            background: #1a1a1a;
            border-radius: 5px;
          }
          
          .mixer-channel {
            background: #222;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
          }
          
          .mixer-label {
            font-size: 0.8em;
            margin-bottom: 5px;
            color: #00ff88;
          }
          
          .mixer-slider {
            width: 100%;
            margin: 5px 0;
          }
          
          .dm-effects {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin: 20px 0;
            padding: 15px;
            background: #1a1a1a;
            border-radius: 5px;
          }
          
          .effect-unit {
            background: #222;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #333;
          }
          
          .effect-unit.active {
            border-color: #00ff88;
            box-shadow: 0 0 10px rgba(0,255,136,0.3);
          }
          
          .effect-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .effect-title {
            font-size: 0.9em;
            color: #00ff88;
          }
          
          .effect-toggle {
            width: 40px;
            height: 20px;
            background: #333;
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .effect-toggle.active {
            background: #00ff88;
          }
          
          .effect-toggle::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background: #999;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.3s;
          }
          
          .effect-toggle.active::after {
            transform: translateX(20px);
            background: #fff;
          }
          
          .effect-control {
            margin: 5px 0;
          }
          
          .effect-label {
            font-size: 0.7em;
            color: #999;
          }
          
          .effect-slider {
            width: 100%;
            height: 4px;
            background: #333;
            outline: none;
            margin: 5px 0;
            cursor: pointer;
          }
          
          .dm-creative-fx {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          .creative-btn {
            padding: 8px 15px;
            background: #222;
            border: 1px solid #666;
            color: #999;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s;
          }
          
          .creative-btn:hover {
            border-color: #00ff88;
            color: #00ff88;
          }
          
          .creative-btn.active {
            background: #00ff88;
            color: #000;
            border-color: #00ff88;
          }
          
          .dm-presets {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          
          .preset-btn {
            padding: 8px 15px;
            background: #333;
            border: 1px solid #666;
            color: #ccc;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s;
          }
          
          .preset-btn:hover {
            border-color: #00ff88;
            background: #444;
          }
        </style>
        
        <div class="dm-header">
          <h1 class="dm-title">DRUM MACHINE PRO</h1>
        </div>
        
        <div class="dm-controls">
          <button class="dm-btn" id="play-btn">▶ PLAY</button>
          <button class="dm-btn" id="stop-btn">■ STOP</button>
          <button class="dm-btn" id="clear-btn">CLEAR</button>
          
          <div class="dm-tempo">
            <label>TEMPO:</label>
            <input type="range" id="tempo-slider" min="60" max="200" value="120">
            <span id="tempo-value">120 BPM</span>
          </div>
          
          <select id="kit-select" class="dm-btn">
            <option value="Classic 808">Classic 808</option>
            <option value="Trap Kit">Trap Kit</option>
            <option value="Vintage">Vintage</option>
          </select>
          
          <select id="bar-select" class="dm-btn">
            <option value="4">4 BARS</option>
            <option value="8">8 BARS</option>
          </select>
        </div>
        
        <div class="dm-presets">
          <button class="preset-btn" data-preset="Traffic jam groove">Traffic Jam Groove</button>
          <button class="preset-btn" data-preset="Robofunk">Robofunk</button>
          <button class="preset-btn" data-preset="Power pose">Power Pose</button>
        </div>
        
        <div class="dm-creative-fx">
          <h3 style="width: 100%; text-align: center; color: #00ff88; margin: 10px 0;">CREATIVE FX</h3>
          <button class="creative-btn" id="tape-stop-btn">TAPE STOP</button>
          <button class="creative-btn" id="stutter-btn">STUTTER</button>
          <button class="creative-btn" id="glitch-btn">GLITCH</button>
          <button class="creative-btn" id="reverse-btn">REVERSE</button>
          <button class="creative-btn" id="granular-btn">GRANULAR</button>
          <button class="creative-btn" id="layering-btn">LAYERING</button>
        </div>
        
        <div class="dm-grid" id="pattern-grid" style="--steps: ${state.steps}">
          <!-- Grid will be generated here -->
        </div>
        
        <div class="dm-mixer" id="mixer">
          <!-- Mixer channels will be generated here -->
        </div>
        
        <div class="dm-effects" id="effects">
          <!-- Effects will be generated here -->
        </div>
      </div>
    `;
    
    generateGrid();
    generateMixer();
    generateEffects();
    setupEventListeners();
  }

  function generateGrid() {
    const grid = document.getElementById('pattern-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    grid.style.setProperty('--steps', state.steps);
    
    // Create header row
    const spacer = document.createElement('div');
    grid.appendChild(spacer);
    
    for (let i = 0; i < state.steps; i++) {
      const stepNum = document.createElement('div');
      stepNum.style.textAlign = 'center';
      stepNum.style.fontSize = '0.8em';
      stepNum.style.color = '#666';
      stepNum.textContent = (i % 4 === 0) ? Math.floor(i/4) + 1 : '';
      grid.appendChild(stepNum);
    }
    
    // Create instrument rows
    instruments.forEach(inst => {
      // Track label with mute/solo
      const label = document.createElement('div');
      label.className = 'dm-track-label';
      label.innerHTML = `
        <span>${inst.toUpperCase()}</span>
        <div class="track-controls">
          <button class="track-btn" data-inst="${inst}" data-action="mute">M</button>
          <button class="track-btn" data-inst="${inst}" data-action="solo">S</button>
        </div>
      `;
      grid.appendChild(label);
      
      // Steps
      for (let i = 0; i < state.steps; i++) {
        const step = document.createElement('button');
        step.className = 'step';
        step.dataset.inst = inst;
        step.dataset.step = i;
        if (state.pattern[inst][i]) {
          step.classList.add('active');
        }
        grid.appendChild(step);
      }
    });
  }

  function generateMixer() {
    const mixer = document.getElementById('mixer');
    if (!mixer) return;
    
    mixer.innerHTML = '<h3 style="grid-column: 1/-1; text-align: center; color: #00ff88;">MIXER</h3>';
    
    instruments.forEach(inst => {
      const channel = document.createElement('div');
      channel.className = 'mixer-channel';
      channel.innerHTML = `
        <div class="mixer-label">${inst.toUpperCase()}</div>
        <input type="range" class="mixer-slider" data-param="volume" data-inst="${inst}" 
               min="0" max="100" value="${instrumentParams[inst].volume * 100}">
        <div style="font-size: 0.7em; color: #666;">VOL</div>
        <input type="range" class="mixer-slider" data-param="pan" data-inst="${inst}" 
               min="-100" max="100" value="${instrumentParams[inst].pan * 100}">
        <div style="font-size: 0.7em; color: #666;">PAN</div>
        <input type="range" class="mixer-slider" data-param="pitch" data-inst="${inst}" 
               min="-24" max="24" value="${instrumentParams[inst].pitch}">
        <div style="font-size: 0.7em; color: #666;">PITCH</div>
      `;
      mixer.appendChild(channel);
    });
  }

  function generateEffects() {
    const effectsContainer = document.getElementById('effects');
    if (!effectsContainer) return;
    
    effectsContainer.innerHTML = '<h3 style="grid-column: 1/-1; text-align: center; color: #00ff88;">EFFECTS</h3>';
    
    const effectList = [
      { name: 'reverb', params: ['mix', 'room', 'damp'] },
      { name: 'delay', params: ['time', 'feedback', 'mix'] },
      { name: 'filter', params: ['freq', 'res'] },
      { name: 'compressor', params: ['threshold', 'ratio'] },
      { name: 'distortion', params: ['drive', 'tone'] },
      { name: 'chorus', params: ['rate', 'depth', 'mix'] },
      { name: 'bitcrusher', params: ['bits', 'downsample'] },
      { name: 'stereoWidth', params: ['width'] }
    ];
    
    effectList.forEach(fx => {
      const unit = document.createElement('div');
      unit.className = 'effect-unit';
      unit.id = `effect-${fx.name}`;
      
      let controlsHTML = '';
      fx.params.forEach(param => {
        const value = effects[fx.name][param];
        controlsHTML += `
          <div class="effect-control">
            <div class="effect-label">${param.toUpperCase()}</div>
            <input type="range" class="effect-slider" 
                   data-effect="${fx.name}" data-param="${param}"
                   min="0" max="100" value="${value * 100}">
          </div>
        `;
      });
      
      unit.innerHTML = `
        <div class="effect-header">
          <div class="effect-title">${fx.name.toUpperCase()}</div>
          <div class="effect-toggle" data-effect="${fx.name}"></div>
        </div>
        ${controlsHTML}
      `;
      
      effectsContainer.appendChild(unit);
    });
  }

  // === EVENT HANDLERS ===
  function setupEventListeners() {
    // Transport controls
    document.getElementById('play-btn')?.addEventListener('click', () => {
      if (state.isPlaying) {
        stopSequencer();
        document.getElementById('play-btn').textContent = '▶ PLAY';
      } else {
        startSequencer();
        document.getElementById('play-btn').textContent = '⏸ PAUSE';
      }
    });
    
    document.getElementById('stop-btn')?.addEventListener('click', () => {
      stopSequencer();
      document.getElementById('play-btn').textContent = '▶ PLAY';
    });
    
    document.getElementById('clear-btn')?.addEventListener('click', clearPattern);
    
    // Tempo control
    document.getElementById('tempo-slider')?.addEventListener('input', (e) => {
      state.bpm = parseInt(e.target.value);
      document.getElementById('tempo-value').textContent = state.bpm + ' BPM';
      if (state.isPlaying) {
        stopSequencer();
        startSequencer();
      }
    });
    
    // Kit selection
    document.getElementById('kit-select')?.addEventListener('change', (e) => {
      state.currentKit = e.target.value;
    });
    
    // Bar mode selection
    document.getElementById('bar-select')?.addEventListener('change', (e) => {
      const bars = parseInt(e.target.value);
      state.currentBarMode = bars;
      state.steps = bars === 4 ? CONFIG.STEPS_4_BAR : CONFIG.STEPS_8_BAR;
      
      // Duplicate pattern if switching to 8-bar
      if (bars === 8) {
        instruments.forEach(inst => {
          for (let i = 16; i < 32; i++) {
            state.pattern[inst][i] = state.pattern[inst][i - 16];
          }
        });
      }
      
      generateGrid();
    });
    
    // Pattern grid clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('step')) {
        const inst = e.target.dataset.inst;
        const step = parseInt(e.target.dataset.step);
        state.pattern[inst][step] = state.pattern[inst][step] ? 0 : 1;
        e.target.classList.toggle('active');
      }
      
      // Mute/Solo buttons
      if (e.target.classList.contains('track-btn')) {
        const inst = e.target.dataset.inst;
        const action = e.target.dataset.action;
        
        if (action === 'mute') {
          state.muted[inst] = !state.muted[inst];
          e.target.classList.toggle('active-mute');
        } else if (action === 'solo') {
          if (state.solo === inst) {
            state.solo = null;
            e.target.classList.remove('active-solo');
          } else {
            document.querySelectorAll('.track-btn[data-action="solo"]').forEach(btn => {
              btn.classList.remove('active-solo');
            });
            state.solo = inst;
            e.target.classList.add('active-solo');
          }
        }
      }
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });
    
    // Creative FX buttons
    document.getElementById('tape-stop-btn')?.addEventListener('click', (e) => {
      creativeFX.tapeStop.enabled = !creativeFX.tapeStop.enabled;
      e.target.classList.toggle('active');
      if (creativeFX.tapeStop.enabled) {
        creativeFX.tapeStop.active = true;
      }
    });
    
    document.getElementById('stutter-btn')?.addEventListener('click', (e) => {
      creativeFX.stutter.enabled = !creativeFX.stutter.enabled;
      e.target.classList.toggle('active');
    });
    
    document.getElementById('glitch-btn')?.addEventListener('click', (e) => {
      creativeFX.glitch.enabled = !creativeFX.glitch.enabled;
      e.target.classList.toggle('active');
    });
    
    document.getElementById('reverse-btn')?.addEventListener('click', (e) => {
      creativeFX.reverse.enabled = !creativeFX.reverse.enabled;
      e.target.classList.toggle('active');
    });
    
    document.getElementById('granular-btn')?.addEventListener('click', (e) => {
      creativeFX.granular.enabled = !creativeFX.granular.enabled;
      e.target.classList.toggle('active');
    });
    
    document.getElementById('layering-btn')?.addEventListener('click', (e) => {
      creativeFX.layering.enabled = !creativeFX.layering.enabled;
      e.target.classList.toggle('active');
    });
    
    // Mixer sliders
    document.querySelectorAll('.mixer-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const inst = e.target.dataset.inst;
        const param = e.target.dataset.param;
        const value = parseFloat(e.target.value);
        
        if (param === 'volume') {
          instrumentParams[inst].volume = value / 100;
        } else if (param === 'pan') {
          instrumentParams[inst].pan = value / 100;
        } else if (param === 'pitch') {
          instrumentParams[inst].pitch = value;
        }
      });
    });
    
    // Effect toggles
    document.querySelectorAll('.effect-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const effectName = e.target.dataset.effect;
        effects[effectName].enabled = !effects[effectName].enabled;
        e.target.classList.toggle('active');
        e.target.parentElement.parentElement.classList.toggle('active');
      });
    });
    
    // Effect sliders
    document.querySelectorAll('.effect-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const effectName = e.target.dataset.effect;
        const param = e.target.dataset.param;
        const value = parseFloat(e.target.value) / 100;
        
        if (effects[effectName] && param in effects[effectName]) {
          effects[effectName][param] = value;
        }
      });
    });
  }

  // === UI UPDATE ===
  function updateUI() {
    // Update pattern grid
    instruments.forEach(inst => {
      for (let i = 0; i < state.steps; i++) {
        const step = document.querySelector(`[data-inst="${inst}"][data-step="${i}"]`);
        if (step) {
          if (state.pattern[inst][i]) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }
        }
      }
    });
  }

  // === INITIALIZATION ===
  function init() {
    createUI();
    initAudio();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.DrumMachinePro = {
    play: startSequencer,
    stop: stopSequencer,
    clear: clearPattern,
    loadPreset: loadPreset,
    state: state,
    effects: effects,
    creativeFX: creativeFX,
    instrumentParams: instrumentParams
  };

})();
