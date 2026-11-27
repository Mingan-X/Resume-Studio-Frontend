# 开发进度

按时间倒序记录每个阶段或任务的完成情况与验证证据。阶段定义见[开发计划](development-roadmap.md)。

记录规则：

- 每条记录写明日期、阶段/任务编号、分支或提交、完成内容、执行的检查及结果、未执行项及原因。
- 只记录实际运行过的检查；基于MSW完成的功能写明“待联调”。
- 已有记录不改写；发现错误时追加更正记录。

## 2026-11-28 F2.1-T3 简历列表（feature/f2.1-resumes）

- /resumes接入上传与游标分页；按后端顺序显示编号、上传时间、版本、详情入口。缺文件名/解析状态按T1缺口说明，不编造；上传成功后精确刷新列表。首次骨架、空状态指向上传，后续加载保留原内容，错误可复制requestId。
- typecheck、Lint、77项单元/组件/契约、build、11项E2E全部通过；组件实测游标特殊字符编码、两页无遗漏/重复及末页停止。真实文件流程留T5，未描述为真实上传联调完成。

## 2026-11-28 F2.1-T2 上传组件（feature/f2.1-resumes）

- 选择/拖拽单文件、PDF/DOCX扩展名与10MiB单处上限、非空预检、浏览器字节进度、取消、aria-live状态和解析成功入口。413/422保留后端原因与requestId；SCANNED_PDF/ENCRYPTED_FILE按reason明确提示不支持，不解析message。请求中禁重复提交，取消不自动重试。
- typecheck、Lint、73项测试、build通过；组件覆盖格式/空/超限、三类文件错误和取消不重试，既有真实XHR传输测试保留。重试入口额外遵守当前文件校验，类型/Lint复查通过；页面流程E2E与真实文件联调在T5统一运行。尚未把组件作为完整简历功能交付。

## 2026-11-28 F2.1-T1 简历契约与接口（feature/f2.1-resumes，进行中）

- fetch后端确认S2.1–S3.3均已合并，origin/develop为b2104ea374ba6bc9f1da799033c7f37d5ab80153；已读handoff-frontend-s33及相关契约。普通任务串行推进，不使用goal或子代理。
- 快照按该SHA的docs/openapi.json复制，SOURCE同步，独立提交aa69756；新增简历游标列表、双ID版本详情、XHR上传mutation与Query key/精确失效、生成Schema夹具。失败重试复用键，重新选文件换键；重复提交和成功后重复操作被阻止。错误对象保留生成契约reason/details。
- 基础检查全部通过：typecheck、Lint、67项单元/组件/契约、build；独立契约5项通过。首次Lint碰到新增测试文件未格式化，格式化后通过。未改页面，E2E及真实上传在T2–T5执行。无新依赖。
- 契约缺口：简历列表仅id/latestVersionId/version/createdAt，无文件显示名和解析状态；按§6记录并跳过缺字段展示，不补造类型。详情API需要resumeId/versionId，既有/resumes/:resumeId页面以经Zod校验的versionId查询参数承载版本，保持刷新可复现。上传成功才写入解析产物；原文件名仅能在本次选择区域显示。

## 2026-11-27 F1.3-T5 阶段交付与F2.1门禁（feature/f1.3-contract-tasks，待验收）

- README、架构、API对接和测试文档同步生成契约、轮询/取消、真实冒烟前置及测试隔离边界；路线图F1.3待验收。复核界面规范时修正重试时间为本地时区YYYY-MM-DD HH:mm，避免locale改变分隔符，格式断言通过。
- 最终typecheck、Lint、单元/组件/契约65项、build、MSW E2E11项通过；独立契约4项通过；真实HTTP冒烟3项及隔离清理在T4通过，最终仅时间展示/文档变化，不重复数据库冒烟。文档本地目标45处全部存在，git diff --check通过。
- 下一阶段F2.1开始前fetch后端：两次TLS握手失败后fetch成功。origin/develop仍为01d9a36c882d5e7c0e0945b4bc7a2ed6ee11cc66，S2.1仍进行中，OpenAPI无简历路径，未合并满足F2.1的实现。按维护者停止条件，本轮交付F1.3后停止，等待后端S2.1合并；不轮询、不创建F2.1实现分支，不用mock绕过门禁。
- F2.1至F3.2其余任务未执行（依赖门禁）；真实模型冒烟F2.3-T4/F2.4-T7/F2.5-T4/F3.2-T2及目标部署F3.2-T6仍按统一验收延后规则保留，不标完成。F3.2仅提前T1完成，阶段保持进行中。
- F1.1、F1.2、F1.3阶段状态为待验收，main未操作；后端文件未改动，真实测试只使用已编译模块及本轮隔离数据。

