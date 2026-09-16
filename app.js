const cfg = window.STREAM_CONFIG;
const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];
const money = (n) => `${cfg.currencyLabel} ${Number(n || 0).toLocaleString()}`;

let selectedAmount = cfg.standardAmounts.includes(cfg.tts.minAmount) ? cfg.tts.minAmount : cfg.standardAmounts[0];
let selectedDrop = null;
let selectedChallenge = null;

function saveDemoEvent(event) {
  const payload = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    at: new Date().toISOString(),
    verified: true,
    ...event
  };
  localStorage.setItem('streamnest:lastEvent', JSON.stringify(payload));
  window.dispatchEvent(new StorageEvent('storage', { key: 'streamnest:lastEvent', newValue: JSON.stringify(payload) }));
  return payload;
}

function demoNotice(text) {
  const n = qs('#notice');
  if (n) {
    n.textContent = text;
    setTimeout(() => { if (n.textContent === text) n.textContent = ''; }, 5000);
  }
}

function validateMessage(text) {
  const value = (text || '').trim();
  if (cfg.moderation.blockLinks && /(https?:\/\/|www\.|\.com\b|\.gg\b)/i.test(value)) return 'Links are not allowed in stream messages.';
  const lower = value.toLowerCase();
  if ((cfg.moderation.blockedTerms || []).some(t => t && lower.includes(t.toLowerCase()))) return 'That message contains a blocked term.';
  return null;
}

function initIdentity() {
  qs('#brandName').textContent = cfg.brand;
  qs('#creatorName').textContent = cfg.creatorName;
  qs('#handle').textContent = cfg.handle;
  qs('#ttsMinLabel').textContent = money(cfg.tts.minAmount);
  qs('#ttsRule').textContent = `Unlocks at ${money(cfg.tts.minAmount)}`;
  qs('#message').maxLength = cfg.tts.maxChars;
}

