const api = window.StreamOverlayLayout;
const $ = (id) => document.getElementById(id);
const clamp = (n,min,max)=>Math.min(max,Math.max(min,n));
const deep = (v)=>JSON.parse(JSON.stringify(v));
let layout = api.load();
let sceneKey = layout.activeScene || 'support';
let selectedId = null;
let mode = null;
let stageScale = .5;
let zoomMode = 'fit';
let history = [];
let historyIndex = -1;
let suppressHistory = false;
let sessionAssets = [];
const stage = $('stage');
const stageWrap = $('stageWrap');
const viewport = $('stageViewport');
const statusEl = $('studioStatus');
const guideV = $('guideV');
const guideH = $('guideH');

function normalizeLayout(){
  layout.canvas ||= {width:1920,height:1080};
  for(const sc of Object.values(layout.scenes||{})){
    sc.durationMs ||= 5500;
    sc.soundUrl ||= '';
    sc.background ||= '#000000';
    for(const el of sc.elements||[]){
      Object.assign(el,{
        rotation: el.rotation ?? 0,
        locked: el.locked ?? false,
        enterAnimation: el.enterAnimation || 'fade',
        exitAnimation: el.exitAnimation || 'fade',
        animationMs: el.animationMs ?? 500,
        objectFit: el.objectFit || 'contain',
        opacity: el.opacity ?? 1,
        padding: el.padding ?? 0
      });
    }
  }
}
normalizeLayout();

function setStatus(text,kind=''){statusEl.textContent=text;statusEl.className=`studio-status ${kind}`.trim();}
function scene(){return layout.scenes[sceneKey];}
function getEl(){return scene().elements.find(e=>e.id===selectedId)||null;}
function maxZ(){return Math.max(0,...scene().elements.map(e=>Number(e.z)||0));}
function minZ(){return Math.min(0,...scene().elements.map(e=>Number(e.z)||0));}
function uniqueId(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;}
function isTypingTarget(el){return !!el?.closest?.('input,textarea,select,[contenteditable="true"]');}

function snapshot(force=false){
  if(suppressHistory)return;
  const data=JSON.stringify(layout);
  if(!force && history[historyIndex]===data)return;
  history=history.slice(0,historyIndex+1);
  history.push(data);
  if(history.length>60)history.shift(); else historyIndex++;
  if(history.length===60)historyIndex=59;
  updateHistoryButtons();
}
function restoreHistory(index){
  if(index<0||index>=history.length)return;
  historyIndex=index;
  suppressHistory=true;
  layout=JSON.parse(history[index]);
  normalizeLayout();
  if(!layout.scenes[sceneKey])sceneKey=layout.activeScene||Object.keys(layout.scenes)[0];
  selectedId=null;
  render();
  suppressHistory=false;
  updateHistoryButtons();
}
function undo(){restoreHistory(historyIndex-1)}
function redo(){restoreHistory(historyIndex+1)}
function updateHistoryButtons(){$('undoBtn').disabled=historyIndex<=0;$('redoBtn').disabled=historyIndex>=history.length-1;}
snapshot(true);

function getSavedRealtime(){try{return JSON.parse(localStorage.getItem('streamnest:realtimeConfig')||'{}')}catch(_){return{}}}
function buildObsUrl(values=getSavedRealtime()){
  const base=new URL('overlay.html',location.href);base.searchParams.set('obs','1');
  if(values.supabaseUrl)base.searchParams.set('sbUrl',values.supabaseUrl);
  if(values.publishableKey)base.searchParams.set('sbKey',values.publishableKey);
  if(values.channel)base.searchParams.set('channel',values.channel);
  return base.toString();
}
function loadRealtimeForm(){const saved=getSavedRealtime();$('sbUrl').value=saved.supabaseUrl||window.STREAM_CONFIG?.realtime?.supabaseUrl||'';$('sbKey').value=saved.publishableKey||window.STREAM_CONFIG?.realtime?.publishableKey||'';$('sbChannel').value=saved.channel||window.STREAM_CONFIG?.realtime?.channel||'stream-preview-main';$('obsUrl').value=buildObsUrl({supabaseUrl:$('sbUrl').value,publishableKey:$('sbKey').value,channel:$('sbChannel').value});}
async function saveRealtimeSettings(){const values={supabaseUrl:$('sbUrl').value.trim(),publishableKey:$('sbKey').value.trim(),channel:$('sbChannel').value.trim()||'stream-preview-main'};localStorage.setItem('streamnest:realtimeConfig',JSON.stringify(values));$('obsUrl').value=buildObsUrl(values);await window.StreamPreviewTransport.reset?.();if(values.supabaseUrl&&values.publishableKey){setStatus('Connecting live preview…');const state=await window.StreamPreviewTransport.connectCloud();if(state.connected){$('transportDot').classList.add('cloud');$('transportLabel').textContent='OBS cloud preview connected';setStatus('Live preview connected. Copy the OBS URL into OBS.','success');}else setStatus('Could not connect to Supabase. Check URL/key.','error');}else setStatus('Saved local-only preview settings.','warn');}
async function copyObsUrl(){try{await navigator.clipboard.writeText($('obsUrl').value);setStatus('OBS URL copied.','success')}catch(_){$('obsUrl').focus();$('obsUrl').select();setStatus('Copy the selected OBS URL manually.','warn')}}