## 2026-11-27 F1.3-T4 取消任务（feature/f1.3-contract-tasks）

- 取消前二次确认安全停止后果；请求使用生成的空对象契约，202仅提示“取消请求已提交”，最终状态继续查询。提交中/已请求取消禁用按钮；INVALID_STATE精确刷新当前任务并提示，其他失败展示安全message/requestId。
- 最终串行typecheck、Lint、单元/组件/契约65项、build、MSW E2E11项、真实HTTP冒烟3项全部通过。真实取消验证202后仍QUEUED且cancelRequested=true，随后后端实际对账服务提交CANCELLED并查询核对；本轮隔离数据清理成功。
- 失败记录：一次E2E终态轮询断言出现额外请求，trace显示我并行运行生成导致Vite页面重载/重连，改为完整串行后通过（未改断言）；新增组件测试首次因happy-dom无原生confirm而spy失败，显式stub原生对话框后通过。重复提交禁用及500失败保留状态/requestId有组件测试。
- 未运行真实模型、报告及生产部署，均非本任务范围。

## 2026-11-27 F1.3-T3 任务进度页（feature/f1.3-contract-tasks）

- `/tasks/:taskId`消费生成契约，显示状态、真实阶段/计数、尝试次数、重试时间及失败安全信息；requestId来自经UUID校验的响应头，reportId为空不显示报告入口。不估算百分比。
- 2秒轮询，SUCCEEDED/PARTIAL/FAILED/CANCELLED全部停止；页面隐藏取消当前查询并暂停，可见后恢复；错误由共享客户端有限重试，失败后停止定时轮询。非法参数在入口拒绝。
- typecheck、Lint、单元/组件/契约64项、build、MSW E2E9项通过；各终态与隐藏暂停实测检查请求次数，刷新恢复重试状态。新增冒烟脚本Node全局Lint声明后检查通过，未禁用规则。
- `pnpm run test:smoke:tasks`真实HTTP组2项通过（health与合成任务终态/1:1计数/刷新）。脚本使用后端已有dist、真实数据库/控制器/服务，测试IdentityPort只绑定本轮随机owner；先核验项目容器/端口/卷，最后仅清理本轮owner及关联记录并核对0残留。未修改后端文件、迁移、配置或Docker，也未运行模型。通用`test:smoke`保留仅health，任务冒烟使用独立命令。

## 2026-11-27 F1.3-T2 契约夹具检查（feature/f1.3-contract-tasks）

- health、任务排队/重试/四终态、取消响应夹具按生成类型声明并逐一经生成Zod校验；编译期类型等价断言保证Schema输出与生成类型一致。新增test:contract命令。
- typecheck、Lint、单元/组件/契约49项、build通过，独立契约组4项通过。负向夹具验证缺字段/错误类型/JOB_INDEX非法PARTIAL/取消false均拒绝；客户端忽略顶层和嵌套新字段，坏数据抛contract。
- 首次Lint检测到新契约测试格式差异，重新格式化后通过。未改用户流程，本任务未重复E2E和真实冒烟（T1已跑E2E，T3/T4跑真实任务）。

## 2026-11-27 F1.3-T1 契约快照与生成（feature/f1.3-contract-tasks，进行中）

