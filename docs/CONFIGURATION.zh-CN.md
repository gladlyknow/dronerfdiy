# DroneRF DIY 配置说明

本文只描述仓库当前实际读取的配置。示例均为占位符，不能把真实密钥、Webhook 签名或生产账户信息提交到 Git。

## 1. 配置来源与优先级

Worker 的公开变量定义在 `wrangler.jsonc`，本地开发变量放在不提交的 `.dev.vars`，生产敏感值应使用 Cloudflare Worker Secret。后台还可把部分服务商密钥加密保存到 D1 的 `app_secret` 表。

服务商密钥的读取顺序固定为：**Worker 环境变量/Secret → D1 加密密钥 → 未配置**。也就是说，一旦某个同名环境密钥存在，后台保存的值不会生效。后台配置项 (`app_config`) 没有环境变量覆盖层，始终以 D1 当前值为准；迁移写入的值只是初始默认值。

`BETTER_AUTH_SECRET` 既是 Better Auth 的签名密钥，也是后台 D1 加密密钥的派生材料。生产环境不可在服务已运行后随意更换；更换后，旧 `app_secret` 中的数据将无法解密，必须重新配置。

## 2. Cloudflare Worker 与 D1

| 项目 | 当前值/位置 | 是否必需 | 说明与验证 |
| --- | --- | --- | --- |
| Worker 名称 | `wrangler.jsonc` → `name: dronerfdiy` | 必需 | 发布目标。使用 `wrangler deployments list` 核对当前版本。 |
| 入口 | `src/worker.ts` | 必需 | 负责静态资源与 API 分流。Radio 只支持 README 所列的 11 个浅层网页路由；旧 `/redio/*` 和市场/语言深路径不再兼容。 |
| Static Assets | `assets.directory: ./dist` | 必需 | `bun run build` 后必须存在根首页、`radio/` 与 Drone 产物。 |
| `ASSETS` binding | Cloudflare assets binding | 必需 | Worker 非 `/api/` 请求交给该 binding。无需手工创建。 |
| `DB` binding | D1 `dronerfdiy`，ID `de174415-1d9e-4411-b9b1-66e2821bbc5a` | 必需（账户、学习、商业、AI） | 名称与 ID 已在 `wrangler.jsonc` 固定。以 `wrangler d1 info dronerfdiy` 核对。 |
| Node compatibility | `nodejs_compat` | 必需 | 当前 Worker 依赖此兼容标志。 |
| Observability | `enabled: true` | 建议 | 生产可观察性已开启；不包含业务密钥。 |

本地初始化（命令仅供执行，不会自动写生产库）：

```bash
cp .dev.vars.example .dev.vars
wrangler d1 migrations apply dronerfdiy --local
wrangler dev
```

生产迁移必须先备份并确认目标库：

```bash
wrangler d1 migrations apply dronerfdiy --remote
```

现有迁移为 `0001_auth_learning.sql`（账户、学习、考试）和 `0002_commerce_ai_admin.sql`（商品、订单、订阅、积分、AI、邮件、后台）。迁移没有自动回滚脚本；生产前应先导出 D1，并在预发布环境演练。

## 3. 普通环境变量

| 参数 | 必需性/启用条件 | 配置位置与本地示例 | 实际用途、验证与注意事项 |
| --- | --- | --- | --- |
| `BETTER_AUTH_URL` | 必需 | `wrangler.jsonc` 生产为 `https://dronerfdiy.com`；`.dev.vars`：`BETTER_AUTH_URL=http://localhost:8787` | Better Auth 基准 URL，同时用于支付回跳和账单门户返回地址。域名变更时必须同时更新，并保持 HTTPS 生产地址。注册、登录、邮件链接、支付回跳都依赖它。 |
| `EMAIL_VERIFICATION_REQUIRED` | 可选；仅 `true` 时强制验证 | `EMAIL_VERIFICATION_REQUIRED=false` | 字符串严格等于 `true` 才启用；启用后注册/登录会发送验证邮件，因此必须先配置 `RESEND_API_KEY` 与有效发件人。 |
| `INITIAL_ADMIN_EMAIL` | 可选；仅首位目标用户**首次创建**时有效 | `INITIAL_ADMIN_EMAIL=gladlyknow@gmail.com` | Better Auth 的用户创建钩子会按小写邮箱匹配，并追加 `super_admin`。该邮箱必须通过本站邮箱密码注册产生新用户；设置变量不会追溯提升已存在账户。部署后应用变量，再让该邮箱注册，最后在 D1/后台核对角色。 |
| `MAIL_FROM` | 可选 | `MAIL_FROM=DroneRF DIY <noreply@example.com>` | 优先于后台 `mail_from` 配置。必须是 Resend 已验证域名/发件人。若省略，代码尝试读后台值，最后回退到 `DroneRF DIY <noreply@dronerfdiy.com>`。 |

