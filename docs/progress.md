# 开发进度

按时间倒序记录每个阶段或任务的完成情况与验证证据。阶段定义见[开发计划](development-roadmap.md)。

记录规则：

- 每条记录写明日期、阶段/任务编号、分支或提交、完成内容、执行的检查及结果、未执行项及原因。
- 只记录实际运行过的检查；基于MSW完成的功能写明“待联调”。
- 已有记录不改写；发现错误时追加更正记录。

## 2026-11-28 F3.2-T6 部署覆盖配置与本地回滚（feature/f3.2-quality）

- 提供与后端release Compose叠加的frontend覆盖，只替换既有proxy模板/安全头/路由挂载，envsubst限定PUBLIC_HOST；不改后端文件。正式发布/不可变dist目录/旧assets保留/回滚步骤写deployment，要求受信TLS及核验digest。
- Compose合并config --quiet通过（合成占位仅语法，不pull/build/up）。完整TLS模板最初80端口绑定被Windows拒绝，改成本轮loopback18080/18443后nginx -t通过；没有占用生产端口或改防火墙。真实nginx8090用两份生产产物A→B→A回滚演练通过，原dist不变、本轮进程已退出。
- Lint首次扫描本轮回滚复制的minified dist得到大量产物错误，将.smoke-runs与dist一样明确排除后零警告通过，源码规则不变。目标服务器TLS/HSTS/镜像核验、Compose启动及目标回滚演练按既定F3.2-T6延后；本机演练不替代目标验收。

## 2026-11-28 F3.2-T5 nginx安全响应头与CSP实测（feature/f3.2-quality）

- 从nginx.org官方HTTPS下载Windows稳定1.30.8，zip SHA256 ccd0c03ff665d4534e6595e455624ededc9eeb11a81a6a128920fcc928be1151；仅本机8088/8089与本次API进程。生产dist与真实nginx配置语法/响应头/缓存/SPA/真实后端未知API404验证通过，页面业务数据用合成路由夹具。
- 3项部署浏览器检查通过：报告/图表、其他已实现页面和表单、严格样式试验0违规。CSP移除全部unsafe-inline/unsafe-eval，style-src-attr none；Zod官方jitless先于Schema装配。主入口启动分块改变后预算脚本计入createApplication动态启动块，首屏gzip104800字节，仍低于300KiB。
- 失败：独立nginx前缀缺temp目录导致语法检查失败，创建专用temp后通过；首次CSP实际捕获Zod eval探测，设置jitless但导入排序过晚仍失败，改bootstrap动态装配后0违规。类型检查拒绝webServer显式undefined，改空数组；脚本AbortSignal全局声明补齐。没有关闭浏览器安全策略、修改系统代理或停止既有服务。
- Lint/typecheck与构建通过。生产TLS/HSTS和目标环境验证仍延后；本地HTTP专项不替代。nginx测试日志在忽略.smoke-runs保留，进程均已停止。

## 2026-11-28 F3.2-T4 构建体积与预算（feature/f3.2-quality）

- build manifest与递归依赖测量入口/resumes，首屏JS gzip103501字节，小于300KiB（307200字节），保留预算并在CI构建后强制检查。报告图表独立动态块；不把体积当生产时延。
- `pnpm run build:analyze`构建通过，首次分析因入口key误用src/main.ts失败，修正实际index.html后分析通过；Lint通过。明细在dist/build-analysis.json（不提交），解释见quality-review。无依赖变动。

## 2026-11-28 F3.2-T3 可访问性核对（feature/f3.2-quality）

- 加入axe4.14.1开发依赖，registry engines/peers与官方README核对、冻结安装通过。10页面自动WCAG规则0违规；768px键盘跳内容/焦点/无横向溢出验证通过，专项11项。
- 人工核对补字段错误aria-invalid/aria-describedby关联与清理；typecheck、Lint、116项测试、build和a11y11项全部通过。核对记录见quality-review；真实读屏听读未执行，记录为人工验收缺口，未声称自动扫描等于AA认证。

## 2026-11-28 F3.2-T2 可执行关键真实流程（feature/f3.2-quality，进行中）

