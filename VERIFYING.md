# 最新版交付校验

本仓库只发布《神笔马良：奇幻一笔》v5.0。完整文件清单见 [asset-manifest.json](catalog/asset-manifest.json)，表格见 [asset-manifest.csv](catalog/asset-manifest.csv)。

在仓库根目录执行 `node scripts/verify-archive.mjs`，逐一检查文件大小和 SHA-256。更新文件后可执行 `node scripts/build-asset-catalog.mjs` 重建清单。清单自身与发布回执不计入自身摘要。

运行与资源检查见 [repository-validation.json](catalog/repository-validation.json)。课堂原包及其 SHA-256 文件仅在 [v5.0 Release](https://github.com/Royal44-k/A-Magical-Stroke/releases/tag/v5.0) 提供；原包保持本地成包时的字节。GitHub 自动生成的 Source code 为本仓库源码快照，不带课堂包内的 Node 运行时。

最终上传回执见 [publication.json](catalog/publication.json)，记录内容提交、文件树、唯一版本与服务器校验摘要。该回执在发布核验后写入。
