# ADR-0001：前端技术栈

- 日期：2026-11-24
- 状态：已采纳（对应后端决策D5）；依赖尚未安装，版本在F1.1接入时以冻结安装和真实编译验证
- 范围：Resume-Studio-Frontend 第一版

## 背景

Resume Studio 需要一个面向求职者的Web界面：上传简历、管理岗位、发起分析、查看任务进度和证据化报告。后端是独立仓库的 NestJS 服务，接口契约以后端Zod Schema为真源（见[后端接口契约规范](https://github.com/Mingan-X/Resume-Studio-Backend/blob/master/docs/api-contract.md)）。后端文档曾把前端框架列为“Vue 3 + TypeScript 或 React”待定。

## 决策

1. 框架：Vue 3（组合式API + `<script setup lang="ts">`）、Vite、TypeScript。
2. 运行环境与包管理与后端一致：Node.js 24.22.3、pnpm 12.x、精确版本、锁文件与 `--frozen-lockfile`、严格peer校验。
3. 服务端数据使用 TanStack Vue Query 管理（缓存、轮询、重试、失效）；Pinia只保存客户端状态（当前用户、界面偏好），不缓存接口数据。
4. 组件库使用 Element Plus；图表使用 ECharts（六维雷达图），按需引入模块。
5. 接口类型从后端OpenAPI产物生成，响应在运行时用Zod校验。
6. 首版只支持中文界面，不引入国际化框架。
7. 不引入自动导入插件（unplugin-auto-import / unplugin-vue-components），组件与函数一律显式导入，便于阅读、审查和AI生成代码时定位来源。

## 候选版本

2026-11-24 查询 npm registry 的 latest 版本与 engines/peers。这些是F1.1的接入起点，不是已安装版本；接入时重新核对。

| 用途 | 包与版本 | 约束 |
|---|---|---|
| 框架与构建 | vue 3.5.46、vite 8.3.8、@vitejs/plugin-vue 6.0.11 | vite与plugin-vue要求Node `^20.19.0 \|\| >=22.12.0` |
| 类型 | typescript 6.0.3、vue-tsc 3.3.14、@vue/tsconfig 0.9.1 | TypeScript固定6.0.3与后端一致；latest 7.0.2 超出 typescript-eslint 8.74.0 的 `<6.1.0` peer范围 |
| 路由与状态 | vue-router 5.5.1、pinia 4.1.0、@tanstack/vue-query 5.108.4 | pinia的peer `@vue/devtools-api ^8.2.1` 不是可选项，严格peer模式下需显式安装 |
| UI与图表 | element-plus 2.14.8、@element-plus/icons-vue 2.3.2、echarts 6.1.0、vue-echarts 8.3.2 | vue-echarts peer `echarts ^6.0.0` |
| 校验 | zod 4.6.7 | 与后端同版本 |
| 接口类型生成 | @hey-api/openapi-ts 0.99.0 | Node `>=22.18.0`；peer TypeScript `>=5.5.3 \|\| >=6.0.0`；0.x版本须固定精确版本，升级前阅读变更记录 |
| Lint与格式 | eslint 10.15.0、@eslint/js 10.0.1、eslint-plugin-vue 10.12.1、typescript-eslint 8.74.0、@vue/eslint-config-typescript 14.9.0、prettier 3.10.1 | eslint-plugin-vue需要 `vue-eslint-parser ^10.3.0` |
| 测试 | vitest 5.1.1、@vitest/coverage-v8 5.1.1、@vue/test-utils 2.6.0、happy-dom 21.0.4、msw 3.0.7、@playwright/test 1.65.1 | vitest要求Node `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`；msw要求Node `>=22.12.0` |

## 方案比较

### F1.1-T5 实际安装（2026-11-27）

Zod 4.6.7、@tanstack/vue-query 5.108.4、MSW 3.0.8。registry版本/engines/peers复核，Vue Query支持Vue 3.3+，MSW要求Node >=22.12。复用已选运行时校验和服务端缓存方案，替代手工断言/状态管理；MSW仅开发期，采用官方README及包类型注明的onUnhandledFrame选项。已检查vue-demi 0.14.10 postinstall及utils，仅切换包内Vue适配文件，allowBuilds精确批准；无全局允许脚本。MSW worker与官方文件SHA256一致且只在mock开发服务器提供，不复制进dist。官方入口：[Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview)、[MSW](https://mswjs.io/docs)、[Zod](https://zod.dev/)。冻结安装、组件和真实后端验证通过。

### F1.1-T4 实际安装（2026-11-27）

@playwright/test 1.65.1，registry engines为Node >=20，兼容本机；已读取官方包README并按其文档安装Chromium。沿用已选E2E框架（替代Cypress），成本是浏览器缓存和CI下载，仅开发期依赖；真实页面打开已验证。[官方文档](https://playwright.dev/docs/intro)。

### F1.1-T3 实际安装（2026-11-27）

Vitest / @vitest/coverage-v8 5.1.2、@vue/test-utils 2.6.0、happy-dom 21.0.4。已复核registry版本/engines/peers（Vitest要求Node 22.12/24/26，Vite 6.4/7/8，coverage严格同版本；Vue Test Utils要求Vue 3）。沿用ADR选型，不改用Jest或jsdom；这些包只影响开发和CI安装。使用官方API：[Vitest配置](https://vitest.dev/config/)、[Vue Test Utils](https://test-utils.vuejs.org/guide/)。冻结安装与实际组件运行已通过。

### F1.1-T2 实际安装（2026-11-27）

ESLint 10.15.0、@eslint/js 10.0.1、eslint-plugin-vue 10.12.1、typescript-eslint 8.74.0、@vue/eslint-config-typescript 14.9.0、Prettier 3.10.1、eslint-plugin-simple-import-sort 14.0.0。均为开发依赖，registry版本/engines/peers已复核，TS保持6.0.3以满足 `<6.1.0`；官方Vue ESLint配置README核对flat config写法。导入排序采用simple-import-sort（替代手工排序或更重的import resolver插件），成本仅开发期；架构路径规则本地实现，避免增加完整边界插件。官方说明：[Vue ESLint TS](https://github.com/vuejs/eslint-config-typescript)、[导入排序](https://github.com/lydell/eslint-plugin-simple-import-sort)、[Prettier](https://prettier.io/docs/configuration)。

### F1.1-T1 实际安装（2026-11-27）

| 包 | 版本 | 用途与核对 |
|---|---|---|
| vue | 3.5.46 | 已选框架；官方Quick Start与registry核对 |
| vite / @vitejs/plugin-vue | 8.4.0 / 6.0.11 | 开发服务器与Vue编译；替代手工打包配置，新增开发依赖成本；Node范围兼容24.22.3，plugin支持Vite 8 |
| typescript / vue-tsc | 6.0.3 / 3.3.14 | TS与SFC检查；只用tsc不能检查Vue模板，vue-tsc要求TS >=5 |
| @vue/tsconfig / @types/node | 0.9.1 / 24.19.4 | 官方严格基础配置与构建配置的Node类型，均为开发依赖 |

已读取官方包内README（Vite、vue-tsc、@vue/tsconfig）并核对registry发布版本、engines/peers。官方入口：[Vue](https://vuejs.org/guide/quick-start.html)、[Vite](https://vite.dev/guide/)、[Vue TS配置](https://github.com/vuejs/tsconfig)。当前版本均仍有发布维护；精确版本与锁文件冻结安装已验证。pnpm自动记录的 `vite@8.4.0` release-age例外随workspace配置提交，不关闭全局供应链或peer校验。

| 方案 | 结论与原因 |
|---|---|
| React + TypeScript | 生态同样成熟。选择Vue的原因：国内企业后台组件库（Element Plus）成熟，参考项目Elpis Demo的报告界面也是Vue，便于对照业务设计 |
| Nuxt / SSR | 不选。报告与任务数据都需要登录后访问，没有SEO需求；SSR增加部署组件 |
| 只用Pinia管理接口数据 | 不选。缓存失效、轮询、重试和请求去重需要自行实现，容易出现过期数据 |
| openapi-typescript 7.13.0 | 不选。其peer要求 `typescript ^5.x`，与TypeScript 6.0.3在严格peer模式下冲突 |
| 手写接口类型 | 不选。字段会与后端Schema漂移；只在OpenAPI产物可用前对接 `/health` 时临时使用 |
| Ant Design Vue / Naive UI | 不选。功能可满足，但Element Plus的表格、表单和上传组件更贴近本项目的后台式页面，社区资料更多 |
| 引入vue-i18n | 首版不选，没有多语言需求 |
| DOMPurify | 不选。项目禁止用 `v-html` 渲染任何接口数据，不需要HTML净化 |

## 后果

- 收益：类型从后端契约派生，前后端字段一致；服务端状态与客户端状态职责清楚；显式导入让依赖关系可审查。
- 代价：OpenAPI产物要等后端S1.4-T9交付，此前业务页面无法对接真实契约；@hey-api/openapi-ts仍是0.x，升级可能有破坏性变化。
- 若Element Plus运行时内联样式与CSP冲突，需在F3.2实测并记录CSP的最小放宽范围。

## 重新评估触发条件

- @hey-api/openapi-ts出现不可接受的破坏性变化或停止维护。
- 出现多语言、移动端优先或SEO需求。
- typescript-eslint支持TypeScript 7且后端同步升级。