- F3.1已合并推送develop6595fc2；F3.2前fetch后端b2104ea，S3.3合并已核验。T1 CI已提前交付，不重复实施。
- HTTPS真实组3项通过：登录/CSRF/退出、同源岗位要求确认发布→持久索引任务、PDF上传；非模型分析/报告边界组3项通过。各轮合成账号/会话/业务数据按精确owner清理，未启动模型或向量消费者。
- 完整真实“分析→报告→重算→历史”依赖真实模型产物，按统一验收延后。工程MSW相关完整流程已在F2.x运行；不以合成报告假装真实质量验证。

## 2026-11-28 F3.1-T6 文档与交付（feature/f3.1-auth，待验收）

- README、架构、API、测试和部署说明同步会话引导、CSRF内存、DEV边界及HTTPS前置，阶段待验收。最终115项测试、build、24项E2E与2项真实HTTPS通过；纯文档检查本地链接及diff，不重复数据库操作。T1–T6分别提交，no-ff集成推送。
- 未使用goal/子代理，检查串行；未改后端文件或main。目标环境、真实模型延后；已确认cleaned但被审批拒绝删除的诊断TLS目录保留，见T5。

## 2026-11-28 F3.1-T5 真实HTTPS会话联调（feature/f3.1-auth）

- 真实HTTPS两项通过：匿名访问→登录→原页面、浏览器缺CSRF写请求403、正确CSRF创建岗位、退出与重新受保护访问；同一浏览器真实Secure Cookie下XHR上传PDF成功。无手工Cookie注入。临时自签TLS仅auth-real测试上下文接受，不修改系统信任或生产配置；关闭trace避免账号/会话进入网络归档，账号/输入均合成。
- 精确记录本轮Set-Cookie令牌hash仅用于测试清理，前端应用不读取Cookie；账号/业务数据/会话及临时TLS文件清理通过。前端存储检查仅允许Vue Router内置vue-router:scroll界面位置键，无业务内容/凭证。最终typecheck、Lint、115项测试、build、24项E2E通过。
- 失败：首次夹具启动未取得ready（原输出保留，根因未确认），同目录有界诊断启动/cleaned成功；三次缺CSRF断言得到401，最终证据确认URL正则误匹配login的redirect参数、请求早于登录完成，改精确完整URL及标题后403通过，前述Cookie上下文猜测撤回。存储初查误要求sessionStorage绝对空，核对Vue Router官方实现后只排除滚动位置键。
- 遗留：启动诊断目录.smoke-runs/auth-Wzin4r的manifest为cleaned、业务数据已清理；删除其临时证书目录被自动审批以blocked by policy拒绝，未绕过，忽略目录保留待手工清理。其他成功运行目录均正常清理。目标服务器TLS/真实模型未验证。

## 2026-11-28 F3.1-T4 写请求CSRF（feature/f3.1-auth）

- fetch与XHR非GET/HEAD统一附内存X-CSRF-Token；GET不附头，缺值不伪造，后端403原样处理。Origin由浏览器发送，不手写或读取Cookie。登录成功轮换后使用新CSRF，退出后清除。
- typecheck、Lint、115项测试、build、24项E2E通过；MSW登录/登出校验新旧CSRF，单元覆盖fetch/XHR与缺值403。首次新增测试复用已消费Response导致contract错误，模拟改为每请求新Response后通过，业务实现未放宽。

## 2026-11-28 F3.1-T3 守卫与失效处理（feature/f3.1-auth）

- 路由先校验输入，再fetch会话；匿名转/login?redirect，登录返回站内原地址。401取消/清空资源缓存和CSRF/用户状态后跳登录；403显示安全无权限信息并保留requestId，404保持“不存在或无权访问”。顶部当前账号和退出已接线。
- typecheck、Lint、112项原测试、build、24项E2E通过；新增401/403专项1项及类型检查通过（累计113项），明确断言缓存移除、redirect和requestId。真实HTTPS/Secure Cookie在T5；未读取浏览器Cookie或保存凭证。

## 2026-11-28 F3.1-T2 登录表单（feature/f3.1-auth）

- /login表单使用管理员账号，无注册入口；提交中禁用，失败保留用户名并清除口令，安全错误/requestId可见；成功按safeRedirect返回站内路径。口令只在表单临时内存，卸载清除。
- typecheck、Lint、112项测试、build、23项E2E通过；组件验证失败后的用户名/口令状态。全局认证守卫在T3接线，真实HTTPS/Secure Cookie在T5验证。

