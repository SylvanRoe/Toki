import {
  List, Section, ForEach, Text, HStack, VStack, Spacer, Image, Button,
  ToolbarItem, Form, TextField, SecureField, Picker, DatePicker,
} from "scripting"
import {
  TokiState, Identity, Account, Token, TOKEN_CATEGORIES, ACCOUNT_CATEGORIES, uid,
} from "./types"
import { mask, maskName, expiryLabel, copyText } from "./components"

// ---------------- 卡包 ----------------
export function WalletPage({ state, refresh }: { state: TokiState; refresh: () => void }) {
  const kinds: Array<{ type: Identity["type"]; title: string; icon: string }> = [
    { type: "email", title: "邮箱", icon: "envelope" },
    { type: "phone", title: "手机号", icon: "phone" },
    { type: "login", title: "登录账号", icon: "person.crop.circle" },
  ]
  return (
    <List
      navigationTitle="卡包"
      listStyle="insetGrouped"
    >
      <Section title="概览">
        <HStack>
          <Image systemName="envelope" foregroundStyle="accentColor" />
          <Text>{state.identities.length} 个身份 · {state.accounts.length} 个网站</Text>
        </HStack>
      </Section>
      {kinds.map(k => {
        const items = state.identities.filter(i => i.type === k.type)
        if (!items.length) return null
        return (
          <Section title={k.title} key={k.type}>
            <ForEach data={items}>
              {(it: Identity) => (
                <HStack spacing={10}>
                  <Image systemName={k.icon} foregroundStyle={it.color} />
                  <VStack alignment="leading" spacing={2}>
                    <Text bold lineLimit={1}>{it.label || k.title}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>{maskName(it.value)}</Text>
                  </VStack>
                  <Spacer />
                  <Button title="复制" systemImage="doc.on.doc" action={() => copyText(it.value)} />
                </HStack>
              )}
            </ForEach>
          </Section>
        )
      })}
    </List>
  )
}

// ---------------- 网站与 App ----------------
export function SitesPage({ state }: { state: TokiState }) {
  const cats = ACCOUNT_CATEGORIES.filter(c => state.accounts.some(a => a.category === c))
  return (
    <List navigationTitle="网站与 App" listStyle="insetGrouped">
      {cats.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">还没有网站记录。打开网页版添加后，数据可导入到此处。</Text>
        </Section>
      ) : cats.map(c => (
        <Section title={c} key={c}>
          <ForEach data={state.accounts.filter(a => a.category === c)}>
            {(a: Account) => (
              <HStack spacing={10}>
                <Image systemName="globe" foregroundStyle="accentColor" />
                <VStack alignment="leading" spacing={2}>
                  <Text bold lineLimit={1}>{a.name}</Text>
                  <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1}>{a.domain || a.handle || ""}</Text>
                </VStack>
                <Spacer />
                <Text font="caption2" foregroundStyle="tertiaryLabel">{a.identityIds.length} 个身份</Text>
              </HStack>
            )}
          </ForEach>
        </Section>
      ))}
    </List>
  )
}

// ---------------- Tokens ----------------
export function TokensPage({
  state, onAdd, onEdit, onToggleReveal, revealed,
}: {
  state: TokiState
  onAdd: () => void
  onEdit: (t: Token) => void
  onToggleReveal: (id: string) => void
  revealed: Set<string>
}) {
  const tokens = state.tokens.slice().sort((a, b) => (a.expiresAt || Infinity) - (b.expiresAt || Infinity))
  return (
    <List
      navigationTitle="Tokens"
      listStyle="insetGrouped"
      toolbar={
        <ToolbarItem placement="topBarTrailing">
          <Button title="添加" systemImage="plus" action={onAdd} />
        </ToolbarItem>
      }
    >
      <Section title="概览">
        <HStack>
          <Image systemName="key.fill" foregroundStyle="accentColor" />
          <Text>{tokens.length} 条密钥</Text>
          <Spacer />
          <Text foregroundStyle="secondaryLabel">{tokens.filter(t => expiryLabel(t.expiresAt).urgent).length} 条需留意</Text>
        </HStack>
      </Section>
      {tokens.length === 0 ? (
        <Section>
          <Text foregroundStyle="secondaryLabel">还没有密钥。点右上角 + 添加，或从网页版导入。</Text>
        </Section>
      ) : (
        <Section title="全部密钥">
          <ForEach data={tokens}>
            {(t: Token) => {
              const ex = expiryLabel(t.expiresAt)
              const shown = revealed.has(t.id)
              return (
                <HStack spacing={10}>
                  <Image systemName="key.fill" foregroundStyle={ex.urgent ? "systemOrange" : t.color} />
                  <VStack alignment="leading" spacing={2}>
                    <Text bold lineLimit={1}>{maskName(t.name)}</Text>
                    <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={1} monospaced={shown}>
                      {shown ? t.value : mask(t.value)}
                    </Text>
                    <Text font="caption2" foregroundStyle={ex.urgent ? "systemOrange" : "tertiaryLabel"}>
                      {t.category} · {ex.text}
                    </Text>
                  </VStack>
                  <Spacer />
                  <Button title="显示/隐藏" systemImage={shown ? "eye.slash" : "eye"} action={() => onToggleReveal(t.id)} />
                  <Button title="复制" systemImage="doc.on.doc" action={() => copyText(t.value)} />
                  <Button title="编辑" systemImage="square.and.pencil" action={() => onEdit(t)} />
                </HStack>
              )
            }}
          </ForEach>
        </Section>
      )}
    </List>
  )
}

// ---------------- 关系图（列表式表达身份→网站关联） ----------------
export function GraphPage({ state }: { state: TokiState }) {
  const identityById = (id: string) => state.identities.find(i => i.id === id)
  return (
    <List navigationTitle="关系图" listStyle="insetGrouped">
      <Section title="说明">
        <Text font="caption" foregroundStyle="secondaryLabel">每个身份关联了哪些网站。点击网页版可查看可视化连线图。</Text>
      </Section>
      <ForEach data={state.identities}>
        {(id: Identity) => {
          const linked = state.accounts.filter(a => a.identityIds.includes(id.id))
          return (
            <Section title={id.label || maskName(id.value)} key={id.id}>
              {linked.length === 0 ? (
                <Text font="caption" foregroundStyle="tertiaryLabel">暂无关联网站</Text>
              ) : linked.map(a => (
                <HStack key={a.id}>
                  <Image systemName="link" foregroundStyle="accentColor" />
                  <Text lineLimit={1}>{a.name}</Text>
                  <Spacer />
                  <Text font="caption2" foregroundStyle="secondaryLabel">{a.category}</Text>
                </HStack>
              ))}
            </Section>
          )
        }}
      </ForEach>
    </List>
  )
}
