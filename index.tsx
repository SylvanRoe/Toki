import { Navigation, Script, WebView } from "scripting"

const WEB_ROOT = `${FileManager.scriptsDirectory}/Toki/web`
const ENTRY = `${WEB_ROOT}/index.html`

async function main() {
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

  try {
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
      return null
    })

    await webView.addUserScript({
      source: "window.__TOKI_SCRIPTING__ = true; document.documentElement.classList.add('scripting-app');",
      injectionTime: "documentStart",
      forMainFrameOnly: true,
    })

    const loaded = await webView.loadFile(ENTRY, WEB_ROOT)
    if (!loaded) throw new Error("本地网页资源加载失败")
    await webView.waitForLoad({ timeout: 20 })
    await Navigation.present({
      element: (
        <WebView
          controller={webView}
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          navigationBarVisibility="hidden"
          ignoresSafeArea
        />
      ),
      modalPresentationStyle: "fullScreen",
      swipeBackBehavior: "dismiss",
    })
  } catch (error) {
    await Dialog.alert({ title: "Toki 无法打开", message: error instanceof Error ? error.message : String(error) })
  } finally {
    webView.dispose()
    Script.exit()
  }
}

main()