## 2026-11-28 F3.1-T1 会话接口与当前用户（feature/f3.1-auth，进行中）

- F2.5合并推送develop5246b9c；F3.1前fetch后端b2104ea并核验S3.2合并9ca226f。快照仍相同。读取auth契约/控制器/Guard，按匿名session引导→login轮换→logout实现。
- API请求在feature，Pinia仅存当前用户/就绪/开发模式客户端状态，Query缓存保留用户和过期时间；CSRF只存内存，不进入浏览器存储或URL。浏览器Cookie不读取；登录/登出清理旧查询缓存。仅DEV遇认证路由404时保留后端既定本地模式，生产不放行。
- typecheck、Lint、111项测试、build、契约9项通过；当前尚未启用路由鉴权/登录页面（T2/T3）。新增CSRF内存工具验证非法值与GET不附头，业务写请求接线在T4。

## 2026-11-28 F2.5-T5 文档与交付（feature/f2.5-revisions，待验收）

- 架构§8、API、测试与README同步实际SSE/重算/历史；阶段待验收。最新完整回归108项测试、build、23项E2E和真实非模型3项/任务SSE4项均通过，纯文档不重复测试。链接/diff检查执行；T1–T5独立提交并no-ff集成推送。
- 真实模型报告重算链路保持延后；不修改main或后端文件，所有临时API与隔离数据均按测试流程结束。

## 2026-11-28 F2.5-T4 重算历史与非模型联调（feature/f2.5-revisions）

- typecheck、Lint、108项测试、build、23项E2E通过；重算→新revision→原报告→历史可核对，后端字段错误保留3.25输入并定位对应维度。真实非模型组3项通过（创建QUEUED、报告404、历史空状态），隔离清理通过；真实SSE4项记录见T3。
- 依赖真实模型报告的重算→新revision→历史完整真实链路按统一验收延后，未执行；MSW新报告不当作真实产物。

## 2026-11-28 F2.5-T3 SSE任务进度（feature/f2.5-revisions）

- 接入后端event:task及生成TaskEvent校验，按taskId/seq/id过滤错任务、重复/旧事件，再查询后端快照；终态/隐藏/卸载关闭连接，原生EventSource断线保留Last-Event-ID补读，失败上限后恢复2秒轮询。
- 最终typecheck、Lint、107项测试、build、23项E2E通过；原生本地传输测试实际看到Last-Event-ID=1后事件2，断线失败回退。真实任务组4项通过，含持久SSE最终seq补读204，查询/取消及隔离清理保持通过。
- 首次E2E发现fallback状态在refetchInterval回调内未被Vue Query响应追踪，改computed间隔配置后通过；类型检查曾拒绝泛型Query键不一致，改为所需state结构类型，无断言。去重测试首次误匹配“已完成”计数标题，改精确状态标签后107项通过。保留全部失败，不放宽超时或断言。

## 2026-11-28 F2.5-T2 报告历史（feature/f2.5-revisions）

- /reports列表与报告内同分析revisions列表均按游标分页，显示时间/状态/revision/来源链接；不覆盖原报告或重排后端结果。
- typecheck、Lint、105项测试、build、22项E2E通过。分页组件验证两页与来源关系，重算E2E仍可回原版本。首次测试把MSW Request.url误写为函数，类型检查拒绝，改属性后通过；无标准放宽。

## 2026-11-28 F2.5-T1 调权重算（feature/f2.5-revisions，进行中）

- F2.4已合并并推送develop93b1188；F2.5前fetch后端b2104ea并核验S3.1。权重从每个候选的weightsSnapshot复制到表单，维度/要求权重只校验有限非负，提交后使用后端新report.id跳转，原缓存/报告不变，来源revision可回看。字段details映射到对应输入，未保存提醒。
- typecheck、Lint、104项测试、build、22项E2E通过；验证网络重试同键、输入变化换键、原夹具不变、生成revision2并返回revision1。首次Vue格式检查失败后重新格式化通过。真实重算需真实报告产物，按F2.5-T4延后。