function testEvent(){
  const type=sceneKey==='drop'?'drop':sceneKey==='challenge'?'challenge':'support';
  return {verified:true,preview:true,type,name:$('testName').value.trim()||'Anonymous',amount:Number($('testAmount').value||0),title:$('testTitle').value.trim(),message:$('testMessage').value.trim(),tts:$('testTts').checked,rarity:type==='drop'?'LEGENDARY':'',icon:type==='drop'?'👑':type==='challenge'?'🎯':'✦',soundUrl:scene().soundUrl||''};
}
function populateTestForm(){
  if(sceneKey==='support'){$('testName').value='Ayesha';$('testAmount').value=1000;$('testTitle').value='Support';$('testMessage').value='That clutch was actually insane!';$('testTts').checked=true;}
  if(sceneKey==='drop'){$('testName').value='Hamza';$('testAmount').value=10000;$('testTitle').value='Crown Drop';$('testMessage').value='Crown Drop incoming!';$('testTts').checked=true;}
  if(sceneKey==='challenge'){$('testName').value='Ali';$('testAmount').value=2500;$('testTitle').value='Viewer Picks My Loadout';$('testMessage').value='Shotgun-only next round.';$('testTts').checked=false;}
}
async function sendCurrentSceneToOverlay(){api.save(layout);const btn=$('testInObs');btn.disabled=true;btn.textContent='Sending…';try{const result=await window.StreamPreviewTransport.send({kind:'studio-preview',event:testEvent(),layout:deep(layout)});setStatus(result.cloud?'Sent to browser + OBS Realtime.':'Sent to browser preview. Configure Supabase for OBS-app testing.',result.cloud?'success':'warn');}catch(e){setStatus(`Preview failed: ${e.message||e}`,'error')}finally{btn.disabled=false;btn.textContent='📺 Test current scene in OBS'}}

function eventData(){
  const e=testEvent(),money=`${window.STREAM_CONFIG?.currencyLabel||'Rs'} ${Number(e.amount||0).toLocaleString()}`;
  return {label:e.type==='drop'?`${e.rarity||'RARE'} DROP`:e.type==='challenge'?'CHALLENGE UNLOCKED':e.tts?'TTS SUPPORT':'SUPPORT',name:e.name||'Anonymous',amount:money,title:e.title||'',message:e.message?`“${e.message}”`:'',icon:e.icon,ttsBadge:e.tts?'🔊 TTS':'',dropMedia:''};
}
function valueFor(el){const d=eventData();return el.role?(d[el.role]??el.text??''):(el.text||'');}

function computeFitScale(){const pad=36;const w=Math.max(320,viewport.clientWidth-pad),h=Math.max(220,viewport.clientHeight-pad);return Math.min(w/layout.canvas.width,h/layout.canvas.height,1);}
function setZoom(value){zoomMode=value;if(value==='fit')stageScale=computeFitScale();else stageScale=Number(value);stageScale=clamp(stageScale,.15,1.25);stageWrap.style.width=`${layout.canvas.width*stageScale}px`;stageWrap.style.height=`${layout.canvas.height*stageScale}px`;stage.style.width=`${layout.canvas.width}px`;stage.style.height=`${layout.canvas.height}px`;stage.style.transform=`scale(${stageScale})`;stage.style.transformOrigin='top left';$('zoomSelect').value=value==='fit'?'fit':String([.25,.5,.75,1].reduce((a,b)=>Math.abs(b-stageScale)<Math.abs(a-stageScale)?b:a,.5));hideGuides();}
function adjustZoom(delta){const next=clamp(stageScale+delta,.15,1.25);zoomMode=String(next);setZoom(next)}

