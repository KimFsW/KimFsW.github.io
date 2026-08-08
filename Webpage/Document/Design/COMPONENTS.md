# pulsepilot 介绍页 · 组件目录

对应文件：`Page/` 下五个页面（`index.html` 主页、`team.html` 成员、`project.html` 项目、`goals.html` 目标、`roadshow.html` 路演），各页样式与脚本内联。设计数值（色彩 / 字级 / 间距 / 断点）以同目录 `DESIGN_SYSTEM.md` 为准。

## 0. 全局基础

| 组件 | 位置 | 说明 |
|---|---|---|
| 设计 Token | CSS `:root` | 色彩 / 圆角 / 字体栈，全站唯一事实源（见 `DESIGN_SYSTEM.md`） |
| 版心容器 | `.wrap` | `max-width: 1120px` + 24px 边距 |
| 入场动效 | `.rev` / `.vis` + `initReveal()` | IntersectionObserver 触发上浮淡入 |

## 1. 导航 Nav

- `.brand` + `.mark`：心电线 logo + 双色队名。
- `.nav-links a`：桌面端页面跳转（≤768px 隐藏）。
- `.nav-toggle` + `#nav-mobile`：移动端汉堡按钮（三横线，常规页面 ≤768px、路演页 ≤840px 出现，点击变 X）＋下拉菜单（`.open` 类控制展开页面链接，JS 联动 `aria-expanded`）；五个页面均提供「路演汇报」与「项目演示」入口，项目演示跳转至 `Project_Document/WatchCareAI/demo/visual/index.html`。
- `.status-pill`：题目状态胶囊，呼吸红点；题目确定后改文案。

## 2. Hero（index.html）

| 子组件 | 选择器 | 职责 |
|---|---|---|
| 眉题 | `.kicker` | 赛事 / 地域定位，左侧红短线 |
| 主标题 | `.wordmark` | pulse + pilot 双色 + `.w-name`「守望 AI」同级大字（无括号、同字级字重、`.3em` 间距），96 / 72 / 52 / 40 四档 |
| 口号 | `.slogan` | 脉搏所指，航向所至。 |
| 定位句 | `.position` | 以产品名开头的一句话简介（目标群体后换行，「守护每一份牵挂」收尾） |
| 跳转按钮 | `.hero-cta` + `.btn` | 四个差异化胶囊链接：团队成员＝墨色描边（`.btn-ink`）、项目介绍＝信号红实填（`.btn-solid`）、参赛目标＝浅红底（`.btn-tint`）、项目演示＝墨色实填（`.btn-demo`，跳转可视化 Demo）；每个按钮文字后带 ↗ 跳转图标（`.btn-ico`，hover 向右上位移） |
| Hero 背景 | `.hero` | `paper-2 → paper` 纵向渐变＋右上角信号红光晕（`radial-gradient`），与正文纯纸色底区分、增强首屏识别性 |

## 2B. 主页章节（index.html `#who` / `#value`）

- 章节骨架：`.section` + `.sec-head`（`.sec-index` mono 编号 + `.sec-title`），与项目页共用同一套样式。
- **我们是谁**（`#who`，编号 01）：`.who-grid` 双列卡片（≤768px 单列）。
  - 左卡「研究阶段」：`.stages` 纵向步骤条——`.stage-dot` 红色圆形编号（32px）＋红→浅渐变连接线（末项隐藏），依次为研发／实验／落地。
  - 右卡「团队组成」：`.pie` SVG 圆饼图（`pathLength="100"`；硕士 75% 信号红 `dasharray="75 25"`、本科 25% 墨色 `dasharray="25 75" dashoffset="25"`），中心 mono 总人数「4 人 · 100%」；`.pie-legend` 图例（色块＋百分比＋人数）。
- **让照护不缺位、让牵挂有回应**（`#value`，编号 02，價值主張章節）：`.value-loop` 四步闭环（实时感知 → 智能识别 → 秒级预警 → 隐私守护），`.value-card` 白底卡片 ＋ `.value-arrow` 红色箭头（≤768px 旋转 90° 转纵向）；底部 `.loop-note` mono 闭环说明。

## 3. 成员卡片 MemberCard（team.html，`renderMembers` 渲染）

