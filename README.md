<p align="center"><img src="web/icon-512.png" width="112" alt="Toki"></p>
<h1 align="center">Toki</h1>
<p align="center">账号与 Token 管理，一眼看清 · 本地优先的网页版 / PWA</p>
<p align="center"><b>Toki</b> 取自 Token 的趣味音译。API Key、Access Token、GitHub/Gist Token 与各类账号，本地优先、统一收纳。</p>
<p align="center"><a href="https://sylvanroe.github.io/Toki/"><b>打开 Toki 网页版</b></a></p>

---

## 当前状态

本仓库目前**只维护网站端**。旧的 Scripting 实现已移除；等网页功能和数据模型稳定后，再以当前网站端为准重新迁移、重写原生客户端与小组件。

## 功能

- **卡包**：统一管理邮箱、手机号与第三方登录身份
- **网站与 App**：记录账号名、分类、绑定身份及备注；支持预设搜索和自定义图标
- **Tokens**：平台与密钥名称分开管理；密钥可自定义用途名称，并支持分类、打码显示、复制和到期提醒
- **账号关联**：先选平台，再从同平台账号中精确选择，例如 `GitHub · alice`；支持同一平台多个账号
- **关系图**：以“身份 → 平台 → 密钥”三列显示；同平台的多个具体账号聚合为一个节点（例如两个 GitHub 账号只显示一个 GitHub），每条密钥仍精确对应具体账号并沿用其邮箱/身份颜色；未关联具体账号的密钥不进入关系图
- **加密同步（可选）**：AES-GCM 端到端加密，密文可保存到自己的 Gitee 或 GitHub 私有 Gist
- **隐私模式 / 深浅色 / 离线 PWA / JSON 导入导出**

## 快速开始

### 在线使用

访问：**https://sylvanroe.github.io/Toki/**

在 iPhone Safari 中选择“添加到主屏幕”，即可作为 PWA 使用。

### 本地运行

项目是零依赖的纯 HTML/CSS/JS 静态站点：

```bash
cd web
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

## 项目结构

```text
.
├── web/
│   ├── index.html
│   ├── app.js               # 卡包、网站账号、关系图与加密同步
│   ├── tokens.js            # Token 管理、账号关联与平台联想
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   ├── icon.png / icon-512.png / logo.svg
│   └── icons/               # 内置站点图标
├── LICENSE
└── README.md
```

## 数据模型

```json
{
  "identities": [
    { "id": "", "type": "email|phone|login", "value": "", "label": "", "color": "" }
  ],
  "accounts": [
    { "id": "", "name": "", "handle": "", "domain": "", "category": "", "identityIds": [] }
  ],
  "tokens": [
    { "id": "", "platform": "GitHub", "name": "博客部署 PAT", "domain": "github.com", "category": "GitHub", "value": "", "accountId": "", "expiresAt": 0 }
  ],
  "deleted": {}
}
```

- `identityIds` 让一个网站账号关联一个或多个邮箱、手机号、第三方登录身份。
- `platform` 是平台名称，用于默认 logo、域名和账号匹配；`name` 是用户自定义的密钥用途名称。
- `accountId` 让一条 Token 精确关联到某个网站账号，能区分同一平台下的多个账号。旧数据没有 `platform` 时会按域名或旧名称自动推断。
- 导出备份会包含完整数据；请像保管密码一样妥善保管备份文件。

## 隐私

- 数据默认仅保存在当前浏览器的 `localStorage` 中。
- 未开启同步时，不上传账号或密钥数据。
- 开启同步后，远端仅保存经 AES-GCM 加密的密文。
- 密钥默认打码显示；复制操作不会写入应用日志。

## 致谢与许可

Toki 的网站端代码最初源自 [Ckxkx/account-atlas](https://github.com/Ckxkx/account-atlas)（GPL-3.0），并在其基础上新增 Tokens、具体账号关联和三列关系图等功能。项目遵循 GPL-3.0：可自由使用、修改和再分发，衍生作品请同样以 GPL-3.0 开源并保留声明。

Toki 的 Logo 与图标为原创；内置站点图标归各自所有者。

---

Made with 🔑 by Toki.
