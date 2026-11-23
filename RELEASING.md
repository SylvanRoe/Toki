# Toki 发版流程

## 单一网页源码

仓库只保留一份 `web/`。网页版 / PWA 直接部署它，Scripting 安装包也直接把它与根目录 `index.tsx`、`script.json` 一起打包，不维护第二份网页快照。

## 每次发版

1. 拉取 `origin/main`，确认工作区干净
2. 完成并验证 `web/` 改动
3. 同步更新根目录 `VERSION`、`script.json` 和 `CHANGELOG.md`
4. 将以下内容打入 `Toki.scripting`：
   - `script.json`
   - `index.tsx`
   - `README.md`
   - `LICENSE`
   - `VERSION`
   - `CHANGELOG.md`
   - 完整 `web/`
5. 校验安装包解出的 `web/` 与仓库唯一 `web/` 逐文件一致
6. 运行 Scripting 本地 WebView，确认四个 Tab、消息桥和 localStorage 持久化
7. 运行敏感信息增量审计
8. 提交并推送 `main`
9. 如 `web/` 有改动，部署同一份 `web/` 到 `gh-pages`
10. 创建版本标签 `vX.Y.Z`

## 回退

- 网页源码：检出目标标签的 `web/`
- Scripting：安装目标标签中的 `Toki.scripting`
- 不覆盖已发布标签；修复后发布新的补丁版本
