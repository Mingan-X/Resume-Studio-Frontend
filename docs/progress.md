# 开发进度

按时间倒序记录每个阶段或任务的完成情况与验证证据。阶段定义见[开发计划](development-roadmap.md)。

记录规则：

- 每条记录写明日期、阶段/任务编号、分支或提交、完成内容、执行的检查及结果、未执行项及原因。
- 只记录实际运行过的检查；基于MSW完成的功能写明“待联调”。
- 已有记录不改写；发现错误时追加更正记录。

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