- F1.2已合并并推送develop（9f96603）与阶段分支，develop远端CI45876655026 success；连续TLS握手失败后分支/develop分开推送成功，保留证书校验。
- 后端fetch确认S1.4-T8/T9已合并origin/develop，提交01d9a36c882d5e7c0e0945b4bc7a2ed6ee11cc66。快照来自该提交docs/openapi.json（非后端工作区），SOURCE记录SHA/日期，单独提交b8a076c。仅包含health与任务查询/取消3条路径。
- @hey-api/openapi-ts生成类型与Zod4 Schema，health删除手写定义，错误结构消费生成Schema（兼容新增错误code）。dev/typecheck/test/build先生成，不提交src/generated。直接运行生成Schema确认忽略health扩展字段和任务双分支联合。
- 冻结安装、typecheck、Lint、单元/组件45项、build、E2E7项通过。首轮typecheck发现0.99不接受旧版version插件选项，删除后通过；测试一轮101.76秒主要在模块/环境加载，未放宽超时或覆盖门槛。
- 任务页真实联调尚未执行，安排T3/T4；无后端文件修改。

## 2026-11-27 F1.2-T6 文档与阶段回归（feature/f1.2-app-shell，待验收）

- README、架构和API/测试文档更新至实际边界，路线图F1.2待验收；T1–T6分别提交。共享层已可复用，所有业务页仍为占位，未描述为完成。
- 基础检查45项单元/组件及7项E2E通过（T5最终代码）；本任务真实后端健康冒烟1项通过，44处本地文档链接及git diff --check通过。内置浏览器检查顶栏/侧栏/内容布局，点击岗位导航后状态正确且截图无重叠。
- Git fetch多次出现OpenSSL握手失败，单次命令指定Windows schannel后成功，未改Git全局配置或关闭证书校验。远端develop无新提交。CI待推送后查实际结果。
- 真实上传业务与SSE接口未接入，后续F2.1/F2.5验证；生产部署未执行。只关闭本次启动的API和dev进程，未改后端文件/数据库或Docker服务。

## 2026-11-27 F1.2-T5 上传与SSE基础（feature/f1.2-app-shell）

- XHR multipart上传支持真实字节进度、幂等键、取消、超时、错误标准化与Schema校验；不设置multipart边界，不在取消后重试。SSE保留原生EventSource重连，连续失败/重连期限/不可用时关闭并回退；校验消息，停止后不再交付。
- typecheck、Lint、单元/组件45项、build、E2E7项通过；浏览器真实XHR向仅e2e模式启用的本地传输服务器发送2MiB合成文件，验证进度、取消及413转换。该服务器不是后端业务接口，未伪造未合并的业务契约。
- SSE假EventSource测试覆盖断线重连、达到上限、期限耗尽、主动停止、非法JSON/Schema、不支持的环境。shared/api行覆盖率96.99%，SSE100%、上传95.12%。真实业务SSE尚无接口，未执行，留待F2.5；真实文件上传业务留待F2.1。

## 2026-11-27 F1.2-T4 全局错误与通用状态（feature/f1.2-app-shell）

- 新增加载/空/错误/正常内容组件、错误requestId展示与复制、复制失败提示和重试事件；健康页采用共享错误提示。全局Vue异常/未处理Promise只记录kind/requestId到开发控制台，未知异常转固定文案，不输出用户内容或堆栈；卸载移除监听。
- typecheck、Lint、单元/组件32项、build、MSW E2E5项通过；共享UI行覆盖率100%。组件覆盖四种状态、复制成功/失败、404统一文案；全局异常测试确认不输出合成私密字符串。
- 首次两次typecheck失败于Vue的unknown默认值限制，改为保留缺省undefined语义后通过；未修改严格选项。真实后端冒烟留待阶段回归。

## 2026-11-27 F1.2-T3 HTTP客户端（feature/f1.2-app-shell）

- shared/api统一fetch、同源地址、15秒超时、取消、Zod响应校验、AppError与requestId；健康查询迁移至共享层。HTTP错误只展示契约安全message，非法JSON/HTML不透出。
- 最多2次指数退避；仅retryable错误重试，变更必须带Idempotency-Key，重试保留键/正文，取消及契约错误不重试；Vue Query该查询关闭额外重试以免叠加。
- typecheck、Lint、单元/组件28项、build、MSW E2E5项通过。测试覆盖后端错误、网络、超时、Schema不符、用户取消/退避取消、未知字段及无幂等键变更；shared/api行覆盖率96.22%。真实冒烟本项未重复执行，阶段回归再验证。

