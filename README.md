# Resume Studio Frontend

Resume Studio 的 Web 前端。求职者在这里上传简历、管理岗位、发起分析、查看任务进度，并阅读带证据的六维画像与岗位推荐报告。

后端位于独立仓库 Resume-Studio-Backend（远程 [Mingan-X/Resume-Studio](https://github.com/Mingan-X/Resume-Studio)），负责全部业务计算，并且是接口契约的唯一来源。本地建议把两个仓库放在同一父目录下：

```text
Resume-Studio/
  Resume-Studio-Backend/
  Resume-Studio-Frontend/   # 本仓库
```

## 当前状态

**仓库只有文档，尚无代码、依赖或构建配置。** 第一个开发阶段是F1.1工程基线，见[开发计划](docs/development-roadmap.md)；完成情况见[开发进度](docs/progress.md)。

后端目前只实现了健康检查接口，业务页面需要等后端对应阶段交付后才能联调。

## 技术栈（已确定，尚未安装）

Vue 3 + TypeScript + Vite、Vue Router、TanStack Vue Query、Pinia、Element Plus、ECharts、Zod；测试使用 Vitest、Vue Test Utils、MSW、Playwright。选型理由与候选版本见[ADR-0001](docs/decisions/0001-frontend-stack.md)。

运行环境与后端一致：Node.js 24.22.3、pnpm 12.x。

## 本地运行（F1.1完成后可用）

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

开发服务器把 `/api` 与 `/health` 代理到 `http://127.0.0.1:3000`，需要先按后端README启动API。

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

后端相关文档：[接口契约规范](https://github.com/Mingan-X/Resume-Studio/blob/master/docs/api-contract.md)、[业务需求](https://github.com/Mingan-X/Resume-Studio/blob/master/docs/requirements.md)、[后端开发计划](https://github.com/Mingan-X/Resume-Studio/blob/master/docs/development-roadmap.md)。

## 许可

尚未选定项目许可证，公开可见不代表授予额外使用许可。
