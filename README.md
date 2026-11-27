# Resume Studio Frontend

Resume Studio 的 Web 前端。求职者在这里上传简历、管理岗位、发起分析、查看任务进度，并阅读带证据的六维画像与岗位推荐报告。

后端位于独立仓库 Resume-Studio-Backend（远程 [Mingan-X/Resume-Studio](https://github.com/Mingan-X/Resume-Studio-Backend)），负责全部业务计算，并且是接口契约的唯一来源。本地建议把两个仓库放在同一父目录下：

```text
Resume-Studio/
  Resume-Studio-Backend/
  Resume-Studio-Frontend/   # 本仓库
```

## 当前状态

**F1.1–F2.2已实现，阶段待验收；提前CI已通过远端验证。** 简历上传/证据详情、岗位JD/要求确认/发布和任务查询已通过本地真实后端联调。分析与报告页面仍在开发中；真实模型抽取未验收。简历列表缺字段见[进度与缺口](docs/progress.md)及[开发计划](docs/development-roadmap.md)。

前端消费health及任务查询/取消；契约来源见[快照记录](contracts/SOURCE.md)。其他接口在对应后端阶段合并后接入。

## 技术栈

Vue 3 + TypeScript + Vite、Vue Router、TanStack Vue Query、Pinia、Element Plus、ECharts、Zod；测试使用 Vitest、Vue Test Utils、MSW、Playwright。选型理由与候选版本见[ADR-0001](docs/decisions/0001-frontend-stack.md)。

运行环境与后端一致：Node.js 24.22.3、pnpm 12.x。

## 本地运行

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

开发服务器把 `/api` 与 `/health` 代理到 `http://127.0.0.1:3000`，需要先按后端README启动API。

```powershell
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm exec playwright install chromium
pnpm run test:e2e    # MSW流程，无需后端
pnpm run test:smoke  # 真实后端，未启动时失败
pnpm run test:contract
pnpm run test:smoke:tasks # 使用后端已有编译产物和本项目数据库，见测试文档
pnpm run test:smoke:resumes # 真实合成PDF/DOCX上传；需空闲3000端口
pnpm run test:smoke:jobs # 真实岗位手工确认和发布；不消费索引任务
```

`pnpm run preview`预览dist，不提供后端代理；真实联调用dev。E2E启动独立Vite实例，运行前关闭本项目手动启动的dev，避免Vite项目锁冲突。开发时可设置`VITE_ENABLE_MOCKS=true`启用MSW，生产构建禁止该值；mock不代表真实后端可用。

`dev`、`typecheck`、`test`、`build`先运行`api:generate`，无需手工创建src/generated。生成会写本地派生文件；运行E2E期间不要并行生成或编辑源码，以免开发服务器热更新影响断言。

## 文档

| 文档 | 内容 |
|---|---|
| [AGENTS.md](AGENTS.md) | 工程约定，AI 与人工开发都必须遵守 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 分支、提交与审查流程 |
| [开发计划](docs/development-roadmap.md) | 阶段、任务拆分、验收标准、待决策事项 |
| [开发进度](docs/progress.md) | 已完成工作与验证记录 |
| [架构](docs/architecture.md) | 职责边界、目录结构、依赖方向、状态、路由、错误、安全 |
| [编码规范](docs/coding-standards.md) | TypeScript、Vue组件、composable、命名与导入规则 |
| [API对接](docs/api-integration.md) | 契约同步、HTTP客户端、错误码处理、幂等、上传、Mock |
| [产品与界面规范](docs/ui-guidelines.md) | 页面内容、必须遵守的展示规则、视觉与可访问性 |
| [测试](docs/testing.md) | 测试分层、必须覆盖的行为、覆盖率 |
| [构建与部署](docs/deployment.md) | 环境变量、安全响应头、缓存、反向代理 |
| [ADR-0001](docs/decisions/0001-frontend-stack.md) | 技术栈决策 |

后端相关文档：[接口契约规范](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api-contract.md)、[业务需求](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/requirements.md)、[后端开发计划](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/development-roadmap.md)。

## 许可

尚未选定项目许可证，公开可见不代表授予额外使用许可。
