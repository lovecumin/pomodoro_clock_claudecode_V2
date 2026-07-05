/**
 * main.js — Electron 主进程
 *
 * 【整体架构说明】
 * Electron 应用分为"主进程"和"渲染进程"两部分：
 *   - 主进程（本文件）：运行在 Node.js 环境中，负责创建窗口、调用系统 API（通知、文件等）。
 *   - 渲染进程（index.html + js/*）：运行在 Chromium 浏览器环境中，负责界面展示和用户交互。
 *
 * 两者之间通过 IPC（进程间通信）互相发送消息。
 * 本文件就是整个应用的"入口"和"管家"。
 */

// ============================================================
// 第一部分：导入依赖
// ============================================================

// 从 Electron 框架中解构出需要的模块：
//   app           — 应用生命周期管理（启动、退出等事件）
//   BrowserWindow — 创建和管理桌面窗口
//   ipcMain       — 主进程的 IPC 通信接口，用于接收渲染进程发来的消息
//   Notification  — Electron 内置的通知模块（本项目未直接使用，改用 node-notifier）
const { app, BrowserWindow, ipcMain } = require('electron');

// path — Node.js 内置模块，用于拼接和处理文件路径（跨平台兼容）
const path = require('path');

// node-notifier — 第三方库，用于发送跨平台桌面通知（比 Electron 内置的兼容性更好）
const notifier = require('node-notifier');

// ============================================================
// 第二部分：全局变量
// ============================================================

// mainWindow — 保存主窗口的引用
// 声明为全局变量，这样在 createWindow() 之外也能访问（如窗口控制、通知等场景）
let mainWindow;

// ============================================================
// 第三部分：创建窗口函数
// ============================================================

/**
 * createWindow() — 创建应用主窗口
 *
 * 这是整个应用最核心的函数，做了以下几件事：
 *   1. 创建一个 BrowserWindow 实例（即一个桌面窗口）
 *   2. 加载 HTML 页面作为窗口内容
 *   3. 注册 IPC 消息监听器，处理渲染进程发来的各种请求
 */
function createWindow() {

  // ---------- 3.1 创建窗口 ----------
  mainWindow = new BrowserWindow({
    // --- 窗口尺寸 ---
    width: 900,        // 初始宽度 900px
    height: 650,       // 初始高度 650px
    minWidth: 750,     // 最小宽度（防止用户拖得太小导致界面错乱）
    minHeight: 550,    // 最小高度

    // --- 窗口外观 ---
    frame: false,          // 无边框窗口（去掉系统自带的标题栏和边框）
                           // 因为我们用 HTML 自己做了标题栏（index.html 里的 .titlebar）
    transparent: false,    // 不透明背景（设为 true 可以做透明/圆角窗口，但性能较差）
    resizable: true,       // 允许用户拖拽调整窗口大小
    backgroundColor: '#F7F2EC',  // 窗口背景色（在页面加载前显示，避免白屏闪烁）

    // --- 窗口图标 ---
    // path.join() 拼接出图标的绝对路径
    // __dirname 是当前文件（main.js）所在的目录
    icon: path.join(__dirname, 'src/assets/icon.png'),

    // --- Web 安全配置 ---
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // preload — 预加载脚本的路径
      // 预加载脚本在页面加载之前执行，可以安全地把 Node.js 能力暴露给渲染进程
      // 本项目中，preload.js 暴露了窗口控制和通知发送的 API

      contextIsolation: true,
      // contextIsolation — 上下文隔离（设为 true 是安全最佳实践）
      // 开启后，预加载脚本和网页脚本运行在不同的 JavaScript 上下文中
      // 防止恶意网页篡改预加载脚本注入的 API

      nodeIntegration: false,
      // nodeIntegration — 禁止渲染进程直接访问 Node.js API
      // 设为 false 是安全最佳实践，防止网页中的 JavaScript 直接操作文件系统等
    },
  });

  // ---------- 3.2 加载页面 ----------
  // loadFile() — 加载本地 HTML 文件作为窗口内容
  // 渲染进程会执行 src/index.html 及其中引用的所有 CSS 和 JS
  mainWindow.loadFile('src/index.html');

  // ---------- 3.3 注册 IPC 消息监听器 ----------
  // ipcMain.on(频道名, 回调函数) — 监听渲染进程发来的消息
  // 渲染进程通过 window.electronAPI.xxx() 调用，对应 preload.js 中暴露的接口

  // --- 3.3.1 最小化窗口 ---
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();  // 调用 BrowserWindow 的最小化方法，窗口缩到任务栏
  });

  // --- 3.3.2 最大化/还原窗口 ---
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();  // 如果已最大化 → 还原为原始大小
    } else {
      mainWindow.maximize();    // 如果未最大化 → 放大到全屏
    }
    // 这种"切换"逻辑就是自定义标题栏上"□"按钮的行为
  });

  // --- 3.3.3 关闭窗口 ---
  ipcMain.on('window-close', () => {
    mainWindow.close();  // 关闭窗口（如果这是最后一个窗口，应用会退出）
  });

  // --- 3.3.4 发送桌面通知 ---
  ipcMain.on('send-notification', (event, { title, body }) => {
    // event    — IPC 事件对象，包含发送方信息
    // { title, body } — 解构渲染进程传来的参数
    //
    // 使用 node-notifier 发送系统级桌面通知：
    //   title   — 通知标题（如 "🍅 专注完成！"）
    //   message — 通知正文（如 "休息一下吧"）
    //   icon    — 通知图标路径
    //   sound   — true = 播放系统提示音
    //   wait    — false = 不等待用户点击，自动消失
    notifier.notify({
      title,
      message: body,
      icon: path.join(__dirname, 'src/assets/icon.png'),
      sound: true,
      wait: false,
    });
  });

  // --- 3.3.5 播放提示音 ---
  ipcMain.on('play-alert', () => {
    // 这里复用了 notifier 的 sound 功能来播放提示音
    // 番茄钟倒计时结束时，渲染进程会先调 send-notification（显示通知）
    // 再调 play-alert（确保有声音提醒）
    notifier.notify({
      title: '⏰ 番茄钟',
      message: '时间到！',
      sound: true,
    });
  });
}

// ============================================================
// 第四部分：应用生命周期事件
// ============================================================

// --- 4.1 应用准备就绪 ---
// app.whenReady() 返回一个 Promise，在 Electron 完成初始化后 resolve
// 此时才创建窗口，避免在 Electron 还没准备好时就调用 BrowserWindow 导致报错
app.whenReady().then(createWindow);

// --- 4.2 所有窗口关闭 ---
// 在 macOS 上，关闭所有窗口通常不会退出应用（用户期望应用留在 Dock 中）
// 在 Windows/Linux 上，关闭所有窗口意味着应用应该退出
app.on('window-all-closed', () => {
  app.quit();  // 退出整个应用进程
});

// --- 4.3 应用被激活（macOS 专有行为）---
// macOS 上点击 Dock 图标会触发 activate 事件
// 如果此时没有打开的窗口，就重新创建一个
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============================================================
// 总结：数据流向
// ============================================================
//
//   渲染进程（index.html + js/*）
//       │
//       │  window.electronAPI.minimize()
//       │  window.electronAPI.sendNotification(title, body)
//       │
//       ▼  （通过 preload.js 桥接，IPC 通信）
//
//   主进程（main.js）
//       │
//       │  ipcMain.on('window-minimize', ...)
//       │  ipcMain.on('send-notification', ...)
//       │
//       ▼  （调用系统 API）
//
//   操作系统
//       ├── 最小化/最大化/关闭窗口
//       └── 显示桌面通知 + 播放提示音
