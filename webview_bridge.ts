// Toki WebView 共享初始化：index.tsx 与主页 tab 都用它加载同一份 web/，保证 UI 与网页端一致。

export const WEB_ROOT = `${FileManager.scriptsDirectory}/Toki/web`
export const ENTRY = `${WEB_ROOT}/index.html`

export async function createTokiWebView(options?: { onClose?: () => void }): Promise<WebViewController> {
  const webView = new WebViewController({
    allowsContentJavaScript: true,
    preferredContentMode: "mobile",
    javaScriptCanOpenWindowsAutomatically: false,
    suppressesIncrementalRendering: false,
    settings: {
      allowsBackForwardNavigationGestures: false,
      allowsLinkPreview: true,
      isScrollEnabled: true,
      bounces: true,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      isOpaque: true,
      backgroundColor: "#000000",
      underPageBackgroundColor: "#000000",
    },
  })

  await webView.addScriptMessageHandler<any, any>("atlas", async payload => {
    if (payload?.file && typeof payload.text === "string") {
      const data = Data.fromRawString(payload.text)
      if (!data) throw new Error("无法生成备份文件")
      const paths = await DocumentPicker.exportFiles({ files: [{ name: String(payload.file), data }] })
      return { ok: paths.length > 0, paths }
    }
    if (payload?.theme === "light" || payload?.theme === "dark") {
      const color = payload.theme === "light" ? "#F2F2F7" : "#000000"
      await webView.setSettings({ backgroundColor: color, underPageBackgroundColor: color })
      return true
    }
    if (payload?.share && Array.isArray(payload.items)) return ShareSheet.present(payload.items)
    if (payload?.close === true) {
      options?.onClose?.()
      return true
    }
    return null
  })

  const injection = [
    "window.__TOKI_SCRIPTING__ = true;",
    "document.documentElement.classList.add('scripting-app');",
  ]
  // 只在传了 onClose 的场景（独立脚本全屏页）注入：在右上角按钮行末尾加一个 ✕ 关闭按钮，样式与其余 .round 按钮一致。
  // 主页 tab 不传 onClose，就不会出现一个点了没反应的按钮。
  // 用 WebView 用户脚本注入而非改 web/，保证网页版 / gh-pages 完全不受影响。
  if (options?.onClose) {
    injection.push(
      "document.addEventListener('DOMContentLoaded', function () {",
      "  var actions = document.querySelector('.top-bar .top-actions');",
      "  if (!actions || document.getElementById('scriptingClose')) return;",
      "  var btn = document.createElement('button');",
      "  btn.id = 'scriptingClose'; btn.className = 'round';",
      "  btn.setAttribute('aria-label', '关闭 Toki');",
      "  btn.innerHTML = '<svg viewBox=\"0 0 24 24\"><path d=\"M6 6l12 12M18 6 6 18\"/></svg>';",
      "  btn.addEventListener('click', function () {",
      "    window.webkit?.messageHandlers?.atlas?.postMessage({ close: true });",
      "  });",
      "  actions.appendChild(btn);",
      "}, { once: true });",
    )
  }

  await webView.addUserScript({
    source: injection.join("\n"),
    injectionTime: "documentStart",
    forMainFrameOnly: true,
  })

  const loaded = await webView.loadFile(ENTRY, WEB_ROOT)
  if (!loaded) throw new Error("本地网页资源加载失败")
  await webView.waitForLoad({ timeout: 20 })
  return webView
}
