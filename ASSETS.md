# v5.0 资产导航

本页服务于《神笔马良：奇幻一笔》当前版本的使用、教学和继续制作。文件名中的`v1`、`v2`、`v3`、`v4`有些属于当前复用的图片、影片、组件或构建资料，不代表本仓库另行发布旧版。**任务规则、结尾反馈和新视频接入均以v5文档及源码为准。**

## 故事、课堂与评价

| 资料 | 用途 |
|---|---|
| [四章设计说明](docs/45-v5.0-画卷与神笔重构.md) | 四章的故事目标、神笔玩法、视觉方向与反馈要求。 |
| [教师指南与剧情衔接](docs/46-v5.0-课堂指南与影视衔接.md) | 当前课堂安排、分层建议、完整任务规则、备课方案、五维观察表、人物后果与报告说明。 |
| [可打印教师指南](public/teacher-guide-v5.html) | 与当前指南对应的网页；在本地运行项目后打开，可直接打印。 |
| [四章当前故事与规则数据](src/v5/model.mjs) | 四章开场、对白、任务、新条件、结尾及可计算规则的实际实现。 |
| [当前界面与流程](src/v5/AppV5.jsx) | 听故事、画一画、试办法、说发现、结尾与个人画册的衔接。 |
| [支线创作底稿](docs/35-v3.0-三支线完整剧本.md) | 耕牛、石磨、归航的人物与逐场创作素材；其中数值和判定已有调整，制作当前影片时须对照v5指南。 |
| [文学与教学来源登记](docs/v3-sources.json) | 原作母题和教学依据的来源入口。 |
| [个人画册样例](artifacts/v5.0/student-report.html) | 展示笔迹、图纸、预测、执行结果与交流记录；由自动化测试产生，不是真实学生资料。 |

课堂观察包括：观察与绘画表达、方案与检验、预测与修改、新情境应用、表达与责任。程序核对实际任务结果，师生讨论创意与理由，不把五项加总排名，不按画得像不像或重试次数评价孩子。

## 13个镜头的生产衔接

[当前影视衔接表](docs/46-v5.0-课堂指南与影视衔接.md)已给出每镜时长、画面、对白、互动接点和人物道具连续性：

| 镜组 | 内容 |
|---|---|
| W51—W53 | 溪边发现难处、三种造物显形、试水后的实际后果 |
| C51—C53 | 纸上耕牛、犁路执行、劳动后的休息 |
| M51—M53 | 修磨坊、齿轮传动与出粉、三家商量分配 |
| S51—S53 | 明确归航、画风收帆、真正到岸后的团聚 |
| F51 | 学生作品收入画册，留下明确结束与报告入口 |

这些是**待制作镜头规格**，不是现有成片。统一16:9、24fps、每镜6—8秒；文字、程序数量和学生笔迹由前端或后期叠加。成功画面必须满足实际任务条件；水没到、磨没动或船没靠岸时，不得套用成功镜头。

## 图片与提示词

仓库`public/assets/`保留25张PNG，既有当前四章直接使用的图，也有当前工程复用的制作素材；不能把v5新增的六张说成全部美术。以下按用途列出全部文件。

### 当前画卷与绘画参照

| 图片 | 用途 | 提示词与记录 |
|---|---|---|
| [village-stage.png](public/assets/v5/village-stage.png) | 无人物村庄全景，首页分层舞台 | [stage-asset.json](artifacts/v5.0/stage-asset.json) |
| [maliang-brush.png](public/assets/v5/maliang-brush.png) | 透明马良前景，蓝衣、棕腰带、小发髻 | [maliang-asset.json](artifacts/v5.0/maliang-asset.json) |
| [water-inventions.png](public/assets/v5/water-inventions.png) | 水车、竹槽、蓄水池三种参照 | [water-asset.json](artifacts/v5.0/water-asset.json) |
| [ox-study.png](public/assets/v5/ox-study.png) | 耕牛、窄犁与宽犁参照 | [ox-asset.json](artifacts/v5.0/ox-asset.json) |
| [mill-study.png](public/assets/v5/mill-study.png) | 手摇柄、大小齿轮、进粮与出粉结构 | [mill-asset.json](artifacts/v5.0/mill-asset.json) |
| [sail-study.png](public/assets/v5/sail-study.png) | 木船、窄帆、宽帆与收帆参照 | [sail-asset.json](artifacts/v5.0/sail-asset.json) |

