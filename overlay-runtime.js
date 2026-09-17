const cfg = window.STREAM_CONFIG;
const layoutApi = window.StreamOverlayLayout;
let layout = layoutApi.load();
let queue=[];let playing=false;let currentTimer=null;
const root=document.getElementById('overlayRoot');
const controls=document.getElementById('overlayControls');
const money=(n)=>`${cfg.currencyLabel} ${Number(n||0).toLocaleString()}`;
function scaleRoot(){const sx=innerWidth/layout.canvas.width,sy=innerHeight/layout.canvas.height;const s=Math.min(sx,sy);root.style.width=`${layout.canvas.width}px`;root.style.height=`${layout.canvas.height}px`;root.style.transform=`scale(${s})`;root.style.transformOrigin='top left';root.style.left=`${(innerWidth-layout.canvas.width*s)/2}px`;root.style.top=`${(innerHeight-layout.canvas.height*s)/2}px`;}
addEventListener('resize',scaleRoot);scaleRoot();
function dataFor(event){const baseLabel=event.type==='drop'?`${event.rarity||'RARE'} DROP`:event.type==='challenge'?'CHALLENGE UNLOCKED':event.tts?'TTS SUPPORT':'SUPPORT';return{label:event.demo?`DEMO • ${baseLabel}`:baseLabel,name:event.name||'Anonymous',amount:event.demo?'DEMO':money(event.amount),title:event.title||'',message:event.message?`“${event.message}”`:'',icon:event.icon||(event.type==='challenge'?'🎯':event.type==='drop'?'✨':'✦'),ttsBadge:event.tts?'🔊 TTS':'',dropMedia:event.assetUrl||''};}
function animFrames(name,baseRotation=0,exit=false){const r=`rotate(${baseRotation}deg)`;if(exit){if(name==='shrink')return[{opacity:1,transform:`${r} scale(1)`},{opacity:0,transform:`${r} scale(.72)`}];if(name==='slide-down')return[{opacity:1,transform:`${r} translateY(0)`},{opacity:0,transform:`${r} translateY(70px)`}];return[{opacity:1,transform:r},{opacity:0,transform:r}];}if(name==='pop')return[{opacity:0,transform:`${r} scale(.72)`},{opacity:1,transform:`${r} scale(1)`}];if(name==='slide-up')return[{opacity:0,transform:`${r} translateY(70px)`},{opacity:1,transform:`${r} translateY(0)`}];if(name==='slide-left')return[{opacity:0,transform:`${r} translateX(90px)`},{opacity:1,transform:`${r} translateX(0)`}];if(name==='bounce')return[{opacity:0,transform:`${r} scale(.72)`},{opacity:1,transform:`${r} scale(1.08)`,offset:.72},{opacity:1,transform:`${r} scale(1)`}];if(name==='none')return[{opacity:1,transform:r},{opacity:1,transform:r}];return[{opacity:0,transform:r},{opacity:1,transform:r}];}
function createEl(el,event){if(el.visible===false)return null;const d=dataFor(event);const n=document.createElement('div');n.className=`live-el live-${el.type}`;Object.assign(n.style,{left:`${el.x}px`,top:`${el.y}px`,width:`${el.w}px`,height:`${el.h}px`,zIndex:el.z,opacity:el.opacity,color:el.color||'#fff',background:el.background||'transparent',border:`${el.borderWidth||0}px solid ${el.borderColor||'transparent'}`,borderRadius:`${el.borderRadius||0}px`,fontSize:`${el.fontSize||24}px`,fontWeight:el.fontWeight||700,textAlign:el.align||'left',justifyContent:el.align==='center'?'center':el.align==='right'?'flex-end':'flex-start',padding:`${el.padding||0}px`,letterSpacing:`${el.letterSpacing||0}px`,transform:`rotate(${el.rotation||0}deg)`});if(el.type==='media'){const src=el.role==='dropMedia'?d.dropMedia:el.src;if(src){const isVid=/^(blob:)|\.(webm|mp4|mov)(\?|$)/i.test(src);const m=document.createElement(isVid?'video':'img');m.src=src;m.style.width='100%';m.style.height='100%';m.style.objectFit=el.objectFit||'contain';if(isVid){m.autoplay=true;m.muted=true;m.playsInline=true;m.loop=false;}n.appendChild(m);}}else n.textContent=el.role?(d[el.role]??el.text??''):(el.text||'');return n;}
function ttsProfile(id){return (cfg.tts.voices||[]).find(v=>v.id===id)||(cfg.tts.voices||[]).find(v=>v.id===cfg.tts.defaultVoice)||(cfg.tts.voices||[])[0]||{id:'default',langs:['en-GB'],rate:1,pitch:1};}
function looksUrduScript(text){return /[\u0600-\u06FF]/.test(text||'');}
function looksRomanUrdu(text){const words=(text||'').toLowerCase().match(/[a-z]+/g)||[];const hits=new Set(['aap','ap','main','mein','mai','hum','tum','tumhara','tumhari','mera','meri','mere','kya','kyun','kaise','kaisay','hai','hain','ho','hoon','tha','thi','the','acha','accha','bohat','bahut','bht','nahi','nai','nahin','kar','karo','karna','raha','rahi','rahe','jao','ao','aao','dekho','bhai','yaar','jan','jaan','mujhe','muje','tujhe','usko','isko','wala','wali','wese','waise','phir','abhi','aj','aaj','kal','shukriya','mubarak','allah','inshallah','mashallah']);let n=0;for(const w of words)if(hits.has(w))n++;return n>=2||(n>=1&&words.length<=5);}
function desiredLang(text,profile){if(looksUrduScript(text))return 'ur-PK';if(looksRomanUrdu(text))return (profile.langs||[]).find(x=>x==='en-IN')||(profile.langs||[])[0]||'en-IN';return (profile.langs||[]).find(x=>x.startsWith('en'))||(profile.langs||[])[0]||'en-GB';}
function voiceForProfile(profile,lang){const voices=speechSynthesis.getVoices();if(!voices.length)return null;const female=(profile.gender||'').toLowerCase()==='female';const male=(profile.gender||'').toLowerCase()==='male';const femaleNames=/uzma|neerja|heera|sonia|hazel|zira|susan|aria|jenny|samantha|victoria|female/i;const maleNames=/asad|ravi|george|david|mark|guy|ryan|male/i;const genderScore=v=>female?(femaleNames.test(v.name)?4:maleNames.test(v.name)?-2:0):male?(maleNames.test(v.name)?4:femaleNames.test(v.name)?-2:0):0;const langScore=v=>{const vl=(v.lang||'').toLowerCase(),dl=(lang||'').toLowerCase();if(vl===dl)return 8;if(vl.split('-')[0]===dl.split('-')[0])return 5;if((profile.langs||[]).some(x=>vl===x.toLowerCase()))return 3;return 0;};return voices.slice().sort((x,y)=>(langScore(y)+genderScore(y))-(langScore(x)+genderScore(x)))[0]||voices[0];}
async function speak(event,done){
  if(!event.tts||!event.message)return done();
  const profile=ttsProfile(event.voiceProfile);
  const provider=event.ttsProvider||profile.provider||'browser';
  const spokenText=`${event.name||'Anonymous'} says: ${event.message}`;

  if(provider==='elevenlabs'){
    try{
      const response=await fetch(cfg.tts.apiEndpoint||'/api/tts',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:spokenText,voice:profile.id})
      });
      if(!response.ok)throw new Error(`TTS ${response.status}`);
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      audio.volume=Number(cfg.tts.volume||1);
      const finish=()=>{URL.revokeObjectURL(url);done();};
      audio.onended=finish;
      audio.onerror=finish;
      await audio.play();
      return;
    }catch(error){
      console.error('ElevenLabs playback failed in OBS overlay.',error);
      document.documentElement.dataset.ttsError='elevenlabs';
      return done();
    }
  }

  if(!('speechSynthesis'in window))return done();
  const lang=desiredLang(event.message,profile);
  const u=new SpeechSynthesisUtterance(spokenText);
  u.lang=lang;u.rate=Number(profile.rate||cfg.tts.rate||1);u.pitch=Number(profile.pitch||cfg.tts.pitch||1);u.volume=Number(cfg.tts.volume||1);
  const v=voiceForProfile(profile,lang);if(v)u.voice=v;u.onend=done;u.onerror=done;speechSynthesis.speak(u);
}

