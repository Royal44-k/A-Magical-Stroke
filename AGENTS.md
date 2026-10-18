# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 已确认的项目要求（2026-10-12）
正式名称《神笔马良：奇幻一笔》，采用已选第1张流动长卷方案，视觉目标art-direction/selected-scroll-v2.png。小学四至六年级，面向学生使用具体短句、物品和动作，不用抽象制作术语替学生讲道理。保存并遵守：不同操作有真实后果，四结局可修正；首礼照顾自己不扣分；自由画不假称任意图像识别；不用人格/善良评分；所有拖放有点选键盘替代；小禾透明背景、轻微悬停放大，尊重减少动态效果；影片由用户外部生成，场景/分镜/角色/道具须连续；无学生姓名或声音采集；AI接口密钥只在服务端，不假称已联网。不要改动曹冲与虎门项目。

## v2.0 方向纠正（2026-10-14）
用户要求大改：神笔必须以学生亲手作画为核心，画完进入故事并产生可检验的后果；主线每次只突出一件事，叙事走向与小禾引导明确。减少无意义放大、泛滥纸签、长文字和功能堆叠；每项增改说明解决的学生痛点。互动含真实画笔、连点/键盘替代、拖放、拼合、执行小测等，不能仅换按钮文案。允许使用可用插件生成视频并实际嵌入，替代此前视频全部留待用户的限制。保留青绿童话人物连续性，v2.0分数轮验收，老作品不删除。

## v2.1 检验与复盘原则
试水需遍历水源连通分量，不能到田边便停止检查门前；未连上的笔迹不凭空出水。旧记录只读，重看和对照不新增试次、不能改剧情判定。比较画稿要保留当时准备，不能把准备差异误说成画线差异。新增交互优先帮助学生看见原因、修改办法，避免回到静态图放大与文字堆叠。

## v2.2 交接原则
不能把连续点击或纸牌排对冒充实际试做。新交接必须基于当前学生水路，查看三处、提水到田、停水、收齐工具。早停可修补，不用计时排行榜；旧完成记录保留并明确区分新操作。工具拖放必须有点选、键盘途径。

## v3.0 多故事与评价要求（2026-10-15）
现有水路主线命名《一笔清泉》。扩展耕牛、石磨、海上归航三个母题，玩法必须不同。每章有明确收束、结果、可修改入口、师生反馈；个人报告引用实际画稿和执行记录，区分程序可核对的任务与需要教师观察的表达/创意，不以点击、速度、笔画或人格打分。保留旧画卷与历史版本。

## v3.1 全屏与立体交互要求（2026-10-16）
用户提供飞象老师神笔马良资源广场及 sael.net 作为参考。先实际打开公开课件、观察交互再实现，不能把搜索缩略图当完整体验。升级为全屏沉浸式课件，3D必须服务观察与操作，不能用平面图片倾斜冒充真实空间。作画、方向、份数、试水、结局、报告必须仍由同一学习状态驱动；镜头操作不能改学生答案。保留键盘、平面和设备兼容路径。外部资源用于研究，不把未经授权的参考素材或代码打入交付包。新三维场景保持青绿、暖土与纸墨风格；不借模型真实性给学生增添无关制作提示。

## v4.0 学习深度要求（2026-10-16）
面向四至六年级，视觉升级不能替代学习机制。取消一笔通关与只有一个固定答案的低幼问答。学生图纸必须直接影响执行；公开功能标准，允许多个有效方案。每章有预测、执行、可追溯修改、新条件迁移及具体人物后果。程序只核对数量与规则，不自动评创意、理由或人格。保留旧画卷，不用旧通关记录冒充新能力。研究抖音/小红书须如实说明访问与实际体验范围。

## v5.0 用户录屏与四章修订（2026-10-18）
录屏作为新审美依据：深墨留白、矿物青绿朱砂淡金、分层画卷与人物前景；课堂画纸仍需明亮易读。四章全都保留亲手画物和画物入景；第一章精美参照、至少三种造物选择；第二章有工具与路线配合；第三章加入真实传动与资源约束；第四章明确目的地、逐步画帆画风。教材式短句、人物具体动作与因果，不用口号和机械抽象语。新作品独立存档，不覆盖旧卷；笔数不作为能力/创造力或通关判定。角色须延续马良蓝衣、小禾赭红衣。
