# DroneRF DIY · 无线电与无人机实验站

站点包含三个独立入口：

- `/`：DroneRF DIY 品牌首页，提供 Radio / Drone 双入口与 DIY 学习工作流。
- `/drone/`：无人机实验模块；包含法规与安全、FPV、装机、调参、RF、ExpressLRS、数字图传、电池安全、项目与可计算工具。
- `/redio/`：业余无线电 A / B / C 类题库学习应用（保留既有业务与题库校验）。

Drone 深层页面会在构建时生成真实的 `index.html`，可直接访问和刷新：`/drone/safety/`、`/drone/fpv/`、`/drone/build/`、`/drone/tuning/`、`/drone/rf/`、`/drone/expresslrs/`、`/drone/o3/`、`/drone/battery/`、`/drone/projects/`、`/drone/tools/`。

`dronerfdiy.com/redio/` 的业余无线电 A / B / C 类操作技术能力学习前端。

题库数据层以 R2 上的三份 PDF 为唯一权威源，不使用 AI 补题、示例摘录或跨类别复用题目：

- A：`https://storage.dronerfdiy.com/redio/A类题库.pdf`
- B：`https://storage.dronerfdiy.com/redio/B类题库.pdf`
- C：`https://storage.dronerfdiy.com/redio/C类题库.pdf`

## A / B / C 完整题库

| 类别 | PDF 页数 | 原题数量 | 唯一 `[I]` | `[P]` 小节 | 单选 | 多选 | 缺失字段 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 165 | 683 | 683 | 51 | 547 | 136 | 0 |
| B | 277 | 1143 | 1143 | 95 | 947 | 196 | 0 |
| C | 309 | 1282 | 1282 | 104 | 1072 | 210 | 0 |

合计 **3108 道源题**。

每道题直接保留源 PDF 字段：`[I]` 题号、`[J]` 参考码、`[P]` 分类、`[Q]` 题干、`[T]` 标准答案以及 `[A]`～`[D]` 四个选项。源 PDF 未提供解析时，页面明确显示“原始题库未提供解析”，不会自行生成解释冒充题库内容。

## R2 源文件指纹

为了防止题库被替换、截断或生成数据与源文件失配，当前版本固定校验三份 PDF 的页数与 SHA-256：

- A：`871cf0290e5d89da926216f95eeecbc2ef46a5d8a10eaa2a29dab018736d14a3`
- B：`492eaaa1e2d56b90923cd2ba13c901c0fc18e9c037db50462dafeb81b707a34b`
- C：`94c525cdadf210ac3d183d17c80d9bef829eebcf1fe93e550917e5e39b5d0098`

`bun run build` 会先执行 `bun run verify:banks`。任何类别出现题数不符、`[I]` 重复、字段缺失、四个选项不完整、章节合计不符或源 PDF 指纹变化，构建都会失败，不允许静默部署不完整数据。

> 源 PDF 中部分 `[J]` 参考码本身存在重复。项目保持源数据原样，仅将 `[I]` 作为题目唯一主键；重复 J 码会在导入清单中记录，不会被篡改或人工重编号。

## 学习功能

A / B / C 三个入口均独立使用各自题库，包含：

- 原始题库完整浏览、分页、搜索与 `[P]` 分类过滤
- 全真模拟考试
- 错题本
- 考点速记 / 结构化大纲
- 源数据驱动的全景知识图谱：模块 → `[P]` 小节 → 全部关联原题
- 全局搜索：可同时搜索 A/B/C 题干、MC 题号、J 码、P 分类、答案与选项
- Q 简语、ITU 字母解释法、中国呼号 1～0 分区地图等辅助组件

## 模拟考试结构

- A：40 题 = 32 单选 + 8 多选；30 题合格；40 分钟
- B：60 题 = 45 单选 + 15 多选；45 题合格；60 分钟
- C：90 题 = 70 单选 + 20 多选；70 题合格；90 分钟

多选题采用**完全匹配**计分：多选、少选均不得分。

## 知识图谱原则

知识图谱的章节覆盖以各自 R2 PDF 的 `[P]` 字段为骨架。PDF 未提供章节中文标题的地方，界面只显示真实 `[P]` 编码，不由模型猜测标题；点击小节可反查该小节覆盖的全部源题。

## 呼号分区地图

中国呼号分区组件按题库考试口径展示 1～0 区，并保留完整省、自治区、直辖市对照。地图用于学习示意，不作为测绘或行政边界依据。

## 数据重新导入

如果 R2 上的 PDF 更新，应先在 feature 分支执行：

```bash
node scripts/import-r2-banks.mjs
bun run verify:banks
bun run lint
bun run build
```

导入器会从 R2 下载 PDF、使用源标签解析题目、生成 `src/data/generated/` 数据文件和 manifest，并记录页数、SHA-256、题量、唯一题号、章节数、单选/多选及每节题量。

## 本地运行

```bash
bun install
bun run dev
```

## 检查与构建

```bash
bun run verify:banks
bun run lint
bun run build
```

构建配置：

- 站点首页与 Drone：输出至 `dist/`
- Radio 独立构建：`base: /redio/`，输出至 `dist/redio/`

Cloudflare Worker Static Assets 从仓库根目录的 `dist/` 发布：

```text
dist/redio/index.html -> https://dronerfdiy.com/redio/
dist/index.html -> https://dronerfdiy.com/
dist/drone/fpv/index.html -> https://dronerfdiy.com/drone/fpv/
```

Cloudflare Git Build：

```text
Build command:  bun run build
Deploy command: npx wrangler deploy
Root directory: /
Production branch: main
```

当前生产应用不调用 Gemini API，也不需要 `GEMINI_API_KEY`。
