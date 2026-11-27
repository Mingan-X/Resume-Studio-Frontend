# API对接

接口约定的唯一来源是后端的[接口契约规范](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api-contract.md)，已实现接口见后端[HTTP API](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api.md)。本文说明前端如何落实这些约定；两者冲突时以后端文档为准，并在前端提交问题记录。

## 1. 当前可对接的接口

当前已对接health、任务查询/取消、简历上传/游标列表/双ID版本详情，全部消费生成契约；契约快照已同步后端S3.3，但只有已实现页面使用对应接口。真实冒烟在本地开发身份完成，不代表生产认证或真实模型分析完成。来源SHA见[SOURCE](../contracts/SOURCE.md)。

## 2. 契约同步

后端S1.4-T9交付OpenAPI产物后执行以下流程：

1. 把后端产物复制到 `contracts/openapi.json`，在 `contracts/SOURCE.md` 记录后端提交SHA、产物路径和复制日期。
2. 运行 `pnpm run api:generate`，用 @hey-api/openapi-ts 的typescript/zod插件生成到 `src/generated/`。目录不提交，`dev`、`build`、`typecheck` 和 `test` 前自动生成。F1.3实测生成Zod4 Schema满足当前契约，使用默认z.object忽略未知字段；类型等价与坏夹具拒绝由契约测试保证。
3. 运行类型检查。字段变化导致的编译错误逐一修复，不用类型断言绕过。
4. 快照更新单独提交，提交说明写明后端SHA。

F1.3已删除health临时手写定义。不得为尚未在后端合并的接口手写类型或字段。错误code字段对未知字符串保持兼容，其余结构来源于生成Schema。

## 3. HTTP客户端

F1.2已实现本节客户端核心、XHR上传与EventSource基础封装。health已使用共享客户端；业务上传和SSE尚未接入。`tests/mocks/transportPlugin.ts`只在Vite的e2e模式提供本地传输测试，不属于后端契约；不会进入生产构建。

`shared/api/client.ts` 是唯一调用 `fetch` 的位置，负责：

- 基础路径 `/api/v1`，`credentials: 'same-origin'`。
- 请求超时：默认15秒，使用 `AbortSignal.timeout`；组件卸载或查询取消时中止请求。
- 用生成的Zod Schema解析响应体。解析使用非严格模式，忽略未知字段，使后端新增字段不破坏旧前端；缺字段或类型不符时抛出 `kind: 'contract'` 的 `AppError`。
- 把非2xx响应解析为后端错误体并转换为 `AppError`；错误体本身无法解析时使用 `INTERNAL_ERROR` 文案并保留HTTP状态。
- 从响应头读取 `x-request-id` 并附在 `AppError` 上。
- S3.2之后为非GET请求附加CSRF头（具体名称以后端实现为准）。

feature中的调用方式（示意，实际实现另处理响应头与可见性）：

```ts
// features/tasks/api/useTask.ts
export function useTask(taskId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => taskKeys.detail(toValue(taskId))),
    queryFn: ({ signal }) => apiRequest(`/tasks/${encodeURIComponent(toValue(taskId))}`, taskSchema, { signal }),
    refetchInterval: (query) => (isTerminal(query.state.data?.status) ? false : 2000),
    refetchIntervalInBackground: false,
  });
}
```

## 4. 错误码处理

| code | 前端行为 |
|---|---|
| VALIDATION_ERROR | 表单页：根据 `details.fields` 标注对应字段（后端提供后）；否则显示后端message |
| BAD_REQUEST、HTTP_ERROR | 显示后端message与requestId |
| NOT_FOUND | 详情页显示“不存在或无权访问”，不区分两种情况 |
| IDEMPOTENCY_CONFLICT | 提示请求内容已变化，生成新的Idempotency-Key后由用户重新提交 |
| INVALID_STATE | 刷新当前资源并提示状态已变化 |
| PAYLOAD_TOO_LARGE、UNSUPPORTED_FILE | 上传区域内显示原因，不进入全局错误 |
| UNAUTHENTICATED | S3.2后跳转登录页 |
| FORBIDDEN | 显示无权限页面 |
| RATE_LIMITED、INTERNAL_ERROR | 显示后端message；`retryable` 为true时提供“重试”按钮 |
| 未知code | 按通用错误显示message与requestId，并在开发控制台记录 |

规划中的错误码名称以后端实现时的 `src/contracts/` 为准，前端在对接时同步更新本表。

## 5. 幂等键

任务取消是后端已实现的可重复操作，不要求Idempotency-Key；前端不自动重试取消，用户可再次确认。202不表示已取消，最终状态由GET确定。

- 创建任务类请求（发起分析、调权重算、触发索引等）必须带 `Idempotency-Key`。
- 用户点击提交时用 `crypto.randomUUID()` 生成，保存在该表单的组件状态中；网络失败或超时后的重试复用同一键；用户修改输入后生成新键。
- 提交中禁用提交按钮，防止重复点击产生多个键。

## 6. 文件上传

F2.1已实现：文件字段file，10MiB上限仅在uploadRules定义；POST成功201表示同步解析产物已保存。失败手动重试保留同一Idempotency-Key，选新文件换键；取消不自动重试。reason直接来自生成契约，扫描/加密明确提示不支持。GET列表缺少文件名/解析状态，当前说明缺口并显示编号/时间/版本，不从其他字段推算。详情GET使用`/resumes/:resumeId/versions/:versionId`，保留后端文本块与位置，不展示语义结构化信息。

- `fetch` 无法报告上传进度，上传使用 `shared/api/upload.ts` 中基于 `XMLHttpRequest` 的实现，同样产出 `AppError`。
- 提交前检查扩展名（`.pdf`、`.docx`）与大小上限，提示文案说明后端仍会校验内容。上限数值从后端接口或文档获取，不在多处硬编码。
- 上传时可取消；取消后不自动重试。

## 7. Mock与夹具

- 使用MSW。handlers放在 `tests/mocks/`，只用于测试和本地开发的显式开关（`VITE_ENABLE_MOCKS=true`，生产构建中禁止开启）。
- 只能mock已经合并进后端契约（即出现在 `contracts/openapi.json` 中）的接口；夹具数据必须通过生成的Zod Schema校验，有测试保证夹具不漂移。
- 基于mock完成的页面在路线图中状态为“待联调”，与真实后端联调通过后才能标为“已完成”。
- 夹具只使用合成数据，不放入真实简历、姓名或联系方式。

## 8. 本地联调

1. 按后端README启动API（默认 `127.0.0.1:3000`）。
2. 前端运行 `pnpm run dev`，Vite把 `/api` 与 `/health` 代理到后端（F1.1配置，示意如下）：

```ts
// vite.config.ts（片段）
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
    '/health': { target: 'http://127.0.0.1:3000', changeOrigin: false },
  },
},
```

后端不开启CORS；联调失败时先检查代理目标和后端进程，而不是要求后端放开跨域。
