# DroneRF DIY 项目指南

## 1. 产品与边界

DroneRF DIY 是母品牌；Radio Earth 与 Drone 是两个内容与学习入口。Radio Earth 重点提供中国业余无线电 A/B/C 类题库学习，也提供美国执照流程资料；Drone 提供无人机 DIY 主题与工具。

中国 A/B/C 的 PDF 题库、导入产物和构建校验属于强一致性数据链路。美国 Technician、General、Amateur Extra 当前是静态执照指南与官方来源入口，**未导入美国完整题库，也没有美国全题库校验/模拟考试数据管线**。

## 2. 系统架构

```text
浏览器
  ├─ 根站 / 与 Drone /drone/ ── Vite 静态产物
  ├─ Radio Earth /radio/ ───── Radio Vite 静态产物与预渲染 SEO 页
  └─ /api/* ────────────────── Cloudflare Worker
                                  ├─ Better Auth
                                  ├─ 学习、考试、收藏、进度 API
                                  ├─ 商业、积分、AI、后台 API
                                  └─ Cloudflare D1 (DB)
```

`src/worker.ts` 会把非 API 请求交给 Static Assets。Radio 只发布下表列出的 11 个浅层网页路由；旧 `/redio/*` 与市场/语言深路径已移除，不进行 301 或内部重写，也不保证访问。认证和需要个人数据的 API 由 Better Auth session 保护；支付 Webhook 与支付回调有独立路由。D1 是账户、学习记录、订单、积分、AI、邮件投递记录和后台审计的事实库。

## 3. 目录说明

| 路径 | 职责 |
| --- | --- |
| `src/` | React 前端、Radio 组件、SEO 页面、Worker 与 API 服务端。 |
| `src/server/` | 身份认证、学习、考试、积分、商业、支付适配器、AI、邮件、后台权限。 |
| `src/data/generated/` | 从权威 R2 PDF 解析生成的 A/B/C 数据；不手工修改。 |
| `scripts/` | 题库导入/校验、答案键校验、HAM 工具校验、Radio 预渲染与 Drone 路由复制。 |
| `migrations/` | D1 SQL 迁移。 |
| `public/` | 前端静态资源。 |
| `dist/` | 构建输出，部署时生成，不作为编辑源。 |
| `wrangler.jsonc` | Worker、D1、静态资源和公开变量配置。 |
| `.dev.vars.example` | 本地环境变量模板；复制为不提交的 `.dev.vars`。 |

## 4. 路由与页面隔离

新建站内链接应使用以下浅层正式路径：

| 正式路径 | 目标 |
| --- | --- |
| `/`、`/drone/`、`/radio/` | 三个顶级入口 |
| `/radio/ham-radio-license/` | 美国执照总览 |
| `/radio/china-license/` | 中国执照总览 |
| `/radio/exam/` | A/B/C 学习工作区 |
| `/radio/tools/` | HAM 工具工作区 |
| `/radio/technician/`、`/radio/general/`、`/radio/extra/` | 美国等级页 |
| `/radio/license-a/`、`/radio/license-b/`、`/radio/license-c/` | 中国等级页 |

工作区细分状态通过查询参数保存：考试页为 `level=A|B|C` 与 `tab=knowledge|question_bank|simulator|wrong_book`；工具页为 `tool=map|dictionary|phonetic|bands|antenna`。内容页与工作区应保持视觉和任务隔离：工作区必须提供返回上级与 Radio Earth 首页入口；详情页应提供“返回执照中心”和首页入口。表内 11 个浅层页是唯一受支持的 Radio 网页路由；旧 `/redio/*` 与旧市场/语言深路径已移除，不能出现在新站内链接、sitemap 或 canonical 中。R2 的 `storage.dronerfdiy.com/redio/` PDF 对象路径与网页路由无关，继续用于题库校验。

## 5. 静态预渲染与部署产物

构建脚本顺序为：题库校验 → HAM 工具校验 → 答案键校验 → 根站 Vite 构建 → Radio Vite 构建 → Radio 预渲染 → Drone 路由复制 → Radio SEO 校验。

输出约定：

```text
dist/index.html                 -> /
dist/radio/index.html           -> /radio/
dist/drone/fpv/index.html       -> /drone/fpv/
```

Worker Static Assets 开启 `auto-trailing-slash`，因此页面链接应使用末尾斜杠。部署后应至少检查根站、Radio、Drone 与一个预渲染 Radio 页面；旧 Radio 地址不在支持范围内。

## 6. 数据与功能流

### 题库与考试

R2 PDF → `scripts/import-r2-banks.mjs` → `src/data/generated/` → React 学习界面。`verify-r2-banks.ts` 校验三套题库的页数、SHA-256、题数、题号、字段、选项和章节；`generate-answer-key.ts --check` 再验证答案键。原始题库浏览与模拟考试必须分别保证源数据准确和选项随机化需求；不要用 AI 生成题目、答案或解析替代权威源。

登录后，考试会话写入 `exam_session`，答案写入 `question_attempt`，掌握度写入 `question_mastery`。学习 API 还会保存收藏 (`user_favorite`)、观看/访问活动 (`resource_activity`) 与进度 (`learning_progress`)；本地历史数据可通过受保护的导入接口去重写入。

