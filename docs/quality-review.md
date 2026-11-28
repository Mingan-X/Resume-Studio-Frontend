# F3.2本地质量核对（2026-11-28）

## 可访问性

@axe-core/playwright 4.14.1按wcag2a/wcag2aa/wcag21aa/wcag22aa扫描登录、简历列表/详情、岗位列表/新建/详情、分析创建、任务、报告列表/详情共10页面，0违规；另测768×900视口无横向溢出、Tab首焦点为“跳到内容”、Enter聚焦主内容，共11项通过。数据为MSW合成夹具，覆盖扫描时可见状态，不等于所有动态状态已认证。

人工/代码核对：原生按钮/select/checkbox/details可键盘操作；原生确认框有明确后果；表单可见label；错误aria-live/role=alert，字段错误建立aria-invalid与aria-describedby并在消失/卸载清理；图表有完整表格和文字替代，unknown与unmet的文字/颜色不同。内置浏览器已核对报告概要/雷达/表格、纯文本证据和焦点定位。

尚未运行NVDA/JAWS等真实读屏软件的听读验收，列为人工验收缺口；自动AX语义、键盘与对比度检查不替代读屏全流程。不宣称已获WCAG 2.2 AA认证。目标服务器浏览器/TLS和真实模型报告质量仍待统一验收。

## 构建预算

生产manifest递归核对index.html、动态启动createApplication及/resumes路由静态依赖，去重后门槛307200字节（300KiB）；已纳入CI。初测103501字节，严格CSP启动拆分后104800字节，最终以build-analysis.json与progress记录为准。报告图表独立动态加载。Node gzip默认设置与构建工具压缩等级可能略有差异；体积不代表实际网络时延或生产性能保证。

`pnpm run build:analyze`输出dist/build-analysis.json，列出每个计入块；预算超限非零退出。首次使用src/main.ts查manifest失败，按实际Vite入口index.html修正后通过。

## 安全与部署本地证据

nginx官方Windows稳定1.30.8实际提供生产dist；安全头、所有已实现页面和表单的严格CSP（无unsafe-inline/eval）、缓存、深链与真实API404通过。Zod使用jitless且动态应用装配保证先配置。Compose叠加仅config --quiet语法核对，未拉镜像或启动容器。独立8090发布A→B→A成功，原dist不变。目标Linux、镜像digest、受信TLS/HSTS和服务器回滚仍待验收。

## 已知契约与验收缺口

- 简历列表无文件显示名/解析状态字段，当前展示编号/时间/版本并说明缺口。
- 最终报告无rank数字，仅有top10有序ID；保留顺序，不以召回rank冒充最终名次。number分数保留原值，不前端toFixed补尾零。
- 原简历映射通过analyses/options查询后跳双ID版本详情，找不到则保留报告内原文，未伪造resumeId。
- 真实模型分析终态、报告/重算与目标部署按既定延后；真实读屏听读列人工缺口。
- `.smoke-runs/auth-Wzin4r`诊断manifest已cleaned，业务数据清理完成；临时TLS目录删除被自动审批拒绝，未绕过，需维护者手工清理。`auth-2XtTJf`、`auth-II7RTp`两轮曾因夹具提前退出遗漏清理，最终已按精确manifest清理账号/owner及业务记录，目录保留；这两轮匿名会话hash未持久记录，不能确认其即时物理清理，按后端匿名过期策略处理。此限制不冒充清理全通过，详见progress更正。

## 证据入口

- 自动化与键盘：[accessibility.spec.ts](../tests/e2e/accessibility.spec.ts)
- 字段错误关联：[FieldError.test.ts](../src/shared/ui/FieldError.test.ts)
- 原始测试与失败记录：[progress.md](progress.md)