生产普通变量可放在 `wrangler.jsonc` 的 `vars`（仅适合非敏感值），或以部署平台提供的普通环境变量设置；不要把密码、API key、Webhook secret 放进 `vars`。

## 4. Better Auth 与初始超级管理员

### 必需密钥

```bash
# 本地 .dev.vars；生产请使用 wrangler secret put，不要写入 wrangler.jsonc
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
```

生产设置示例：

```bash
wrangler secret put BETTER_AUTH_SECRET
```

当前实现启用邮箱密码登录（密码长度 8–128），信任来源为：

- `https://dronerfdiy.com`
- `https://www.dronerfdiy.com`
- `http://localhost:3000`
- `http://localhost:8787`
- `http://127.0.0.1:8787`

部署到其他域名时，代码中尚未提供可配置的 trusted origins；必须先改代码并审查，不能只改环境变量。邮箱验证与重置令牌有效期均为 3600 秒。账户、会话、验证记录及角色数据都在 D1。

### `gladlyknow@gmail.com` 生效条件

用户已确认此地址为首位超级管理员。正确顺序是：1) 在生产环境设置 `INITIAL_ADMIN_EMAIL=gladlyknow@gmail.com`；2) 保持 `BETTER_AUTH_SECRET` 稳定；3) 让该邮箱**在设置后首次**注册；4) 核对 `user_role` 中同时有 `user` 与 `super_admin`。如果该用户已存在，当前代码不会自动补授予角色，需由现有超级管理员通过后台角色接口操作，或通过受控数据库维护流程补授予；不要删除唯一超级管理员。

## 5. 服务商密钥（Secret）

以下环境变量由 `src/server/secrets.ts` 支持。可通过 `wrangler secret put 名称` 设置，或由已登录的超级管理员在后台写入 D1 加密存储。环境 Secret 优先，后台只能显示“已配置”和来源，不能读回明文。

| 环境变量 | 后台密钥名 | 启用的能力 | 必需性/服务端验证 |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | `resend_api_key` | 邮箱验证、重置密码、系统邮件 | 仅邮件发送时必需；缺失会返回“Email service is not configured”。 |
| `STRIPE_SECRET_KEY` | `stripe_secret_key` | Stripe Checkout、订阅取消、账单门户、支付状态同步 | 选择 Stripe 且支付开启时必需。 |
| `STRIPE_WEBHOOK_SECRET` | `stripe_webhook_secret` | Stripe Webhook HMAC 验签 | Stripe Webhook 必需；代码检查签名与时间戳。 |
| `CREEM_API_KEY` | `creem_api_key` | Creem checkout、订阅与订单同步 | 选择 Creem 且支付开启时必需。 |
| `CREEM_WEBHOOK_SECRET` | `creem_webhook_secret` | Creem Webhook HMAC 验签 | Creem Webhook 必需。 |
| `PAYPAL_CLIENT_ID` | `paypal_client_id` | PayPal OAuth、订单/订阅 API | 选择 PayPal 且支付开启时必需。 |
| `PAYPAL_CLIENT_SECRET` | `paypal_client_secret` | PayPal OAuth | 同上；不可暴露给浏览器。 |
| `PAYPAL_WEBHOOK_ID` | `paypal_webhook_id` | PayPal 官方验签 API | PayPal Webhook 必需。 |
| `OPENROUTER_API_KEY` | `openrouter_api_key` | OpenRouter 文本聊天 | 仅启用 OpenRouter 模型时必需。 |
| `GEMINI_API_KEY` | `gemini_api_key` | Gemini 文本聊天 | 仅启用 Gemini 模型时必需。 |
| `REPLICATE_API_TOKEN` | `replicate_api_token` | Replicate 图像/视频媒体任务 | 仅启用 Replicate 媒体模型时必需。 |
| `REPLICATE_WEBHOOK_SECRET` | `replicate_webhook_secret` | 预留密钥名 | **当前代码未接收或验证 Replicate Webhook**；不要误认为已上线回调。 |
| `FAL_API_KEY` | `fal_api_key` | fal.ai 图像/视频媒体任务 | 仅启用 fal 模型时必需。 |
| `KIE_API_KEY` | `kie_api_key` | Kie 图像/视频/音乐媒体任务 | 仅启用 Kie 模型时必需。 |

例如：

