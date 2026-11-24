# 编码规范

规则由ESLint、Prettier与 `vue-tsc` 尽量自动检查；无法自动检查的部分在代码审查中核对。目录与依赖方向见[架构](architecture.md)。

## 1. TypeScript

- `tsconfig` 基于 `@vue/tsconfig`，并开启与后端一致的严格选项：`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`verbatimModuleSyntax`。
- 禁止 `any`；确实无法确定的类型用 `unknown` 并通过Zod或类型守卫收窄。
- 禁止用类型断言（`as`）代替校验；仅允许 `as const`，以及有注释说明原因的DOM类型收窄。
- 禁止非空断言 `!`。
- 类型导入使用 `import type`。
- 枚举值使用字符串字面量联合类型，从生成的契约类型派生，不手写重复定义。
- 判别联合的 `switch` 必须穷尽，`default` 分支用 `assertNever` 让新增状态在编译期报错。

## 2. Vue组件

- 一律使用 `<script setup lang="ts">` 与组合式API，不使用选项式API。
- Props与emits用类型声明：`defineProps<{...}>()`、`defineEmits<{...}>()`；可选props给出默认值。
- 组件文件名使用PascalCase，例如 `ReportSummary.vue`；页面组件以 `Page` 结尾，例如 `ReportDetailPage.vue`。
- 单个组件超过约250行或承担多个职责时拆分。
- 组件分两类：
  - 展示组件：只接收props、发出事件，不调用接口，放在 `components/` 或 `shared/ui/`。
  - 容器组件：调用 `features/*/api` 的composable并把数据传给展示组件。页面组件属于容器组件。
- 禁止 `v-html`（ESLint `vue/no-v-html` 设为error）。
- 列表 `v-for` 必须使用稳定业务ID作为 `key`，不用数组下标。
- 不直接修改props；双向绑定使用 `defineModel`。
- 样式使用 `<style scoped>`；颜色、间距使用 `tokens.css` 中的CSS变量。

## 3. Composable与接口调用

- 命名以 `use` 开头；查询类为 `useXxx`、变更类为 `useXxxMutation`。
- 一个composable只做一件事，返回值为响应式对象或ref，不返回裸值。
- 接口调用只出现在 `features/*/api/`；组件、store和工具函数中不调用 `fetch` 或客户端。
- 参数接受 `MaybeRefOrGetter`，内部用 `toValue` 读取，以便响应式参数变化时自动重新查询。

## 4. Pinia

- 只存客户端状态，不缓存接口返回的数据（接口数据由Vue Query管理）。
- 使用setup写法：`defineStore('ui', () => { ... })`。
- store之间不互相调用形成环。

## 5. 命名

| 对象 | 规则 | 例子 |
|---|---|---|
| 目录 | kebab-case | `features/reports/` |
| 组件文件 | PascalCase | `EvidenceQuote.vue` |
| 其他TS文件 | camelCase | `useTask.ts`、`formatScore.ts` |
| 类型、接口 | PascalCase | `TaskStatus` |
| 常量 | UPPER_SNAKE_CASE | `TERMINAL_TASK_STATUSES` |
| Query key工厂 | `<领域>Keys` | `taskKeys.detail(id)` |
| 测试文件 | 与被测文件同名加 `.test.ts` | `formatScore.test.ts` |

## 6. 导入

- 使用路径别名 `@/` 指向 `src/`；同一feature内部使用相对路径。
- 跨feature只从对方的 `index.ts` 导入。
- 不使用默认导出，Vue单文件组件除外。
- 导入顺序：外部包 → `@/` 别名 → 相对路径，由ESLint规则自动排序（F1.1确定具体规则）。

## 7. 注释与文案

- 注释解释“为什么”，不复述代码。涉及业务规则时注明后端文档出处，例如 `// unknown不计为0分，见后端requirements.md §3`。
- 界面文案直接写在组件模板中（首版不做国际化），同一文案在多处使用时提取到该feature的 `model/labels.ts`。
- 状态枚举到中文标签的映射集中在 `model/labels.ts`，用 `Record<Status, string>` 保证穷尽。

## 8. 依赖

- 新增依赖前说明用途、替代方案和成本，核对官方文档、engines、peers和维护状态。属于ADR-0001范围内的依赖更新其版本表；新类别的依赖新建ADR。
- 使用精确版本（`.npmrc` 中 `save-exact=true`），同步提交锁文件，不忽略peer冲突。
- 能用浏览器原生API或现有依赖完成的功能，不新增依赖。
