/**
 * stats.js - 统计数据 & 图表（纯 Canvas，无外部依赖）
 */
const Stats = (() => {
  let dailyData = {}; // { '2026-07-05': 3, ... }
  let tagData = {};   // { '工作': 5, '学习': 3, ... }

  function init() {
    loadData();
  }

  function loadData() {
    const saved = localStorage.getItem('pomodoro-stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      dailyData = parsed.daily || {};
      tagData = parsed.tags || {};
    }
  }

  function saveData() {
    localStorage.setItem('pomodoro-stats', JSON.stringify({
      daily: dailyData,
      tags: tagData,
    }));
  }

  function recordPomodoro(tag) {
    const today = getToday();
    dailyData[today] = (dailyData[today] || 0) + 1;
    if (tag) {
      tagData[tag] = (tagData[tag] || 0) + 1;
    }
    saveData();
    updateDisplay();
  }

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function getTodayCount() {
    return dailyData[getToday()] || 0;
  }

  function getWeekCount() {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 周日=7
    let count = 0;
    for (let i = 1; i <= dayOfWeek; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (dayOfWeek - i));
      const key = d.toISOString().split('T')[0];
      count += dailyData[key] || 0;
    }
    return count;
  }

  function getTotalCount() {
    return Object.values(dailyData).reduce((sum, v) => sum + v, 0);
  }

  function updateDisplay() {
    animateNumber('stat-today', getTodayCount());
    animateNumber('stat-week', getWeekCount());
    animateNumber('stat-total', getTotalCount());

    const colors = getThemeColors();
    drawDailyChart(colors);
    drawTagChart(colors);
  }

  function animateNumber(id, target) {
    const el = document.getElementById(id);
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    el.textContent = target;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 400);
  }

  // ===== 主题颜色（一次读取，供两个图表共用）=====
  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      accent: style.getPropertyValue('--accent').trim(),
      textSec: style.getPropertyValue('--text-secondary').trim(),
      bgCard: style.getPropertyValue('--bg-card').trim(),
      border: style.getPropertyValue('--border').trim(),
    };
  }

  // ===== Canvas 图表 =====

  function drawDailyChart(colors) {
    const canvas = document.getElementById('chart-daily');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 获取最近7天数据
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      days.push({ label, count: dailyData[key] || 0 });
    }

    const maxCount = Math.max(...days.map(d => d.count), 1);
    const barWidth = (w - 60) / 7;
    const chartHeight = h - 40;

    const { accent, textSec } = colors;

    // 标题
    ctx.fillStyle = textSec;
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('近7天专注趋势', 10, 16);

    // 绘制柱状图
    days.forEach((day, i) => {
      const x = 30 + i * barWidth;
      const barH = (day.count / maxCount) * (chartHeight - 30);
      const y = chartHeight - barH;

      // 柱子
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.roundRect(x + 6, y, barWidth - 12, barH, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 数量
      if (day.count > 0) {
        ctx.fillStyle = textSec;
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(day.count, x + barWidth / 2, y - 4);
      }

      // 日期
      ctx.fillStyle = textSec;
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, x + barWidth / 2, chartHeight + 14);
    });
  }

  function drawTagChart(colors) {
    const canvas = document.getElementById('chart-tags');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const { textSec, bgCard } = colors;

    const tags = Object.entries(tagData).filter(([, v]) => v > 0);
    const total = tags.reduce((sum, [, v]) => sum + v, 0);

    // 标题
    ctx.fillStyle = textSec;
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('标签分布', 10, 16);

    if (tags.length === 0) {
      ctx.fillStyle = textSec;
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', w / 2, h / 2);
      return;
    }

    const pieColors = ['#C65A4A', '#7BAE7F', '#D4A574', '#8B7EC8', '#D4845A', '#6B9BB5'];

    // 饼图
    const centerX = 100;
    const centerY = h / 2 + 10;
    const radius = 55;
    let startAngle = -Math.PI / 2;

    tags.forEach(([tag, count], i) => {
      const sliceAngle = (count / total) * Math.PI * 2;
      ctx.fillStyle = pieColors[i % pieColors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      startAngle += sliceAngle;
    });

    // 中心白洞
    ctx.fillStyle = bgCard;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 中心文字
    ctx.fillStyle = textSec;
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, centerX, centerY - 6);
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('总计', centerX, centerY + 12);

    // 图例
    const legendX = 200;
    let legendY = 30;
    tags.forEach(([tag, count], i) => {
      ctx.fillStyle = pieColors[i % pieColors.length];
      ctx.beginPath();
      ctx.roundRect(legendX, legendY, 10, 10, 2);
      ctx.fill();

      ctx.fillStyle = textSec;
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${Tasks.getTagEmoji(tag)} ${tag}  ${count}`, legendX + 16, legendY - 1);
      legendY += 24;
    });
  }

  return {
    init,
    recordPomodoro,
    updateDisplay,
    getTodayCount,
    getWeekCount,
    getTotalCount,
  };
})();
