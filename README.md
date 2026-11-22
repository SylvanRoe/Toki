<p align="center"><img src="web/icon-512.png" width="112" alt="Toki"></p>
<h1 align="center">Toki</h1>
<p align="center">账号与 Token 管理，一眼看清 · 网页版 + Scripting App + 桌面小组件</p>
<p align="center"><b>Toki</b> 取自 Token 的趣味音译。API Key、Access Token、GitHub/Gist Token 与各类账号，本地优先、统一收纳。</p>

---

## 这是什么

Toki 把两类容易散落的东西放在一起：

- **账号关系**：哪个邮箱、手机号注册/绑定了哪些网站和 App
- **密钥令牌**：AI 工具的 API 地址与密钥、GitHub token、access token、Gist token……

提供两种使用方式，数据格式互通：

| | 网页版 | Scripting App |
|---|---|---|
| 形态 | 纯 HTML/CSS/JS，零依赖，PWA | `index.tsx` 完整四页 App + `widget.tsx` 桌面小组件 |
| 功能 | 卡包 / 网站 / Tokens / 关系图，加密同步 | 卡包 / 网站 / Tokens / 关系图，桌面小组件摘要 |
| 数据 | 浏览器 `localStorage` | App Group 目录 JSON + 脱敏快照 |
| 互通 | 导出 JSON | 导入 JSON / 分享导入 |

## 功能

### 网页版
- **卡包**：邮箱、手机号Wallet 卡片，手机号做成 SIM 卡样式
- **网站与 App**：内置 100+ 常用站点预设图标，点选添加、分类筛选
- **Tokens**：AI API / GitHub / 云服务 / 数据库 / 支付 / OAuth 分类管理，20+ 平台预设
- **打码与复制**：密钥默认 `••••` 打码，点击显示，一键复制不写日志
- **到期提醒**：记录到期日，临期/过期高亮
- **加密同步（可选）**：AES-GCM 端到端加密，存到你自己的 Gitee 或 GitHub 私有 Gist
- **隐私模式 / 深浅色 / 离线 PWA / JSON 导入导出**

### Scripting App
- 四页原生界面：卡包、网站、Tokens、关系图（TabView + iOS 系统控件 + SF Symbols）
- Tokens 增删改、打码/显示、复制、到期提醒
- 桌面小组件：small / medium / large 自适应，显示临期数量 + 最近密钥摘要
- **安全边界**：写进小组件的快照经过脱敏，**只含名称/分类/颜色/到期时间，绝不含任何密钥明文**

## 项目结构

```
.
├── web/                     # 网页版（可直接静态部署 / PWA）
│   ├── index.html
│   ├── app.js               # 卡包/网站/关系图 + 同步
│   ├── tokens.js            # Tokens 模块
│   ├── styles.css
│   ├── sw.js / manifest.webmanifest
│   └── icons/               # 站点预设图标
├── scripting/               # Scripting App 脚本项目（打包为 Toki.scripting）
│   ├── script.json
│   ├── index.tsx            # 四页主界面
│   ├── widget.tsx           # 桌面小组件
│   ├── intent.tsx           # 分享/快捷指令导入入口
│   ├── pages.tsx            # 四个页面
│   ├── components.tsx       # 表单/打码/复制
│   ├── store.ts             # App Group 存储 + 脱敏快照
│   └── types.ts             # 共享数据模型
├── Toki.scripting           # 可一键导入的脚本包（ZIP）
└── README.md
```

## 快速开始

### 网页版
静态托管 `web/` 目录即可（GitHub Pages / 任意静态服务器）：
```bash
cd web && python3 -m http.server 8080
```
浏览器打开 `http://localhost:8080`。iPhone Safari「添加到主屏幕」即可当 App 用。

### Scripting App
1. 下载仓库里的 `Toki.scripting`
2. 用 Scripting App 导入（或点导入链接）
3. 打开 Toki，即可看到四页界面；在桌面添加 Toki 小组件

## 网页 → Scripting 数据互通

小组件运行在独立扩展环境，读不到网页的 `localStorage`，因此需要一个显式的桥：

1. 网页版「更多 → 导出备份」，得到 Toki JSON
2. 把这个 JSON 分享给 Scripting 的 Toki（intent 入口），或在 Toki App 内粘贴导入
3. Toki 写入 App Group 存储，并生成脱敏快照给小组件
4. 小组件读取快照展示（刷新组件即可见）

> 出于安全，导入脚本会保留密钥明文在 App Group 的私有存储里，但**写入小组件快照时刻意剥离 `value` 字段**。

## 数据格式

```json
{
  "app": "toki",
  "version": 2,
  "identities": [{ "id": "", "type": "email|phone|login", "value": "", "label": "", "color": "" }],
  "accounts":  [{ "id": "", "name": "", "domain": "", "category": "", "identityIds": [] }],
  "tokens":    [{ "id": "", "name": "", "domain": "", "category": "", "color": "", "value": "", "expiresAt": 0 }],
  "deleted":   {}
}
```

## 隐私

- 网页版：数据默认只在本机浏览器，不上传；加密同步时云端只有密文
- Scripting：数据存 App Group 私有目录；小组件快照脱敏；不联网、不上报
- 不记录你的同步密码或任何密钥明文到小组件/日志

## 致谢与许可

Toki 的网页版代码最初源自 [Ckxkx/account-atlas](https://github.com/Ckxkx/account-atlas)（GPL-3.0），在其基础上新增 Tokens 模块并重构为独立项目；Scripting 客户端与小组件为 Toki 原创。遵循 GPL-3.0 开源：可自由使用、修改、再分发，衍生作品请同样以 GPL-3.0 开源并保留声明。

Toki 的 Logo 与图标为原创，不使用上游品牌素材。上游的站点图标归各自所有者。

---

Made with 🔑 by Toki.
