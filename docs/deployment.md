# 构建与部署

状态：F3.2已验证本机nginx生产产物、严格CSP、缓存与路由回退；Compose覆盖模板已提供。D10单机Docker Compose与后端release叠加；目标服务器镜像/TLS/部署回滚待统一验收。

## 1. 环境

F3.1会话联调已在本机独立HTTPS测试入口验证。生产需真实受信TLS、同源反向代理及后端AUTH_ENABLED/AUTH_ORIGIN精确匹配；不能把auth-real的自签证书接受选项用于发布。前端构建不包含账号、CSRF或TLS文件。

- Node.js 24.22.3、pnpm 12.x，与后端一致；`.node-version` 与 `package.json` 的 `engines` 在F1.1写入。
- `.npmrc` 与后端相同：`engine-strict=true`、`strict-peer-dependencies=true`、`save-exact=true`、`registry=https://registry.npmjs.org/`。
- 安装一律使用 `pnpm install --frozen-lockfile`。

已验证pnpm 12.23.0。首次安装锁文件由F1.1建立；workspace仅批准vue-demi的版本切换脚本，保留供应链校验。浏览器安装命令见[测试](testing.md)。`pnpm run dev`用于本地代理联调，`pnpm run preview`只预览静态产物。运行E2E前关闭本项目手动启动的Vite实例，以免项目锁冲突。

## 2. 构建配置

FD2：首版不接入生产错误监控，不发送异常/简历/证据/凭证到第三方。开发控制台仅kind/requestId，生产构建删除该分支；`pnpm run audit:production`检查产物无公开sourcemap、MSW、测试凭证或已知第三方上报地址，CI执行。此检查是白盒核对补充，不是秘密扫描或生产安全认证。

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
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self'; style-src-elem 'self'; style-src-attr 'none'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | 启用TLS后设置，`max-age=31536000` |

F3.2本机实际nginx+生产构建页面实测已移除unsafe-inline，style属性none下登录/简历/岗位/分析/报告及SVG图表无CSP违规。Zod默认动态函数探测触发eval违规，采用官方jitless并先配置再动态装配应用解决；未放宽script-src。当前按需使用的UI组件范围验证通过，未来新增组件必须继续跑CSP专项。配置在[安全头](../deploy/security-headers.conf)及[代理路由](../deploy/locations.conf)。HSTS仅TLS生产模板启用，本机HTTP专项不声称验证了HSTS。

## 4. 缓存与路由回退

- 带哈希的静态资源：`Cache-Control: public, max-age=31536000, immutable`。
- `index.html`：`Cache-Control: no-cache`，保证发布后立即生效。
- 单页应用回退：非 `/api/`、非 `/health`、非静态资源的路径返回 `index.html`。`/api/` 下的未知路径必须由后端返回404，不能回退到 `index.html`。

## 5. 反向代理示例

正式模板为[default.conf.template](../deploy/default.conf.template)，通过[Compose覆盖文件](../deploy/compose.frontend.yaml)替换后端已有proxy的前端配置挂载，不另起同端口代理。下面简化片段仅解释路由，部署必须使用完整模板与headers include：

```nginx
location /api/ { proxy_pass http://127.0.0.1:3000; }
location = /health { proxy_pass http://127.0.0.1:3000; }
location /assets/ { root /srv/resume-studio/dist; add_header Cache-Control "public, max-age=31536000, immutable"; }
location / { root /srv/resume-studio/dist; try_files $uri /index.html; add_header Cache-Control "no-cache"; }
```

## 6. 发布与回滚

1. 在前端串行运行冻结安装、typecheck/lint/test、build:analyze与E2E，保存Git SHA、锁文件hash、dist文件hash和当前后端SHA。dist不带.env、测试文件或公开sourcemap。
2. 每个版本复制到服务器独立不可变目录，如`/srv/resume-studio/releases/<sha>/dist`；保留上一版本和被长会话引用的旧assets，不能覆盖唯一备份。后端接口先部署，确认会话/CSRF与迁移兼容。
3. 私有release.env沿用后端变量并增加`FRONTEND_CONFIG_DIR=<本仓库deploy绝对路径>`、`FRONTEND_DIST=<本次dist绝对路径>`；NGINX_IMAGE/APP_IMAGE必须是已核验digest，TLS和AUTH_ORIGIN必须与PUBLIC_HOST一致，不能将示例占位或测试证书用于发布。
4. 用`docker compose --env-file <私有release.env> -f <后端>/infra/release/compose.yaml -f <前端>/deploy/compose.frontend.yaml config --quiet`验证。再只重建本项目proxy服务，禁止down/remove-orphans或停止基础设施。模板envsubst仅替换PUBLIC_HOST，不替换nginx变量。
5. 检查HTTPS登录/CSRF、/health、静态缓存、深链、/api未知404、SSE与当前版本资源；失败时把FRONTEND_DIST切回已验证上一目录并只重建proxy，保留后端数据/迁移/凭证。不要通过清空浏览器业务数据、重置数据库或删除卷回滚。

本机`pnpm run test:deployment`用官方nginx1.30.8便携版本与当前dist，NGINX_EXE可显式指向本机已核验二进制，默认本次忽略目录路径；启动本轮API3000和nginx8088/8089，执行后关闭。`pnpm run test:rollback`只在.smoke-runs复制两份生产产物并用独立8090验证A→B→A，不改dist或原服务。Windows本机演练不替代Linux/Compose目标环境验证；目标TLS/HSTS/镜像digest/发布回滚延后。

- 每次发布保留上一版本的 `dist/`，回滚即切换到上一版本目录。
- 前端发布依赖的后端接口必须先上线；破坏性接口变更按后端[契约变更流程](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api-contract.md#11-契约变更流程)安排顺序。