六图的尺寸、用途和人物连续性见[美术清单](docs/48-v5.0-美术素材清单.md)。

### 人物、情境与复用素材

| 图片 | 内容 | 提示词 |
|---|---|---|
| [xiaohe-guide-v1.png](public/assets/xiaohe-guide-v1.png) | 透明小禾陪伴形象 | [companion](art-direction/companion-prompt.txt) |
| [river-survey-v1.png](public/assets/river-survey-v1.png) | 河边观察与清泉情境 | [river](art-direction/river-prompt.txt) |
| [cow-field-v3.png](public/assets/cow-field-v3.png) | 田地、鲁伯与耕牛情境 | [cow](art-direction/v3-cow-prompt.txt) |
| [mill-courtyard-v3.png](public/assets/mill-courtyard-v3.png) | 磨坊庭院与三家人物 | [mill](art-direction/v3-mill-prompt.txt) |
| [court-sea-v1.png](public/assets/court-sea-v1.png) | 公堂与画中海情境 | [court](art-direction/court-prompt.txt) |
| [night-brush-v2.png](public/assets/night-brush-v2.png) | 两段成片中使用的雨夜定帧 | [night-v2](art-direction/night-prompt-v2.txt) |
| [night-brush-v1.png](public/assets/night-brush-v1.png) | 雨夜修订参考稿；当前影片使用上行v2图 | [night](art-direction/night-prompt.txt) |
| [opening-field-v1.png](public/assets/opening-field-v1.png) | 田边开场 | [opening](art-direction/opening-prompt.txt) |
| [worktable-day-v1.png](public/assets/worktable-day-v1.png) | 白昼画桌 | [worktable](art-direction/worktable-prompt.txt) |
| [ink-workshop-v1.png](public/assets/ink-workshop-v1.png) | 墨盘与工坊 | [workshop](art-direction/workshop-prompt.txt) |
| [shared-board-v1.png](public/assets/shared-board-v1.png) | 共用画板与议事 | [shared-board](art-direction/shared-board-prompt.txt) |
| [grain-contract-v1.png](public/assets/grain-contract-v1.png) | 粮袋与契书 | [contract](art-direction/contract-prompt.txt) |
| [paper-bridge-v1.png](public/assets/paper-bridge-v1.png) | 纸桥情境 | [bridge](art-direction/bridge-prompt.txt) |
| [evening-review-v1.png](public/assets/evening-review-v1.png) | 夜晚复盘与收卷 | [evening](art-direction/evening-prompt.txt) |
| [ending-conditions-v1.png](public/assets/ending-conditions-v1.png) | 结尾条件情境 | [ending-conditions](art-direction/ending-conditions-prompt.txt) |
| [classroom-library-v1.png](public/assets/classroom-library-v1.png) | 教室图书角 | [classroom-library](art-direction/classroom-library-prompt.txt) |
| [rain-tools-v1.png](public/assets/rain-tools-v1.png) | 漏斗、竹导管、陶碗近景 | [rain-tools](art-direction/rain-tools-prompt.txt) |
| [hero-scroll-v1.png](public/assets/hero-scroll-v1.png) | 横向封面构图 | [hero](art-direction/hero-prompt.txt) |
| [hero-mobile-v1.png](public/assets/hero-mobile-v1.png) | 竖向封面构图 | [mobile](art-direction/mobile-prompt.txt) |

[正式题名视觉方向稿](art-direction/selected-scroll-v2.png)另存于美术目录。资源尺寸、用途和摘要可参照[assets.json](docs/assets.json)、[v2-assets.json](docs/v2-assets.json)、[v3-assets.json](docs/v3-assets.json)，v5六图采用上表独立记录；不同清单覆盖范围不同，不把某一份当作全部素材清单。

用户参考录屏及其截帧不随仓库分发。图片中的人物和场景负责叙事；水路、齿轮、路线和船帆的Canvas/SVG图是实际操作工具。学生作品保留原始笔迹，不用示范图替换。

## 已有视频、字幕、音频与源工程

