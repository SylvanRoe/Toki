import {
  Form, TextField, SecureField, Picker, DatePicker, Button, ToolbarItem, Pasteboard,
} from "scripting"
import { Token, TOKEN_CATEGORIES, uid } from "./types"

export function mask(s: string): string {
  const v = String(s || "")
  if (v.length <= 8) return "••••••••"
  return v.slice(0, 4) + "••••••••" + v.slice(-4)
}

export function maskName(s: string): string {
  const v = String(s || "")
  return v.length <= 2 ? v + "••" : v.slice(0, 2) + "•••" + v.slice(-1)
}

export function expiryLabel(expiresAt: number): { text: string; urgent: boolean } {
  if (!expiresAt) return { text: "不过期", urgent: false }
  const d = expiresAt - Date.now()
  if (d < 0) return { text: "已过期", urgent: true }
  if (d < 7 * 86400000) return { text: `${Math.ceil(d / 86400000)} 天后到期`, urgent: true }
  return { text: new Date(expiresAt).toLocaleDateString("zh-CN"), urgent: false }
}

export type DraftToken = {
  id: string
  name: string
  domain: string
  category: string
  color: string
  value: string
  notes: string
  expiryTs: number
}

export function emptyDraft(): DraftToken {
  return { id: "", name: "", domain: "", category: TOKEN_CATEGORIES[0], color: "#0A84FF", value: "", notes: "", expiryTs: 0 }
}

export function draftFrom(t: Token): DraftToken {
  return {
    id: t.id, name: t.name, domain: t.domain, category: t.category, color: t.color,
    value: t.value, notes: t.notes || "", expiryTs: t.expiresAt || 0,
  }
}

export function draftToToken(d: DraftToken): Token {
  const now = Date.now()
  return {
    id: d.id || uid(), name: d.name || "未命名密钥", domain: d.domain, category: d.category,
    color: d.color || "#0A84FF", value: d.value, notes: d.notes,
    expiresAt: d.expiryTs, createdAt: now, updatedAt: now,
  }
}

/** Token edit/add form. Meant to be shown inside a .sheet modal. */
export function TokenForm({
  draft, onDraft, onSave, onCancel, deleting, onDelete,
}: {
  draft: DraftToken
  onDraft: (d: DraftToken) => void
  onSave: () => void
  onCancel: () => void
  deleting: boolean
  onDelete: () => void
}) {
  const set = (patch: Partial<DraftToken>) => onDraft({ ...draft, ...patch })
  return (
    <Form
      navigationTitle={draft.id ? "编辑密钥" : "添加密钥"}
      toolbar={
        <ToolbarItem placement="topBarTrailing">
          <Button title="保存" action={onSave} buttonStyle="borderedProminent" />
        </ToolbarItem>
      }
    >
      <Section title="基本信息">
        <TextField title="名称" value={draft.name} onChanged={v => set({ name: v })} prompt="OpenAI / GitHub PAT" />
        <TextField title="域名" value={draft.domain} onChanged={v => set({ domain: v })} prompt="openai.com" />
        <Picker title="分类" value={draft.category} onChanged={v => set({ category: v })}>
          {TOKEN_CATEGORIES.map(c => <Text tag={c} key={c}>{c}</Text>)}
        </Picker>
      </Section>
      <Section title="密钥">
        <SecureField title="Token / Key" value={draft.value} onChanged={v => set({ value: v })} prompt="粘贴密钥" />
        <TextField title="备注" value={draft.notes} onChanged={v => set({ notes: v })} axis="vertical" prompt="用途、权限范围、绑定账号…" />
      </Section>
      <Section title="到期提醒">
        <DatePicker title="到期日" value={draft.expiryTs} onChanged={v => set({ expiryTs: v })} displayedComponents={["date"]} />
      </Section>
      <Section>
        <Button title="取消" action={onCancel} />
        {deleting ? <Button title="删除这条密钥" role="destructive" action={onDelete} /> : null}
      </Section>
    </Form>
  )
}

export function copyText(value: string) {
  Pasteboard.setString(value)
}
