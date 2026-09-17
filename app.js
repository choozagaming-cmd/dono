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
  if (n) { n.textContent = text; setTimeout(() => { if (n.textContent === text) n.textContent = ''; }, 5000); }
  let toast=qs('#globalToast'); if(!toast){toast=document.createElement('div');toast.id='globalToast';toast.className='global-toast';document.body.appendChild(toast);}
  toast.textContent=text;toast.classList.add('show');clearTimeout(window.__streamToastTimer);window.__streamToastTimer=setTimeout(()=>toast.classList.remove('show'),4200);
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


function voiceProfiles() { return (cfg.tts && cfg.tts.voices) || []; }
function selectedVoice(selectId) {
  const el = qs(selectId);
  return (el && el.value) || cfg.tts.defaultVoice || (voiceProfiles()[0] && voiceProfiles()[0].id) || '';
}
function fillVoiceSelect(selectId) {
  const el = qs(selectId); if (!el) return; el.innerHTML='';
  voiceProfiles().forEach(v => {
    const o=document.createElement('option'); o.value=v.id; o.textContent=`${v.name} — ${v.style}`;
    if(v.id===cfg.tts.defaultVoice)o.selected=true; el.appendChild(o);
  });
}
function paymentNotConnected() {
  demoNotice('Payments are not connected yet. Use “Try this alert in OBS” to test the exact interaction.');
}

async function previewVoice(selectId, text) {
  const id = selectedVoice(selectId);
  const profile = voiceProfiles().find(v => v.id === id) || voiceProfiles()[0] || {};
  const sample = (text || '').trim() || 'Assalam o alaikum yaar, welcome to the stream. This is a mixed Roman Urdu and English TTS test.';

  if (profile.provider === 'elevenlabs') {
    try {
      demoNotice('Generating ElevenLabs preview…');
      const response = await fetch(cfg.tts.apiEndpoint || '/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sample, voice: profile.id })
      });
      if (!response.ok) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info.error || 'TTS preview failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = Number(cfg.tts.volume || 1);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
      return;
    } catch (error) {
      console.error(error);
      return demoNotice(error.message || 'Could not preview the ElevenLabs voice.');
    }
  }

  if (!('speechSynthesis' in window)) return demoNotice('Voice preview is not supported in this browser.');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(sample);
  const roman = /\b(aap|main|mein|kya|hai|ho|yaar|bhai|bohat|nahi|kar|raha|rahi|shukriya|assalam)\b/i.test(sample);
  u.lang = roman ? 'en-IN' : ((profile.langs || []).find(x => x.startsWith('en')) || 'en-GB');
  u.rate = Number(profile.rate || 1); u.pitch = Number(profile.pitch || 1); u.volume = Number(cfg.tts.volume || 1);
  const voices = speechSynthesis.getVoices(); const preferred = (profile.langs || []).map(x => x.toLowerCase());
  const female = /female/i.test(profile.gender || ''), male = /male/i.test(profile.gender || '');
  const fn = /uzma|neerja|heera|sonia|hazel|zira|susan|aria|jenny|samantha|victoria/i, mn = /asad|ravi|george|david|mark|guy|ryan/i;
  const scored = voices.map(v => { let z = 0, vl = (v.lang || '').toLowerCase(); if (preferred.includes(vl)) z += 8; else if (preferred.some(x => x.split('-')[0] === vl.split('-')[0])) z += 4; if (female && fn.test(v.name)) z += 3; if (male && mn.test(v.name)) z += 3; return [z, v]; }).sort((a, b) => b[0] - a[0]);
  if (scored[0]) u.voice = scored[0][1]; speechSynthesis.speak(u);
}

function initSupport() {
  renderAmounts(); fillVoiceSelect('#supportVoice');
  qs('#customAmount').addEventListener('input', () => { renderAmounts(); updateSupportState(); });
  qs('#ttsEnabled').addEventListener('change', (e) => { e.target.dataset.touched = 'yes'; updateSupportState(); });
  qs('#message').addEventListener('input', (e) => { qs('#charCount').textContent = `${e.target.value.length} / ${cfg.tts.maxChars}`; });
  updateSupportState();
  qs('#supportBtn').addEventListener('click', paymentNotConnected);
  qs('#previewSupportVoice').addEventListener('click', () => previewVoice('#supportVoice', qs('#message').value));
  qs('#supportDemoBtn').addEventListener('click', () => sendIntegratedDemo('support'));
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
  qs('#dropDemoBtn').disabled = false;
  qs('#dropBuyBtn').textContent = `Drop ${drop.name} · ${money(drop.price)}`;
}

function initDrops() {
  renderDrops(); fillVoiceSelect('#dropVoice');
  qs('#dropBuyBtn').addEventListener('click', paymentNotConnected);
  qs('#dropDemoBtn').addEventListener('click', () => sendIntegratedDemo('drop'));
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
  qs('#challengeDemoBtn').disabled = false;
  qs('#challengeBuyBtn').textContent = `Buy challenge · ${money(challenge.price)}`;
}

