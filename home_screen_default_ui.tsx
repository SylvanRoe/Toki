import { Text, VStack, WebView, useEffect, useState } from "scripting"
import { createTokiWebView } from "./webview_bridge"

// 主页 tab：直接加载与网页端完全相同的 Toki 页面（同一份 web/），UI/交互一致。
export default function HomeScreenView() {
  const [controller, setController] = useState<WebViewController | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    let created: WebViewController | null = null
    createTokiWebView()
      .then(c => {
        created = c
        if (alive) setController(c)
      })
      .catch(e => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
      // 卸载 tab 时释放 WebView，避免常驻占用；切换 tab 不会卸载组件，所以不会被误释放
      created?.dispose()
    }
  }, [])

  if (error) {
    return (
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "center" }} padding={24}>
        <Text foregroundStyle="secondaryLabel">Toki 加载失败：{error}</Text>
      </VStack>
    )
  }

  if (!controller) {
    return (
      <VStack frame={{ maxWidth: "infinity", maxHeight: "infinity", alignment: "center" }}>
        <Text foregroundStyle="secondaryLabel">正在打开 Toki…</Text>
      </VStack>
    )
  }

  return (
    <WebView
      controller={controller}
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      navigationBarVisibility="hidden"
      ignoresSafeArea
    />
  )
}
