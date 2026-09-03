# DroneRF DIY

DroneRF DIY 是母品牌站点，当前由三个相互独立、但共享账户与服务端能力的入口组成：

| 入口 | 用途 |
| --- | --- |
| `/` | DroneRF DIY 品牌首页，连接无线电与无人机学习。 |
| `/radio/` | **Radio Earth**：业余无线电学习、A/B/C 类题库、考试与实用工具。 |
| `/drone/` | Drone：法规安全、FPV、装机、调参、射频、ExpressLRS、数字图传、电池、项目与工具。 |

完整的部署参数请见 [配置说明](docs/CONFIGURATION.zh-CN.md)，目录、路由、数据流和运维流程请见 [项目指南](docs/PROJECT_GUIDE.zh-CN.md)。

## Radio Earth 路由

Radio 的正式公开路径保持为浅层入口；学习工作区的细分状态使用查询参数，而不是继续增加目录层级。

| 正式路径 | 页面 |
| --- | --- |
| `/radio/` | Radio Earth 首页 |
| `/radio/ham-radio-license/` | 美国业余无线电执照总览 |
| `/radio/china-license/` | 中国 A/B/C 类学习总览 |
| `/radio/exam/` | 中国题库、知识图谱、模拟考试、错题本工作区 |
| `/radio/tools/` | 呼号地图、通联词典、频段、天馈等工具工作区 |
| `/radio/technician/`、`/radio/general/`、`/radio/extra/` | 美国执照等级指南 |
| `/radio/license-a/`、`/radio/license-b/`、`/radio/license-c/` | 中国 A/B/C 类学习页 |

`/radio/exam/` 使用 `level=A|B|C` 与 `tab=knowledge|question_bank|simulator|wrong_book` 保存学习上下文；`/radio/tools/` 使用 `tool=map|dictionary|phonetic|bands|antenna`。上表列出的 **11 个浅层 Radio 页面**是唯一受支持的网页路由；新站内链接、sitemap、canonical 与外部投放落地页只使用这些路径。旧 `/redio/*` 和旧市场/语言深路径已移除，不保证可访问。下方 R2 PDF 的 `/redio/` 是对象存储文件路径，不是网页路由，仍予以保留。

Drone 的既有专题页面仍会静态输出，可直接访问或刷新，例如 `/drone/safety/`、`/drone/fpv/`、`/drone/build/`、`/drone/tuning/`、`/drone/rf/`、`/drone/expresslrs/`、`/drone/o3/`、`/drone/battery/`、`/drone/projects/` 与 `/drone/tools/`。

## 中国 A / B / C 题库的权威性门禁

中国 A/B/C 数据层以 R2 上的三份 PDF 为唯一权威源，不使用 AI 补题、示例摘录或跨类别复用题目：

- A：`https://storage.dronerfdiy.com/redio/A类题库.pdf`
- B：`https://storage.dronerfdiy.com/redio/B类题库.pdf`
- C：`https://storage.dronerfdiy.com/redio/C类题库.pdf`

| 类别 | PDF 页数 | 原题数量 | 唯一 `[I]` | `[P]` 小节 | 单选 | 多选 | 缺失字段 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 165 | 683 | 683 | 51 | 547 | 136 | 0 |
| B | 277 | 1143 | 1143 | 95 | 947 | 196 | 0 |
| C | 309 | 1282 | 1282 | 104 | 1072 | 210 | 0 |

合计 **3108 道源题**。题目保存 `[I]`、`[J]`、`[P]`、`[Q]`、`[T]` 和 `[A]`～`[D]` 源字段。源 PDF 未提供解析时，界面会明确写出“原始题库未提供解析”。部分 `[J]` 参考码在源 PDF 中本身重复，项目保持原样，并以 `[I]` 作为题目唯一主键。

构建会先运行 `bun run verify:banks`，固定校验 PDF 页数、SHA-256、题数、唯一题号、字段完整性、四个选项和章节合计；任何不一致都会使构建失败。当前指纹为：

- A：`871cf0290e5d89da926216f95eeecbc2ef46a5d8a10eaa2a29dab018736d14a3`
- B：`492eaaa1e2d56b90923cd2ba13c901c0fc18e9c037db50462dafeb81b707a34b`
- C：`94c525cdadf210ac3d183d17c80d9bef829eebcf1fe93e550917e5e39b5d0098`

美国 Technician、General、Amateur Extra 页面目前是执照流程与官方资料入口，**仓库没有导入或校验美国完整试题库**；不得将这些介绍页描述为美国全题库练习系统。

## 本地运行与校验

```bash
bun install
cp .dev.vars.example .dev.vars
bun run dev
```

常用校验：

```bash
bun run verify:banks
bun run verify:ham-tools
bun run verify:answer-key
bun run lint
bun run build
```

`bun run build` 会完成题库、HAM 工具与答案键校验，分别构建根站与 `/radio/`，预渲染 Radio 静态页，复制 Drone 路由，并校验 Radio SEO 产物。发布命令为 `bun run deploy`；它会先构建再执行 `wrangler deploy`。Cloudflare Worker 将仓库根目录的 `dist/` 作为 Static Assets 发布。

生产配置为 `wrangler.jsonc` 中的 Worker `dronerfdiy`、D1 绑定 `DB`（`de174415-1d9e-4411-b9b1-66e2821bbc5a`）和 `dist/` 资产目录。任何真实密钥均不得提交到仓库；详见 [配置说明](docs/CONFIGURATION.zh-CN.md)。
