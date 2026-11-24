import { Navigation, Script, WebView } from "scripting"
import { createTokiWebView } from "./webview_bridge"

function TokiPage({ controller, closeRef }: {
  controller: WebViewController
  closeRef: { current: (() => void) | null }
}) {
  const dismiss = Navigation.useDismiss()
  closeRef.current = dismiss
  return (
    <WebView
      controller={controller}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      navigationBarVisibility="hidden"
      ignoresSafeArea
    />
  )
}

async function main() {
  let webView: WebViewController | null = null
  const closeRef: { current: (() => void) | null } = { current: null }
  try {
    webView = await createTokiWebView({ onClose: () => closeRef.current?.() })
    await Navigation.present({
      element: <TokiPage controller={webView} closeRef={closeRef} />,
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