function stagePoint(evt){const r=stageWrap.getBoundingClientRect();return{x:(evt.clientX-r.left)/stageScale,y:(evt.clientY-r.top)/stageScale};}
function hideGuides(){guideV.hidden=true;guideH.hidden=true;}
function showGuideX(x){guideV.hidden=false;guideV.style.left=`${x*stageScale}px`;}
function showGuideY(y){guideH.hidden=false;guideH.style.top=`${y*stageScale}px`;}
function snapMove(el,x,y){
  const threshold=8;
  const candidatesX=[0,layout.canvas.width/2,layout.canvas.width];
  const candidatesY=[0,layout.canvas.height/2,layout.canvas.height];
  for(const other of scene().elements){if(other===el||other.visible===false)continue;candidatesX.push(other.x,other.x+other.w/2,other.x+other.w);candidatesY.push(other.y,other.y+other.h/2,other.y+other.h)}
  const ownX=[x,x+el.w/2,x+el.w],ownY=[y,y+el.h/2,y+el.h];
  let bestX=null,bestDX=Infinity,bestY=null,bestDY=Infinity;
  candidatesX.forEach(cx=>ownX.forEach(ox=>{const d=cx-ox;if(Math.abs(d)<Math.abs(bestDX)&&Math.abs(d)<=threshold){bestDX=d;bestX=cx}}));
  candidatesY.forEach(cy=>ownY.forEach(oy=>{const d=cy-oy;if(Math.abs(d)<Math.abs(bestDY)&&Math.abs(d)<=threshold){bestDY=d;bestY=cy}}));
  if(bestX!==null){x+=bestDX;showGuideX(bestX)}else guideV.hidden=true;
  if(bestY!==null){y+=bestDY;showGuideY(bestY)}else guideH.hidden=true;
  return{x,y};
}

