/**
 * sound.js - 白噪音生成（Web Audio API）
 */
const Sound = (() => {
  let audioCtx = null;
  let gainNode = null;
  let currentSound = 'none';
  let volume = 0.5;
  let nodes = [];
  let chirpTimer = null; // 森林鸟鸣的 setTimeout 链

  function init() {
    const slider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');

    slider.value = volume * 100;
    volumeValue.textContent = Math.round(volume * 100) + '%';

    slider.addEventListener('input', (e) => {
      volume = e.target.value / 100;
      volumeValue.textContent = Math.round(volume * 100) + '%';
      if (gainNode) {
        gainNode.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      }
      localStorage.setItem('pomodoro-volume', volume);
    });

    document.querySelectorAll('.sound-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;
        play(sound);
        document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
        if (sound !== 'none') btn.classList.add('active');
      });
    });

    const savedVolume = localStorage.getItem('pomodoro-volume');
    if (savedVolume !== null) {
      volume = parseFloat(savedVolume);
      slider.value = volume * 100;
      volumeValue.textContent = Math.round(volume * 100) + '%';
    }
  }

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function stop() {
    // 清除鸟鸣定时器链
    if (chirpTimer) {
      clearTimeout(chirpTimer);
      chirpTimer = null;
    }
    nodes.forEach(n => {
      try { n.stop(); } catch(e) {}
    });
    nodes = [];
    currentSound = 'none';
  }

  // ====== 辅助：创建棕噪声 Buffer ======
  function createBrownNoiseBuffer(seconds, factor, divisor, gain) {
    const bufferSize = audioCtx.sampleRate * seconds;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + factor * white) / divisor;
      data[i] = lastOut * gain;
    }
    return buffer;
  }

  // ====== 辅助：创建循环滤波音源 ======
  function createLoopingSource(buffer, filterType, filterFreq, filterQ) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
    if (filterQ !== undefined) {
      filter.Q.setValueAtTime(filterQ, audioCtx.currentTime);
    }
    source.connect(filter);
    filter.connect(gainNode);
    source.start();
    nodes.push(source);
    return source;
  }

  // ====== 雨声：粉红噪声 ======
  function createRain() {
    const bufferSize = audioCtx.sampleRate * 4;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    createLoopingSource(buffer, 'lowpass', 3000);
  }

  // ====== 海浪：棕噪声 + LFO 调制 ======
  function createOcean() {
    const buffer = createBrownNoiseBuffer(6, 0.02, 1.02, 3.5);
    const source = createLoopingSource(buffer, 'lowpass', 800);

    // LFO 调制音量模拟海浪
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.1, audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();
    nodes.push(lfo);
  }

  // ====== 森林：鸟鸣 + 风声 ======
  function createForest() {
    const buffer = createBrownNoiseBuffer(4, 0.04, 1.04, 2);
    createLoopingSource(buffer, 'bandpass', 600, 0.5);

    // 鸟鸣：间歇性高频正弦波，路由到 gainNode 以受音量控制
    function chirp() {
      if (currentSound !== 'forest') return;
      const osc = audioCtx.createOscillator();
      const chirpGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 2000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1500 + Math.random() * 1500,
        audioCtx.currentTime + 0.1
      );
      chirpGain.gain.setValueAtTime(0, audioCtx.currentTime);
      chirpGain.gain.linearRampToValueAtTime(0.02 * volume, audioCtx.currentTime + 0.02);
      chirpGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      osc.connect(chirpGain);
      chirpGain.connect(gainNode); // 修复：连接到 gainNode 而非 destination
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      chirpTimer = setTimeout(chirp, 2000 + Math.random() * 5000);
    }
    chirpTimer = setTimeout(chirp, 1000);
  }

  // ====== 咖啡馆：棕噪声 + 人声嗡鸣 ======
  function createCafe() {
    const buffer = createBrownNoiseBuffer(3, 0.02, 1.02, 4);
    createLoopingSource(buffer, 'bandpass', 400, 0.3);

    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + Math.random() * 100, audioCtx.currentTime);
      oscGain.gain.setValueAtTime(0.008 * volume, audioCtx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();
      nodes.push(osc);
    }
  }

  function play(type) {
    ensureContext();
    stop();
    if (type === 'none') return;
    currentSound = type;
    switch (type) {
      case 'rain': createRain(); break;
      case 'ocean': createOcean(); break;
      case 'forest': createForest(); break;
      case 'cafe': createCafe(); break;
    }
  }

  function getCurrentSound() {
    return currentSound;
  }

  return { init, play, stop, getCurrentSound };
})();
