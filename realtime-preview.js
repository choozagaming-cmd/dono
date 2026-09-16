(function(){
  const CHANNEL_NAME='streamnest-live-preview';
  const LOCAL_KEY='streamnest:livePreviewEvent';
  function cfg(){
    const base=window.STREAM_CONFIG?.realtime||{};
    let saved={};
    try{saved=JSON.parse(localStorage.getItem('streamnest:realtimeConfig')||'{}')}catch(_){}
    const q=new URLSearchParams(location.search);
    const fromUrl={
      supabaseUrl:q.get('sbUrl')||undefined,
      publishableKey:q.get('sbKey')||undefined,
      channel:q.get('channel')||undefined
    };
    const merged={...base,...saved};
    Object.entries(fromUrl).forEach(([k,v])=>{if(v)merged[k]=v;});
    merged.enabled=!!(merged.supabaseUrl&&merged.publishableKey&&merged.channel);
    return merged;
  }
  let bc=null, supabaseClient=null, supabaseChannel=null, readyPromise=null;
  const seen=new Set();
  function once(onPayload,payload){
    const id=payload?._nonce;
    if(id && seen.has(id)) return;
    if(id){seen.add(id);if(seen.size>100){const first=seen.values().next().value;seen.delete(first);}}
    onPayload(payload);
  }

  function localChannel(){
    if(!bc && 'BroadcastChannel' in window) bc=new BroadcastChannel(CHANNEL_NAME);
    return bc;
  }

  function cloudConfigured(){
    const c=cfg();
    return !!(c.enabled && c.supabaseUrl && c.publishableKey && c.channel && window.supabase?.createClient);
  }

  function connectCloud(onPayload){
    if(!cloudConfigured()) return Promise.resolve({connected:false,mode:'local'});
    if(readyPromise) return readyPromise;
    readyPromise=new Promise((resolve)=>{
      const c=cfg();
      supabaseClient=window.supabase.createClient(c.supabaseUrl,c.publishableKey);
      supabaseChannel=supabaseClient.channel(c.channel,{config:{broadcast:{self:false}}});
      if(onPayload) supabaseChannel.on('broadcast',{event:'studio-preview'},({payload})=>once(onPayload,payload));
      supabaseChannel.subscribe((status)=>{
        if(status==='SUBSCRIBED') resolve({connected:true,mode:'supabase'});
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED') resolve({connected:false,mode:'local',status});
      });
    });
    return readyPromise;
  }

  async function send(payload){
    const packet={...payload,_sentAt:Date.now(),_nonce:crypto?.randomUUID?.()||Math.random().toString(36).slice(2)};
    try{localChannel()?.postMessage(packet);}catch(_){}
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(packet));}catch(_){}
    let cloud={connected:false,mode:'local'};
    if(cloudConfigured()){
      cloud=await connectCloud();
      if(cloud.connected && supabaseChannel){
        const result=await supabaseChannel.send({type:'broadcast',event:'studio-preview',payload:packet});
        return {local:true,cloud:true,result};
      }
    }
    return {local:true,cloud:false};
  }

  async function listen(onPayload){
    try{localChannel()?.addEventListener('message',(e)=>once(onPayload,e.data));}catch(_){}
    addEventListener('storage',(e)=>{
      if(e.key===LOCAL_KEY && e.newValue){try{once(onPayload,JSON.parse(e.newValue));}catch(_){}}
    });
    return connectCloud(onPayload);
  }

  async function reset(){
    try{if(supabaseClient&&supabaseChannel)await supabaseClient.removeChannel(supabaseChannel);}catch(_){}
    supabaseClient=null;supabaseChannel=null;readyPromise=null;
  }
  window.StreamPreviewTransport={send,listen,cloudConfigured,connectCloud,reset};
})();