function initTabs() {
  qsa('.interaction-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      qsa('.interaction-tab').forEach(b => b.classList.toggle('active', b === btn));
      qsa('.interaction-panel').forEach(p => p.classList.remove('active'));
      qs(`#${target}Panel`).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function currentSupportAmount() {
  const custom = Number(qs('#customAmount').value || 0);
  return custom > 0 ? custom : selectedAmount;
}

function renderAmounts() {
  const host = qs('#amounts');
  host.innerHTML = '';
  cfg.standardAmounts.forEach(amount => {
    const b = document.createElement('button');
    b.className = 'amount';
    b.type = 'button';
    b.textContent = money(amount);
    b.classList.toggle('active', amount === selectedAmount && !qs('#customAmount').value);
    b.addEventListener('click', () => {
      selectedAmount = amount;
      qs('#customAmount').value = '';
      updateSupportState();
      renderAmounts();
    });
    host.appendChild(b);
  });
}

function updateSupportState() {
  const amount = currentSupportAmount();
  const eligible = cfg.tts.enabled && amount >= cfg.tts.minAmount;
  const card = qs('#ttsCard');
  const checkbox = qs('#ttsEnabled');
  card.classList.toggle('disabled', !eligible);
  checkbox.disabled = !eligible;
  if (!eligible) checkbox.checked = false;
  else if (cfg.tts.defaultOn && checkbox.dataset.touched !== 'yes') checkbox.checked = true;
  qs('#ttsStatus').textContent = eligible ? 'UNLOCKED' : 'LOCKED';
  qs('#supportPrice').textContent = money(amount);
  qs('#supportTtsSummary').textContent = checkbox.checked && eligible ? 'Read aloud' : 'Off';
}

function initSupport() {
  renderAmounts();
  qs('#customAmount').addEventListener('input', () => { renderAmounts(); updateSupportState(); });
  qs('#ttsEnabled').addEventListener('change', (e) => { e.target.dataset.touched = 'yes'; updateSupportState(); });
  qs('#message').addEventListener('input', (e) => {
    qs('#charCount').textContent = `${e.target.value.length} / ${cfg.tts.maxChars}`;
  });
  updateSupportState();

  qs('#supportBtn').addEventListener('click', () => {
    const amount = currentSupportAmount();
    const msg = qs('#message').value.trim();
    const name = qs('#donorName').value.trim() || 'Anonymous';
    if (amount < cfg.minTip) return demoNotice(`Minimum support is ${money(cfg.minTip)}.`);
    const err = validateMessage(msg);
    if (err) return demoNotice(err);
    const tts = cfg.tts.enabled && amount >= cfg.tts.minAmount && qs('#ttsEnabled').checked && !!msg;
    saveDemoEvent({ type: 'support', name, amount, currency: cfg.currency, message: msg, tts, title: 'Support' });
    demoNotice('Demo payment verified — your stream alert has been queued. Open overlay.html to preview it.');
  });
}

function renderDrops() {
  const host = qs('#dropGrid');
  host.innerHTML = '';
  cfg.rareDrops.forEach(drop => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `shop-card rarity-${drop.rarity.toLowerCase()}`;
    card.innerHTML = `
      <div class="shop-card-top"><span class="shop-icon">${drop.icon}</span><span class="rarity-tag">${drop.rarity}</span></div>
      <h3>${drop.name}</h3>
      <p>${drop.description}</p>
      <div class="shop-card-bottom"><b>${money(drop.price)}</b><span>${drop.remaining} left</span></div>`;
    card.addEventListener('click', () => selectDrop(drop, card));
    host.appendChild(card);
  });
}

function selectDrop(drop, card) {
  selectedDrop = drop;
  qsa('#dropGrid .shop-card').forEach(c => c.classList.toggle('selected', c === card));
  qs('#dropSelectedName').textContent = `${drop.icon} ${drop.name} — ${money(drop.price)}`;
  qs('#dropSelectedDesc').textContent = `${drop.description} ${drop.ttsIncluded ? 'TTS message included.' : ''}`;
  qs('#dropBuyBtn').disabled = false;
  qs('#dropBuyBtn').textContent = `Drop ${drop.name} · ${money(drop.price)}`;
}

function initDrops() {
  renderDrops();
  qs('#dropBuyBtn').addEventListener('click', () => {
    if (!selectedDrop) return;
    const name = qs('#dropDonorName').value.trim() || 'Anonymous';
    const msg = qs('#dropMessage').value.trim();
    const err = validateMessage(msg);
    if (err) return alert(err);
    saveDemoEvent({
      type: 'drop',
      name,
      amount: selectedDrop.price,
      currency: cfg.currency,
      message: msg,
      tts: selectedDrop.ttsIncluded && !!msg,
      title: selectedDrop.name,
      rarity: selectedDrop.rarity,
      icon: selectedDrop.icon,
      assetUrl: selectedDrop.assetUrl || '',
      soundUrl: selectedDrop.soundUrl || ''
    });
    alert(`Demo verified: ${selectedDrop.name} has been sent to the overlay.`);
  });
}

function renderChallenges() {
  const host = qs('#challengeGrid');
  host.innerHTML = '';
  cfg.challenges.forEach(challenge => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'shop-card challenge-card';
    card.innerHTML = `
      <div class="shop-card-top"><span class="shop-icon">${challenge.icon}</span><span class="challenge-tag">CHALLENGE</span></div>
      <h3>${challenge.title}</h3>
      <p>${challenge.description}</p>
      <div class="rules">${challenge.rules}</div>
      <div class="shop-card-bottom"><b>${money(challenge.price)}</b><span>Trigger live</span></div>`;
    card.addEventListener('click', () => selectChallenge(challenge, card));
    host.appendChild(card);
  });
}

