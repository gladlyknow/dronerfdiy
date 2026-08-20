# DroneRF DIY · Radio

`dronerfdiy.com/redio/` 的业余无线电学习前端。

本版本以 Google AI Studio 生成项目为 UI/交互基线，并针对当前 A 类题库与 Cloudflare Workers Static Assets 部署做了清理和适配。

## 当前范围

- A 类考试全景知识图谱：法律法规、通联规范、无线电技术、设备电路、安全与应急
- 结构化考点卡片 / 交互知识图谱
- A 类题库浏览、模拟考试、错题本
- 中国业余无线电呼号 1～0 区考试分区示意图与完整对照
- Q 简语、ITU 字母解释法、频段与功率、天馈计算工具
- 亮色 / 暗色模式、全局搜索

> `/redio/` 当前专注 A 类。Google AI 原工程中的 B/C 旧规则没有作为生产入口开放。

## A 类关键口径

- 操作能力频率范围：30–3000 MHz
- 最大发射功率：≤25 W
- 7 / 14 / 21 / 28 MHz 等低于 30 MHz，不属于 A 类发射能力范围
- 当前考试结构：40 题（32 单选 + 8 多选），答对 30 题合格，40 分钟
- 电台执照继续使用：有效期届满 30 个工作日前申请更换
- 应急临时设台：按规定在 48 小时内报告

## 呼号分区地图

地图用于考试记忆，按题库 1～0 分区表对 31 个大陆省级行政区着色：

- 1：北京
- 2：黑龙江、吉林、辽宁
- 3：天津、内蒙古、河北、山西
- 4：上海、山东、江苏
- 5：浙江、江西、福建
- 6：安徽、河南、湖北
- 7：湖南、广东、广西、海南
- 8：四川、重庆、贵州、云南
- 9：陕西、甘肃、宁夏、青海
- 0：新疆、西藏

地图是学习示意图，不作为测绘或行政边界依据。港澳台仅作地理提示，不并入本题库这张 1～0 分区表。

## 本地运行

```bash
bun install
bun run dev
```

## 检查与构建

```bash
bun run lint
bun run build
```

Vite 配置：

- `base: /redio/`
- 输出目录：`dist/redio/`

Cloudflare Worker Static Assets 从仓库根目录的 `dist/` 发布，因此最终路径为：

```text
dist/redio/index.html -> https://dronerfdiy.com/redio/
```

Cloudflare Git Build 推荐：

```text
Build command:  bun run build
Deploy command: npx wrangler deploy
Root directory: /
Production branch: main
```

当前生产应用不调用 Gemini API，也不需要 `GEMINI_API_KEY`。
