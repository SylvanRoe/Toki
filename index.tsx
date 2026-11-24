import { Navigation, Script, WebView } from "scripting"
import { createTokiWebView } from "./webview_bridge"

async function main() {
  let webView: WebViewController | null = null
  try {
    webView = await createTokiWebView()
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
    webView?.dispose()
    Script.exit()
  }
}

main()