function initChallenges() {
  renderChallenges();
  qs('#challengeBuyBtn').addEventListener('click', paymentNotConnected);
  qs('#challengeDemoBtn').addEventListener('click', () => sendIntegratedDemo('challenge'));
}

// ---------------- Integrated viewer demo alerts ----------------
const VIEWER_DEMO_LAST_SENT = 'streamnest:viewerDemoLastSent';
function demoCfg(){ return cfg.viewerDemo || {enabled:false,cooldownSeconds:20,maxChars:180,allowTts:true}; }
function remainingDemoCooldown(){ const last=Number(localStorage.getItem(VIEWER_DEMO_LAST_SENT)||0); return Math.max(0,Math.ceil((last+Number(demoCfg().cooldownSeconds||20)*1000-Date.now())/1000)); }
function setDemoButtonsBusy(busy,label='Sending…'){
  ['#supportDemoBtn','#dropDemoBtn','#challengeDemoBtn'].forEach(id=>{const b=qs(id);if(!b)return;if(busy){b.dataset.oldText=b.textContent;b.disabled=true;b.textContent=label;}else{if(b.dataset.oldText)b.textContent=b.dataset.oldText; b.disabled=(id==='#dropDemoBtn'&&!selectedDrop)||(id==='#challengeDemoBtn'&&!selectedChallenge);}});
}
async function sendIntegratedDemo(type){
  const d=demoCfg();
  if(!d.enabled) return demoNotice('Viewer demo alerts are disabled right now.');
  const wait=remainingDemoCooldown(); if(wait>0) return demoNotice(`Please wait ${wait}s before sending another demo alert.`);
  if(!window.StreamPreviewTransport) return demoNotice('OBS realtime connection is unavailable.');
  let event;
  if(type==='support'){
    const amount=currentSupportAmount(); const msg=qs('#message').value.trim(); const name=qs('#donorName').value.trim()||'Anonymous';
    if(amount<cfg.minTip)return demoNotice(`Minimum support is ${money(cfg.minTip)}.`); const err=validateMessage(msg); if(err)return demoNotice(err);
    const tts=cfg.tts.enabled&&amount>=cfg.tts.minAmount&&qs('#ttsEnabled').checked&&!!msg;
    { const vp=voiceProfiles().find(v=>v.id===selectedVoice('#supportVoice'))||{}; event={type:'support',name,amount,currency:cfg.currency,message:msg,tts,title:'Support',voiceProfile:vp.id||selectedVoice('#supportVoice'),ttsProvider:vp.provider||'browser',ttsVoiceId:vp.voiceId||'',ttsModel:vp.model||''}; }
  } else if(type==='drop'){
    if(!selectedDrop)return demoNotice('Choose a Rare Drop first.'); const msg=qs('#dropMessage').value.trim(); const err=validateMessage(msg);if(err)return demoNotice(err);
    { const vp=voiceProfiles().find(v=>v.id===selectedVoice('#dropVoice'))||{}; event={type:'drop',name:qs('#dropDonorName').value.trim()||'Anonymous',amount:selectedDrop.price,currency:cfg.currency,message:msg,tts:selectedDrop.ttsIncluded&&!!msg,title:selectedDrop.name,rarity:selectedDrop.rarity,icon:selectedDrop.icon,assetUrl:selectedDrop.assetUrl||'',soundUrl:selectedDrop.soundUrl||'',voiceProfile:vp.id||selectedVoice('#dropVoice'),ttsProvider:vp.provider||'browser',ttsVoiceId:vp.voiceId||'',ttsModel:vp.model||''}; }
  } else {
    if(!selectedChallenge)return demoNotice('Choose a Challenge first.'); const note=qs('#challengeNote').value.trim();const err=validateMessage(note);if(err)return demoNotice(err);
    event={type:'challenge',name:qs('#challengeDonorName').value.trim()||'Anonymous',amount:selectedChallenge.price,currency:cfg.currency,message:note,tts:false,title:selectedChallenge.title,icon:selectedChallenge.icon};
  }
  event={...event,verified:true,demo:true,viewerDemo:true}; setDemoButtonsBusy(true,'Sending to OBS…');
  try{ const result=await window.StreamPreviewTransport.send({kind:'studio-preview',source:'viewer-demo-inline',event}); if(!result?.cloud)return demoNotice('Demo sent locally, but OBS cloud connection is unavailable.'); localStorage.setItem(VIEWER_DEMO_LAST_SENT,String(Date.now())); demoNotice('Demo alert sent to OBS — watch the stream.'); }
  catch(e){console.error(e);demoNotice('Could not send the demo alert. Please try again.');}
  finally{setDemoButtonsBusy(false);}
}

initIdentity();
initTabs();
initSupport();
initDrops();
initChallenges();
