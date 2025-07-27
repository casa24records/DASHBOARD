// Casa 24 Drum Machine Module
(function() {
  // Configuration
  const STEPS = 16;
  const instruments = [
    { id: 'kick', label: 'KICK', frequency: 60 },
    { id: 'snare', label: 'SNARE', frequency: 200 },
    { id: 'hihat', label: 'HI-HAT', frequency: 800 },
    { id: 'openhat', label: 'OPEN HAT', frequency: 800 },
    { id: 'clap', label: 'CLAP', frequency: 1500 },
    { id: 'crash', label: 'CRASH', frequency: 2000 },
    { id: 'rim', label: 'RIM', frequency: 400 },
    { id: 'cowbell', label: 'COWBELL', frequency: 800 }
  ];

  // Preset patterns
  const presets = {
    'boom-bap': {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'trap': {
      kick:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'house': {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'techno': {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'breakbeat': {
      kick:    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'minimal': {
      kick:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      cowbell: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    },
    'afrobeat': {
      kick:    [1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
      hihat:   [1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1],
      openhat: [0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      rim:     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      cowbell: [0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0]
    },
    'reggaeton': {
      kick:    [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
      crash:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
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

  // Initialize empty pattern
  instruments.forEach(inst => {
    pattern[inst.id] = new Array(STEPS).fill(0);
  });

  // Create the drum machine HTML
  function createDrumMachine() {
    const container = document.getElementById('drum-machine-container');
    if (!container) return;

    container.innerHTML = `
      <div class="drum-machine-wrapper">
        <style>
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
          .drum-preset-btn:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0px #00a651;
            background: rgba(0, 166, 81, 0.1) !important;
          }
          
          .drum-control-btn:active,
          .drum-preset-btn:active {
            transform: translate(0, 0);
            box-shadow: 1px 1px 0px #00a651;
          }
          
          .drum-control-btn.active {
            background: #00a651 !important;
            color: #1a1a1a !important;
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
          
          @keyframes drum-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 166, 81, 0.4); }
            100% { transform: scale(1.15); box-shadow: 0 0 0 8px rgba(0, 166, 81, 0); }
          }
          
          @keyframes drum-pulse-active {
            0% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 166, 81, 0.5); }
            100% { transform: scale(1.15); box-shadow: 0 0 20px rgba(0, 166, 81, 0.8); }
          }
          
          .drum-tempo-slider {
            width: 120px;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
            cursor: pointer;
            border-radius: 3px;
            -webkit-appearance: none;
            appearance: none;
          }
          
          .drum-tempo-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: #00a651;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #1a1a1a;
            box-shadow: 0 0 0 1px #00a651;
          }
          
          .drum-tempo-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #00a651;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid #1a1a1a;
            box-shadow: 0 0 0 1px #00a651;
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
            
            .drum-tempo-slider {
              width: 100px;
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

        <!-- Transport Controls -->
        <div class="drum-controls-wrapper flex flex-wrap gap-4 items-center justify-center mb-8">
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
          </div>
          
          <div class="flex items-center gap-3">
            <span style="font-family: 'VT323', monospace; font-size: 1.25rem; color: #00a651; letter-spacing: 1px;">TEMPO</span>
            <input type="range" class="drum-tempo-slider" id="drumTempoSlider" min="60" max="180" value="120">
            <span id="drumTempoValue" style="font-family: 'VT323', monospace; font-size: 1.25rem; color: #00a651; min-width: 80px;">120 BPM</span>
          </div>
        </div>

        <!-- Sequencer Grid -->
        <div style="border: 2px solid #00a651; border-radius: 0.5rem; background: rgba(26, 26, 26, 0.7); box-shadow: 4px 4px 0px #00a651; padding: 2rem; margin-bottom: 2rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);" 
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='6px 6px 0px #00a651';" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='4px 4px 0px #00a651';">
          <div id="drumPatternGrid" style="display: grid; gap: 0.75rem;">
            <!-- Grid will be generated by JavaScript -->
          </div>
        </div>

        <!-- Presets -->
        <div style="border: 2px solid #00a651; border-radius: 0.5rem; background: rgba(26, 26, 26, 0.7); box-shadow: 4px 4px 0px #00a651; padding: 1.5rem;">
          <h4 style="font-family: 'VT323', monospace; font-size: 1.5rem; color: #00a651; letter-spacing: 1px; margin-bottom: 1rem; text-align: center;">BEAT PRESETS</h4>
          <div class="flex flex-wrap gap-3 justify-center" id="drumPresets">
            <button class="drum-preset-btn" data-preset="boom-bap">BOOM BAP</button>
            <button class="drum-preset-btn" data-preset="trap">TRAP</button>
            <button class="drum-preset-btn" data-preset="house">HOUSE</button>
            <button class="drum-preset-btn" data-preset="techno">TECHNO</button>
            <button class="drum-preset-btn" data-preset="breakbeat">BREAKBEAT</button>
            <button class="drum-preset-btn" data-preset="minimal">MINIMAL</button>
            <button class="drum-preset-btn" data-preset="afrobeat">AFROBEAT</button>
            <button class="drum-preset-btn" data-preset="reggaeton">REGGAETON</button>
          </div>
        </div>
      </div>
    `;

    // Create the sequencer grid
    createGrid();

    // Setup event listeners
    setupEventListeners();

    // Load default preset
    loadPreset('boom-bap');
  }

  // Create sequencer grid
  function createGrid() {
    const grid = document.getElementById('drumPatternGrid');
    if (!grid) return;

    grid.innerHTML = '';

    instruments.forEach(inst => {
      const row = document.createElement('div');
      row.style.cssText = 'display: grid; grid-template-columns: 100px repeat(16, 1fr); gap: 0.25rem; align-items: center;';

      const label = document.createElement('div');
      label.className = 'drum-track-label';
      label.style.cssText = 'font-family: "VT323", monospace; font-size: 1.125rem; color: #00a651; text-transform: uppercase; letter-spacing: 1px; text-align: right; padding-right: 1rem;';
      label.textContent = inst.label;
      row.appendChild(label);

      for (let i = 0; i < STEPS; i++) {
        const step = document.createElement('button');
        step.className = 'drum-step-btn';
        if (i % 4 === 0 && i !== 0) {
          step.classList.add('drum-step-4n');
        }
        step.dataset.instrument = inst.id;
        step.dataset.step = i;
        step.addEventListener('click', toggleStep);
        row.appendChild(step);
      }

      grid.appendChild(row);
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

  // Audio synthesis
  function playSound(instId) {
    if (!audioContext) return;

    const inst = instruments.find(i => i.id === instId);
    if (!inst) return;

    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    switch(instId) {
      case 'kick':
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'snare':
        const noise = audioContext.createBufferSource();
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const noiseGain = audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.2);
        noise.start(now);
        noise.stop(now + 0.2);
        break;

      case 'hihat':
      case 'openhat':
        osc.type = 'square';
        osc.frequency.value = inst.frequency;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (instId === 'openhat' ? 0.3 : 0.05));
        osc.start(now);
        osc.stop(now + (instId === 'openhat' ? 0.3 : 0.05));
        break;

      case 'clap':
      case 'rim':
      case 'cowbell':
        osc.frequency.value = inst.frequency;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.value = inst.frequency;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
    }
  }

  // Sequencer playback
  function advanceSequencer() {
    // Remove playing class from previous step
    document.querySelectorAll('.drum-step-btn').forEach(el => {
      el.classList.remove('playing');
    });

    // Add playing class to current step
    instruments.forEach(inst => {
      const el = document.querySelector(`[data-instrument="${inst.id}"][data-step="${currentStep}"]`);
      if (el) {
        el.classList.add('playing');
        if (pattern[inst.id][currentStep]) {
          playSound(inst.id);
        }
      }
    });

    currentStep = (currentStep + 1) % STEPS;
  }

  // Transport controls
  function play() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    });
    updatePattern();
  }

  function loadPreset(presetName) {
    if (presets[presetName]) {
      pattern = JSON.parse(JSON.stringify(presets[presetName]));
      updatePattern();
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    const playBtn = document.getElementById('drumPlayBtn');
    const stopBtn = document.getElementById('drumStopBtn');
    const clearBtn = document.getElementById('drumClearBtn');
    const tempoSlider = document.getElementById('drumTempoSlider');
    const tempoValue = document.getElementById('drumTempoValue');

    if (playBtn) playBtn.addEventListener('click', play);
    if (stopBtn) stopBtn.addEventListener('click', stop);
    if (clearBtn) clearBtn.addEventListener('click', clear);

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

    document.querySelectorAll('.drum-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });
  }

  // Initialize function
  function initialize() {
    const container = document.getElementById('drum-machine-container');
    if (!container) {
      console.error('Drum machine container not found');
      return;
    }

    // Reset state when re-initializing
    pause();
    currentStep = 0;
    
    createDrumMachine();
  }

  // Public API
  window.drumMachine = {
    initialize: initialize,
    play: play,
    stop: stop,
    clear: clear,
    loadPreset: loadPreset
  };
})();
