/* Toki Tokens module — local-first API token / key keeper.
   Loaded by app.js. Exposes window.TokiTokens. */
(() => {
  'use strict';

  const TOKEN_CATS = ['AI API', 'GitHub', '云服务', '数据库', '支付', 'OAuth', '其他'];
  // 分类完全手填：以下是输入建议，不限制可选值
  const CAT_SUGGESTIONS = ['AI API', 'GitHub', '云服务', '数据库', '支付', 'OAuth', '其他'];
  const TOKEN_PRESETS = [
    ['ChatGPT', 'chatgpt.com', 'AI API', '#10a37f'],
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
    if (!t.expiresAt) return { text: '无限期', cls: '' };
    const d = t.expiresAt - Date.now();
    if (d < 0) return { text: '已过期', cls: 'expired' };
    if (d < 7 * DAY) return { text: `${Math.ceil(d / DAY)} 天后到期`, cls: 'soon' };
    return { text: new Date(t.expiresAt).toLocaleDateString('zh-CN'), cls: '' };
  }
  const normKey = s => { const d = ctx?.cleanDomain?.(s) || String(s || '').trim().toLowerCase(); return d.replace(/^www\./, ''); };
  function byPreset(name) { return TOKEN_PRESETS.find(p => p[0].toLowerCase() === String(name || '').toLowerCase()); }
  function presetFor(t = {}) {
    const platform = String(t.platform || '').trim().toLowerCase(), domain = normKey(t.domain), oldName = String(t.name || '').trim().toLowerCase();
    return TOKEN_PRESETS.find(p => (platform && p[0].toLowerCase() === platform) || (domain && normKey(p[1]) === domain) || (!platform && oldName && p[0].toLowerCase() === oldName));
  }
  // 旧 token 没有 platform：优先按 domain / 旧 name 推断，不破坏原 name
  function platformOf(t = {}) { return String(t.platform || presetFor(t)?.[0] || '').trim(); }
  function visualOf(t = {}) { const p = presetFor(t); return { ...t, name: platformOf(t) || t.name || '自定义平台', domain: t.domain || p?.[1] || '', color: t.color || p?.[3] || '#0a84ff' }; }
  function favicon(t, size = '') {
    const v = visualOf(t);
    const custom = ctx?.customIcon?.(v);
    if (custom) return `<span class="icon fav full ${size}"><img alt="" loading="lazy" decoding="async" width="64" height="64" src="${esc(custom)}"></span>`;
    if (ctx?.favIcon) return ctx.favIcon(v, size);
    const domain = String(v.domain || '').trim(), initial = esc((v.name || 'T').slice(0, 1).toUpperCase());
    if (!domain) return `<span class="tok-fav" style="--pc:${esc(v.color)}">${initial}</span>`;
    return `<span class="tok-fav" style="--pc:${esc(v.color)}"><img src="https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}" alt="" onerror="this.style.display='none';this.nextSibling&&(this.nextSibling.style.display='grid')"><b style="display:none">${initial}</b></span>`;
  }
  function allAccounts() {
    const s = getState();
    return Array.isArray(s?.accounts) ? s.accounts.slice().sort((a, b) => zh(a.name, b.name)) : [];
  }
  const normName = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  function accountPlatformOptions() {
    const groups = new Map(), presets = ctx?.PRESETS || [];
    for (const account of allAccounts()) {
      const domain = normKey(account.domain), name = String(account.name || '').trim();
      let preset = null;
      if (domain) {
        const matches = presets.filter(p => { const pd = normKey(p[1]); return pd && (domain === pd || domain.endsWith('.' + pd)); });
        if (matches.length) preset = matches.sort((a, b) => normKey(b[1]).length - normKey(a[1]).length)[0];
      } else preset = presets.find(p => normName(p[0]) === normName(name)) || null;
      const key = preset ? `preset:${normKey(preset[1])}` : domain ? `domain:${domain}` : `name:${normName(name) || account.id}`;
      let group = groups.get(key);
      if (!group) {
        group = { key, name: name || preset?.[0] || '未命名平台', domain: domain || preset?.[1] || '', category: account.category || preset?.[2] || '其他', color: ctx?.brand?.(account) || preset?.[3] || '#0a84ff', icon: account.icon || '', accounts: [] };
        groups.set(key, group);
      }
      group.accounts.push(account);
      if (!group.icon && account.icon) group.icon = account.icon;
    }
    return [...groups.values()].sort((a, b) => zh(a.name, b.name));
  }
  function accountName(id) { const a = allAccounts().find(x => x.id === id); return a ? a.name + (a.handle ? ' · ' + a.handle : '') : ''; }
  function platformAccounts(t = {}) {
    const platform = platformOf(t), p = presetFor(t), words = platform.toLowerCase().split(/[\/·（）()\-]+/).map(x => x.trim()).filter(x => x.length > 2 && !['api','cloud'].includes(x));
    const domains = new Set([normKey(t.domain || p?.[1])].filter(Boolean));
    for (const ap of (ctx?.PRESETS || [])) {
      const an = String(ap[0] || '').toLowerCase();
      if (words.some(w => an.includes(w) || w.includes(an))) domains.add(normKey(ap[1]));
    }
    return allAccounts().filter(a => {
      const ad = normKey(a.domain), an = String(a.name || '').toLowerCase();
      return (ad && [...domains].some(d => ad === d || ad.endsWith('.' + d) || d.endsWith('.' + ad))) || words.some(w => an.includes(w) || w.includes(an));
    });
  }

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
      const platform = platformOf(t) || '自定义平台';
      return `<div class="tok-reel" style="--pc:${esc(t.color || presetFor(t)?.[3] || '#0a84ff')}">
        <div class="tok-blur"></div>
        ${favicon(t)}
        <div class="tok-main">
          <div class="tok-head"><span class="tok-title">${esc(t.name || `${platform} 密钥`)}</span><span class="tok-cat">${esc(platform)}</span></div>
          <div class="tok-value ${revealed ? 'revealed' : ''}">${revealed ? esc(t.value) : esc(maskValue(t.value))}</div>
          <div class="tok-meta">${t.accountId && accountName(t.accountId) ? `<span class="tok-acc">${esc(accountName(t.accountId))}</span> · ` : ''}${esc(t.category || '其他')} · <span class="${ex.cls}">${ex.text}</span>${t.notes ? ' · ' + esc(t.notes.slice(0, 24)) : ''}</div>
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

  const TOKEN_POPULAR = ['GitHub', 'ChatGPT', 'OpenAI', 'Anthropic / Claude', 'DeepSeek', 'OpenRouter', 'Gemini', 'Cloudflare', 'Vercel', 'AWS', 'Supabase', 'Gitee', 'GitLab'];

  function normalizeToken(t = {}, fresh = false) {
    const p = presetFor(t);
    const platform = String(t.platform || p?.[0] || (t.domain ? t.name || '' : '')).trim();
    return {
      id: t.id || (fresh ? '' : uid()),
      platform,
      name: t.name || (fresh ? '' : '未命名密钥'),
      domain: t.domain || p?.[1] || '',
      category: t.category || p?.[2] || '其他',
      color: t.color || p?.[3] || '#0a84ff',
      value: t.value || '', notes: t.notes || '', accountId: t.accountId || '', icon: t.icon || '',
      expiresAt: Number(t.expiresAt) || 0,
      createdAt: Number(t.createdAt) || Date.now(), updatedAt: Number(t.updatedAt) || Date.now(),
    };
  }

  function tokenForm(existing = null, presetName = '') {
    const base = normalizeToken(existing || {}, !existing);
    const p = byPreset(presetName);
    if (!existing && p) Object.assign(base, { platform: p[0], domain: p[1], category: p[2], color: p[3] });
    ui.tokenDraft = base;
    ui.sheetTokenId = existing ? existing.id : null;
    ui.tokenEditing = !!existing;
    renderTokenEditor();
  }

  function captureTokenDraft() {
    const d = ui.tokenDraft; if (!d || !$('#tokName')) return d;
    d.name = $('#tokName').value.trim();
    d.domain = $('#tokDomain')?.value.trim() || '';
    d.category = $('#tokCategory')?.value.trim() || '其他';
    d.value = $('#tokValue')?.value.trim() || '';
    const exp = $('#tokExpiry')?.value, expiryMode = $('#tokExpiryMode')?.value || (exp ? 'date' : 'never');
    d.expiresAt = expiryMode === 'date' && exp ? new Date(exp + 'T23:59:59').getTime() : 0;
    d.notes = $('#tokNotes')?.value.trim() || '';
    return d;
  }

  function renderTokenEditor() {
    const d = ui.tokenDraft; if (!d) return;
    const accounts = platformAccounts(d), selected = d.accountId && allAccounts().find(a => a.id === d.accountId);
    if (selected && !accounts.some(a => a.id === selected.id)) accounts.push(selected);
    const catOptions = CAT_SUGGESTIONS.map(c => `<option value="${esc(c)}"></option>`).join('');
    const platformValue = d.platform ? `${favicon(d)}<span>${esc(d.platform)}</span>` : '<em>选择平台</em>';
    const accountValue = selected ? `${favicon(selected)}<span>${esc(accountName(selected.id))}</span>` : `<em>选择${esc(d.platform)}账号</em>`;
    ctx.openSheet(`<div class="sheet-bar"><button data-close>取消</button><span class="t">${ui.tokenEditing ? '编辑密钥' : '添加密钥'}</span><button id="tokSaveTop" class="tok-save-top">保存</button></div>
      <input type="file" id="tokIconFile" accept="image/*" hidden>
      <div class="sheet-body form">
        <div class="form-hero" id="tokHero" style="--pc:${esc(d.color || '#0a84ff')}">
          <button class="hero-icon" id="tokIconBtn" aria-label="更换图标">${favicon(d, 'lg')}<i class="hero-edit">${ICON_EDIT}</i></button>
          <b id="tokHeroTitle">${esc(d.name || d.platform || '新密钥')}</b>
          <p>${d.platform ? esc(d.platform) : '先选择平台'}</p>
          <div class="icon-menu" id="tokIconMenu"><button data-tim="pick"><span>从相册选择</span></button>${d.icon ? '<button data-tim="reset"><span>使用平台默认图标</span></button>' : ''}</div>
        </div>
        <div class="group">
          <button class="field link-field ${d.platform ? 'linked' : ''}" id="tokPlatformBtn"><label>平台</label><span class="link-val">${platformValue}</span><span class="link-chev">›</span></button>
          <div class="field" id="tokNameField"><label>名称</label><input id="tokName" value="${esc(d.name)}" placeholder="例如：博客部署 PAT" autocomplete="off"></div>
        </div>
        <p class="hint">平台决定默认图标；名称完全由你填写，用来区分这条密钥的用途。</p>
        <div class="sec-title">详细信息</div>
        <div class="group">
          <div class="field"><label>域名</label><input id="tokDomain" value="${esc(d.domain)}" placeholder="选填，用来获取平台图标" autocomplete="off"></div>
          <div class="field"><label>分类</label><input id="tokCategory" list="tokCatList" value="${esc(d.category)}" placeholder="手填分类，可自定义" autocomplete="off"><datalist id="tokCatList">${catOptions}</datalist></div>
          <div class="field"><label>密钥</label><input id="tokValue" type="password" value="${esc(d.value)}" placeholder="粘贴 Token / Key" autocomplete="off" spellcheck="false"></div>
          <div class="field"><label>有效期</label><select id="tokExpiryMode"><option value="never" ${d.expiresAt ? '' : 'selected'}>无限期</option><option value="date" ${d.expiresAt ? 'selected' : ''}>指定日期</option></select></div>
          <div class="field tok-expiry-date" id="tokExpiryDateRow" ${d.expiresAt ? '' : 'hidden'}><label>到期日</label><input id="tokExpiry" type="date" value="${d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 10) : ''}"></div>
          ${d.platform && accounts.length ? `<button class="field link-field ${selected ? 'linked' : ''}" id="tokAccountBtn"><label>使用账号</label><span class="link-val">${accountValue}</span><span class="link-chev">›</span></button>` : ''}
          <div class="field stack"><textarea id="tokNotes" placeholder="用途、权限范围…" spellcheck="false">${esc(d.notes)}</textarea></div>
        </div>
        <p class="hint">有效期默认无限期；切换到指定日期后才会提醒。没有可关联账号时，不显示“使用账号”。</p>
        <div class="tok-form-actions"><button class="btn-filled" data-toksave="1">${ui.tokenEditing ? '保存修改' : '添加密钥'}</button>${ui.tokenEditing ? '<button class="btn-text destructive" data-tokdelete="' + esc(d.id) + '">删除</button>' : ''}</div>
      </div>`, { kind: 'token', id: d.id || '' });
    setTimeout(wireTokenEditor, 0);
  }

  function wireTokenEditor() {
    const d = ui.tokenDraft; if (!d) return;
    $('#tokPlatformBtn').onclick = () => { captureTokenDraft(); tokenPlatformPicker(); };
    const acc = $('#tokAccountBtn'); if (acc) acc.onclick = () => { captureTokenDraft(); tokenAccountPicker(); };
    $('#tokName').addEventListener('input', e => { const h = $('#tokHeroTitle'); if (h) h.textContent = e.target.value.trim() || d.platform || '新密钥'; });
    $('#tokDomain')?.addEventListener('input', e => { d.domain = e.target.value.trim(); });
    const expiryMode = $('#tokExpiryMode'), expiryRow = $('#tokExpiryDateRow'), expiryDate = $('#tokExpiry');
    if (expiryMode) expiryMode.onchange = () => {
      const dated = expiryMode.value === 'date'; expiryRow.hidden = !dated;
      if (!dated) { expiryDate.value = ''; d.expiresAt = 0; }
      else setTimeout(() => expiryDate.focus(), 30);
    };
    $('#tokIconBtn').onclick = e => { e.stopPropagation(); $('#tokIconMenu').classList.toggle('open'); };
    $$('#tokIconMenu button').forEach(b => b.onclick = e => {
      e.stopPropagation(); $('#tokIconMenu').classList.remove('open');
      if (b.dataset.tim === 'pick') $('#tokIconFile').click(); else { d.icon = ''; renderTokenEditor(); }
    });
    const file = $('#tokIconFile');
    file.onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      captureTokenDraft();
      try { d.icon = await (ctx.makeIcon ? ctx.makeIcon(f) : fileToDataUrl(f)); renderTokenEditor(); }
      catch { toast('这张图片读不了，换一张试试'); }
    };
    if (ui._tokIconOutside) document.removeEventListener('click', ui._tokIconOutside, true);
    ui._tokIconOutside = e => { const m = $('#tokIconMenu'); if (!m) return; if (!e.target.closest('#tokIconMenu,#tokIconBtn')) m.classList.remove('open'); };
    document.addEventListener('click', ui._tokIconOutside, true);
  }

  function choosePlatform(p) {
    const d = ui.tokenDraft;
    Object.assign(d, { platform: p[0], domain: p[1] || '', category: p[2] || '其他', color: p[3] || '#0a84ff', icon: '' });
    if (d.accountId && !platformAccounts(d).some(a => a.id === d.accountId)) d.accountId = '';
    renderTokenEditor();
  }
  function chooseAccountPlatform(option) {
    if (!option) return;
    const d = ui.tokenDraft, accounts = option.accounts || [];
    Object.assign(d, { platform: option.name, category: option.category || '其他', color: option.color || '#0a84ff', icon: option.icon || '' });
    d['domain'] = option.domain || '';
    if (!accounts.some(a => a.id === d.accountId)) d.accountId = accounts.length === 1 ? accounts[0].id : '';
    renderTokenEditor();
  }

  function tokenPlatformPicker(query = '') {
    const d = ui.tokenDraft; captureTokenDraft();
    const existing = accountPlatformOptions();
    let q = query, cat = existing.length ? '已有账号' : '常用';
    const cats = [...(existing.length ? ['已有账号'] : []), '常用', ...TOKEN_CATS.filter(c => TOKEN_PRESETS.some(p => p[2] === c))];
    ctx.openSheet(`<div class="sheet-bar"><button id="tokPickBack">返回</button><span class="t">选择平台</span><button disabled></button></div>
      <div class="pick-head"><div class="spot-field pk-field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><input id="tokPickQ" placeholder="先选已有账号，或搜索其他平台" value="${esc(q)}" autocomplete="off" enterkeyhint="search"></div>
      <div class="filters pk-cats" id="tokPickCats">${cats.map(c => `<button data-tpc="${esc(c)}" class="${c === cat ? 'active' : ''}">${esc(c)}</button>`).join('')}</div></div>
      <div class="sheet-body"><div class="pick-grid" id="tokPickGrid"></div></div>`, { kind: 'token-platform' });
    const draw = () => {
      const ql = normName(q); let existingList = [], presetList = [];
      if (ql) {
        existingList = existing.filter(p => normName(p.name).includes(ql) || normKey(p.domain).includes(ql));
        presetList = TOKEN_PRESETS.filter(p => normName(p[0]).includes(ql) || normKey(p[1]).includes(ql));
      } else if (cat === '已有账号') existingList = existing;
      else if (cat === '常用') presetList = TOKEN_POPULAR.map(n => byPreset(n)).filter(Boolean);
      else presetList = TOKEN_PRESETS.filter(p => p[2] === cat);
      const represented = new Set(existingList.flatMap(p => [`n:${normName(p.name)}`, ...(p.domain ? [`d:${normKey(p.domain)}`] : [])]));
      presetList = presetList.filter(p => !represented.has(`n:${normName(p[0])}`) && !(p[1] && represented.has(`d:${normKey(p[1])}`)));
      const exact = ql && (existing.some(p => normName(p.name) === ql) || TOKEN_PRESETS.some(p => normName(p[0]) === ql));
      $('#tokPickCats').style.display = ql ? 'none' : '';
      $('#tokPickGrid').innerHTML = existingList.map(p => { const visual = { platform: p.name, name: p.name, color: p.color, icon: p.icon }; visual['domain'] = p.domain; return `<button class="pk" data-taccount-platform="${esc(p.key)}">${favicon(visual)}<span>${esc(p.name)}</span><small>已有账号 · ${p.accounts.length}</small></button>`; }).join('') +
        presetList.map(p => `<button class="pk" data-tplatform="${esc(p[0])}">${favicon({ platform: p[0], name: p[0], domain: p[1], color: p[3] })}<span>${esc(p[0])}</span><small>${esc(p[2])}</small></button>`).join('') +
        (ql && !exact ? `<button class="pk custom" data-tcustom="${esc(q.trim())}"><span class="icon">＋</span><span>使用“${esc(q.trim())}”</span></button>` : '');
    };
    setTimeout(() => {
      draw();
      $('#tokPickBack').onclick = renderTokenEditor;
      $('#tokPickQ').addEventListener('input', e => { q = e.target.value; draw(); });
      $('#tokPickCats').onclick = e => { const b = e.target.closest('[data-tpc]'); if (!b) return; cat = b.dataset.tpc; $$('#tokPickCats button').forEach(x => x.classList.toggle('active', x === b)); draw(); $('.sheet-body')?.scrollTo(0, 0); };
      $('#tokPickGrid').onclick = e => {
        const accountPlatform = e.target.closest('[data-taccount-platform]');
        if (accountPlatform) return chooseAccountPlatform(existing.find(p => p.key === accountPlatform.dataset.taccountPlatform));
        const b = e.target.closest('[data-tplatform]'); if (b) return choosePlatform(byPreset(b.dataset.tplatform));
        const c = e.target.closest('[data-tcustom]'); if (c) choosePlatform([c.dataset.tcustom, '', '其他', '#0a84ff']);
      };
      if (q) $('#tokPickQ').focus();
    }, 0);
  }

  function tokenAccountPicker() {
    const d = ui.tokenDraft; captureTokenDraft();
    const accounts = platformAccounts(d), selected = d.accountId && allAccounts().find(a => a.id === d.accountId);
    if (selected && !accounts.some(a => a.id === selected.id)) accounts.push(selected);
    if (!accounts.length) { renderTokenEditor(); toast(`还没有 ${d.platform} 账号`); return; }
    ctx.openSheet(`<div class="sheet-bar"><button id="tokAccBack">返回</button><span class="t">选择 ${esc(d.platform)} 账号</span><button id="tokAccClear" ${d.accountId ? '' : 'disabled'}>清除</button></div>
      <div class="sheet-body form"><div class="form-hero" style="--pc:${esc(d.color)}">${favicon(d, 'lg')}<b>${esc(d.platform)}</b><p>选择这条密钥实际属于哪个账号</p></div>
      <div class="group" id="tokAccList">${accounts.map((a, k) => `<button class="check-cell ${a.id === d.accountId ? 'on' : ''}" data-tacc="${esc(a.id)}">${favicon(a)}<span class="cell-main"><span class="cell-title">${esc(a.name)}</span><span class="cell-sub">${esc(a.handle || `第 ${k + 1} 个账号`)}</span></span><span class="tick">${a.id === d.accountId ? '✓' : ''}</span></button>`).join('')}</div>
      <p class="hint">账号名来自“网站与 App”；同一平台多个账号时可精确选择。</p></div>`, { kind: 'token-account' });
    setTimeout(() => {
      $('#tokAccBack').onclick = renderTokenEditor;
      $('#tokAccClear').onclick = () => { d.accountId = ''; renderTokenEditor(); };
      $('#tokAccList').onclick = e => { const b = e.target.closest('[data-tacc]'); if (!b) return; d.accountId = b.dataset.tacc; renderTokenEditor(); };
    }, 0);
  }

  function fileToDataUrl(f) {
    return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  }

  function readTokenForm() {
    const expiryMode = $('#tokExpiryMode')?.value, expiryDate = $('#tokExpiry')?.value;
    const d = captureTokenDraft(); if (!d) return null;
    if (!d.platform) { toast('先选择平台'); return null; }
    if (expiryMode === 'date' && !expiryDate) { $('#tokExpiry')?.focus(); toast('请选择到期日'); return null; }
    if (!d.name) { $('#tokName')?.focus(); toast('给这条密钥起个名字'); return null; }
    if (!d.value) { $('#tokValue')?.focus(); toast('请填写密钥'); return null; }
    return { ...d, id: ui.sheetTokenId || d.id || uid(), platform: d.platform, createdAt: d.createdAt || Date.now(), updatedAt: Date.now() };
  }
  function saveToken() {
    const t = readTokenForm(); if (!t) return;
    const arr = list(); const i = arr.findIndex(x => x.id === t.id);
    if (i >= 0) arr[i] = { ...arr[i], ...t }; else arr.unshift(t);
    ctx.closeSheet?.(); save(); render(); toast(i >= 0 ? '密钥已更新' : '密钥已添加');
  }
  function tokenGroupSheet(accountId = '') {
    const account = accountId && allAccounts().find(a => a.id === accountId);
    const validAccountIds = new Set(allAccounts().map(a => a.id));
    const tokens = list().filter(t => accountId ? t.accountId === accountId : !t.accountId || !validAccountIds.has(t.accountId)).sort((a, b) => zh(a.name, b.name));
    const title = account ? `${accountName(account.id)} 的密钥` : '未关联密钥';
    ctx.openSheet(`<div class="sheet-bar"><button data-close>关闭</button><span class="t">${esc(title)}</span><button disabled></button></div>
      <div class="sheet-body form"><div class="token-group-summary"><b>${tokens.length}</b><span>条密钥</span></div>
      <div class="group token-group-list">${tokens.map(t => { const ex = expiryInfo(t); return `<button class="token-group-row" data-tokedit="${esc(t.id)}">${favicon(t)}<span class="cell-main"><span class="cell-title">${esc(t.name || `${platformOf(t) || '自定义平台'} 密钥`)}</span><span class="cell-sub">${esc(platformOf(t) || '自定义平台')} · <i class="${ex.cls}">${esc(ex.text)}</i></span></span><span class="link-chev">›</span></button>`; }).join('')}</div>
      ${tokens.length ? '<p class="hint">图谱不显示密钥内容；点一条可查看和编辑。</p>' : '<div class="empty"><p>这里还没有密钥。</p></div>'}</div>`, { kind: 'token-group', accountId });
  }

  function deleteToken(id) {
    const t = list().find(x => x.id === id); if (!t) return;
    ctx.confirmSheet?.(`删除 ${t.name}？`, '删除后几秒内可以撤销，开启同步时会同步到其它设备。', '删除', () => {
      getState().tokens = list().filter(x => x.id !== id);
      ctx.closeSheet?.(); save(); render(); toast('已删除');
    });
  }

  function handleClick(e) {
    const t = e.target.closest('[data-tokcat],[data-new="token"],[data-tokcopy],[data-toksee],[data-tokedit],[data-toksave],#tokSaveTop,[data-tokdelete]');
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

  window.TokiTokens = { TOKEN_CATS, TOKEN_PRESETS, render: renderTokens, install, add: () => tokenForm(), edit(id) { const t = list().find(x => x.id === id); if (t) tokenForm(t); }, showGroup: accountId => tokenGroupSheet(accountId || ''), normalize: t => normalizeToken(t) };
})();