function playSound(event,scene){const url=event.soundUrl||scene?.soundUrl;if(!url)return;try{const a=new Audio(url);a.volume=.88;a.play().catch(()=>{});}catch(_){}}
function animateIn(nodes,sc){nodes.forEach(({n,el},i)=>{const ms=Number(el.animationMs||500);n.animate(animFrames(el.enterAnimation||'fade',el.rotation||0,false),{duration:ms,delay:i*18,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});});}
function animateOut(nodes,done){if(!nodes.length)return done();let longest=0;nodes.forEach(({n,el})=>{const ms=Number(el.animationMs||450);longest=Math.max(longest,ms);n.animate(animFrames(el.exitAnimation||'fade',el.rotation||0,true),{duration:ms,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});});setTimeout(done,longest+30);}
function renderEvent(event,done){layout=event.__layout||layoutApi.load();scaleRoot();const key=event.type==='drop'?'drop':event.type==='challenge'?'challenge':'support';const sc=layout.scenes[key]||layout.scenes.support;root.innerHTML='';const nodes=[];sc.elements.slice().sort((a,b)=>a.z-b.z).forEach(el=>{const n=createEl(el,event);if(n){root.appendChild(n);nodes.push({n,el});}});root.classList.add('show');animateIn(nodes,sc);playSound(event,sc);const exit=()=>animateOut(nodes,()=>{root.classList.remove('show');root.innerHTML='';done();});const finish=()=>{currentTimer=setTimeout(exit,event.tts?1200:(sc.durationMs||5000));};if(event.tts&&event.message)speak(event,finish);else finish();}
function pump(){if(playing||!queue.length)return;playing=true;renderEvent(queue.shift(),()=>{playing=false;pump();});}
function enqueue(event){if(!event||event.verified!==true)return;queue.push(event);pump();}
window.StreamOverlay={enqueue,clear(){queue=[];if(currentTimer)clearTimeout(currentTimer);speechSynthesis?.cancel?.();root.innerHTML='';playing=false;},skip(){speechSynthesis?.cancel?.();if(currentTimer)clearTimeout(currentTimer);root.innerHTML='';playing=false;pump();}};
addEventListener('storage',e=>{if(e.key==='streamnest:lastEvent'&&e.newValue)try{enqueue(JSON.parse(e.newValue));}catch(_){}});
const last=localStorage.getItem('streamnest:lastEvent');if(last)setTimeout(()=>{try{enqueue(JSON.parse(last));}catch(_){}},700);
if(controls){document.getElementById('testSupport').onclick=()=>enqueue({verified:true,type:'support',name:'Ayesha',amount:1000,message:'That clutch was insane!',tts:true});document.getElementById('testDrop').onclick=()=>enqueue({verified:true,type:'drop',name:'Hamza',amount:10000,message:'Crown Drop incoming!',tts:true,title:'Crown Drop',rarity:'LEGENDARY',icon:'👑'});document.getElementById('testChallenge').onclick=()=>enqueue({verified:true,type:'challenge',name:'Ali',amount:2500,message:'Shotgun-only next round.',tts:false,title:'Viewer Picks My Loadout',icon:'🎯'});document.getElementById('skipTts').onclick=()=>window.StreamOverlay.skip();}
if(window.StreamPreviewTransport){window.StreamPreviewTransport.listen((packet)=>{if(!packet||packet.kind!=='studio-preview'||!packet.event)return;const event={...packet.event,verified:true,preview:true};if(packet.layout)event.__layout=packet.layout;enqueue(event);}).then((state)=>{if(state?.connected)document.documentElement.dataset.realtime='connected';}).catch(()=>{});}
