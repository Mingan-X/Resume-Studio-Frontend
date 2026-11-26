# 开发进度

按时间倒序记录每个阶段或任务的完成情况与验证证据。阶段定义见[开发计划](development-roadmap.md)。

记录规则：

- 每条记录写明日期、阶段/任务编号、分支或提交、完成内容、执行的检查及结果、未执行项及原因。
- 只记录实际运行过的检查；基于MSW完成的功能写明“待联调”。
- 已有记录不改写；发现错误时追加更正记录。

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
