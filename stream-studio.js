(() => {
  const $ = id => document.getElementById(id);
  const deep = v => JSON.parse(JSON.stringify(v));
  const money = n => `${window.STREAM_CONFIG?.currencyLabel || 'Rs'} ${Number(n || 0).toLocaleString()}`;
  const BASE_LAYOUT = window.StreamOverlayLayout.defaults();
  const STORE_TYPES = 'streamnest:donationTypes:v1';
  const STORE_LAYOUTS = 'streamnest:studioProfileLayouts:v1';
  const STORE_PROFILE = 'streamnest:activeSourceProfile:v1';

  const profiles = {
    'landscape-1080': { id:'landscape-1080', name:'1080p Landscape', short:'1080p', width:1920, height:1080, ratio:'16:9', use:'Standard Twitch / YouTube / Kick' },
    'landscape-2k': { id:'landscape-2k', name:'2K Landscape', short:'2K', width:2560, height:1440, ratio:'16:9', use:'High-resolution landscape stream' },
    'vertical-short': { id:'vertical-short', name:'Short / Vertical', short:'9:16', width:1080, height:1920, ratio:'9:16', use:'TikTok / Shorts / vertical live' }
  };
  const placements = [
    ['top-left','Top Left'],['top-center','Top Center'],['top-right','Top Right'],
    ['center-left','Center Left'],['center-center','Center'],['center-right','Center Right'],
    ['bottom-left','Bottom Left'],['bottom-center','Bottom Center'],['bottom-right','Bottom Right']
  ];
  const sizes = [['compact','Compact'],['standard','Standard'],['large','Large'],['takeover','Takeover']];
  const templateMeta = {
    support:{name:'Support / TTS',icon:'💬',description:'Normal support with an optional spoken message.',kind:'support',price:500,pricingMode:'minimum',tts:true,label:'TTS SUPPORT'},
    drop:{name:'Rare Drops',icon:'✨',description:'Premium media-heavy alerts and signature drops.',kind:'drop',price:2500,pricingMode:'fixed',tts:true,label:'RARE DROP'},
    challenge:{name:'Challenges',icon:'🎯',description:'Paid pre-approved stream challenges.',kind:'challenge',price:1000,pricingMode:'fixed',tts:false,label:'CHALLENGE UNLOCKED'},
    sound:{name:'Sound Alert',icon:'🔊',description:'Viewer triggers a sound effect on stream.',kind:'custom',price:500,pricingMode:'fixed',tts:false,label:'SOUND ALERT'},
    media:{name:'Media Alert',icon:'🎬',description:'Viewer triggers an image, GIF or video alert.',kind:'custom',price:1000,pricingMode:'fixed',tts:true,label:'MEDIA ALERT'},
    reward:{name:'Custom Reward',icon:'🎁',description:'A custom paid interaction you define.',kind:'custom',price:1000,pricingMode:'fixed',tts:false,label:'STREAM REWARD'}
  };

  function defaultType(id, sceneKey, template) {
    const t = templateMeta[template];
    return {
      id, sceneKey, template, name:t.name, icon:t.icon, description:t.description, kind:t.kind,
      price:t.price, pricingMode:t.pricingMode, enabled:true, ttsEnabled:t.tts, label:t.label,
      appearance:{accent:'#ff6a1a', text:'#ffffff', card:'#0c0c12', border:'#34343d', radius:36, opacity:.93, showIcon:true, showAmount:true, showName:true, showMessage:true},
      audio:{voice:window.STREAM_CONFIG?.tts?.defaultVoice || 'serafina', soundUrl:'', mediaUrl:'', soundVolume:.88},
      motion:{enter:'pop', exit:'fade', animationMs:500, durationMs:5500},
      placements:{
        'landscape-1080':{position:template==='drop'?'center-center':'bottom-center',size:template==='drop'?'large':'standard',safe:true},
        'landscape-2k':{position:template==='drop'?'center-center':'bottom-center',size:template==='drop'?'large':'standard',safe:true},
        'vertical-short':{position:template==='drop'?'center-center':'bottom-center',size:template==='drop'?'large':'large',safe:true}
      }
    };
  }

  function loadTypes(){
    try { const saved = JSON.parse(localStorage.getItem(STORE_TYPES)||'null'); if(Array.isArray(saved)&&saved.length) return saved; } catch(_){}
    return [defaultType('support','support','support'),defaultType('drop','drop','drop'),defaultType('challenge','challenge','challenge')];
  }
  function scaleLayout(layout,w,h){
    const out=deep(layout),sx=w/out.canvas.width,sy=h/out.canvas.height;
    out.canvas={width:w,height:h};
    Object.values(out.scenes||{}).forEach(sc=>sc.elements?.forEach(el=>{el.x*=sx;el.y*=sy;el.w*=sx;el.h*=sy;el.fontSize=(el.fontSize||24)*Math.min(sx,sy);el.borderRadius=(el.borderRadius||0)*Math.min(sx,sy);el.padding=(el.padding||0)*Math.min(sx,sy);}));
    return out;
  }
  function loadLayouts(){
    try { const saved=JSON.parse(localStorage.getItem(STORE_LAYOUTS)||'null'); if(saved&&typeof saved==='object') return saved; }catch(_){}
    return {
      'landscape-1080':deep(BASE_LAYOUT),
      'landscape-2k':scaleLayout(BASE_LAYOUT,2560,1440),
      'vertical-short':scaleLayout(BASE_LAYOUT,1080,1920)
    };
  }
  let types=loadTypes();
  let layouts=loadLayouts();
  let profileId=localStorage.getItem(STORE_PROFILE)||'landscape-1080';
  if(!profiles[profileId]) profileId='landscape-1080';
  let typeId=types[0]?.id||'support';
  let selectedTemplate='sound';
  let showSafe=true,showGrid=false;

  function currentProfile(){return profiles[profileId]}
  function currentType(){return types.find(t=>t.id===typeId)||types[0]}
  function currentLayout(){return layouts[profileId]}
  function currentScene(){return currentLayout().scenes[currentType().sceneKey]}
  function placement(){return currentType().placements[profileId]||(currentType().placements[profileId]={position:'bottom-center',size:'standard',safe:true})}
  function saveAll(){localStorage.setItem(STORE_TYPES,JSON.stringify(types));localStorage.setItem(STORE_LAYOUTS,JSON.stringify(layouts));localStorage.setItem(STORE_PROFILE,profileId);toast('Studio saved');}
  function toast(text){const n=$('scToast');n.textContent=text;n.classList.add('show');clearTimeout(window.__scToast);window.__scToast=setTimeout(()=>n.classList.remove('show'),1600)}

  function ensureScene(type){
    for(const [pid,layout] of Object.entries(layouts)){
      if(layout.scenes[type.sceneKey]) continue;
      const source=layout.scenes.support||Object.values(layout.scenes)[0];
      const sc=deep(source); sc.name=type.name; sc.durationMs=type.motion.durationMs;
      sc.elements.forEach(el=>{if(el.role==='label')el.text=type.label;if(el.role==='icon')el.text=type.icon;});
      layout.scenes[type.sceneKey]=sc;
      applyTypeStyleToLayout(type,pid);
      applyPlacementToLayout(type,pid,true);
    }
  }
  types.forEach(ensureScene);

  function renderSources(){
    const box=$('sourceProfiles');box.innerHTML='';
    Object.values(profiles).forEach(p=>{const b=document.createElement('button');b.className=`source-item ${p.id===profileId?'active':''}`;b.innerHTML=`<span class="source-icon ${p.id==='vertical-short'?'vertical':''}">${p.ratio}</span><span><b>${p.name}</b><small>${p.width} × ${p.height}</small></span>`;b.onclick=()=>switchProfile(p.id);box.appendChild(b)});
  }
  function renderTypes(){
    const box=$('donationTypes');box.innerHTML='';
    types.forEach(t=>{const b=document.createElement('button');b.className=`type-item ${t.id===typeId?'active':''}`;b.innerHTML=`<span class="type-icon">${t.icon}</span><span><b>${t.name}</b><small>${t.pricingMode==='free'?'Event only':money(t.price)}</small></span><span class="type-state ${t.enabled?'on':''}">${t.enabled?'ON':'OFF'}</span>`;b.onclick=()=>{typeId=t.id;renderAll()};box.appendChild(b)});
  }
  function renderHeader(){const p=currentProfile(),t=currentType();$('sourcePill').textContent=p.name;$('sourceResolution').textContent=`${p.width} × ${p.height}`;$('sourceUse').textContent=p.use;$('typeTitle').textContent=`${t.icon} ${t.name}`;$('typeSubtitle').textContent=t.description;$('previewHint').textContent=`Placement preset: ${placements.find(x=>x[0]===placement().position)?.[1]||'Custom'}`;}

  function previewData(){const t=currentType();return{label:t.label,name:'ChoozaFan',amount:t.pricingMode==='free'?'DEMO':money(t.price),title:t.name,message:'“This is how the alert will look on stream.”',icon:t.icon,ttsBadge:t.ttsEnabled?'🔊 TTS':'',dropMedia:t.audio.mediaUrl||''};}
  function roleValue(el,d){return el.role?(d[el.role]??el.text??''):(el.text||'')}
  function renderPreview(){
    const p=currentProfile(),stage=$('previewStage'),scene=currentScene(),viewport=$('previewViewport');
    if(!scene)return;
    const maxW=Math.max(320,viewport.clientWidth-44),maxH=Math.max(300,viewport.clientHeight-44);const s=Math.min(maxW/p.width,maxH/p.height,.55);
    stage.style.width=`${p.width*s}px`;stage.style.height=`${p.height*s}px`;
    const sceneRoot=$('previewScene');sceneRoot.style.width=`${p.width}px`;sceneRoot.style.height=`${p.height}px`;sceneRoot.style.transform=`scale(${s})`;sceneRoot.innerHTML='';
    const safe=$('safeArea'),m=.06;safe.hidden=!showSafe;safe.style.left=`${p.width*m*s}px`;safe.style.top=`${p.height*m*s}px`;safe.style.width=`${p.width*(1-2*m)*s}px`;safe.style.height=`${p.height*(1-2*m)*s}px`;$('previewGrid').hidden=!showGrid;
    const d=previewData();
    scene.elements.slice().sort((a,b)=>(a.z||0)-(b.z||0)).forEach(el=>{if(el.visible===false)return;const n=document.createElement('div');n.className=`preview-el enter-${el.enterAnimation||'fade'}`;Object.assign(n.style,{left:`${el.x}px`,top:`${el.y}px`,width:`${el.w}px`,height:`${el.h}px`,zIndex:el.z||1,color:el.color||'#fff',background:el.background||'transparent',border:`${el.borderWidth||0}px solid ${el.borderColor||'transparent'}`,borderRadius:`${el.borderRadius||0}px`,fontSize:`${el.fontSize||24}px`,fontWeight:el.fontWeight||700,opacity:el.opacity??1,justifyContent:el.align==='center'?'center':el.align==='right'?'flex-end':'flex-start',textAlign:el.align||'left',padding:`${el.padding||0}px`,transform:`rotate(${el.rotation||0}deg)`});
      if(el.type==='media'){const src=(el.role==='dropMedia'||el.role==='media')?tMedia():el.src;if(src){const v=/\.(webm|mp4|mov)(\?|$)/i.test(src)?document.createElement('video'):document.createElement('img');v.src=src;v.style.width='100%';v.style.height='100%';v.style.objectFit=el.objectFit||'contain';if(v.tagName==='VIDEO'){v.autoplay=true;v.loop=true;v.muted=true;v.playsInline=true}n.appendChild(v)}} else n.textContent=roleValue(el,d);
      sceneRoot.appendChild(n);
    });
  }
  function tMedia(){return currentType().audio.mediaUrl||''}

  function renderPlacement(){
    const pg=$('placementGrid');pg.innerHTML='';placements.forEach(([id,label])=>{const b=document.createElement('button');b.className=`placement-btn ${placement().position===id?'active':''}`;b.dataset.placement=id;b.title=label;b.onclick=()=>{placement().position=id;applyPlacementToLayout(currentType(),profileId);renderAll()};pg.appendChild(b)});
    const sg=$('sizeChoices');sg.innerHTML='';sizes.forEach(([id,label])=>{const b=document.createElement('button');b.textContent=label;b.className=placement().size===id?'active':'';b.onclick=()=>{placement().size=id;applyPlacementToLayout(currentType(),profileId);renderAll()};sg.appendChild(b)});
    $('safePlacement').checked=placement().safe!==false;
  }

  function hexFromColor(c,fallback){if(!c)return fallback;if(/^#[0-9a-f]{6}$/i.test(c))return c;const m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);return m?'#'+[m[1],m[2],m[3]].map(x=>Number(x).toString(16).padStart(2,'0')).join(''):fallback}
  function fillControls(){
    const t=currentType(),a=t.appearance,au=t.audio,m=t.motion;
    $('accentColor').value=a.accent;$('textColor').value=a.text;$('cardColor').value=a.card;$('borderColor').value=a.border;$('cornerRadius').value=a.radius;$('cornerRadiusOut').textContent=`${a.radius}px`;$('cardOpacity').value=a.opacity;$('cardOpacityOut').textContent=`${Math.round(a.opacity*100)}%`;$('showIcon').checked=a.showIcon;$('showAmount').checked=a.showAmount;$('showName').checked=a.showName;$('showMessage').checked=a.showMessage;
    $('publicName').value=t.name;$('typeDescription').value=t.description;$('typeIcon').value=t.icon;$('typeLabel').value=t.label;$('typePrice').value=t.price;$('pricingMode').value=t.pricingMode;$('typeEnabled').checked=t.enabled;
    $('ttsEnabled').checked=t.ttsEnabled;$('ttsVoice').value=au.voice;$('soundUrl').value=au.soundUrl;$('mediaUrl').value=au.mediaUrl;$('soundVolume').value=au.soundVolume;$('soundVolumeOut').textContent=`${Math.round(au.soundVolume*100)}%`;
    $('enterAnimation').value=m.enter;$('exitAnimation').value=m.exit;$('animationMs').value=m.animationMs;$('animationMsOut').textContent=`${m.animationMs}ms`;$('durationMs').value=m.durationMs;$('durationMsOut').textContent=`${(m.durationMs/1000).toFixed(2)}s`;
  }
  function fillVoices(){const s=$('ttsVoice');s.innerHTML='';(window.STREAM_CONFIG?.tts?.voices||[]).forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=`${v.name} — ${v.style}`;s.appendChild(o)})}

  function sceneBounds(sc){const els=sc.elements.filter(e=>e.visible!==false);if(!els.length)return{x:0,y:0,w:1,h:1};const x=Math.min(...els.map(e=>e.x)),y=Math.min(...els.map(e=>e.y)),r=Math.max(...els.map(e=>e.x+e.w)),b=Math.max(...els.map(e=>e.y+e.h));return{x,y,w:r-x,h:b-y}}
  function applyPlacementToLayout(type,pid,initial=false){
    const layout=layouts[pid],p=profiles[pid],sc=layout.scenes[type.sceneKey];if(!sc)return;const st=type.placements[pid]||{position:'bottom-center',size:'standard',safe:true};const b=sceneBounds(sc);const vertical=p.height>p.width;
    const sizeMult={compact:.68,standard:1,large:1.28,takeover:1.72}[st.size]||1;
    let maxW,maxH;if(type.template==='drop'||type.template==='media'){maxW=p.width*(vertical?.83:.58);maxH=p.height*(vertical?.48:.68)}else if(type.template==='challenge'){maxW=p.width*(vertical?.82:.52);maxH=p.height*(vertical?.18:.31)}else{maxW=p.width*(vertical?.84:.47);maxH=p.height*(vertical?.16:.29)}maxW*=sizeMult;maxH*=sizeMult;if(st.size==='takeover'){maxW=p.width*.88;maxH=p.height*.82}
    const scale=Math.min(maxW/b.w,maxH/b.h);const scaledW=b.w*scale,scaledH=b.h*scale;const marginX=p.width*(st.safe!==false?.06:.025),marginY=p.height*(st.safe!==false?.06:.025);const pos=st.position.split('-');const vert=pos[0],hor=pos[1];let tx=hor==='left'?marginX:hor==='right'?p.width-marginX-scaledW:(p.width-scaledW)/2;let ty=vert==='top'?marginY:vert==='bottom'?p.height-marginY-scaledH:(p.height-scaledH)/2;
    sc.elements.forEach(el=>{el.x=tx+(el.x-b.x)*scale;el.y=ty+(el.y-b.y)*scale;el.w*=scale;el.h*=scale;el.fontSize=(el.fontSize||24)*scale;el.borderRadius=(el.borderRadius||0)*scale;el.padding=(el.padding||0)*scale;});
    if(!initial) toast(`${type.name}: ${placements.find(x=>x[0]===st.position)?.[1]} · ${sizes.find(x=>x[0]===st.size)?.[1]}`)
  }

  function rgba(hex,a){const h=hex.replace('#','');const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`}
  function applyTypeStyleToLayout(type,pid){
    const sc=layouts[pid].scenes[type.sceneKey];if(!sc)return;const a=type.appearance;
    sc.durationMs=type.motion.durationMs;sc.soundUrl=type.audio.soundUrl;sc.soundVolume=type.audio.soundVolume;
    sc.elements.forEach(el=>{
      if(el.role==='label'){el.text=type.label;el.color=a.accent}
      if(el.role==='icon'){el.text=type.icon;el.color=a.accent;el.visible=a.showIcon}
      if(el.role==='amount'){el.color=a.accent;el.visible=a.showAmount}
      if(el.role==='name'){el.color=a.text;el.visible=a.showName}
      if(el.role==='message'){el.color=a.text;el.visible=a.showMessage}
      if(el.role==='ttsBadge'){el.color=a.accent;el.visible=type.ttsEnabled}
      if(el.type==='box'){el.background=rgba(a.card,a.opacity);el.borderColor=a.border;el.borderRadius=a.radius}
      if(el.type==='media'&&(el.role==='dropMedia'||el.role==='media'))el.src=type.audio.mediaUrl||el.src;
      el.enterAnimation=type.motion.enter;el.exitAnimation=type.motion.exit;el.animationMs=type.motion.animationMs;
    });
  }
  function applyTypeStyle(type){Object.keys(layouts).forEach(pid=>applyTypeStyleToLayout(type,pid))}

  function switchProfile(id){profileId=id;localStorage.setItem(STORE_PROFILE,id);ensureScene(currentType());renderAll()}
  function renderAll(){ensureScene(currentType());applyTypeStyleToLayout(currentType(),profileId);renderSources();renderTypes();renderHeader();renderPlacement();fillControls();renderPreview();updateAdvancedLink();}
  function updateAdvancedLink(){$('openAdvancedBtn').onclick=()=>window.open(`overlay-editor.html?profile=${encodeURIComponent(profileId)}&scene=${encodeURIComponent(currentType().sceneKey)}`,'_blank')}

  function bindTabs(){document.querySelectorAll('#configTabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#configTabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===b.dataset.tab))})}
  function bindControls(){
    $('safePlacement').onchange=e=>{placement().safe=e.target.checked;applyPlacementToLayout(currentType(),profileId);renderAll()};
    ['accentColor','textColor','cardColor','borderColor'].forEach(id=>$(id).oninput=e=>{const map={accentColor:'accent',textColor:'text',cardColor:'card',borderColor:'border'};currentType().appearance[map[id]]=e.target.value;applyTypeStyle(currentType());renderPreview()});
    $('cornerRadius').oninput=e=>{currentType().appearance.radius=Number(e.target.value);$('cornerRadiusOut').textContent=`${e.target.value}px`;applyTypeStyle(currentType());renderPreview()};
    $('cardOpacity').oninput=e=>{currentType().appearance.opacity=Number(e.target.value);$('cardOpacityOut').textContent=`${Math.round(e.target.value*100)}%`;applyTypeStyle(currentType());renderPreview()};
    [['showIcon','showIcon'],['showAmount','showAmount'],['showName','showName'],['showMessage','showMessage']].forEach(([id,key])=>$(id).onchange=e=>{currentType().appearance[key]=e.target.checked;applyTypeStyle(currentType());renderPreview()});
    $('publicName').oninput=e=>{currentType().name=e.target.value||'Untitled';renderTypes();renderHeader()};$('typeDescription').oninput=e=>{currentType().description=e.target.value;renderHeader()};$('typeIcon').oninput=e=>{currentType().icon=e.target.value||'✦';applyTypeStyle(currentType());renderTypes();renderHeader();renderPreview()};$('typeLabel').oninput=e=>{currentType().label=e.target.value;applyTypeStyle(currentType());renderPreview()};$('typePrice').oninput=e=>{currentType().price=Number(e.target.value||0);renderTypes()};$('pricingMode').onchange=e=>{currentType().pricingMode=e.target.value;renderTypes()};$('typeEnabled').onchange=e=>{currentType().enabled=e.target.checked;renderTypes()};
    $('ttsEnabled').onchange=e=>{currentType().ttsEnabled=e.target.checked;applyTypeStyle(currentType());renderPreview()};$('ttsVoice').onchange=e=>currentType().audio.voice=e.target.value;$('soundUrl').oninput=e=>{currentType().audio.soundUrl=e.target.value.trim();applyTypeStyle(currentType())};$('mediaUrl').oninput=e=>{currentType().audio.mediaUrl=e.target.value.trim();applyTypeStyle(currentType());renderPreview()};$('soundVolume').oninput=e=>{currentType().audio.soundVolume=Number(e.target.value);$('soundVolumeOut').textContent=`${Math.round(e.target.value*100)}%`;applyTypeStyle(currentType())};
    $('enterAnimation').onchange=e=>{currentType().motion.enter=e.target.value;applyTypeStyle(currentType());renderPreview()};$('exitAnimation').onchange=e=>{currentType().motion.exit=e.target.value;applyTypeStyle(currentType())};$('animationMs').oninput=e=>{currentType().motion.animationMs=Number(e.target.value);$('animationMsOut').textContent=`${e.target.value}ms`;applyTypeStyle(currentType());renderPreview()};$('durationMs').oninput=e=>{currentType().motion.durationMs=Number(e.target.value);$('durationMsOut').textContent=`${(e.target.value/1000).toFixed(2)}s`;applyTypeStyle(currentType())};
    $('safeAreaBtn').onclick=()=>{showSafe=!showSafe;$('safeAreaBtn').classList.toggle('active',showSafe);renderPreview()};$('gridBtn').onclick=()=>{showGrid=!showGrid;$('gridBtn').classList.toggle('active',showGrid);renderPreview()};
    $('saveStudioBtn').onclick=saveAll;$('resetTypeBtn').onclick=resetCurrentType;$('testObsBtn').onclick=testInObs;$('publishObsBtn').onclick=publishToObs;$('copyObsProfileBtn').onclick=copyObsProfileUrl;
  }

  function genericSceneFor(template,pid){
    const layout=layouts[pid];let source;if(template==='media'||template==='drop')source=layout.scenes.drop;else if(template==='challenge')source=layout.scenes.challenge;else source=layout.scenes.support;const sc=deep(source);
    if(template==='sound'){sc.elements=sc.elements.filter(e=>e.type!=='media');}
    if(template==='media'&&!sc.elements.some(e=>e.type==='media'))sc.elements.push({id:'media',type:'media',role:'media',x:500,y:200,w:920,h:520,z:5,visible:true,src:'',fontSize:20,fontWeight:700,color:'#fff',background:'transparent',borderColor:'transparent',borderWidth:0,borderRadius:28,opacity:1,align:'center',padding:0,objectFit:'contain'});
    return sc;
  }
  function addDonationType(){
    const name=$('newTypeName').value.trim();if(!name)return;const template=selectedTemplate;const id=`custom-${Date.now().toString(36)}`,sceneKey=id;const t=defaultType(id,sceneKey,template==='reward'?'support':template);t.template=template;t.kind='custom';t.name=name;t.icon=$('newTypeIcon').value.trim()||templateMeta[template].icon;t.price=Number($('newTypePrice').value||0);t.label=name.toUpperCase();
    for(const pid of Object.keys(layouts)){layouts[pid].scenes[sceneKey]=genericSceneFor(template,pid)}types.push(t);typeId=id;applyTypeStyle(t);Object.keys(layouts).forEach(pid=>applyPlacementToLayout(t,pid,true));saveAll();renderAll();toast(`${name} added`);
  }
  function renderTemplates(){const box=$('templateGrid');box.innerHTML='';[['sound','Sound Alert'],['media','Media / GIF'],['support','Support / TTS'],['challenge','Challenge'],['reward','Custom Reward']].forEach(([id,label])=>{const t=templateMeta[id];const b=document.createElement('button');b.type='button';b.className=`template-card ${selectedTemplate===id?'active':''}`;b.innerHTML=`<b>${t.icon} ${label}</b><small>${t.description}</small>`;b.onclick=()=>{selectedTemplate=id;renderTemplates();$('newTypeName').value=t.name;$('newTypeIcon').value=t.icon;$('newTypePrice').value=t.price};box.appendChild(b)})}
  function resetCurrentType(){
    const idx=types.findIndex(t=>t.id===typeId),old=types[idx],template=(old.id==='drop'?'drop':old.id==='challenge'?'challenge':old.id==='support'?'support':old.template||'support');const fresh=defaultType(old.id,old.sceneKey,template==='reward'?'support':template);fresh.template=old.template;fresh.name=old.name;fresh.icon=old.icon;fresh.description=old.description;types[idx]=fresh;for(const pid of Object.keys(layouts)){if(['support','drop','challenge'].includes(fresh.sceneKey)){const base=pid==='landscape-1080'?deep(BASE_LAYOUT):scaleLayout(BASE_LAYOUT,profiles[pid].width,profiles[pid].height);layouts[pid].scenes[fresh.sceneKey]=base.scenes[fresh.sceneKey]}else layouts[pid].scenes[fresh.sceneKey]=genericSceneFor(fresh.template,pid);applyTypeStyleToLayout(fresh,pid);applyPlacementToLayout(fresh,pid,true)}renderAll();toast('Donation type reset')
  }

  function testEvent(){const t=currentType();return{verified:true,preview:true,demo:true,type:t.kind==='drop'?'drop':t.kind==='challenge'?'challenge':t.kind==='support'?'support':'custom',sceneKey:t.sceneKey,donationTypeId:t.id,name:'ChoozaFan',amount:t.price,title:t.name,message:'Testing this alert on the live stream.',tts:t.ttsEnabled,voiceProfile:t.audio.voice,ttsProvider:(window.STREAM_CONFIG?.tts?.voices||[]).find(v=>v.id===t.audio.voice)?.provider||'browser',rarity:t.template==='drop'?'LEGENDARY':'',icon:t.icon,label:t.label,assetUrl:t.audio.mediaUrl,soundUrl:t.audio.soundUrl,soundVolume:t.audio.soundVolume}}
  function obsProfileUrl(){const u=new URL('overlay.html',location.href);u.searchParams.set('obs','1');u.searchParams.set('profile',profileId);u.searchParams.set('v',window.STREAM_CONFIG?.buildVersion||'7');return u.toString()}
  async function copyObsProfileUrl(){try{await navigator.clipboard.writeText(obsProfileUrl());toast(`OBS URL copied · ${currentProfile().width}×${currentProfile().height}`)}catch(_){prompt('Copy this OBS Browser Source URL',obsProfileUrl())}}
  async function testInObs(){const btn=$('testObsBtn');btn.disabled=true;btn.textContent='Sending…';try{const result=await window.StreamPreviewTransport.send({kind:'studio-preview',profile:profileId,event:testEvent(),layout:deep(currentLayout())});toast(result.cloud?'Test sent to OBS':'Test sent locally only')}catch(e){toast(`Test failed: ${e.message||e}`)}finally{btn.disabled=false;btn.textContent='📺 Test in OBS'}}
  async function publishToObs(){saveAll();const btn=$('publishObsBtn');btn.disabled=true;btn.textContent='Publishing…';try{const result=await window.StreamPreviewTransport.send({kind:'studio-layout-sync',profile:profileId,layout:deep(currentLayout())});toast(result.cloud?`${currentProfile().name} published to OBS`:'Saved locally; cloud unavailable')}catch(e){toast(`Publish failed: ${e.message||e}`)}finally{btn.disabled=false;btn.textContent='⇧ Publish layout to OBS'}}

  function bindDialog(){renderTemplates();$('addTypeBtn').onclick=()=>{$('newTypeName').value=templateMeta[selectedTemplate].name;$('newTypeIcon').value=templateMeta[selectedTemplate].icon;$('newTypePrice').value=templateMeta[selectedTemplate].price;$('addTypeDialog').showModal()};$('addTypeForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;e.preventDefault();addDonationType();$('addTypeDialog').close()})}
  function init(){fillVoices();bindTabs();bindControls();bindDialog();window.addEventListener('resize',renderPreview);renderAll();}
  init();
})();
