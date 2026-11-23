# Toki 发版流程

网页版与 Scripting 版从 1.0.1 起同步发行，版本号必须一致。

## 单一事实来源

- `web/` 是 UI、业务逻辑和数据模型的唯一源版本
- `scripting/index.tsx` 只提供本地 WebView 与 Scripting 原生文件导出桥
- `scripting/web/` 是发版时从 `web/` 生成的只读快照，不单独修改

## 每次发版

1. 拉取 `origin/main`，确认工作区干净
2. 完成并验证 `web/` 改动
3. 将版本号写入根目录 `VERSION` 和 `scripting/script.json`
4. 删除旧 `scripting/web/`，完整复制当前 `web/` 到 `scripting/web/`
5. 更新根 README、`scripting/README.md` 和 `CHANGELOG.md`
6. 将 `scripting/` 目录内容打成 `Toki.scripting`（ZIP，包根必须直接包含 `script.json` 与 `index.tsx`）
7. 校验：
   - `scripting/web/` 与 `web/` 逐文件哈希一致
   - `Toki.scripting` 解包后与 `scripting/` 一致
   - Scripting 本地 WebView 可加载、四个 Tab 存在、localStorage 可持久化
   - 推送前敏感信息增量审计为 0
8. 提交并推送 `main`
9. 部署同一份 `web/` 到 `gh-pages`
10. 创建并推送标签 `vX.Y.Z`

## 回退

- 网页源码：检出目标标签的 `web/`
- Scripting：安装目标标签中的 `Toki.scripting`
- 不覆盖旧标签；修复后发布新补丁版本
