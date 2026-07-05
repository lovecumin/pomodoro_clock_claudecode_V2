/**
 * app.js - 应用入口 & 状态管理
 */
(function () {
  'use strict';

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', () => {
    // 初始化各模块
    Theme.init();
    Stats.init();
    Notification_.init();
    Sound.init();
    Tasks.init();
    Timer.init(onTimerComplete);

    bindTitlebar();
    bindModeTabs();
    bindSideTabs();
    bindTimerControls();
    bindSettings();

    // 切换到统计面板时刷新图表
    document.querySelector('[data-tab="stats"]').addEventListener('click', () => {
      setTimeout(() => Stats.updateDisplay(), 50);
    });

    // 主题切换时刷新统计图表
    document.addEventListener('themechange', () => {
      setTimeout(() => Stats.updateDisplay(), 50);
    });
  });

  // ===== 计时器完成回调 =====
  function onTimerComplete(mode) {
    if (mode === 'work') {
      Stats.recordPomodoro(Tasks.getActiveTask()?.tag || '其他');
      Tasks.incrementPomodoro();
      Notification_.send('🍅 专注完成！', '休息一下吧，喝杯水放松一下');
    } else {
      Notification_.send('☕ 休息结束！', '准备好开始下一个番茄钟了吗？');
    }

    const autoStart = localStorage.getItem('pomodoro-auto-start') === 'true';
    if (autoStart) {
      setTimeout(() => { Timer.advanceToNext(); Timer.start(); }, 1500);
    } else {
      Timer.advanceToNext();
    }
  }

  // ===== 标题栏 =====
  function bindTitlebar() {
    document.getElementById('btn-minimize').addEventListener('click', () => {
      window.electronAPI?.minimize();
    });
    document.getElementById('btn-maximize').addEventListener('click', () => {
      window.electronAPI?.maximize();
    });
    document.getElementById('btn-close').addEventListener('click', () => {
      window.electronAPI?.close();
    });
  }

  // ===== 模式切换 =====
  function bindModeTabs() {
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (Timer.isTimerRunning()) return; // 运行中不允许切换
        Timer.setMode(tab.dataset.mode);
      });
    });
  }

  // ===== 右侧 Tab =====
  function bindSideTabs() {
    document.querySelectorAll('.side-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      });
    });
  }

  // ===== 计时器控制 =====
  function bindTimerControls() {
    document.getElementById('btn-start').addEventListener('click', () => {
      Timer.start();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      Timer.reset();
    });
    document.getElementById('btn-skip').addEventListener('click', () => {
      Timer.skip();
    });
  }

  // ===== 设置 =====
  function bindSettings() {
    const inputs = {
      work: document.getElementById('setting-work'),
      short: document.getElementById('setting-short'),
      long: document.getElementById('setting-long'),
      interval: document.getElementById('setting-interval'),
      autoStart: document.getElementById('setting-auto-start'),
    };

    // 加载保存的设置（从 Timer 获取，不再重复读 localStorage）
    const config = Timer.getConfig();
    inputs.work.value = config.work;
    inputs.short.value = config.shortBreak;
    inputs.long.value = config.longBreak;
    inputs.interval.value = config.longBreakInterval;

    inputs.autoStart.checked = localStorage.getItem('pomodoro-auto-start') === 'true';

    // 保存设置
    Object.values(inputs).forEach(input => {
      input.addEventListener('change', () => {
        Timer.updateConfig({
          work: parseInt(inputs.work.value) || 25,
          shortBreak: parseInt(inputs.short.value) || 5,
          longBreak: parseInt(inputs.long.value) || 15,
          longBreakInterval: parseInt(inputs.interval.value) || 4,
        });
        localStorage.setItem('pomodoro-auto-start', inputs.autoStart.checked);
      });
    });
  }
})();
