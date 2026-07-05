/**
 * timer.js - 番茄钟计时器核心逻辑
 */
const Timer = (() => {
  // 默认配置
  let config = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    longBreakInterval: 4,
  };

  let currentMode = 'work'; // work | shortBreak | longBreak
  let totalSeconds = config.work;
  let remainingSeconds = config.work;
  let isRunning = false;
  let intervalId = null;
  let pomodoroCount = 0; // 当前连续完成的番茄数

  const CIRCUMFERENCE = 2 * Math.PI * 120; // r=120

  // DOM 元素
  let timerTime, timerLabel, timerProgress, btnStart, timerCircle;
  let onTimerComplete = null; // 回调

  function init(callback) {
    timerTime = document.getElementById('timer-time');
    timerLabel = document.getElementById('timer-label');
    timerProgress = document.querySelector('.timer-progress');
    btnStart = document.getElementById('btn-start');
    timerCircle = document.querySelector('.timer-circle-wrapper');
    onTimerComplete = callback;

    timerProgress.style.strokeDasharray = CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = 0;

    loadConfig();
    updateDisplay();
  }

  function loadConfig() {
    const saved = localStorage.getItem('pomodoro-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      applyMinutes(parsed);
    }
    pomodoroCount = parseInt(localStorage.getItem('pomodoro-count') || '0');
    setMode(currentMode);
  }

  // 将配置中的分钟值统一转换为秒
  function applyMinutes(parsed) {
    config.work = (parsed.work || 25) * 60;
    config.shortBreak = (parsed.shortBreak || 5) * 60;
    config.longBreak = (parsed.longBreak || 15) * 60;
    config.longBreakInterval = parsed.longBreakInterval || 4;
  }

  function saveConfig() {
    localStorage.setItem('pomodoro-config', JSON.stringify({
      work: config.work / 60,
      shortBreak: config.shortBreak / 60,
      longBreak: config.longBreak / 60,
      longBreakInterval: config.longBreakInterval,
    }));
  }

  function setMode(mode) {
    currentMode = mode;
    totalSeconds = config[mode] || config.work;
    remainingSeconds = totalSeconds;
    updateDisplay();
    updateProgress();
    updateModeTabs();
  }

  function start() {
    if (isRunning) {
      pause();
      return;
    }
    isRunning = true;
    btnStart.innerHTML = '⏸';
    btnStart.classList.add('running');
    timerCircle.classList.add('pulsing');
    timerLabel.textContent = currentMode === 'work' ? '专注中...' : '休息中...';

    intervalId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      updateProgress();

      if (remainingSeconds <= 0) {
        complete();
      }
    }, 1000);
  }

  function pause() {
    isRunning = false;
    clearInterval(intervalId);
    btnStart.innerHTML = '▶';
    btnStart.classList.remove('running');
    timerCircle.classList.remove('pulsing');
    timerLabel.textContent = '已暂停';
  }

  function reset() {
    pause();
    remainingSeconds = totalSeconds;
    updateDisplay();
    updateProgress();
    timerLabel.textContent = '准备开始';
  }

  function complete() {
    pause();
    timerProgress.classList.add('completed');
    setTimeout(() => timerProgress.classList.remove('completed'), 3000);

    if (currentMode === 'work') {
      pomodoroCount++;
      localStorage.setItem('pomodoro-count', pomodoroCount);
    }

    if (onTimerComplete) {
      onTimerComplete(currentMode);
    }
  }

  function skip() {
    pause();
    advanceToNext();
  }

  function advanceToNext() {
    if (currentMode === 'work') {
      if (pomodoroCount > 0 && pomodoroCount % config.longBreakInterval === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('work');
    }
  }

  function updateDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // 更新页面标题
    const modeText = currentMode === 'work' ? '专注' : '休息';
    document.title = `${timerTime.textContent} - ${modeText} | 🍅 番茄钟`;
  }

  function updateProgress() {
    const progress = remainingSeconds / totalSeconds;
    const offset = CIRCUMFERENCE * (1 - progress);
    timerProgress.style.strokeDashoffset = offset;
  }

  function updateModeTabs() {
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === currentMode);
    });
  }

  function getCurrentPomodoros() {
    return pomodoroCount;
  }

  function getRemainingSeconds() {
    return remainingSeconds;
  }

  function isTimerRunning() {
    return isRunning;
  }

  function getCurrentMode() {
    return currentMode;
  }

  function updateConfig(newConfig) {
    applyMinutes(newConfig);
    saveConfig();
    if (!isRunning) {
      setMode(currentMode);
    }
  }

  return {
    init,
    start,
    pause,
    reset,
    skip,
    setMode,
    advanceToNext,
    getCurrentPomodoros,
    getRemainingSeconds,
    isTimerRunning,
    getCurrentMode,
    updateConfig,
    getConfig: () => ({ work: config.work / 60, shortBreak: config.shortBreak / 60, longBreak: config.longBreak / 60, longBreakInterval: config.longBreakInterval }),
  };
})();