## 2026-11-27 F1.2-T2 路由与输入守卫（feature/f1.2-app-shell）

- 路由级懒加载、404、UUID参数Zod校验与开发期放行守卫；非法ID在加载feature前进入404。redirect只允许站内绝对路径，拒绝外站、协议相对地址、反斜杠、控制字符与嵌套编码。
- typecheck、Lint、单元/组件19项、build、MSW E2E 5项通过；E2E覆盖所有资源非法ID无请求、未知路由和redirect清理。shared路由工具行覆盖率84.61%，门槛通过。
- 首次Lint拒绝控制字符正则，改用字符码校验后通过，未禁用规则。真实冒烟未运行（本任务仅路由输入）；认证尚未实现，登录页仍占位。

## 2026-11-27 F1.2-T1 应用布局（feature/f1.2-app-shell，进行中）

- F3.2-T1已合并并推送develop（1f68152），develop远端运行45873601513亦success；推送一次TLS失败后有限重试成功。
- 装配Vue Query/Pinia/Element Plus与Router，顶栏、主导航、内容区、跳到内容链接；业务页面明确显示功能开发中且不请求业务接口。健康检查点击后才展开。主题变量集中管理，Element Plus显式按需导入。
- registry/官方包README与peer核对、冻结安装、typecheck、Lint、单元/组件8项、build、MSW E2E 3项通过（含键盘导航与无业务请求）。最初全量UI注册首屏gzip 364.16 kB，改为按需注册后83.50 kB，无大chunk警告。
- 真实后端冒烟本任务未重复运行（接口未变化，T5已有记录）；生产部署未执行。

## 2026-11-27 F3.2-T1 远端验证通过（feature/f3.2-ci，T1待验收）

