# F3.2本地质量核对（2026-11-28）

## 可访问性

@axe-core/playwright 4.14.1按wcag2a/wcag2aa/wcag21aa/wcag22aa扫描登录、简历列表/详情、岗位列表/新建/详情、分析创建、任务、报告列表/详情共10页面，0违规；另测768×900视口无横向溢出、Tab首焦点为“跳到内容”、Enter聚焦主内容，共11项通过。数据为MSW合成夹具，覆盖扫描时可见状态，不等于所有动态状态已认证。

人工/代码核对：原生按钮/select/checkbox/details可键盘操作；原生确认框有明确后果；表单可见label；错误aria-live/role=alert，字段错误建立aria-invalid与aria-describedby并在消失/卸载清理；图表有完整表格和文字替代，unknown与unmet的文字/颜色不同。内置浏览器已核对报告概要/雷达/表格、纯文本证据和焦点定位。

尚未运行NVDA/JAWS等真实读屏软件的听读验收，列为人工验收缺口；自动AX语义、键盘与对比度检查不替代读屏全流程。不宣称已获WCAG 2.2 AA认证。目标服务器浏览器/TLS和真实模型报告质量仍待统一验收。

## 证据入口

- 自动化与键盘：[accessibility.spec.ts](../tests/e2e/accessibility.spec.ts)
- 字段错误关联：[FieldError.test.ts](../src/shared/ui/FieldError.test.ts)
- 原始测试与失败记录：[progress.md](progress.md)