- 数据源：`MEMBERS` 数组，改人改字只动这里，卡片自动重渲染。
- `.photo`：4:5 照片窗口，直接从 `Resource/Photos/<id>.jpg` 加载队员照片（`object-fit:cover`）。
- `.badge-lead` / `.badge-member` / `.badge-degree`：队长徽章（红底白字，仅 `lead: true`）／队员徽章（浅粉红，其余成员）／学历徽章（描边样式，硕士＝信号红 `.badge-master`、本科＝墨色 `.badge-bachelor`，`degree` 字段驱动，呼应主页圆饼图配色）。
- `.role`：分工标签（等宽红字）。
- `.edu`：教育经历列表，每条两行——红点引导「**学校** · **学历**」，换行显示专业（红点仅在学校行）；数据为 `{school, degree, major}` 对象，改学历只动 `MEMBERS`。`min-height:63px` 保证各卡学历区等高。
- `.tags`：技能 chips，紧接学历列表；依赖 `.edu` 等高实现各卡标签顶部对齐。
- 照片来源：`Resource/Photos/` 目录按约定文件名（`<id>.jpg`）直接加载，无上传交互。

## 4. 项目介绍组件（project.html，题目内容已回填）

| 组件 | 选择器 | 填入内容 |
|---|---|---|
| 内容窗口 ×2 | `.ph-window` | 项目题目＋一句话简介 / 服务群体（已回填） |
| 功能槽 ×3 | `.feat-slot`（`.no` ＋描述文案） | 核心功能 01–03（已回填） |

## 4B. 现状问题章节与图表（project.html `#problems`，编号 02·B）

- 数据全部来自 `Project_Document/远程照护危机检测项目数据调研与趋势分析报告.md`，图表零依赖（内联 SVG + CSS 条形）。
- 章节骨架：`.chapter`（`.chapter-head` 胶囊编号 + `.chapter-title`）→ `.chapter-lead` 导语 → 图表 → `.chapter-body`（图简介 + `p.bg` 问题背景块）。
- **图表一** `#chart-aging`（`renderAgingChart` 生成 SVG）：中国 60 岁及以上人口 2006–2025 柱状图 + 占比趋势线；改数据只动函数内 `D` 数组。
- **图表二** `#chart-falls`（`renderFallsChart` 生成 SVG）：全球跌倒死亡 2000–2021 堆叠柱（60 岁以上 / 以下）+ 柱顶占比标注。
- **图表三** `.hbars`：儿童跌倒占比横向条形图（纯 HTML/CSS，`--w` 控制宽度，随 `.rev` 入场动画）。
- `.sources`：资料来源引用列表（7 项）+ 整理说明；新增引用直接追加 `<li>`。
- 修改图表数据后须同步核对 `.chart-note` 与正文引用的数值。

## 4C. 影响范围章节（project.html `#impact`，编号 02·C）

- 数据来自 `Project_Document/项目软件企划书_守望AI.md` §2.2 与调研报告，已交叉核验。
- 章节骨架：`.chapter` 胶囊编号 + 标题 → `.chapter-lead` 导语 → `.impact-stats`（每章 4 张数据卡）→ `.chapter-body`（「谁在受影响／影响有多大」双段）。
- `.impact-stat`：mono 28px 深红大数字（`small` 为单位）+ 12.5px 注解；改数据只动 HTML 卡片文字。
- 三个章节：老年人／儿童／照护者与家庭；每章数据卡须与正文数值一一对应。
- `.sources`：资料来源引用列表（10 项）+ 整理说明。

## 4D. 现有方案的不足章节（project.html `#gaps`，编号 02·D）

- 内容整理自 `Project_Document/项目软件企划书_守望AI.md` §2.3。
- 章节骨架：`.chapter` 胶囊编号 + 标题 → `.chapter-lead` 一句话定位 → `.gap-list` 不足清单（双栏、红色 ✕ 前缀）。
- 四个章节：普通家庭摄像头／穿戴设备／单帧·单阈值 AI／纯云端视频分析。
- `.section-concl` 小结：`p.bg` 红左边框块，给出「共同短板 → 守望 AI 的回应」。
- `.sources`：引用列表（5 项）+ 整理说明。

## 5. 参赛目标 GoalColumn（goals.html）

- `.goal-col` ×2：短期（赛事期间）/ 长期（赛事之后）。
- `.goal-list li` + `.box`：复选框视觉；`li.hot` 为已勾选强调项。

## 6. 路演汇报（roadshow.html）

