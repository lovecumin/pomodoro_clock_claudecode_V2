# 🍅 番茄钟 (Pomodoro Clock)

一款基于 Electron 的桌面番茄钟应用，帮助你高效管理专注与休息时间。

## ✨ 功能特性

- **⏱ 番茄计时器** — 专注 25 分钟 / 短休 5 分钟 / 长休 15 分钟，圆形进度条动画
- **📋 任务管理** — 添加、完成、删除任务，支持 6 种标签分类
- **📊 专注统计** — 近 7 天趋势柱状图 + 标签分布饼图
- **🎵 白噪音** — 4 种背景音（雨声、海浪、森林、咖啡馆），基于 Web Audio API 生成
- **🎨 3 套主题** — 温暖浅色 / 暖棕深色 / 清新绿
- **⚙️ 自定义设置** — 可调整时长、间隔、自动开始等
- **🔔 系统通知** — 专注/休息结束桌面提醒

## 📸 截图

> 界面采用温暖柔和的配色方案，支持深色/浅色/护眼绿三套主题切换

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装与运行

```bash
# 克隆仓库
git clone git@github.com:lovecumin/pomodoro-clock.git
cd pomodoro-clock

# 安装依赖
npm install

# 启动应用
npm start
```

### 打包为可执行文件

```bash
npm run build
```

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 桌面应用框架 |
| HTML / CSS / JavaScript | 界面与逻辑（无前端框架） |
| Web Audio API | 白噪音生成（无需外部音频文件） |
| Canvas API | 统计图表绘制（无外部图表库） |
| node-notifier | 跨平台桌面通知 |

## 📁 项目结构

```
pomodoro-clock/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（IPC 桥接）
├── package.json         # 项目配置
├── src/
│   ├── index.html       # 主界面
│   ├── styles/
│   │   ├── main.css     # 主样式
│   │   ├── themes.css   # 主题变量（3 套主题）
│   │   └── animations.css # 动画效果
│   ├── js/
│   │   ├── app.js       # 应用入口 & 状态管理
│   │   ├── timer.js     # 计时器核心逻辑
│   │   ├── tasks.js     # 任务管理
│   │   ├── stats.js     # 统计数据 & 图表
│   │   ├── sound.js     # 白噪音（Web Audio API）
│   │   ├── theme.js     # 主题切换
│   │   └── notification.js # 系统通知
│   └── assets/          # 图标等资源
└── README.md
```

## ⚙️ 配置说明

在应用内的「设置」面板中可以调整：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 专注时长 | 25 分钟 | 每个番茄钟的工作时间 |
| 短休息时长 | 5 分钟 | 每次专注后的休息时间 |
| 长休息时长 | 15 分钟 | 每 4 个番茄钟后的长休息 |
| 长休息间隔 | 4 个 | 触发长休息所需的番茄数 |
| 自动开始 | 关闭 | 完成后是否自动开始下一阶段 |

## 📝 开发说明

本项目采用模块化 IIFE 设计，各模块职责清晰：

- **Timer** — 倒计时核心，模式切换
- **Tasks** — 任务 CRUD，localStorage 持久化
- **Stats** — 数据记录，Canvas 图表
- **Sound** — Web Audio API 噪声合成
- **Theme** — CSS 变量主题切换
- **Notification** — Electron/浏览器通知

## 📄 License

MIT License
