(function () {
  const deep = (v) => JSON.parse(JSON.stringify(v));
  const baseText = (id, role, x, y, w, h, fontSize, weight, color, align='left') => ({
    id, type:'text', role, x,y,w,h,z:10,visible:true,text:'',src:'',fontSize,fontWeight:weight,color,
    background:'transparent',borderColor:'transparent',borderWidth:0,borderRadius:0,opacity:1,align,
    padding:0
  });
  const baseBox = (id,x,y,w,h,bg,radius=28,z=1) => ({
    id,type:'box',role:'',x,y,w,h,z,visible:true,text:'',src:'',fontSize:20,fontWeight:700,color:'#ffffff',
    background:bg,borderColor:'rgba(255,255,255,.14)',borderWidth:2,borderRadius:radius,opacity:1,align:'left',padding:0
  });
  const baseMedia = (id,role,x,y,w,h) => ({
    id,type:'media',role,x,y,w,h,z:8,visible:true,text:'',src:'',fontSize:20,fontWeight:700,color:'#fff',
    background:'transparent',borderColor:'transparent',borderWidth:0,borderRadius:24,opacity:1,align:'center',padding:0,
    objectFit:'contain'
  });

  const common = (accent, label) => [
    baseBox('card', 610, 690, 700, 250, 'rgba(12,12,18,.93)', 38, 1),
    {...baseText('label','label', 690, 720, 500, 34, 22, 900, accent), text: label, letterSpacing:2},
    baseText('name','name', 690, 770, 360, 45, 34, 900, '#ffffff'),
    baseText('amount','amount', 1050, 770, 190, 45, 34, 900, accent, 'right'),
    baseText('message','message', 690, 830, 540, 62, 26, 600, '#e8e8ef'),
    {...baseText('tts','ttsBadge', 1110, 718, 130, 34, 17, 900, accent, 'center'), background:'rgba(255,106,26,.13)', borderRadius:17, padding:8}
  ];

  const defaults = {
    version: 2,
    canvas: { width: 1920, height: 1080 },
    activeScene: 'support',
    scenes: {
      support: {
        name:'Support / TTS',
        durationMs: 5200,
        elements: [
          ...common('#ff7a2a','TTS SUPPORT'),
          {...baseText('icon','icon', 625, 745, 70, 70, 54, 800, '#ff7a2a', 'center'), text:'✦'}
        ]
      },
      drop: {
        name:'Rare Drop',
        durationMs: 7600,
        elements: [
          baseBox('drop-glow', 420, 120, 1080, 820, 'rgba(15,12,20,.72)', 50, 1),
          baseMedia('drop-media','dropMedia', 560, 160, 800, 520),
          {...baseText('drop-label','label', 650, 695, 620, 40, 26, 950, '#ffce68', 'center'), text:'LEGENDARY DROP', letterSpacing:3},
          baseText('drop-title','title', 560, 745, 800, 72, 56, 950, '#ffffff', 'center'),
          baseText('drop-name','name', 560, 830, 510, 44, 30, 850, '#ffffff'),
          baseText('drop-amount','amount', 1070, 830, 290, 44, 30, 900, '#ffce68', 'right'),
          baseText('drop-message','message', 560, 885, 800, 62, 24, 600, '#e9e9ef', 'center')
        ]
      },
      challenge: {
        name:'Challenge',
        durationMs: 6500,
        elements: [
          baseBox('challenge-card', 500, 650, 920, 300, 'rgba(8,16,24,.94)', 42, 1),
          {...baseText('challenge-label','label', 590, 690, 500, 38, 22, 950, '#6bd2ff'), text:'CHALLENGE UNLOCKED', letterSpacing:2},
          {...baseText('challenge-icon','icon', 515, 700, 90, 90, 62, 800, '#6bd2ff', 'center'), text:'🎯'},
          baseText('challenge-title','title', 590, 745, 730, 64, 46, 950, '#ffffff'),
          baseText('challenge-name','name', 590, 830, 380, 42, 28, 800, '#ffffff'),
          baseText('challenge-amount','amount', 1030, 830, 290, 42, 28, 900, '#6bd2ff', 'right'),
          baseText('challenge-message','message', 590, 880, 730, 48, 22, 600, '#d8eaf3')
        ]
      }
    }
  };

  window.STREAM_OVERLAY_DEFAULTS = defaults;
  window.StreamOverlayLayout = {
    defaults: () => deep(defaults),
    load() {
      try {
        const raw = localStorage.getItem('streamnest:overlayLayout:v2');
        return raw ? JSON.parse(raw) : deep(defaults);
      } catch (_) { return deep(defaults); }
    },
    save(layout) {
      localStorage.setItem('streamnest:overlayLayout:v2', JSON.stringify(layout));
    },
    reset() {
      const layout = deep(defaults);
      localStorage.setItem('streamnest:overlayLayout:v2', JSON.stringify(layout));
      return layout;
    }
  };
})();
