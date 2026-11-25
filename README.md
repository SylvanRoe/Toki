<p align="center"><img src="web/icon-512.png" width="112" alt="Toki"></p>
<h1 align="center">Toki</h1>
<p align="center">这个邮箱注册过什么？那个手机号绑了哪些 App？哪些账号正在使用哪些 Token？一眼看清。</p>
<p align="center"><b>账号与 Token 管理 · 本地优先 · 网页 / PWA / Scripting</b></p>
<p align="center"><b>当前版本：1.0.9</b></p>

---

**Toki** 取自 Token 的趣味音译。它用“身份 → 平台 → 密钥”的方式统一收纳邮箱、手机号、第三方登录、网站账号、API Key、Access Token 和 GitHub/Gist Token。

## 它能做什么

- **卡包**：每个邮箱、手机号和第三方登录身份都有自己的颜色与关联计数
- **网站与 App**：内置常用平台，记录具体账号名、域名、自由分类、绑定身份、备注和自定义图标
- **点选添加**：从常用平台或已有账号中选择；同一平台可记录多个具体账号
- **Tokens**：平台与用途名称分开管理，密钥默认打码；有效期默认无限期，也可指定日期
- **精确账号关联**：每条密钥关联到同平台下的具体账号，例如 `GitHub · alice`
- **关系图**：身份 → 平台 → 密钥；同平台只显示一个节点，密钥连线继承所属邮箱/身份颜色
- **隐私模式**：号码、邮箱和账号名一键打码，截图分享更安心
- **深色 / 浅色**：支持系统主题切换
- **加密同步（可选）**：在本机使用同步密码进行 AES-GCM 加密，再保存到自己的 Gitee 或 GitHub 私密 Gist
- **备份与离线**：JSON 导入导出，PWA 与 Scripting 打包版均可离线打开

## 使用方式

### 网页版 / PWA

访问：**https://sylvanroe.github.io/Toki/**

在 iPhone 或 iPad Safari 中打开分享菜单，选择“添加到主屏幕”，即可全屏使用。数据默认保存在当前浏览器；换设备前请开启加密同步或导出 JSON。

### Scripting 版

Scripting 版直接打包同一份 `web/`，由本地 WebView 加载，因此 UI、动画、四页结构、表单和关系图与网页版一致。

[一键导入 Scripting 版](https://www.scripting.fun/import_scripts/?urls=%5B%22https%3A%2F%2Fgithub.com%2FSylvanRoe%2FToki%2Fraw%2Frefs%2Fheads%2Fmain%2FToki.scripting%22%5D)

静态网页资源随脚本安装；同步、在线图标回退和外部链接仍需网络。

## 数据互通

网页和 Scripting 使用相同的导入导出格式：

```json
{
  "app": "toki",
  "version": 3,
  "identities": [],
  "accounts": [],
  "tokens": []
}
```

- `identityIds`：具体网站账号关联的邮箱、手机号或第三方登录身份
- `platform`：密钥所属平台；`name`：用户自定义的密钥用途
- `accountId`：密钥精确关联的具体账号
- `expiresAt: 0`：无限期

## 隐私

- 数据默认只保存在当前设备
- 未开启同步时，不上传身份、账号或密钥数据
- 开启同步后，远端只保存 AES-GCM 加密密文
- Toki 不记录网站密码
- JSON 备份包含完整密钥，请像保管密码一样妥善保管

## 项目结构

```text
.
├── web/                    # 网页 / PWA 与 Scripting 共用的唯一网页源码
├── index.tsx               # Scripting 本地 WebView 包装入口
├── script.json             # Scripting 描述与版本
├── Toki.scripting          # 可直接导入的安装包
├── VERSION
├── CHANGELOG.md
├── RELEASING.md
├── LICENSE
└── README.md
```

## 本地运行

```bash
cd web
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

## 致谢与许可

Toki 的网站端最初源自 [Ckxkx/account-atlas](https://github.com/Ckxkx/account-atlas)。

代码采用 [GPL-3.0](LICENSE)：可以使用、修改和再分发；发布修改版或衍生作品时，必须同样以 GPL-3.0 开源并保留版权与许可声明。内置第三方网站与 App 图标归各自所有者。

---

Made with 🔑 by Toki.