## 2026-11-28 F2.4-T8 阶段文档与交付（feature/f2.4-reports，待验收）

- README/API/界面规范/测试映射同步实际实现与契约缺口，F2.4待验收；T1–T8独立提交。可执行部分已完成，真实模型报告内容延后，最终名次数字和固定尾零待后端展示字段，均不前端补算。
- 最终代码typecheck/Lint、103项测试、build通过（T6），21项E2E与2项非模型真实检查/清理通过（T7），冻结安装见T4、契约8项见T1；本项纯文档核对链接及git diff --check，不重复模型或数据库操作。

## 2026-11-28 F2.4-T7 展示规则与浏览器核对（feature/f2.4-reports）

- 21项MSW E2E通过，集中核对原分数、UNKNOWN/UNMET、unknown图表/表格、PARTIAL、推荐不足、待核实分区、覆盖率/上界说明、HTML证据与跳转；不伪造进度由任务既有测试覆盖，revision来源由概要组件测试覆盖，实际重算流程在F2.5验证。
- 内置浏览器导航/截图核对PARTIAL概要、六维图和等价表格：四个已知点、三段线，未知两轴无点，布局无重叠。辅助使用MSW合成报告，未声称真实模型验证。
- 最终Lint通过；真实非模型组2项通过（创建QUEUED及报告404/请求编号），隔离清理成功。完整真实报告内容冒烟依真实模型产出，按F2.4-T7延后，未伪造报告写入后端。

## 2026-11-28 F2.4-T6 待核实与硬条件不符合（feature/f2.4-reports）

- 按后端pending/ineligible数组分区，待核实不显示总分且不混入推荐；列出无法验证的硬条件、原因及未完成判断。不符合区可折叠并逐条解释硬unmet，保留原始证据。
- typecheck、Lint、103项测试、build通过；测试确认pending的21.37不会被展示为总分，BUDGET与unknown分离，ineligible有明确硬条件解释。无前端资格计算；完整报告浏览器核对在T7。

## 2026-11-28 F2.4-T5 推荐与逐项判断（feature/f2.4-reports）

- 使用后端top10有序ID和results查找原值，展示总分/coverage/upperBound与可展开说明；不补卡片、不按分数重排、不借召回rank生成名次。逐项显示贡献/verdict/理由/证据与位置，UNKNOWN灰蓝文字和UNMET红色文字分离，未完成执行另示预算/失败/待执行。
- typecheck、Lint、102项测试、build通过，断言63.47/72.11/91.23与47.13原样显示、仅1个推荐、pending不混入、HTML不执行。首次组件单词名Lint失败，改ReportRecommendations并修复导入排序后通过；未禁用规则。完整报告E2E在T7。

## 2026-11-28 F2.4-T4 六维画像（feature/f2.4-reports）

- ECharts按需Radar/Graphic/SVG，六轴保留，只绘assessed后端分值点，相邻两轴均已知才连线；unknown没有点和到0连线。已知0分仍为中心点。图旁明确列出证据不足维度，六维等价表格含等级/分值/理由/证据。
- registry/官方包核对、冻结安装、typecheck、Lint、100项测试、build和20项E2E通过；几何测试断言4已知点/3段线及真实零点，表格显示66.37与证据不足。主入口gzip95.09kB，图表在报告懒加载块145.95kB，非完整性能验收。机械盘依赖安装3m57s、初次Lint/测试加载较慢，未并行或放宽标准。

## 2026-11-28 F2.4-T3 结构化简历与证据（feature/f2.4-reports）

- 教育/工作/项目/技能按快照展示，null和空数组为未识别，来源quote及完整块按纯文本展开。来源定位使用保存的块ID/区间，PDF/DOCX位置原样；无HTML执行。
- 对T1的resumeId缺口补充：可通过已实现analyses/options逐页查回resumeVersionId→resumeId映射，用户点击时才查，不伪造字段；找到后跳双ID详情锚点，找不到仍可核对报告内原文。
- typecheck、Lint、98项测试、build通过，20项E2E通过。首轮跨页锚点用例发现动态加载DOM不可靠触发CSS :target，改为按经校验blockId显式高亮/滚动/聚焦，E2E核对URL、目标原文、高亮和焦点后通过。真实模型报告仍延后。

