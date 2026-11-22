import {
  TabView, Tab, NavigationStack, Text, HStack, Spacer, Image, Button,
  ToolbarItem, useState, useEffect, Script, Navigation, Safari, Dialog, Pasteboard,
} from "scripting"
import { TokiState, Token } from "./types"
import { loadState, saveState, importPayload, exportPayload, writeSnapshot } from "./store"
import {
  DraftToken, emptyDraft, draftFrom, draftToToken, TokenForm,
} from "./components"
import { WalletPage, SitesPage, TokensPage, GraphPage } from "./pages"

function App() {
  const [state, setState] = useState<TokiState>(() => loadState())
  const [tab, setTab] = useState(0)
  const [draft, setDraft] = useState<DraftToken | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [alert, setAlert] = useState<string | null>(null)

  const commit = (next: TokiState) => {
    setState(next)
    saveState(next) // writes the de-identified widget snapshot too
  }

  useEffect(() => {
    // Ensure the widget snapshot exists on first launch.
    writeSnapshot(state)
  }, [])

  const openAdd = () => setDraft(emptyDraft())
  const openEdit = (t: Token) => setDraft(draftFrom(t))

  const saveDraft = () => {
    if (!draft) return
    if (!draft.name.trim() || !draft.value.trim()) {
      setAlert("请填写名称和密钥")
      return
    }
    const token = draftToToken(draft)
    const exists = state.tokens.some(t => t.id === token.id)
    const tokens = exists
      ? state.tokens.map(t => (t.id === token.id ? token : t))
      : [token, ...state.tokens]
    commit({ ...state, tokens })
    setDraft(null)
  }

  const deleteDraft = () => {
    if (!draft || !draft.id) return
    commit({ ...state, tokens: state.tokens.filter(t => t.id !== draft.id) })
    setDraft(null)
  }

  const toggleReveal = (id: string) => {
    const next = new Set(revealed)
    if (next.has(id)) next.delete(id); else next.add(id)
    setRevealed(next)
  }

  const importData = async () => {
    try {
      const pasted = await Pasteboard.string()
      if (!pasted) { setAlert("剪贴板里没有 Toki 备份 JSON"); return }
      const next = importPayload(pasted)
      commit(next)
      setAlert(`已导入 ${next.tokens.length} 条密钥`)
    } catch {
      setAlert("导入失败：不是有效的 Toki 备份")
    }
  }

  const exportData = async () => {
    await Pasteboard.setString(exportPayload(state))
    setAlert("备份 JSON 已复制到剪贴板")
  }

  return (
    <NavigationStack>
      <TabView tabIndex={tab} onTabIndexChanged={setTab}>
        <Tab title="卡包" systemImage="creditcard" value={0}>
          <WalletPage state={state} refresh={() => writeSnapshot(state)} />
        </Tab>
        <Tab title="网站" systemImage="safari" value={1}>
          <SitesPage state={state} />
        </Tab>
        <Tab title="Tokens" systemImage="key.fill" value={2}>
          <TokensPage
            state={state}
            onAdd={openAdd}
            onEdit={openEdit}
            onToggleReveal={toggleReveal}
            revealed={revealed}
          />
        </Tab>
        <Tab title="关系" systemImage="network" value={3}>
          <GraphPage state={state} />
        </Tab>
      </TabView>

      <HStack
        toolbar={
          <ToolbarItem placement="topBarLeading">
            <Button title="导入" systemImage="square.and.arrow.down" action={importData} />
          </ToolbarItem>
        }
      >
        <Button title="导入备份" action={importData} />
        <Spacer />
        <Button title="导出备份" action={exportData} />
      </HStack>

      <Text
        alert={{
          title: "Toki",
          isPresented: alert !== null,
          onChanged: v => { if (!v) setAlert(null) },
          actions: <Button title="好" action={() => setAlert(null)} />,
          message: alert ? <Text>{alert}</Text> : undefined,
        }}
      />

      {draft ? (
        <Text
          sheet={{
            isPresented: true,
            onChanged: v => { if (!v) setDraft(null) },
            content: (
              <TokenForm
                draft={draft}
                onDraft={setDraft}
                onSave={saveDraft}
                onCancel={() => setDraft(null)}
                deleting={!!draft.id}
                onDelete={deleteDraft}
              />
            ),
          }}
        />
      ) : null}
    </NavigationStack>
  )
}

Navigation.present(<App />)
Script.exit()
