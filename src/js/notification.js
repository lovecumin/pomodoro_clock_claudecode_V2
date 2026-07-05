/**
 * notification.js - 系统通知
 */
const Notification_ = (() => {
  function init() {
    // 检查通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function send(title, body) {
    // 优先使用 Electron API
    if (window.electronAPI) {
      window.electronAPI.sendNotification(title, body);
      window.electronAPI.playAlert();
      return;
    }

    // 降级到 Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🍅' });
    }
  }

  return { init, send };
})();