## 2026-11-28 F2.4-T2 报告概要（feature/f2.4-reports）

- /reports/:reportId懒加载、Zod路由入口与Query状态，概要展示分析时间、版本、岗位范围、规则版本与来源revision。PARTIAL横幅直接展示候选/要求计数、原因及“排名仅基于已评估岗位”。
- typecheck、Lint、96项测试、build通过，19项E2E通过。刷新/重新打开比较可见快照；首次用innerText采集却以textContent断言，空白差异导致失败，统一useInnerText后通过，未放松内容断言。真实报告冒烟按延后表处理。

## 2026-11-28 F2.4-T1 报告契约与夹具（feature/f2.4-reports，进行中）

- F2.3已合并推送develop 436c367；F2.4前fetch后端b2104ea并核验S3.1合并5899725。快照不变。新增报告查询、生成类型派生以及覆盖展示规则的PARTIAL夹具（真实模型产物仍延后）。
- typecheck、Lint、94项测试、build、8项契约专项通过。夹具含不与贡献简单相加相等的63.47/72.11/91.23、unknown画像/硬门槛、unmet、BUDGET未执行、HTML quote及不足10条原因，生成Schema验证通过。
- 契约缺口：最终ranking仅top10 ID有序数组，无最终rank数字；不能拿召回rank冒充，不自行编号算名次。报告仅resumeVersionId无resumeId，不能直拼既有双ID简历详情；先使用报告内完整原文块定位。数值返回number，无法保证尾零两位文本；原样显示，不前端取整。按§6记录并跳过缺字段部分，其他展示继续。

## 2026-11-28 F2.3-T5 文档与交付（feature/f2.3-analyses，待验收）

- README/API/测试命令同步，F2.3待验收。T1–T5独立提交；完成后no-ff集成develop并推送。最终代码基础检查93项测试、build，18项E2E与非模型真实创建通过；契约7项见T1。纯文档不重复测试，链接与diff检查执行。
- 真实模型终态冒烟仍为延后项，不使用合成模型伪装完成；后端/main未改动。

## 2026-11-28 F2.3-T4 创建流程联调（feature/f2.3-analyses）

- 18项MSW E2E及1项真实分析选项→创建→QUEUED流程通过，typecheck/Lint通过。真实API/数据库，合成已解析输入与冻结语料来自后端既有测试准备函数，仅配置版本标识，不执行模型/图/向量/评分。报告入口为空，未假造完成产物。
- 清理前核验项目归属及taskAttempt为0，停止API后复用后端精确owner清理函数，本轮合成输入/任务/owner清理通过；后端文件未改动。
- 依赖真实模型的“发起→终态”冒烟延后统一验收，未执行；本次真实创建成功不代表真实分析可用。

## 2026-11-28 F2.3-T3 真实分析任务展示（feature/f2.3-analyses）

- 按后端analysis-graph定义增加LOAD至SAVE/FINALIZE的阶段标签，显示任务类型并说明不同阶段计数单位；保留未知stage原值。reportId为空不显示入口，有ID才跳报告。
- typecheck、Lint、93项测试、build通过；新增PARTIAL/MATCH的8/20原样展示及报告入口断言，既有四终态暂停轮询继续通过。用户流程E2E在T4，真实模型产物依既定延后。

## 2026-11-28 F2.3-T2 发起分析页（feature/f2.3-analyses）

- /analyses/new选择已解析简历版本、冻结语料版本及基准日期，分别分页，不默认选latest；提交前显示版本、文件hash、岗位数量及规则版本。配置缺失/空选项明确提示，创建中禁用，失败保留选择，成功跳任务页。
- typecheck、Lint、92项测试、build、18项E2E通过；接口用例验证同请求网络重试同键、修改日期换键，浏览器验证版本可见/单次POST/跳转。未运行真实模型，非模型真实创建在T4。

## 2026-11-28 F2.3-T1 分析接口（feature/f2.3-analyses，进行中）

