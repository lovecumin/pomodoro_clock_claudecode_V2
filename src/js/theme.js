/**
 * theme.js - 主题切换
 */
const Theme = (() => {
  function init() {
    const saved = localStorage.getItem('pomodoro-theme') || 'light';
    setTheme(saved);

    const select = document.getElementById('setting-theme');
    if (select) {
      select.value = saved;
      select.addEventListener('change', (e) => {
        setTheme(e.target.value);
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pomodoro-theme', theme);

    const select = document.getElementById('setting-theme');
    if (select) select.value = theme;

    // 派发自定义事件，让其他模块响应主题变化
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }

  return { init, setTheme };
})();