| 资源 | 文件 |
|---|---|
| 雨夜得笔，8秒 | [MP4](public/video/v2-night.mp4)、[中文字幕](public/video/v2-night.vtt) |
| 来到溪边，8秒 | [MP4](public/video/v2-river.mp4)、[中文字幕](public/video/v2-river.vtt) |
| 实际成片登记 | [视频清单](public/video/v2-manifest.json)、[回片记录](docs/v2-video-receipts.csv) |
| 可编辑时间轴 | [film-v2/index.html](film-v2/index.html)、[Hyperframes配置](film-v2/hyperframes.json)、[制作依赖](film-v2/package.json) |
| 画面与动效规范 | [film-v2/DESIGN.md](film-v2/DESIGN.md) |
| 中文旁白源音频 | [night-voice.wav](film-v2/assets/night-voice.wav)、[river-voice.wav](film-v2/assets/river-voice.wav) |
| 合成脚本 | [render-v2-films.ps1](scripts/render-v2-films.ps1) |
| 时间轴库说明 | [GSAP-NOTICE.txt](film-v2/assets/GSAP-NOTICE.txt)、[GSAP包信息](film-v2/assets/GSAP-package.json) |

两段影片为本地场景动画与中文旁白合成，1280×720、24fps；`film-v2`是它们的源工程名称。源工程可继续编辑，渲染脚本的本机工具路径需按制作设备配置。没有将未生成的13镜登记为成片。

## 源码、构建与接入

- [package.json](package.json)、[package-lock.json](package-lock.json)：运行依赖、构建和检查命令。
- [src/v5](src/v5/)：当前四章、画纸、功能任务、个人画册、分层画卷和样式。
- [src/spatial](src/spatial/)：立体场景与执行回放。`src/v2`、`src/v3`、`src/v4`中的部分组件和规则仍被当前实现复用，不能按目录名直接删除。
- [src/main.jsx](src/main.jsx)、[server.mjs](server.mjs)、[launch.mjs](launch.mjs)：入口、本地服务和课堂启动。
- [build-v5-guide.mjs](scripts/build-v5-guide.mjs)：从当前教师文档生成可打印网页。
- [.env.example](.env.example)：服务端可选AI配置模板；仓库不包含实际密钥，当前核心教学反馈不依赖外部模型。
- [worker/index.js](worker/index.js)、[prepare-sites-build.mjs](scripts/prepare-sites-build.mjs)：现有Sites构建接入。

源码安装和启动见[首页](README.md)。源码仓库不附带Node运行时或`node_modules`；v5.0 Release课堂包另含本地运行所需内容。

## 验收与页面实拍

| 内容 | 证据入口 |
|---|---|
| 本轮验收说明 | [47号文档](docs/47-v5.0-测试验收.md) |
| 模型检查 | [v5单元输出](artifacts/v5.0/v5-unit-tests.txt)、[完整规则输出](artifacts/v5.0/unit-tests.txt)、[检查源码](tests/v5-model.test.mjs) |
| 四章实际操作与细节 | [browser-validation.json](artifacts/v5.0/browser-validation.json)、[detail-validation.json](artifacts/v5.0/detail-validation.json) |
| 窄屏与中屏布局 | [layout-validation.json](artifacts/v5.0/layout-validation.json) |
| 离线包检查 | [portable-validation.json](artifacts/v5.0/portable-validation.json)、[archive-validation.json](artifacts/v5.0/archive-validation.json) |
| 视觉复核 | [design-qa.md](design-qa.md)；其中参考视频对照图仅用于本机研究，未随仓库收录 |
| 首页与情境 | [首页](artifacts/v5.0/qa-home-final.jpg)、[田间开场](artifacts/v5.0/qa-intro-final.jpg) |
| 桌面与手机任务 | [齿轮](artifacts/v5.0/qa-gears-final.jpg)、[手机归航](artifacts/v5.0/qa-sea-mobile-final-review.jpg)、[手机磨坊](artifacts/v5.0/qa-mill-mobile-final-review.jpg) |
| 结果画册 | [报告截图](artifacts/v5.0/report.jpg)、[离线样例](artifacts/v5.0/student-report.html) |

验收记录描述已有检查，未开展真实小学课堂试教。样例、截图和程序输出不能作为学生学习效果数据。

## 来源与许可

[素材与许可](docs/08-素材与许可.md)说明原作母题、项目创编、图片、字体和运行库来源；[licenses](licenses/)保留依赖许可证，[字体OFL](public/fonts/OFL-MaShanZheng.txt)随字体分发。代码、字体和图标的许可不等于原作文学改编授权。