- F2.2已合并并推送develop c8774ab；开始前fetch后端b2104ea，核对S2.4合并12343f4为其祖先。契约快照仍为相同SHA。读取analysis-input/workflow和选择接口说明。
- 接入analyses/options简历/语料各自游标和创建接口，输入/响应由生成Schema校验；只提交resumeVersionId/asOfDate/jobCorpusVersionId，corpus为版本名，不选latest、不传配置/owner。输入变更换幂等键，同输入重试复用。
- typecheck、Lint、91项测试、build、契约7项通过；页面与真实非模型创建在T2–T4，真实模型终态验证按规则延后。

## 2026-11-28 F2.2-T7 文档与阶段交付（feature/f2.2-jobs，待验收）

- README、API对接和测试前置同步，F2.2待验收。T1–T7按任务提交，计划no-ff合并develop并推送阶段分支/develop。没有新依赖或快照变动（仍b2104ea）。
- 最新完整回归typecheck、Lint、90项测试、build、17项E2E及真实岗位流程通过，契约6项见T1；本项纯文档，不重复数据库冒烟。文档链接与diff检查执行见提交记录。真实模型建议/索引处理未执行，缺模型已有明确交互，不声称生产可用。

## 2026-11-28 F2.2-T6 真实岗位联调（feature/f2.2-jobs）

- 真实浏览器→后端控制器/数据库完成新建JD、缺模型响应、手工引用要求、确认发布、索引任务查询与列表PENDING/未参与召回；1条完整流程通过，17项MSW E2E通过。只使用测试装配的frontend-smoke-only索引标识，不启动消费者、向量或模型，不把创建任务说成索引可用。
- 随机owner隔离；清理前核验项目PostgreSQL归属、ResourceOperation全部停止、无索引执行attempt，关闭API并精确清理本轮岗位/任务/Outbox/owner。真实清理通过，不改后端文件或本地配置。
- 首次真实检查发现后端MODEL_UNAVAILABLE的message为通用“请求无法处理”，MSW预期文案过于具体；保留原message并按code增加“抽取模型当前不可用，可以手工录入要求”，未解析message。修正后typecheck、Lint、90项测试、build、17项E2E及真实流程全部通过。真实模型建议质量按原延后项未验证。

## 2026-11-28 F2.2-T5 发布确认（feature/f2.2-jobs）

- 人工确认硬门槛/来源和权重后，二次确认发布不可变性与新索引任务；使用后端confirm再publish，发布成功刷新精确版本/列表并显示索引状态及任务链接。pending禁重复，网络重试保持同一幂等键。
- typecheck、Lint、90项测试、build、17项E2E通过。发布组件断言网络失败后两个POST同键、提交中按钮禁用；E2E覆盖取消确认、发布任务入口以及编辑发布版得到后端新草稿version2。真实发布在T6执行，无真实模型调用。

## 2026-11-28 F2.2-T4 要求与权重确认（feature/f2.2-jobs）

- 抽取建议只展示，逐条编辑/保存；缺模型直接显示后端不可用原因并允许手工录入。要求包含维度、硬/软、阈值类型/值/单位、权重、优先级，引用由实际文本选择区间或明确选择整段构成，服务端最终校验。来源插值纯文本，不解析HTML。
- 六维权重逐项有限非负预检、不求和/归一化/算分；details.fields在要求/权重字段下显示。已保存要求可编辑/移除；JD变更清除旧建议。要求与权重编辑也具备未保存离开/刷新保护。
- 最终typecheck、Lint、89项测试、build、16项E2E通过；覆盖原文区间、2.75权重原样提交、负值拒绝、字段错误、缺模型继续手工流程。初次格式检查一处Vue格式不符，格式化后通过。真实模型调用未运行，按既定延后；真实无模型岗位流程在T6。

## 2026-11-28 F2.2-T3 JD新建与草稿编辑（feature/f2.2-jobs）

- 新建/编辑表单支持名称、城市、级别、技能、纯文本JD及.txt导入；按后端200000字符限制预检，导入字节上限800000避免无界读取。离开未保存页面/刷新提示，提交失败保留全部输入；字段错误按details.fields定位。编辑发布版调用后端PATCH并使用返回的新版本，不本地改写历史。
- typecheck、Lint、86项测试、build、15项E2E通过，覆盖导入HTML文本、拒绝离开、保存详情及错误字段保留。新增E2E首次格式检查失败后格式化通过。真实岗位发布全链路在T6；抽取/要求/发布尚在后续任务。
- F2.1 develop提交c0192d5的远端CI46076127410实际success。匿名GitHub API查询达到限流，改用既有Git身份读取同仓库运行结果，未打印凭证。