- `.pitch-hero` + `.hero-visual`：参考《守望AI_封面.pptx》的奶油白双栏首屏；左侧为繁体主标题、产品定位、`.hero-product-name` 中英产品名、成员与汇报人信息，右侧复用 `roadshow-cover.png` 居家照护插画；提供「開始匯報」和「體驗產品演示」双入口。
- `#opportunity.market-section`：参考《守望AI_5分鐘商業路演_原風格市場版.pptx》的「强标题 + 关键数字 + 主图 + 来源」版式，替代旧四格数据带与三张痛点卡；以三个 `.data-story` 连续讲述市场现状，避免长段正文。
- `.market-intro`：用两行 CSS Grid 区域让 `MARKET SIGNAL` 单独位于左上，主标题与右侧三行市场结论从同一高度开始；840px 以下改为单栏自然排列。
- `.gap-logic`：参考《守望AI_5分鐘商業路演_PRO.pptx》第 4 页，置于三张详细图表之后；复用 `roadshow-care-gap.png` 作为背景，以「人口老化 + 跌倒负担 + 居家风险」三项等式收束照护缺口，840px 以下纵向排列。
- `#chart-aging` 与 `#chart-falls`：由 `renderMarketCharts` 生成零依赖响应式 SVG，分别呈现中国 60+ 人口（2006–2025）及全球跌倒死亡年龄结构（2000–2021）；数据数组与坐标配置均位于页尾函数内。
- `.child-bars`：七组 CSS 横向条形，呈现全国伤害监测中儿童跌倒／坠落占比（2006–2018）；不同年龄与统计期只用于说明「长期首位」，不得拼接为增长趋势。
- `.story-source`：每张图表的资料来源与口径提示；修改图表数据时须同步核对主数字、`aria-label`、结论短句及来源说明。
- `#solution`：左侧 `.flow` 展示四步事件链，第 02–04 步以 `.ai-mark` 高亮 `AI｜` 标识；右侧 `#phones.solution-phones` 直接复用 Demo 的 `scenes.js` 与 `phones.js`，只展示「锁屏 · Time Sensitive 推送」和「报警处置 · 事件详情」两台 iOS 手机，形成“机制 + 真实操作界面”双栏演示。
- `#edge`：先由 `.solution-gaps` 参考《守望AI_5分鐘商業路演_PRO.pptx》第 5 页，以 2×2 `.gap-route` 对比普通摄像头、穿戴设备、单阈值 AI 与纯云端视频分析，并用 `.gaps-answer` 收束最后一公里；其后 `.why-us-block` 呈现 `03 / WHY US` 及开放接入、隐私优先、解释与闭环三项差异化能力。
- `#business`：参考《守望AI_5分鐘商業路演_PRO.pptx》第 8 页，以三张 `.engine-card` 展示家庭订阅、机构 SaaS、摄像头品牌 SDK 三个收入引擎；家庭收入数字保留 `*情境假设` 标注。
- `#ask`：编号调整为 `05 / THE ASK`，由合作邀请改为产品、技术与商业路径的总结性收束。
- `#roadshow-team`：页面末尾团队介绍区，复用成员页的四人肖像、身份徽章、学历、职责与能力标签结构；采用 `.roadshow-team-grid` 响应式四／二／一列布局。

## 7. 页脚 Footer

- `.foot-brand` / `.foot-slogan` / `.foot-meta` / `.foot-line`。
- `.foot-nav`：页脚页面跳转链接（五个页面均含「路演汇报」与「项目演示」入口，当前页 `.active` 反白），墨色底上置中于品牌与元信息之间。
- 墨色底反白文字，心电红点缀。

## 8. 响应式与无障碍

- 断点：1024px（卡片 2 列、统计 2×2、影响统计 2 列）、768px（导航 56px、隐藏桌面导航链接并切换为汉堡菜单、不足清单单栏、主页 who-grid 单列、value-loop 纵向）、640px（全单列、圆饼图与图例纵向排列）。
- `prefers-reduced-motion`：全局动效降级。
- 照片窗口支持键盘 Enter / Space 触发上传，`aria-label` 完备。

## 9. 扩展指引

- 新增板块：复用 `.section` + `.sec-head` 结构，`.sec-index` 递增（04 …）；同页内附加章节可用 `02·B` 式子编号。
- 题目回填进度：`.ph-window` 与 `.feat-slot` 已填入正式内容；痛点表已整体移除，现状问题（`#problems`）、影响范围（`#impact`）、现有方案的不足（`#gaps`）三个分析章节均已回填。
- 新增成员：向 `MEMBERS` 数组追加一个对象即可，无需改渲染逻辑。