function selectChallenge(challenge, card) {
  selectedChallenge = challenge;
  qsa('#challengeGrid .shop-card').forEach(c => c.classList.toggle('selected', c === card));
  qs('#challengeSelectedName').textContent = `${challenge.icon} ${challenge.title} — ${money(challenge.price)}`;
  qs('#challengeSelectedDesc').textContent = `${challenge.description} ${challenge.rules}`;
  qs('#challengeBuyBtn').disabled = false;
  qs('#challengeBuyBtn').textContent = `Buy challenge · ${money(challenge.price)}`;
}

function initChallenges() {
  renderChallenges();
  qs('#challengeBuyBtn').addEventListener('click', () => {
    if (!selectedChallenge) return;
    const name = qs('#challengeDonorName').value.trim() || 'Anonymous';
    const note = qs('#challengeNote').value.trim();
    const err = validateMessage(note);
    if (err) return alert(err);
    saveDemoEvent({
      type: 'challenge',
      name,
      amount: selectedChallenge.price,
      currency: cfg.currency,
      message: note,
      tts: false,
      title: selectedChallenge.title,
      icon: selectedChallenge.icon
    });
    alert(`Demo verified: ${selectedChallenge.title} has been queued for the stream.`);
  });
}

initIdentity();
initTabs();
initSupport();
initDrops();
initChallenges();

// ---------------- Viewer demo alerts ----------------
let selectedViewerDemoType = 'support';
let viewerDemoCooldownTimer = null;
const VIEWER_DEMO_LAST_SENT = 'streamnest:viewerDemoLastSent';

function demoCfg() {
  return cfg.viewerDemo || { enabled: false, cooldownSeconds: 20, maxChars: 120, allowTts: true };
}

function viewerDemoMeta(type) {
  const d = demoCfg();
  if (type === 'drop') return {
    icon: '✨', title: 'Rare Drop', copy: 'Sends a premium Rare Drop demo to the live OBS overlay.',
    amount: d.dropAmount || 2500, eventTitle: 'Demo Rare Drop', rarity: 'RARE'
  };
  if (type === 'challenge') return {
    icon: '🎯', title: 'Challenge', copy: 'Sends a Challenge demo to the live OBS overlay.',
    amount: d.challengeAmount || 1000, eventTitle: 'Demo Challenge'
  };
  return {
    icon: '💬', title: 'Support + TTS', copy: 'Sends a standard demo support alert to the live OBS overlay.',
    amount: d.supportAmount || 500, eventTitle: 'Demo Support'
  };
}

function setViewerDemoNotice(text, kind = 'ok') {
  const el = qs('#demoViewerNotice');
  if (!el) return;
  el.textContent = text;
  el.className = `demo-viewer-notice show ${kind}`;
}

function clearViewerDemoNotice() {
  const el = qs('#demoViewerNotice');
  if (!el) return;
  el.textContent = '';
  el.className = 'demo-viewer-notice';
}

function remainingViewerDemoCooldown() {
  const seconds = Number(demoCfg().cooldownSeconds || 20);
  const last = Number(localStorage.getItem(VIEWER_DEMO_LAST_SENT) || 0);
  return Math.max(0, Math.ceil((last + seconds * 1000 - Date.now()) / 1000));
}

function updateViewerDemoButton() {
  const btn = qs('#sendViewerDemo');
  if (!btn) return;
  const d = demoCfg();
  if (!d.enabled) {
    btn.disabled = true;
    btn.textContent = 'Demo alerts are currently disabled';
    qs('#demoPanel')?.classList.add('demo-offline');
    return;
  }
  const remain = remainingViewerDemoCooldown();
  btn.disabled = remain > 0;
  btn.classList.toggle('cooldown', remain > 0);
  btn.textContent = remain > 0 ? `Wait ${remain}s before another demo` : '🧪 Send demo alert';
}

function startViewerDemoCooldownTicker() {
  clearInterval(viewerDemoCooldownTimer);
  viewerDemoCooldownTimer = setInterval(updateViewerDemoButton, 500);
  updateViewerDemoButton();
}

