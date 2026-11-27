# 测试与验证

状态：F1.1–F1.3已覆盖工程/共享层、生成契约、任务轮询/取消与真实合成任务；CI已实测通过。实际结果见[进度](progress.md)。简历、岗位、分析、报告和认证覆盖随后续阶段增加。

首次在本机执行 `pnpm exec playwright install chromium` 下载浏览器；Linux CI使用 `pnpm exec playwright install --with-deps chromium`。浏览器保存在用户缓存中，不提交到仓库。`test:e2e`运行离线界面组，`test:smoke`运行真实后端组（后端不运行时失败）；两组均使用独立Vite端口4173，不复用不明来源服务器。失败保留trace与HTML报告，使用合成数据。

## 1. 命令

```powershell
pnpm run typecheck   # vue-tsc --noEmit
pnpm run lint        # eslint . --max-warnings=0，并检查 prettier 格式
pnpm test            # vitest run
pnpm run test:e2e    # playwright test
pnpm run test:smoke  # 连接真实后端
pnpm run test:contract # 契约专项
pnpm run test:smoke:tasks # 隔离合成任务真实HTTP与数据库
pnpm run test:smoke:resumes # PDF/DOCX与扫描/加密拒绝边界，串行4场景
pnpm run test:smoke:jobs # 真实JD/要求/发布/任务查询；单worker
pnpm run build       # 生产构建
```

`pnpm test` 不依赖后端或网络。`test:e2e` 分两组：使用MSW的界面流程测试，以及连接本地真实后端的冒烟测试；后端未启动时冒烟测试失败，不自动跳过。

## 2. 测试分层

岗位真实冒烟使用已编译后端的测试装配、真实服务/数据库和随机owner；只注入明确frontend-smoke-only的索引目标标识以创建PENDING任务，不连接模型/向量/消费者。清理前核验无执行attempt和未停止操作，不把任务创建描述为召回可用。缺模型为真实MODEL_UNAVAILABLE，手工要求来自实际JD。需3000端口空闲；结束精确清理本轮owner关联数据。

简历真实冒烟复用同级后端已有dist和真实解析器，不执行后端安装/构建/迁移。需已部署迁移、本项目PostgreSQL运行及3000端口空闲。专用文件位于前端忽略目录.smoke-runs，本轮随机owner；上传全部安全停止并关闭API后精确清理。失败停止未知时保留manifest，不删除既有数据或重置数据库。四种文件场景串行执行，每个沿用既定测试/断言/解析期限。

任务真实冒烟要求后端仓库与前端同级，已按后端部署文档生成dist并应用既有迁移，infra/.env存在且项目PostgreSQL运行；3000端口空闲。脚本不构建/写入后端，不修改配置或启动/停止Docker。复用后端测试装配与真实控制器/服务，IdentityPort绑定本轮随机owner（不接受HTTP身份输入），运行后核验归属并只清理本轮数据；取消请求最终由后端对账服务提交CANCELLED。该隔离测试身份仅用于本地冒烟，不代表生产认证。环境不满足时失败，不自动跳过。

E2E与生成/源码修改串行执行：Vite热更新会重载页面，影响停止轮询等断言。真实任务组通过test:smoke:tasks提供环境ID，直接运行全部real项目但不准备夹具会失败；test:smoke仅运行health。测试stdout中的合成网络/500/503信息为故障用例，不包含真实用户输入。

| 层次 | 工具 | 测什么 | 位置 |
|---|---|---|---|
| 单元 | Vitest | `shared/lib` 纯函数、`features/*/model` 映射、错误标准化、Query key | 与源码同目录 `*.test.ts` |
| 组件 | Vitest + Vue Test Utils + happy-dom | 展示组件的渲染与事件；容器组件配合MSW的加载、空、错误状态 | 与组件同目录 `*.test.ts` |
| 契约 | Vitest | MSW夹具通过生成的Zod Schema；客户端对未知字段宽容、对缺字段报 `contract` 错误 | `tests/contract/` |
| 端到端 | Playwright | 关键用户流程；真实后端冒烟 | `tests/e2e/` |

## 3. 必须覆盖的行为

每个功能任务的验收条件至少对应一个测试。下列行为无论在哪个任务中实现都必须有测试：

- 错误处理：后端错误体、网络失败、超时、响应不符合Schema四种情况分别得到正确的 `AppError.kind` 与界面提示，并显示requestId。
- 重试：只对 `retryable: true` 与网络错误重试；变更请求无Idempotency-Key时不重试。
- 幂等键：同一次提交的重试复用同一键；修改输入后换新键。
- 任务轮询：到达每种终态后停止；页面隐藏时暂停；`RETRY_WAIT` 显示下次重试时间。
- 报告展示：unknown与unmet文字和样式不同；unknown维度不画成0；PARTIAL横幅显示计数；推荐不足10条时显示原因；待核实岗位不进入推荐列表。
- 前端不计算分数：用夹具中刻意设置的后端分数断言页面原样显示，而不是按要求重新计算出的值。
- 安全：含 `<script>`、`<img onerror>` 的quote与JD文本按纯文本显示。
- 路由：非法路由参数显示404且不发请求；`redirect` 参数拒绝站外地址。

## 4. 覆盖率

初始门槛：`shared/` 与 `features/*/model/` 的行覆盖率不低于80%。这是起点数值，F3.2根据实际情况调整。覆盖率只是辅助指标，不能代替上面的行为测试，不为凑覆盖率写无断言测试。

## 5. 测试数据

- 只使用合成数据：虚构的姓名、公司和经历，不使用真实简历或联系方式。
- 夹具放在 `tests/mocks/fixtures/`，按接口组织，并通过契约测试保证与Schema一致。

## 6. 验证记录

实际运行的检查、环境和结果记录在[开发进度](progress.md)。未运行的检查如实写明，不记为通过。