## 2026-11-28 F2.2-T2 岗位列表（feature/f2.2-jobs）

- /jobs显示岗位、版本、发布/索引状态、时间与入口，游标加载更多；未READY标注未参与召回。未知枚举显示通用文案，INDEXING若将来返回则显示索引中，当前后端只有PENDING/READY/FAILED/NOT_REQUESTED。
- typecheck、Lint、85项测试、build、14项E2E通过；组件覆盖失败/待索引/未来枚举。无需真实模型；实际岗位联调在T6执行。

## 2026-11-28 F2.2-T1 岗位接口与契约（feature/f2.2-jobs，进行中）

- F2.1已no-ff合并并推送develop c0192d5及阶段分支；F2.2前fetch后端b2104ea，merge-base核对S2.2合并c50faf9属于origin/develop。快照与SOURCE保持同SHA，未重复提交相同内容。
- 建立岗位列表/详情/版本、创建/草稿编辑/确认/建议/幂等发布API及精确Query缓存失效；类型与请求/响应校验来自生成契约。展示状态允许新增字符串，其他结构仍校验；fixture按原生成契约验证。
- typecheck、Lint、81项测试、build、6项契约专项通过。页面尚未接入，E2E/真实岗位联调在后续任务运行；发布重试复用组件生命周期内键，不把缺模型或索引配置描述为可用。

## 2026-11-28 F2.1-T6 文档与阶段回归（feature/f2.1-resumes，待验收）

- README、架构、API、测试说明同步实现边界，F2.1待验收；缺字段展示留待后端排期，其余T1–T5实现与验证完成。前端详情版本通过查询参数承载，不改变后端接口。
- 最终typecheck、Lint、80项测试、build、14项E2E、5项契约专项通过；45处本地链接和git diff --check通过。真实文件4场景及精确清理见T5，纯文档阶段不重复启动后端。主入口JS gzip93.22kB，非全站性能验收。
- 各任务独立提交，阶段按no-ff合并develop并推送。无新依赖，未修改main/后端仓库文件；真实模型及目标环境仍留统一验收。

## 2026-11-28 F2.1-T5 真实文件联调（feature/f2.1-resumes）

- 14项MSW E2E通过，新增空列表→上传→列表刷新→版本详情流程。真实冒烟4项通过：真实后端PDF/DOCX解析、列表/详情/刷新，扫描PDF和加密PDF明确422原因，拒绝后列表仍为两条。
- 使用后端既有dist及真实控制器/解析子进程、项目数据库；本轮随机owner与前端.smoke-runs专用目录隔离。先核验容器/端口/卷，清理前核验ResourceOperation全部stoppedAt非空，关闭API后精确删除本轮记录和目录；清理成功，无后端文件/迁移/配置修改，无Docker启停。
- 失败保留：首次把四场景合并为一个30秒用例，PDF已201（trace约11秒）并完成详情，DOCX途中父用例超时；拆为四个独立场景串行跑，各自沿用30秒测试与20秒断言、后端15秒解析期限，全部通过。未放宽任何业务请求/解析超时。脚本初次Lint拒绝finally直接throw，调整清理失败返回码；一处新E2E格式再次格式化后Lint通过。typecheck与最终Lint通过。
- 不代表模型语义结构化已联调，本阶段只有文本解析。剩余文件名/解析状态缺字段见T1，交给后端排期，不绕过契约。

## 2026-11-28 F2.1-T4 不可变版本详情（feature/f2.1-resumes）

- 详情入口校验resumeId/versionId，版本通过URL查询参数保留，缺失/非法不发请求；显示原始文件安全元数据、时间、文本块位置和解析警告。稳定锚点block-UUID支持证据定位；DOCX零基编号明确标注，不加页码。不展示结构化字段。
- typecheck、Lint、80项测试、build、13项E2E通过；HTML恶意文本按纯文本显示、稳定锚点/警告/404、版本刷新一致均有验证。首次Lint误判computed内Zod.catch为异步，将Schema构建移出后通过；无规则放宽。真实上传至详情在T5运行。

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
