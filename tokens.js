/* Toki Tokens module — local-first API token / key keeper.
   Loaded by app.js. Exposes window.TokiTokens. */
(() => {
  'use strict';

  const TOKEN_CATS = ['AI API', 'GitHub', '云服务', '数据库', '支付', 'OAuth', '其他'];
  // 分类完全手填：以下是输入建议，不限制可选值
  const CAT_SUGGESTIONS = ['AI API', 'GitHub', '云服务', '数据库', '支付', 'OAuth', '其他'];
  const TOKEN_PRESETS = [
    ['OpenAI', 'openai.com', 'AI API', '#10a37f'],
    ['Anthropic / Claude', 'anthropic.com', 'AI API', '#d97757'],
    ['DeepSeek', 'deepseek.com', 'AI API', '#4d6bfe'],
    ['Moonshot / Kimi', 'moonshot.cn', 'AI API', '#1f1f1f'],
    ['智谱 AI', 'bigmodel.cn', 'AI API', '#3859ff'],
    ['通义千问', 'aliyun.com', 'AI API', '#615ced'],
    ['豆包 / 火山引擎', 'volcengine.com', 'AI API', '#3c6cff'],
    ['OpenRouter', 'openrouter.ai', 'AI API', '#6467f2'],
    ['Gemini', 'google.com', 'AI API', '#4796e3'],
    ['Hugging Face', 'huggingface.co', 'AI API', '#ffb000'],
    ['GitHub', 'github.com', 'GitHub', '#6e40c9'],
    ['Gitee', 'gitee.com', 'GitHub', '#c71d23'],
    ['GitLab', 'gitlab.com', 'GitHub', '#fc6d26'],
    ['Cloudflare', 'cloudflare.com', '云服务', '#f38020'],
    ['Vercel', 'vercel.com', '云服务', '#555555'],
    ['腾讯云', 'cloud.tencent.com', '云服务', '#006eff'],
    ['阿里云', 'aliyun.com', '云服务', '#ff6a00'],
    ['AWS', 'aws.amazon.com', '云服务', '#ff9900'],
    ['Supabase', 'supabase.com', '数据库', '#3fcF8E'],
    ['MongoDB Atlas', 'mongodb.com', '数据库', '#47a248'],
    ['Stripe', 'stripe.com', '支付', '#635bff'],
    ['PayPal', 'paypal.com', '支付', '#003087'],
    ['OAuth / 自定义', '', 'OAuth', '#0a84ff'],
  ];

  let ctx = null;
  let ui = { cat: '全部', revealed: new Set(), sheetTokenId: null };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const DAY = 864e5;
  const CATS = TOKEN_CATS;

  function getState() { return ctx?.getState?.() || ctx?.state || null; }
  function list() {
    const s = getState(); if (!s) return [];
    if (!Array.isArray(s.tokens)) s.tokens = [];
    return s.tokens;
  }
  function toast(msg) { ctx?.toast?.(msg); }
  function save() { ctx?.save?.(); }
  function render() { ctx?.render?.(); }

  function maskValue(v) {
    const s = String(v || '');
    if (s.length <= 8) return '••••••••';
    return s.slice(0, 4) + '••••••••' + s.slice(-4);
  }
  function expiryInfo(t) {
    if (!t.expiresAt) return { text: '不过期', cls: '' };
    const d = t.expiresAt - Date.now();
    if (d < 0) return { text: '已过期', cls: 'expired' };
    if (d < 7 * DAY) return { text: `${Math.ceil(d / DAY)} 天后到期`, cls: 'soon' };
    return { text: new Date(t.expiresAt).toLocaleDateString('zh-CN'), cls: '' };
  }
  function favicon(t) {
    const domain = String(t.domain || '').trim();
    const initial = esc((t.name || 'T').slice(0, 1).toUpperCase());
    // 手动添加的图标（data URL）优先；其余走品牌色 + 域名 favicon
    if (typeof t.icon === 'string' && /^data:image\//.test(t.icon))
      return `<span class="tok-fav" style="--pc:${esc(t.color || '#0a84ff')}"><img src="${esc(t.icon)}" alt=""></span>`;
    if (!domain) return `<span class="tok-fav" style="--pc:${esc(t.color || '#0a84ff')}">${initial}</span>`;
    return `<span class="tok-fav" style="--pc:${esc(t.color || '#0a84ff')}"><img src="https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}" alt="" onerror="this.style.display='none';this.nextSibling&&(this.nextSibling.style.display='grid')"><b style="display:none">${initial}</b></span>`;
  }
  function byPreset(name) { return TOKEN_PRESETS.find(p => p[0].toLowerCase() === String(name || '').toLowerCase()); }
  // 所有网站账号（用于「关联账号」选择），按名称排序
  function allAccounts() {
    const s = getState();
    return Array.isArray(s?.accounts) ? s.accounts.slice().sort((a, b) => zh(a.name, b.name)) : [];
  }
  function accountName(id) { return allAccounts().find(a => a.id === id)?.name || ''; }

  function renderTokens() {
    const root = $('#tokenList');
    if (!root) return;
    const tokens = list();
    const counts = {};
    tokens.forEach(t => { const c = t.category || '其他'; counts[c] = (counts[c] || 0) + 1; });
    // 包含手填的自定义分类
    const cats = [...CATS.filter(c => counts[c]), ...Object.keys(counts).filter(c => !CATS.includes(c)).sort(zh)];
    if (ui.cat !== '全部' && !counts[ui.cat]) ui.cat = '全部';
    const filters = $('#tokenFilters');
    if (filters) filters.innerHTML = ['全部', ...cats].map(c => `<button class="${c === ui.cat ? 'active' : ''}" data-tokcat="${esc(c)}">${esc(c)}${c === '全部' ? ` <small>${tokens.length}</small>` : ` <small>${counts[c]}</small>`}</button>`).join('');
    const shown = ui.cat === '全部' ? tokens.slice().sort((a, b) => zh(a.name, b.name)) : tokens.filter(t => t.category === ui.cat).sort((a, b) => zh(a.name, b.name));
    const sum = $('#tokensSummary');
    if (sum) {
      const exp = tokens.filter(t => t.expiresAt && t.expiresAt < Date.now() + 7 * DAY).length;
      sum.textContent = tokens.length ? `${tokens.length} 条密钥 · ${exp ? `${exp} 条即将到期` : '暂无临期'}` : 'API Key、Access Token、Gist Token 都存在这里';
    }
    if (!shown.length) {
      root.innerHTML = `<div class="empty"><h3>还没有密钥记录</h3><p>添加 API Key、Access Token 或 Gist Token，数据跟随本应用的加密同步一起备份。</p><button class="btn-filled" data-new="token">添加第一条密钥</button></div>`;
      return;
    }
    root.innerHTML = shown.map(t => {
      const revealed = ui.revealed.has(t.id);
      const ex = expiryInfo(t);
      return `<div class="tok-reel" style="--pc:${esc(t.color || '#0a84ff')}">
        <div class="tok-blur"></div>
        ${favicon(t)}
        <div class="tok-main">
          <div class="tok-head"><span class="tok-title">${esc(t.name)}</span><span class="tok-cat">${esc(t.category || '其他')}</span></div>
          <div class="tok-value ${revealed ? 'revealed' : ''}">${revealed ? esc(t.value) : esc(maskValue(t.value))}</div>
          <div class="tok-meta">${t.accountId && accountName(t.accountId) ? `<span class="tok-acc">${esc(accountName(t.accountId))}</span> · ` : ''}${t.domain ? esc(t.domain) + ' · ' : ''}<span class="${ex.cls}">${ex.text}</span>${t.notes ? ' · ' + esc(t.notes.slice(0, 24)) : ''}</div>
        </div>
        <div class="tok-actions">
          <button data-tokcopy="${t.id}" aria-label="复制">${ICON_COPY}</button>
          <button data-toksee="${t.id}" aria-label="${revealed ? '隐藏' : '显示'}">${revealed ? ICON_EYE_OFF : ICON_EYE}</button>
          <button data-tokedit="${t.id}" aria-label="编辑">${ICON_EDIT}</button>
        </div>
      </div>`;
    }).join('');
  }
  const zh = (a, b) => String(a).localeCompare(String(b), 'zh-CN');
  const ICON_COPY = '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  const ICON_EYE = '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const ICON_EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.2A9.9 9.9 0 0 1 12 6c5.9 0 9.5 6 9.5 6a15 15 0 0 1-3.1 3.7M6.5 7.6A15 15 0 0 0 2.5 12s3.6 6 9.5 6a9.7 9.7 0 0 0 4-.9"/><path d="M9.8 9.8a3 3 0 0 0 4.4 4.4"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4ZM14.5 5.5l4 4"/></svg>';

  function tokenForm(existing = null, presetName = '') {
    const t = existing || (() => {
      const p = byPreset(presetName);
      return { id: '', name: p ? p[0] : '', domain: p ? p[1] : '', category: p ? p[2] : TOKEN_CATS[0], color: p ? p[3] : '#0a84ff', value: '', notes: '', expiresAt: 0, accountId: '' };
    })();
    ui.tokenIcon = t.icon || '';
    ui.tokenColor = t.color || '#0a84ff';
    const accounts = allAccounts();
    const catOptions = CAT_SUGGESTIONS.map(c => `<option value="${esc(c)}"></option>`).join('');
    const accOptions = accounts.map(a => `<option value="${esc(a.id)}" ${a.id === t.accountId ? 'selected' : ''}>${esc(a.name)}${a.handle ? ' · ' + esc(a.handle) : ''}</option>`).join('');
    const html = `<div class="sheet-bar"><button data-close>取消</button><span class="t">${existing ? '编辑密钥' : '添加密钥'}</span><button id="tokSaveTop" class="tok-save-top">保存</button></div>
      <input type="file" id="tokIconFile" accept="image/*" hidden>
      <div class="sheet-body">
      <div class="form-hero"><button class="form-hero-icon tok-icon-btn" id="tokIconBtn" aria-label="更换图标" title="点击设置图标">${favicon({ name: t.name || 'T', domain: t.domain, color: t.color, icon: ui.tokenIcon })}</button><h2>${existing ? '编辑密钥' : '添加密钥'}</h2><p>点图标可手动设置 logo；密钥明文默认打码，复制不会写入日志</p></div>
      <div class="sec-title">搜索平台</div>
      <div class="tok-search-wrap">
        <div class="spot-field tok-search-field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><input id="tokPlatformQ" placeholder="搜索平台名，或直接输入名字" autocomplete="off" enterkeyhint="search"></div>
        <div class="tok-preset-wrap" id="tokPresets"></div>
      </div>
      <div class="sec-title">详细信息</div>
      <div class="group">
        <div class="field"><label>名称</label><input id="tokName" value="${esc(t.name)}" placeholder="OpenAI / GitHub PAT" autocomplete="off"></div>
        <div class="field"><label>域名</label><input id="tokDomain" value="${esc(t.domain)}" placeholder="openai.com" autocomplete="off"></div>
        <div class="field"><label>分类</label><input id="tokCategory" list="tokCatList" value="${esc(t.category || '')}" placeholder="手填分类，可自定义" autocomplete="off"><datalist id="tokCatList">${catOptions}</datalist></div>
        <div class="field"><label>密钥</label><input id="tokValue" type="password" value="${esc(t.value)}" placeholder="粘贴 Token / Key" autocomplete="off" spellcheck="false"></div>
        <div class="field"><label>到期日</label><input id="tokExpiry" type="date" value="${t.expiresAt ? new Date(t.expiresAt).toISOString().slice(0, 10) : ''}"></div>
        <div class="field"><label>关联账号</label><select id="tokAccount"><option value="">不关联</option>${accOptions}</select></div>
        <div class="field stack notes-field"><label>备注</label><textarea id="tokNotes" placeholder="用途、权限范围…" spellcheck="false">${esc(t.notes)}</textarea></div>
      </div>
      <p class="hint">到期日只作为提醒，不会在本地或云端存储任何真实密钥以外的信息。</p>
      <div class="tok-form-actions"><button class="btn-filled" data-toksave="1">${existing ? '保存修改' : '添加密钥'}</button>${existing ? '<button class="btn-text destructive" data-tokdelete="' + esc(t.id) + '">删除</button>' : ''}</div>
    </div>`;
    ctx.openSheet(html, { kind: 'token', id: t.id });
    ui.sheetTokenId = existing ? t.id : null;
    setTimeout(() => wireTokenForm(existing), 0);
  }

  // 平台预设的搜索/手添、图标上传、分类随名称联动
  function wireTokenForm(existing) {
    const drawPresets = () => {
      const box = $('#tokPresets'); if (!box) return;
      const q = ($('#tokPlatformQ')?.value || '').trim().toLowerCase();
      const list = q ? TOKEN_PRESETS.filter(p => p[0].toLowerCase().includes(q) || p[1].includes(q)) : [];
      const exact = q && TOKEN_PRESETS.some(p => p[0].toLowerCase() === q);
      box.innerHTML = list.map(p => `<button type="button" class="tok-preset" data-tokpreset="${esc(p[0])}" style="--pc:${p[3]}">${esc(p[0])}</button>`).join('') +
        (q && !exact ? `<button type="button" class="tok-preset tok-preset-custom" data-tokcustom="${esc(q)}"><span class="icon">＋</span> 用“${esc(q)}”</button>` : '') +
        (!q ? `<span class="tok-preset-hint">输入名字搜索平台，或直接手填</span>` : '');
    };
    const qEl = $('#tokPlatformQ');
    if (qEl) qEl.addEventListener('input', drawPresets);
    drawPresets();
    const iconBtn = $('#tokIconBtn'), file = $('#tokIconFile');
    if (iconBtn && file) {
      iconBtn.onclick = () => file.click();
      file.onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        try {
          const v = await (ctx.makeIcon ? ctx.makeIcon(f) : fileToDataUrl(f));
          ui.tokenIcon = v; iconBtn.innerHTML = favicon({ name: $('#tokName')?.value || 'T', domain: $('#tokDomain')?.value, color: '', icon: v });
        } catch { toast('这张图片读不了，换一张试试'); }
      };
    }
  }
  function fileToDataUrl(f) {
    return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  }

  function applyPreset(name) {
    const p = byPreset(name); if (!p) return;
    const set = (id, v) => { const el = $('#' + id); if (el) el.value = v; };
    set('tokName', p[0]); set('tokDomain', p[1]);
    // 分类仍允许手填：仅当当前为空或是预设分类时才跟随平台建议
    const cat = $('#tokCategory'); if (cat && (!cat.value || CAT_SUGGESTIONS.includes(cat.value))) cat.value = p[2];
    ui.tokenColor = p[3];
    const iconBtn = $('#tokIconBtn');
    if (iconBtn && !ui.tokenIcon) iconBtn.innerHTML = favicon({ name: p[0], domain: p[1], color: p[3] });
  }
  function readTokenForm() {
    const name = $('#tokName')?.value.trim();
    const value = $('#tokValue')?.value.trim();
    if (!name || !value) { toast('请填写名称和密钥'); return null; }
    const exp = $('#tokExpiry')?.value;
    return {
      id: ui.sheetTokenId || uid(),
      name, domain: $('#tokDomain')?.value.trim() || '', category: $('#tokCategory')?.value.trim() || '其他',
      color: ui.tokenColor || byPreset(name)?.[3] || '#0a84ff', value,
      expiresAt: exp ? new Date(exp + 'T23:59:59').getTime() : 0,
      notes: $('#tokNotes')?.value.trim() || '',
      accountId: $('#tokAccount')?.value || '',
      icon: ui.tokenIcon || '',
      createdAt: Date.now(), updatedAt: Date.now(),
    };
  }
  function saveToken() {
    const t = readTokenForm(); if (!t) return;
    const arr = list(); const i = arr.findIndex(x => x.id === t.id);
    if (i >= 0) arr[i] = { ...arr[i], ...t }; else arr.unshift(t);
    ctx.closeSheet?.(); save(); render(); toast(i >= 0 ? '密钥已更新' : '密钥已添加');
  }
  function deleteToken(id) {
    const t = list().find(x => x.id === id); if (!t) return;
    ctx.confirmSheet?.(`删除 ${t.name}？`, '删除后几秒内可以撤销，开启同步时会同步到其它设备。', '删除', () => {
      getState().tokens = list().filter(x => x.id !== id);
      ctx.closeSheet?.(); save(); render(); toast('已删除');
    });
  }

  function handleClick(e) {
    const t = e.target.closest('[data-tokcat],[data-new="token"],[data-tokcopy],[data-toksee],[data-tokedit],[data-tokpreset],[data-tokcustom],[data-toksave],#tokSaveTop,[data-tokdelete]');
    if (!t) return false;
    const d = t.dataset;
    if (d.tokcat !== undefined) { ui.cat = d.tokcat; renderTokens(); return true; }
    if (d.new === 'token') { tokenForm(); return true; }
    if (d.tokcopy) {
      const token = list().find(x => x.id === d.tokcopy);
      if (token) navigator.clipboard?.writeText(token.value).then(() => toast('密钥已复制'), () => toast('复制失败'));
      return true;
    }
    if (d.toksee) {
      if (ui.revealed.has(d.toksee)) ui.revealed.delete(d.toksee); else ui.revealed.add(d.toksee);
      renderTokens(); return true;
    }
    if (d.tokedit) {
      const token = list().find(x => x.id === d.tokedit);
      if (token) tokenForm(token);
      return true;
    }
    if (d.tokpreset) { applyPreset(d.tokpreset); return true; }
    if (d.tokcustom !== undefined) {
      // 手填平台：填入名称，若有同名预设则带上域名/分类/颜色，否则纯手填
      const nm = $('#tokName'); if (nm) nm.value = d.tokcustom;
      applyPreset(d.tokcustom);
      const q = $('#tokPlatformQ'); if (q) { q.value = d.tokcustom; }
      return true;
    }
    if (d.toksave !== undefined || t.id === 'tokSaveTop') { saveToken(); return true; }
    if (d.tokdelete) { deleteToken(d.tokdelete); return true; }
    return false;
  }

  function install(options) {
    ctx = options;
    ui = { cat: '全部', revealed: new Set(), sheetTokenId: null };
    document.addEventListener('click', e => { if (handleClick(e)) { e.stopPropagation(); } }, true);
    renderTokens();
  }

  window.TokiTokens = { TOKEN_CATS, TOKEN_PRESETS, render: renderTokens, install, add: () => tokenForm(), edit(id) { const t = list().find(x => x.id === id); if (t) tokenForm(t); }, normalize(t) {
    const p = byPreset(t.name) || {};
    return {
      id: t.id || uid(), name: t.name || '未命名密钥', domain: t.domain || '',
      // 分类完全手填：保留任意用户自定义值
      category: t.category || '其他',
      color: t.color || p[3] || '#0a84ff', value: t.value || '', notes: t.notes || '',
      accountId: t.accountId || '', icon: t.icon || '',
      expiresAt: Number(t.expiresAt) || 0, createdAt: Number(t.createdAt) || Date.now(), updatedAt: Number(t.updatedAt) || Date.now(),
    };
  } };
})();