function selectViewerDemoType(type) {
  selectedViewerDemoType = type;
  qsa('[data-demo-type]').forEach(btn => btn.classList.toggle('active', btn.dataset.demoType === type));
  const meta = viewerDemoMeta(type);
  qs('#demoPreviewIcon').textContent = meta.icon;
  qs('#demoPreviewTitle').textContent = meta.title;
  qs('#demoPreviewCopy').textContent = meta.copy;
  const ttsCard = qs('#demoTtsCard');
  const tts = qs('#demoTtsEnabled');
  const eligible = demoCfg().allowTts !== false && type !== 'challenge';
  tts.disabled = !eligible;
  if (!eligible) tts.checked = false;
  ttsCard.classList.toggle('disabled', !eligible);
  clearViewerDemoNotice();
}

async function sendViewerDemoAlert() {
  const d = demoCfg();
  if (!d.enabled) return setViewerDemoNotice('The streamer has disabled viewer demo alerts.', 'error');
  const remain = remainingViewerDemoCooldown();
  if (remain > 0) return setViewerDemoNotice(`Please wait ${remain} seconds before sending another demo.`, 'error');
  if (!window.StreamPreviewTransport) return setViewerDemoNotice('Live demo connection is unavailable. Refresh and try again.', 'error');

  const name = (qs('#demoViewerName').value || '').trim().slice(0, 32) || 'Anonymous';
  const message = (qs('#demoViewerMessage').value || '').trim().slice(0, Number(d.maxChars || 120));
  const err = validateMessage(message);
  if (err) return setViewerDemoNotice(err, 'error');
  if (!message) return setViewerDemoNotice('Write a short message before sending your demo.', 'error');

  const meta = viewerDemoMeta(selectedViewerDemoType);
  const tts = d.allowTts !== false && selectedViewerDemoType !== 'challenge' && !!qs('#demoTtsEnabled').checked;
  const event = {
    verified: true,
    demo: true,
    viewerDemo: true,
    type: selectedViewerDemoType,
    name,
    amount: meta.amount,
    currency: cfg.currency,
    message,
    tts,
    title: meta.eventTitle,
    icon: meta.icon,
    rarity: selectedViewerDemoType === 'drop' ? meta.rarity : undefined
  };

  const btn = qs('#sendViewerDemo');
  btn.disabled = true;
  btn.textContent = 'Sending to stream…';
  try {
    const result = await window.StreamPreviewTransport.send({ kind: 'studio-preview', source: 'viewer-demo', event });
    if (!result?.cloud) {
      setViewerDemoNotice('Your demo was sent locally, but the OBS cloud connection is not available right now.', 'error');
      return;
    }
    localStorage.setItem(VIEWER_DEMO_LAST_SENT, String(Date.now()));
    setViewerDemoNotice('Demo alert sent! Watch the stream — it should appear in OBS now.', 'ok');
    qs('#demoViewerMessage').value = '';
    qs('#demoCharCount').textContent = `0 / ${d.maxChars || 120}`;
  } catch (error) {
    console.error(error);
    setViewerDemoNotice('Could not send the demo alert. Please try again in a moment.', 'error');
  } finally {
    updateViewerDemoButton();
  }
}

function initViewerDemoAlerts() {
  const panel = qs('#demoPanel');
  if (!panel) return;
  const d = demoCfg();
  qs('#demoViewerMessage').maxLength = Number(d.maxChars || 120);
  qs('#demoCharCount').textContent = `0 / ${d.maxChars || 120}`;
  qs('#demoCooldownLabel').textContent = `${Number(d.cooldownSeconds || 20)} seconds`;
  qsa('[data-demo-type]').forEach(btn => btn.addEventListener('click', () => selectViewerDemoType(btn.dataset.demoType)));
  qs('#demoViewerMessage').addEventListener('input', e => {
    qs('#demoCharCount').textContent = `${e.target.value.length} / ${d.maxChars || 120}`;
  });
  qs('#sendViewerDemo').addEventListener('click', sendViewerDemoAlert);
  selectViewerDemoType('support');
  startViewerDemoCooldownTicker();
}

initViewerDemoAlerts();
