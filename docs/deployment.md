# 构建与部署

状态：F1.1已验证本地构建、同源代理与健康接口；生产配置和目标环境尚未验证。D10已确定单机Docker Compose，具体生产部署配置在F3.2完成。

## 1. 环境

- Node.js 24.22.3、pnpm 12.x，与后端一致；`.node-version` 与 `package.json` 的 `engines` 在F1.1写入。
- `.npmrc` 与后端相同：`engine-strict=true`、`strict-peer-dependencies=true`、`save-exact=true`、`registry=https://registry.npmjs.org/`。
- 安装一律使用 `pnpm install --frozen-lockfile`。

已验证pnpm 12.23.0。首次安装锁文件由F1.1建立；workspace仅批准vue-demi的版本切换脚本，保留供应链校验。浏览器安装命令见[测试](testing.md)。`pnpm run dev`用于本地代理联调，`pnpm run preview`只预览静态产物。运行E2E前关闭本项目手动启动的Vite实例，以免项目锁冲突。

## 2. 构建配置

- `pnpm run build` 输出静态文件到 `dist/`，入口 `index.html`，其余资源文件名带内容哈希。
- 接口基础路径固定为相对路径 `/api/v1`，同一份构建产物可部署到任意环境，不需要按环境重新构建。
- 允许的环境变量（均为非秘密，`VITE_` 前缀）：

| 变量 | 用途 | 默认 |
|---|---|---|
| `VITE_APP_TITLE` | 浏览器标题 | `Resume Studio` |
| `VITE_ENABLE_MOCKS` | 本地开发启用MSW | `false`；生产构建中为true时构建失败 |

新增变量必须登记在本表并在 `shared/config/` 中用Zod校验。

- 生产构建不生成可公开访问的sourcemap；如需排查，使用不随静态资源发布的独立sourcemap。

## 3. 安全响应头

由反向代理对 `index.html` 和静态资源设置。下列为F3.2的起点配置，必须用实际页面测试后再定稿：

| 响应头 | 值 |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | 启用TLS后设置，`max-age=31536000` |

`style-src 'unsafe-inline'` 是因为Element Plus与ECharts会写入内联样式；F3.2实测能否改用更窄的规则，结论写回本文。

## 4. 缓存与路由回退

- 带哈希的静态资源：`Cache-Control: public, max-age=31536000, immutable`。
- `index.html`：`Cache-Control: no-cache`，保证发布后立即生效。
- 单页应用回退：非 `/api/`、非 `/health`、非静态资源的路径返回 `index.html`。`/api/` 下的未知路径必须由后端返回404，不能回退到 `index.html`。

## 5. 反向代理示例

以下Nginx片段只表达路由规则，生产部署形态确定后（D10）再落地并测试：

```nginx
location /api/ { proxy_pass http://127.0.0.1:3000; }
location = /health { proxy_pass http://127.0.0.1:3000; }
location /assets/ { root /srv/resume-studio/dist; add_header Cache-Control "public, max-age=31536000, immutable"; }
location / { root /srv/resume-studio/dist; try_files $uri /index.html; add_header Cache-Control "no-cache"; }
```

## 6. 发布与回滚

- 每次发布保留上一版本的 `dist/`，回滚即切换到上一版本目录。
- 前端发布依赖的后端接口必须先上线；破坏性接口变更按后端[契约变更流程](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api-contract.md#11-契约变更流程)安排顺序。