- 提交f2d274a的[GitHub Actions运行45873425074](https://github.com/Mingan-X/Resume-Studio-Frontend/actions/runs/45873425074)实际success：冻结安装、typecheck、Lint、单元/组件、build、Chromium安装、MSW E2E全部通过。此任务完成实现和验证，按no-ff合并develop并推送。
- 本次仅交付提前CI；F3.2阶段保持进行中，T2–T8尚未执行，不能把整个阶段标待验收。下一阶段F1.2从develop创建分支。

## 2026-11-27 F3.2-T1 CI配置（feature/f3.2-ci，进行中）

- F1.1已通过no-ff合并develop（9a214b8）并推送develop及阶段分支（798bc6a），本地已合并分支按约定清理。
- CI仅提前执行T1，F3.2其余任务尚未开始，阶段状态进行中。后端fetch已成功（origin/develop 01d9a36）；本任务按路线图仅依赖F1.1，不要求S3.3。
- GitHub Actions使用Node 24.22.3、pnpm 12.23.0、冻结安装、typecheck、Lint、test、build及MSW组E2E；最小contents:read权限，不部署。Actions固定提交：checkout v7.0.1（GitHub API核对）、setup-node v7.1.0（git ls-remote核对）、pnpm/action-setup v6.1.1（API解析annotated tag核对）。
- GitHub CLI本机未安装，远端记录经官方GitHub REST读取。GitHub连接偶发TLS EOF，保留校验并有限重试，未关闭证书校验。远端运行待推送后记录，不先宣称通过。

## 2026-11-27 F1.1-T6 文档与阶段交付（feature/f1.1-project-setup，待验收）

- README、架构当前状态、API对接、部署、测试与ADR同步到实际已实现范围；路线图F1.1改为待验收。T1–T6按任务提交，随后按CONTRIBUTING以no-ff集成develop。
- 本地文档目标44处全部存在，链接/标题结构人工核对，git diff --check通过；基础检查全部通过（单元/组件8项），MSW E2E 2项通过。真实后端冒烟在T5通过，此次纯文档修改不重复启动后端。
- 前端fetch首次出现GitHub TLS握手失败，重试成功，origin/develop仍为0e812619bb796569c3a2300758fe467e97862d85，无上游新提交。远端CI尚未配置，下一任务F3.2-T1；生产发布与业务联调均未执行，不属于本阶段。
- 后端fetch成功，origin/develop为01d9a36，S2.1尚未合并；工作区有其他工作产生的S2.1改动，未触碰。提前CI仅依赖F1.1，按明确执行顺序继续；F2.1开始前会重新核对后端S2.1门禁。

## 2026-11-27 F1.1-T5 健康状态与代理（feature/f1.1-project-setup）

- `/api`、`/health`同源代理；features/system查询健康状态并用Zod校验，临时Schema注明后端src/contracts/http.ts，F1.3替换。Vue Query管理状态，纯文本错误与重试，状态变化aria-live。公开环境配置经Zod验证，生产禁止mock且不包含MSW worker。
- 基础检查通过：typecheck、Lint、单元/组件8项、build；shared/config与system/model行覆盖率各100%。MSW E2E 2项、真实后端冒烟1项通过；生产mock开启的负向构建按预期失败，正常构建通过（JS gzip 59.42 kB）。
- 真实冒烟使用后端既有dist/src/main-api.js，APP_ENV=development、loopback:3000、TASK_API_ENABLED=false；未修改后端文件、数据库或Docker。验证后只停止本次启动的API。API停止后内置浏览器明确显示网络/服务错误与重试，且pnpm test仍8项通过。
- 失败与修复：vue-demi安装脚本被pnpm拒绝，审阅仅在包内选择Vue版本的脚本后精确批准；MSW 3将onUnhandledRequest改名为onUnhandledFrame，类型检查首次失败后修正。E2E首次因本次视觉检查的Vite实例占用项目锁而失败，关闭该实例后通过；未绕过锁。模拟网络/503测试产生预期stderr，断言通过。
- 内置浏览器缺少官方版本文件：按修复技能恢复159个官方文件并校验，不改config。首次连接/页面加载超时，随后实际健康页导航、点击重试、状态读回与截图成功；不宣称未来升级自动修复。
- 视觉采用现有界面规范的浅灰蓝工作台、深蓝文字与绿色连接状态，颜色/间距集中tokens.css，无业务未实现页面冒充完成。

## 2026-11-27 F1.1-T4 E2E框架（feature/f1.1-project-setup）

- 建立Playwright Chromium配置、离线ui/真实real两组、独立Vite端口、首页可见性用例与安装说明；浏览器缓存、trace和报告不入库。
- 冻结安装、Lint、单元测试1项、E2E首页1项通过。初次typecheck/build因exactOptionalPropertyTypes拒绝`workers: undefined`失败，改为明确的2个worker后复查。
- 真实后端组尚无用例，未执行（T5交付）；下载Chromium 159及headless shell成功。环境同时设置NO_COLOR/FORCE_COLOR产生Node提示，不影响测试。

## 2026-11-27 F1.1-T3 单元与组件测试（feature/f1.1-project-setup）

- 建立Vitest + Vue Test Utils + happy-dom，首页可见名称/用途组件测试；`pnpm test`默认生成HTML及JSON覆盖率报告（不提交），shared与feature model行覆盖率门槛80%。当前尚无这两类模块，不把全局50%误记为80%。
- 冻结安装、typecheck、Lint、build通过；首次`pnpm test`失败（安装结束写回package.json覆盖了测试脚本），串行补齐脚本后测试1项通过。修复Vitest配置导入缺少扩展名的前向兼容警告。
- 测试无需网络或后端；E2E尚未建立，未执行（T4）。

## 2026-11-27 F1.1-T2 类型与Lint（feature/f1.1-project-setup）

- 建立ESLint flat config、Prettier、LF规则、禁止any/非空断言/v-html/未校验类型断言、类型导入及自动导入排序。架构规则解析alias与相对路径，强制层级、feature入口与generated访问边界。
- `pnpm run typecheck`、`pnpm run lint`（零警告）、`pnpm run build`通过。临时文件故意加入v-html、alias/相对路径跨feature内部导入、shared→app导入，四项都被Lint拒绝；临时文件已删除。
- 尚未建立单元/E2E框架，测试未执行（T3/T4）。格式检查覆盖代码及配置，已有Markdown暂保留原格式，文档链接在T6核对。

## 2026-11-27 F1.1-T1 项目初始化（feature/f1.1-project-setup，进行中）

- 建立Vue入口、Vite配置、严格TS配置、精确依赖、Node版本与忽略规则。阶段状态为进行中。
- 重新核对npm registry版本、engines/peers；使用Vue 3.5.46、Vite 8.4.0、plugin-vue 6.0.11、TypeScript 6.0.3、vue-tsc 3.3.14、@vue/tsconfig 0.9.1、@types/node 24.19.4。版本依据与成本见ADR追加记录。
- Node 24.22.3 / pnpm 12.23.0：首次安装、`pnpm install --frozen-lockfile`、`pnpm run build`通过；产出dist（不提交），首屏JS gzip 24.74 kB。
- registry下载有慢速警告；Vite/TypeScript官网读取出现TLS错误，改读官方包内README与@vue/tsconfig文档；Vue官网可访问。无忽略peer或engines校验。
- typecheck独立命令、Lint、单元测试和E2E尚未建立，分别由T2/T3/T4交付，未执行；真实冒烟待T5。

## 2026-11-27 决策确认与develop集成分支流程

- 维护者确认全部决策并授权AI连续完成F1.1至F3.2：FD1采用GitHub Actions并在F1.1完成后提前执行F3.2-T1；FD2首版不引入生产错误监控；后端D9（本地账号+会话+CSRF）与D10（单机Docker Compose）已确定。路线图任务依赖、FD表与阶段总览同步更新。
- 分支流程改为 `develop` 集成分支：阶段分支从 `develop` 创建，完成后合并回 `develop` 并标“待验收”；可推送阶段分支与 `develop`，`main` 由维护者在统一验收后合并。契约快照改取自后端 `develop`。CONTRIBUTING同步修改。
- 依赖真实模型的真实冒烟及目标环境部署按后端“统一验收前延后的任务”表处理，不阻塞阶段合并。
- 修正AGENTS中后端远程仓库名为 `Mingan-X/Resume-Studio-Backend`。
- 只改文档；未运行构建或测试。

## 2026-11-27 F2.1–F3.2 任务拆分与连续执行规则（分支 feature/f2.1-scope-adjust）

- 维护者要求把前后端后续任务一次拆分完并由AI连续执行。路线图§2拆分规则改为全部已拆分、阶段开始时复核；§6新增“执行顺序与停止条件”（批次与停止条件引用后端同名小节）及F2.1（6项）、F2.2（7项）、F2.3（5项）、F2.4（8项）、F2.5（5项）、F3.1（6项）、F3.2（8项）任务表。
- 门禁：F3.1-T1依赖D9；F3.2-T1依赖FD1，F3.2-T6依赖D10，F3.2-T7依赖FD2；各F2.x/F3.x阶段需后端对应契约已合并。FD表阻塞列改为指向具体任务。
- 界面规范同步：§3.1简历详情不再展示结构化信息，改到§3.5报告页新增“结构化简历”分区，与F2.1/F2.4范围调整一致。
- 只改文档；文档链接核对见汇报，未运行构建或测试。

## 2026-11-26 F2.1/F2.4 范围调整（分支 feature/f2.1-scope-adjust）

- 起因：后端S2.1拆分修订把简历语义结构化的执行移到后端S2.4的分析流程，S2.1只交付文本块、引用及ParsedResume契约；上传改为请求内同步解析，并要求Idempotency-Key。
- 路线图调整：F2.1验收去掉“未识别字段显示未识别”，补充上传幂等键与“版本详情不展示结构化字段”；F2.4交付增加结构化简历，并承接“未识别”展示要求。F2.4依赖的后端阶段（S3.1）不变。
- 只改文档；后端拆分仍待维护者最终确认，确认后如有变化再同步。未运行构建或测试，未提交。

## 2026-11-24 仓库文档初始化

- 建立前端文档：README、AGENTS、CONTRIBUTING、架构、编码规范、API对接、界面规范、测试、部署、路线图、ADR-0001。
- 技术栈候选版本于当日查询npm registry的latest、engines与peers，记录在ADR-0001；尚未安装任何依赖。
- 仓库没有代码和提交；未运行任何构建或测试。