### 登录与账户

Better Auth 使用 D1 的 `user`、`session`、`account`、`verification` 等表。当前启用邮箱密码登录；邮箱验证是否强制由 `EMAIL_VERIFICATION_REQUIRED` 决定。初始超级管理员的授予条件和密钥优先级见 [配置说明](CONFIGURATION.zh-CN.md)。

### 支付、订阅与积分

商品由 `catalog_product` 保存，支付订单写入 `payment_order`，支付事件写入 `payment_webhook_event`，订阅写入 `billing_subscription`，积分由 `credit_wallet` 与不可重复操作的 `credit_ledger` 维护。支付默认关闭；只在服务商密钥、商品、Webhook 和 `payment_enabled=true` 全部确认后开放。代码支持 Stripe、Creem、PayPal 适配器与回调，但前端页面是否呈现某个管理功能要以实际界面验收为准。

### AI、邮件与后台

AI 只有在 `ai_enabled=true`，且管理员白名单中存在模型、相应 Secret 已配置、用户积分足够时才会调用提供商。聊天记录、任务、状态与失败退款记录在 `ai_chat`、`ai_message`、`ai_task`、积分账本中。媒体任务当前通过查询 API 轮询。

邮件通过 Resend 发送；每次投递状态写入 `email_delivery`。后台权限依赖 `role`、`permission`、`user_role`；后台可管理用户角色、商品、设置、服务商密钥状态、订单、订阅、AI 任务、邮件和审计记录。管理写操作有权限检查与审计日志。

## 7. 本地开发

```bash
bun install
cp .dev.vars.example .dev.vars
wrangler d1 migrations apply dronerfdiy --local
bun run dev
```

根站开发服务器默认为 3000；Radio 独立开发可使用：

```bash
bun run dev:radio
```

Worker API 的本地调试使用 `wrangler dev`。前端 Vite 与 Worker 是不同进程；涉及登录、D1 或支付回调时应在 Worker 入口验证，而不是只看 Vite 页面。

## 8. 数据库迁移、备份与回滚

1. 查看待执行迁移并先备份生产 D1。
2. 本地执行 `wrangler d1 migrations apply dronerfdiy --local`。
3. 在预发布验证后，执行 `wrangler d1 migrations apply dronerfdiy --remote`。
4. 迁移后检查账户、学习进度、订单和后台角色的关键查询。

SQL 文件是前向迁移，没有自动回滚。回滚发布版本可使用 Cloudflare 已部署 Worker 版本，但**不能逆转已执行数据库结构/数据迁移**；需要依靠变更前导出、专门的补偿迁移或受控恢复。因此上线前必须记录 Worker 版本、Git commit、D1 备份时间和迁移清单。

## 9. 构建、发布与验证

```bash
bun run verify:banks
bun run verify:ham-tools
bun run verify:answer-key
bun run lint
bun run build
bun run deploy
```

`bun run deploy` 会先执行完整构建，再调用 `wrangler deploy`。生产分支为 `main`；Git 自动构建配置应使用 `bun run build` 与 `npx wrangler deploy`。不要跳过 `verify:banks` 发布题库变更。

上线清单：

- [ ] 根站 `/`、`/radio/`、`/drone/` 及刷新可用。
- [ ] Radio 只有 11 个正式浅层页进入 sitemap，且它们有正确 canonical 与预渲染产物。
- [ ] 旧 `/redio/*` 和旧市场/语言深路径没有出现在站内链接、sitemap 或 canonical 中；R2 PDF 对象路径不作为网页地址检查。
- [ ] A/B/C 题库、随机模拟选项、答案显示控制和工具页回归通过。
- [ ] 受保护 API 未登录返回 401；登录后收藏、学习进度、考试结果能落入 D1。
- [ ] 若已开启邮件、支付或 AI，逐项完成测试账户/测试事件验证。
- [ ] 已记录 D1 备份、发布 commit、Worker 版本与配置变更。

## 10. 常见排错

| 现象 | 优先检查 |
| --- | --- |
| 构建因题库失败 | R2 PDF 是否变动；运行 `bun run verify:banks`，不要手工改 generated 数据绕过校验。 |
| 登录重定向或邮件链接错误 | `BETTER_AUTH_URL`、可信来源、Cookie 域名与 HTTPS。 |
| 已设置初始管理员但没有权限 | 是否在设置 `INITIAL_ADMIN_EMAIL` 后首次注册；检查 `user_role`。 |
| 后台已存密钥却仍报未配置 | 同名环境 Secret 优先且可能为空/错误；确认当前 source 状态并保持 `BETTER_AUTH_SECRET` 未变。 |
| 支付返回未到账 | `payment_enabled`、商品状态、服务商密钥、Webhook 地址/签名和 `payment_webhook_event`。 |
| AI 显示未启用或模型不可用 | `ai_enabled`、`ai_models_json` 白名单、对应 Secret 和用户积分。 |
| 静态页刷新 404 | 确认构建产物在 `dist/`，路径有尾部斜杠，Worker assets 目录未被错误替换。 |