function elementDom(el){
  const n=document.createElement('div');n.className=`stage-element ${el.type==='media'?'media-element':''} ${el.locked?'locked':''} ${selectedId===el.id?'selected':''}`;n.dataset.id=el.id;
  Object.assign(n.style,{left:`${el.x}px`,top:`${el.y}px`,width:`${el.w}px`,height:`${el.h}px`,zIndex:el.z,opacity:el.visible===false?.22:el.opacity,transform:`rotate(${el.rotation||0}deg)`,color:el.color||'#fff',background:el.background||'transparent',border:`${el.borderWidth||0}px solid ${el.borderColor||'transparent'}`,borderRadius:`${el.borderRadius||0}px`,fontSize:`${el.fontSize||24}px`,fontWeight:el.fontWeight||700,textAlign:el.align||'left'});
  const content=document.createElement('div');content.className='content';content.style.justifyContent=el.align==='center'?'center':el.align==='right'?'flex-end':'flex-start';content.style.padding=`${el.padding||0}px`;
  if(el.type==='media'){
    const src=el.src||'';
    if(src){const isVid=/^(blob:)|\.(webm|mp4|mov)(\?|$)/i.test(src) || sessionAssets.find(a=>a.url===src)?.kind==='video';const m=document.createElement(isVid?'video':'img');m.src=src;m.style.objectFit=el.objectFit||'contain';if(isVid){m.autoplay=true;m.loop=true;m.muted=true;m.playsInline=true;}content.appendChild(m)}
    else{const ph=document.createElement('div');ph.className='media-placeholder';ph.textContent=el.role==='dropMedia'?'DROP MEDIA':'MEDIA';content.appendChild(ph)}
  }else content.textContent=valueFor(el);
  n.appendChild(content);
  n.addEventListener('pointerdown',e=>startMove(e,el));n.addEventListener('click',e=>{e.stopPropagation();selectedId=el.id;renderInspectorAndLayers()});
  if(selectedId===el.id&&!el.locked){
    ['nw','n','ne','e','se','s','sw','w'].forEach(dir=>{const h=document.createElement('span');h.className=`handle ${dir}`;h.dataset.resize=dir;h.addEventListener('pointerdown',e=>startResize(e,el,dir));n.appendChild(h)});
    const stick=document.createElement('span');stick.className='rotate-stick';n.appendChild(stick);const rh=document.createElement('span');rh.className='rotate-handle';rh.addEventListener('pointerdown',e=>startRotate(e,el));n.appendChild(rh);
  }
  return n;
}
function renderStageOnly(){stage.innerHTML='';scene().elements.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(el=>stage.appendChild(elementDom(el)));}
function renderScenes(){const box=$('sceneTabs');box.innerHTML='';Object.entries(layout.scenes).forEach(([key,sc])=>{const b=document.createElement('button');b.textContent=sc.name;b.className=key===sceneKey?'active':'';b.onclick=()=>{sceneKey=key;layout.activeScene=key;selectedId=null;populateTestForm();render();};box.appendChild(b)});}
function renderLayers(){const box=$('layerList');box.innerHTML='';scene().elements.slice().sort((a,b)=>(b.z||0)-(a.z||0)).forEach(el=>{const row=document.createElement('div');row.className=`layer-item ${selectedId===el.id?'active':''}`;const icon=document.createElement('span');icon.textContent=el.type==='text'?'T':el.type==='media'?'▣':'▭';const name=document.createElement('div');name.innerHTML=`<span>${el.id}</span><small>${el.role||el.type}</small>`;const tools=document.createElement('div');tools.className='layer-icons';const lock=document.createElement('button');lock.textContent=el.locked?'🔒':'🔓';lock.onclick=(e)=>{e.stopPropagation();el.locked=!el.locked;snapshot();render()};const vis=document.createElement('button');vis.textContent=el.visible===false?'🙈':'👁';vis.onclick=(e)=>{e.stopPropagation();el.visible=el.visible===false;snapshot();render()};tools.append(lock,vis);row.append(icon,name,tools);row.onclick=()=>{selectedId=el.id;renderInspectorAndLayers()};box.appendChild(row)});}
function renderSceneSettings(){$('sceneDuration').value=scene().durationMs||5500;$('sceneSound').value=scene().soundUrl||'';$('sceneBg').value=scene().background||'#000000';}
function renderInspector(){const el=getEl();$('emptyInspector').hidden=!!el;$('inspector').hidden=!el;if(!el)return;$('selectedLabel').textContent=el.id;$('selectedType').textContent=`${el.type}${el.role?` · ${el.role}`:''}`;$('lockEl').textContent=el.locked?'🔒':'🔓';$('hideEl').textContent=el.visible===false?'🙈':'👁';const vals={pId:el.id,pRole:el.role||'',pText:el.text||'',pSrc:el.src||'',pX:Math.round(el.x),pY:Math.round(el.y),pW:Math.round(el.w),pH:Math.round(el.h),pRotate:Math.round(el.rotation||0),pOpacity:el.opacity??1,pRadius:el.borderRadius||0,pFont:el.fontSize||24,pWeight:el.fontWeight||700,pColor:toHex(el.color,'#ffffff'),pBg:toHex(el.background,'#000000'),pBorder:toHex(el.borderColor,'#333333'),pBorderW:el.borderWidth||0,pAlign:el.align||'left',pEnter:el.enterAnimation||'none',pExit:el.exitAnimation||'none',pAnimMs:el.animationMs??500,pFit:el.objectFit||'contain'};for(const [id,val] of Object.entries(vals)){if($(id))$(id).value=val}}
function renderInspectorAndLayers(){renderStageOnly();renderLayers();renderInspector();}
function render(){normalizeLayout();$('sceneName').textContent=scene().name;renderScenes();renderStageOnly();renderLayers();renderInspector();renderSceneSettings();setZoom(zoomMode);}
function toHex(v,fallback){if(!v||v==='transparent'||v.startsWith('rgba'))return fallback;const m=v.match(/^#([0-9a-f]{6})$/i);return m?v:fallback;}

function startMove(e,el){if(e.button!==0||el.locked)return;if(e.target.dataset.resize||e.target.classList.contains('rotate-handle'))return;e.stopPropagation();selectedId=el.id;const p=stagePoint(e);mode={type:'move',el,start:p,x:el.x,y:el.y,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId);renderInspectorAndLayers();}
function startResize(e,el,dir){e.stopPropagation();selectedId=el.id;const p=stagePoint(e);mode={type:'resize',el,dir,start:p,x:el.x,y:el.y,w:el.w,h:el.h,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId);}
function startRotate(e,el){e.stopPropagation();selectedId=el.id;const p=stagePoint(e);const cx=el.x+el.w/2,cy=el.y+el.h/2;const start=Math.atan2(p.y-cy,p.x-cx)*180/Math.PI;mode={type:'rotate',el,cx,cy,start,rotation:el.rotation||0,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId);}
function onPointerMove(e){if(!mode)return;const p=stagePoint(e),el=mode.el;if(mode.type==='move'){let x=mode.x+(p.x-mode.start.x),y=mode.y+(p.y-mode.start.y);({x,y}=snapMove(el,x,y));el.x=clamp(x,-el.w+20,layout.canvas.width-20);el.y=clamp(y,-el.h+20,layout.canvas.height-20);mode.moved=true}
  if(mode.type==='resize'){const dx=p.x-mode.start.x,dy=p.y-mode.start.y,min=20;let{x,y,w,h}=mode;const d=mode.dir;if(d.includes('e'))w=Math.max(min,mode.w+dx);if(d.includes('s'))h=Math.max(min,mode.h+dy);if(d.includes('w')){w=Math.max(min,mode.w-dx);x=mode.x+(mode.w-w)}if(d.includes('n')){h=Math.max(min,mode.h-dy);y=mode.y+(mode.h-h)}el.x=x;el.y=y;el.w=w;el.h=h;mode.moved=true;hideGuides()}
  if(mode.type==='rotate'){const ang=Math.atan2(p.y-mode.cy,p.x-mode.cx)*180/Math.PI;let rot=mode.rotation+(ang-mode.start);if(e.shiftKey)rot=Math.round(rot/15)*15;el.rotation=((rot%360)+360)%360;mode.moved=true;hideGuides()}
  renderStageOnly();renderInspector();}
function onPointerUp(){if(!mode)return;const changed=mode.moved;mode=null;hideGuides();if(changed)snapshot();renderInspectorAndLayers();}
window.addEventListener('pointermove',onPointerMove);window.addEventListener('pointerup',onPointerUp);stage.addEventListener('pointerdown',e=>{if(e.target===stage){selectedId=null;renderInspectorAndLayers()}});

function propChange(e){const el=getEl();if(!el)return;const map={pRole:'role',pText:'text',pSrc:'src',pX:'x',pY:'y',pW:'w',pH:'h',pRotate:'rotation',pFont:'fontSize',pWeight:'fontWeight',pColor:'color',pBg:'background',pBorder:'borderColor',pBorderW:'borderWidth',pRadius:'borderRadius',pOpacity:'opacity',pAlign:'align',pEnter:'enterAnimation',pExit:'exitAnimation',pAnimMs:'animationMs',pFit:'objectFit'};const key=map[e.target.id];if(!key)return;const numeric=['x','y','w','h','rotation','fontSize','fontWeight','borderWidth','borderRadius','opacity','animationMs'].includes(key);el[key]=numeric?Number(e.target.value):e.target.value;renderStageOnly();renderLayers();}
['pRole','pText','pSrc','pX','pY','pW','pH','pRotate','pFont','pWeight','pColor','pBg','pBorder','pBorderW','pRadius','pOpacity','pAlign','pEnter','pExit','pAnimMs','pFit'].forEach(id=>$(id).addEventListener('input',propChange));
['pRole','pText','pSrc','pX','pY','pW','pH','pRotate','pFont','pWeight','pColor','pBg','pBorder','pBorderW','pRadius','pOpacity','pAlign','pEnter','pExit','pAnimMs','pFit'].forEach(id=>$(id).addEventListener('change',()=>snapshot()));

function addElement(type,overrides={}){const base={id:uniqueId(type),type,role:'',x:760,y:470,w:type==='text'?400:320,h:type==='text'?80:200,z:maxZ()+1,visible:true,locked:false,text:type==='text'?'Custom text':'',src:'',fontSize:42,fontWeight:800,color:'#ffffff',background:type==='box'?'rgba(18,18,24,.85)':'transparent',borderColor:'#33343d',borderWidth:type==='box'?2:0,borderRadius:24,opacity:1,align:'center',padding:8,objectFit:'contain',rotation:0,enterAnimation:'pop',exitAnimation:'fade',animationMs:500};Object.assign(base,overrides);scene().elements.push(base);selectedId=base.id;snapshot();render();return base;}
document.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>addElement(btn.dataset.add));
$('deleteEl').onclick=()=>deleteSelected();
function deleteSelected(){if(!selectedId)return;scene().elements=scene().elements.filter(e=>e.id!==selectedId);selectedId=null;snapshot();render();}
function duplicateSelected(){const el=getEl();if(!el)return;const c=deep(el);c.id=uniqueId(el.type);c.x+=30;c.y+=30;c.z=maxZ()+1;scene().elements.push(c);selectedId=c.id;snapshot();render();}
$('duplicateEl').onclick=duplicateSelected;$('bringFront').onclick=()=>{const el=getEl();if(el){el.z=maxZ()+1;snapshot();render()}};$('sendBack').onclick=()=>{const el=getEl();if(el){el.z=minZ()-1;snapshot();render()}};$('lockEl').onclick=()=>{const el=getEl();if(el){el.locked=!el.locked;snapshot();render()}};$('hideEl').onclick=()=>{const el=getEl();if(el){el.visible=el.visible===false;snapshot();render()}};

$('sceneDuration').addEventListener('change',e=>{scene().durationMs=Math.max(500,Number(e.target.value)||5500);snapshot()});$('sceneSound').addEventListener('change',e=>{scene().soundUrl=e.target.value.trim();snapshot()});$('sceneBg').addEventListener('change',e=>{scene().background=e.target.value;snapshot()});

function previewInEditor(){const d=eventData();stage.classList.remove('previewing');void stage.offsetWidth;stage.classList.add('previewing');[...stage.querySelectorAll('.stage-element')].forEach((node,i)=>{const el=scene().elements.find(x=>x.id===node.dataset.id);const anim=el?.enterAnimation||'fade',ms=el?.animationMs||500;const frames=animFrames(anim);node.animate(frames,{duration:ms,delay:i*25,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});const content=node.querySelector('.content');if(content&&el?.role&&d[el.role]!=null){if(el.type!=='media')content.textContent=d[el.role]}});if(testEvent().tts&&testEvent().message&&'speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`${testEvent().name} says: ${testEvent().message}`);u.lang=window.STREAM_CONFIG?.tts?.language||'en-GB';u.volume=window.STREAM_CONFIG?.tts?.volume??1;speechSynthesis.speak(u)}setStatus('Editor preview played.','success')}
function animFrames(name){if(name==='pop')return[{opacity:0,transform:'scale(.72)'},{opacity:1,transform:'scale(1)'}];if(name==='slide-up')return[{opacity:0,transform:'translateY(60px)'},{opacity:1,transform:'translateY(0)'}];if(name==='slide-left')return[{opacity:0,transform:'translateX(80px)'},{opacity:1,transform:'translateX(0)'}];if(name==='bounce')return[{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1.08)',offset:.7},{opacity:1,transform:'scale(1)'}];return[{opacity:0},{opacity:1}]}
$('testEditor').onclick=previewInEditor;

function loadPersistedAssets(){try{return JSON.parse(localStorage.getItem('streamnest:urlAssets')||'[]')}catch(_){return[]}}

let storageClient=null,storageUser=null;
function initStorageClient(){
  const c=window.STREAM_CONFIG?.realtime||{};
  if(!window.supabase?.createClient||!c.supabaseUrl||!c.publishableKey)return null;
  if(!storageClient)storageClient=window.supabase.createClient(c.supabaseUrl,c.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return storageClient;
}
async function refreshStorageAuth(){
  const c=initStorageClient(); if(!c)return;
  const {data}=await c.auth.getSession(); storageUser=data?.session?.user||null;
  const st=$('storageStatus'),dot=$('storageDot'),out=$('storageSignOut');
  if(storageUser){st.textContent=`Storage connected · ${storageUser.email||'admin'}`;dot.classList.add('cloud');out.hidden=false;$('storageSignIn').hidden=true;$('storageSignUp').hidden=true;}
  else{st.textContent='Storage signed out';dot.classList.remove('cloud');out.hidden=true;$('storageSignIn').hidden=false;$('storageSignUp').hidden=false;}
}
async function storageSignIn(create=false){
  const c=initStorageClient(); if(!c)return setStatus('Supabase client unavailable.','error');
  const email=$('storageEmail').value.trim(),password=$('storagePassword').value;
  if(!email||!password)return setStatus('Enter your admin email and password.','warn');
  const r=create?await c.auth.signUp({email,password}):await c.auth.signInWithPassword({email,password});
  if(r.error)return setStatus(`Storage auth: ${r.error.message}`,'error');
  await refreshStorageAuth();
  setStatus(create?'Admin account created. Confirm email first if Supabase requires it.':'Storage signed in. Permanent uploads are enabled.','success');
}
async function uploadPermanentAsset(file){
  const c=initStorageClient();
  if(!c||!storageUser)throw new Error('Sign in to Storage first');
  const safe=(file.name||'asset').replace(/[^a-zA-Z0-9._-]+/g,'-');
  const path=`${storageUser.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}`;
  const {data,error}=await c.storage.from('stream-assets').upload(path,file,{contentType:file.type||undefined,cacheControl:'3600',upsert:false});
  if(error)throw error;
  const pub=c.storage.from('stream-assets').getPublicUrl(data.path);
  const url=pub?.data?.publicUrl; if(!url)throw new Error('Could not create public asset URL');
  return {id:uniqueId('asset'),name:file.name,url,kind:assetKind(url,file.type),session:false,path:data.path};
}

let urlAssets=loadPersistedAssets();
function assetKind(url,type=''){if(type.startsWith('image/'))return'image';if(type.startsWith('video/'))return'video';if(type.startsWith('audio/'))return'audio';if(/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url))return'audio';if(/\.(webm|mp4|mov)(\?|$)/i.test(url))return'video';return'image'}
function renderAssets(){const box=$('assetLibrary');box.innerHTML='';const all=[...urlAssets,...sessionAssets];if(!all.length){box.innerHTML='<div style="grid-column:1/-1;color:#666;font-size:9px;padding:8px 0">Upload a file or add a URL.</div>';return}all.forEach(asset=>{const card=document.createElement('div');card.className='asset-card';card.draggable=true;card.title=asset.kind==='audio'?'Click to use as this scene sound':'Drag onto the canvas';const thumb=document.createElement('div');thumb.className='thumb';if(asset.kind==='image'){const img=document.createElement('img');img.src=asset.url;thumb.appendChild(img)}else if(asset.kind==='video'){const v=document.createElement('video');v.src=asset.url;v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;thumb.appendChild(v)}else thumb.textContent='🔊';const meta=document.createElement('div');meta.className='meta';meta.textContent=asset.name;const kind=document.createElement('span');kind.className='kind';kind.textContent=asset.kind.toUpperCase();card.append(thumb,meta,kind);card.addEventListener('dragstart',e=>e.dataTransfer.setData('application/json',JSON.stringify(asset)));card.addEventListener('click',()=>{if(asset.kind==='audio'){scene().soundUrl=asset.url;$('sceneSound').value=asset.url;snapshot();setStatus(`${asset.name} set as scene sound.`, 'success')}});box.appendChild(card)})}
$('assetUpload').addEventListener('change',async e=>{
  const files=[...e.target.files]; e.target.value='';
  if(!files.length)return;
  if(!storageUser){setStatus('Sign in to Supabase Storage before uploading.','warn');return;}
  setStatus(`Uploading ${files.length} asset${files.length===1?'':'s'} to Supabase Storage…`);
  let ok=0;
  for(const file of files){
    try{const asset=await uploadPermanentAsset(file);urlAssets.push(asset);ok++;localStorage.setItem('streamnest:urlAssets',JSON.stringify(urlAssets));renderAssets();}
    catch(err){setStatus(`Upload failed for ${file.name}: ${err.message||err}`,'error');}
  }
  if(ok)setStatus(`${ok} permanent asset${ok===1?'':'s'} uploaded. OBS will use the same HTTPS URL.`, 'success');
});
$('addAssetUrl').onclick=()=>{$('assetUrlName').value='';$('assetUrlValue').value='';$('assetUrlDialog').showModal()};$('assetUrlForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;const name=$('assetUrlName').value.trim(),url=$('assetUrlValue').value.trim();if(!name||!url){e.preventDefault();return}urlAssets.push({id:uniqueId('asset'),name,url,kind:assetKind(url),session:false});localStorage.setItem('streamnest:urlAssets',JSON.stringify(urlAssets));renderAssets();setStatus('URL asset added.','success')});
stageWrap.addEventListener('dragover',e=>e.preventDefault());stageWrap.addEventListener('drop',e=>{e.preventDefault();let asset;try{asset=JSON.parse(e.dataTransfer.getData('application/json'))}catch(_){return}if(!asset)return;if(asset.kind==='audio'){scene().soundUrl=asset.url;$('sceneSound').value=asset.url;snapshot();return}const p=stagePoint(e);addElement('media',{x:p.x-180,y:p.y-110,w:360,h:220,src:asset.url,text:asset.name,objectFit:'contain'})});

$('saveLayout').onclick=()=>{api.save(layout);setStatus('Layout saved in this browser.','success')};$('resetLayout').onclick=()=>{layout=deep(window.STREAM_OVERLAY_DEFAULTS);normalizeLayout();sceneKey=layout.activeScene||'support';selectedId=null;snapshot();populateTestForm();render();setStatus('Default layout restored. Save to keep it.','warn')};$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;
$('testInObs').onclick=sendCurrentSceneToOverlay;$('saveRealtime').onclick=saveRealtimeSettings;$('copyObsUrl').onclick=copyObsUrl;['sbUrl','sbKey','sbChannel'].forEach(id=>$(id).addEventListener('input',()=>{$('obsUrl').value=buildObsUrl({supabaseUrl:$('sbUrl').value.trim(),publishableKey:$('sbKey').value.trim(),channel:$('sbChannel').value.trim()})}));

$('zoomSelect').addEventListener('change',e=>setZoom(e.target.value));$('zoomIn').onclick=()=>adjustZoom(.1);$('zoomOut').onclick=()=>adjustZoom(-.1);
window.addEventListener('resize',()=>{if(zoomMode==='fit')setZoom('fit')});
window.addEventListener('keydown',e=>{if(isTypingTarget(e.target))return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}if(mod&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected();return}if((e.key==='Delete'||e.key==='Backspace')&&selectedId){e.preventDefault();deleteSelected();return}const el=getEl();if(!el||el.locked)return;const step=e.shiftKey?10:1;if(e.key==='ArrowLeft'){el.x-=step}else if(e.key==='ArrowRight'){el.x+=step}else if(e.key==='ArrowUp'){el.y-=step}else if(e.key==='ArrowDown'){el.y+=step}else return;e.preventDefault();renderStageOnly();renderInspector();clearTimeout(window.__nudgeTimer);window.__nudgeTimer=setTimeout(()=>snapshot(),180)});

async function initTransport(){const cloud=window.StreamPreviewTransport.cloudConfigured();if(!cloud){$('transportLabel').textContent='Browser preview ready';$('transportHelp').textContent='Open Live Overlay in another tab for instant testing. Configure Supabase for OBS-app testing.';return}$('transportLabel').textContent='Connecting to Supabase…';const state=await window.StreamPreviewTransport.connectCloud();if(state.connected){$('transportDot').classList.add('cloud');$('transportLabel').textContent='OBS cloud preview connected';$('transportHelp').textContent='Test current scene can reach any overlay subscribed to this channel, including OBS.'}else{$('transportLabel').textContent='Cloud preview unavailable';$('transportHelp').textContent='Local browser preview still works. Check Supabase URL/key/channel.'}}

populateTestForm();renderAssets();render();loadRealtimeForm();initTransport();

$('storageSignIn').onclick=()=>storageSignIn(false);
$('storageSignUp').onclick=()=>storageSignIn(true);
$('storageSignOut').onclick=async()=>{const c=initStorageClient();if(c)await c.auth.signOut();storageUser=null;await refreshStorageAuth();setStatus('Storage signed out.','warn')};
initStorageClient()?.auth.onAuthStateChange(()=>setTimeout(refreshStorageAuth,0));
refreshStorageAuth();