```bash
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

每次新增/轮换 Secret 后，先在提供商测试环境创建一笔可追踪请求，再用后台密钥状态、订单/邮件/AI 记录和 Worker 日志确认；不要把 Secret 复制到浏览器、issue、截图或 CI 日志。

## 6. 后台数据库配置

迁移 `0002_commerce_ai_admin.sql` 会向 `app_config` 写入默认值。拥有 `admin.settings.write` 权限的后台账户可经 `/api/v1/admin/config` 读写下表白名单。默认值并不代表功能已启用。

| 配置键 | 默认值 | 含义与约束 |
| --- | --- | --- |
| `payment_enabled` | `false` | 必须为 `true` 才允许创建非免费商品 checkout。 |
| `default_payment_provider` | `stripe` | `stripe`、`creem` 或 `paypal`。请求可显式选择其中之一。 |
| `creem_environment` | `sandbox` | `sandbox` 或 `production`，决定 Creem API 地址。 |
| `paypal_environment` | `sandbox` | `sandbox` 或 `production`，决定 PayPal API 地址。 |
| `mail_from` | `DroneRF DIY <noreply@dronerfdiy.com>` | 仅当 `MAIL_FROM` 环境变量为空时采用。 |
| `initial_credits_enabled` | `false` | 新注册用户是否尝试发放欢迎积分。 |
| `initial_credits_amount` | `0` | 非负整数；仅在欢迎积分启用时有意义。 |
| `initial_credits_valid_days` | `0` | 非负整数；大于 0 时积分有到期日。 |
| `ai_enabled` | `false` | AI API 总开关；为 `false` 时所有 AI 请求拒绝。 |
| `ai_models_json` | `[]` | 允许模型白名单 JSON；单项含 `provider`、`model`、可选 `label`、`taskTypes`。仅支持 `openrouter`/`gemini` 文本聊天，`replicate`/`fal`/`kie` 图像、视频、音乐。 |
| `ai_chat_credits` | `1` | 单次文本聊天积分，非负整数。 |
| `ai_image_credits` | `2` | 单次图像任务积分，非负整数。 |
| `ai_video_credits` | `8` | 单次视频任务积分，非负整数。 |
| `ai_music_credits` | `10` | 单次音乐任务积分，非负整数。 |
| `openrouter_base_url` | `https://openrouter.ai/api/v1` | 必须为 HTTPS URL；仅 OpenRouter 使用。 |

商品在 `catalog_product` 中维护，状态必须为 `active` 才会从公开 `/api/v1/products` 返回；默认种子商品均为 `inactive`。支付完成后的订单、订阅、积分和 webhook 事件都会保存在 D1。当前代码支持结账、状态同步、Webhook、订阅取消与部分提供商账单门户；是否显示完整前台管理界面取决于前端，不能仅凭 API 存在就宣称所有后台界面都已完成。

## 7. 邮件、支付与 AI 回调地址

所有回调均以 `BETTER_AUTH_URL` 的 origin 为基础，生产应为 `https://dronerfdiy.com`：

| 服务 | 在服务商控制台配置的地址 | 验证方法 |
| --- | --- | --- |
| Stripe Webhook | `https://dronerfdiy.com/api/v1/webhooks/stripe` | 使用测试事件；确认 `payment_webhook_event.signature_valid=1` 且订单状态更新。 |
| Creem Webhook | `https://dronerfdiy.com/api/v1/webhooks/creem` | 发送签名测试事件，确认事件记录被处理。 |
| PayPal Webhook | `https://dronerfdiy.com/api/v1/webhooks/paypal` | PayPal 验签 API 通过且 D1 事件状态为 `processed`。 |
| Stripe 支付成功/取消返回 | 代码自动生成，不要手工替换 | `/api/v1/payments/callback/stripe?...` 同步后 303 到 `/account/`。 |
| Creem/PayPal 支付返回 | 代码自动生成，不要手工替换 | `/api/v1/payments/callback/creem?...` 或 `/paypal?...` 同步后返回账户页。 |
| Better Auth 验证/重置链接 | Better Auth 生成，邮件中发送 | 使用有效域名和 Resend 已验证发件人完成一次注册与重置。 |

AI 媒体任务当前采用轮询：`/api/v1/ai/tasks/:id` 会向提供商查询状态。除上表的支付 Webhook 外，代码没有 fal/Kie/Replicate 的入站完成回调路由。

## 8. 推荐上线顺序

1. `bun install` 后执行 `bun run lint` 和 `bun run build`。
2. 备份生产 D1，执行生产迁移。
3. 设置 `BETTER_AUTH_SECRET`、正确的 `BETTER_AUTH_URL` 和 `INITIAL_ADMIN_EMAIL=gladlyknow@gmail.com`。
4. 先注册首位超级管理员并核对角色；再通过后台配置其余服务。
5. 先以 Resend、Stripe/Creem/PayPal 的测试环境逐项验证；支付保持 `payment_enabled=false` 直到商品、回调和退款流程经过验收。
6. 配置 AI Secret、模型白名单与积分成本，最后把 `ai_enabled` 打开。
7. 发布后检查 `/`、`/radio/`、`/drone/`、登录、一个受保护 API 和静态 SEO 产物；确认旧 `/redio/*` 与市场/语言深路径没有出现在站内链接、sitemap 或 canonical 中。R2 PDF 的 `storage.dronerfdiy.com/redio/` 对象路径不属于此网页路由检查。
