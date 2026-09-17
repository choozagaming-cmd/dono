window.STREAM_CONFIG = {
  buildVersion: '8.0.0',
  brand: "MY STREAM",
  creatorName: "Your Stream Name",
  handle: "@yourhandle",
  currency: "PKR",
  currencyLabel: "Rs",
  accent: "#ff6a1a",
  realtime: {
    enabled: true,
    supabaseUrl: "https://bvuqhluroturqthatsqr.supabase.co",
    publishableKey: "sb_publishable_osxFky8RKkmxIpHT0XXtbg_-r_35CGl",
    channel: "stream-preview-main"
  },
  standardAmounts: [200, 500, 1000, 2500, 5000],
  minTip: 100,
  viewerDemo: { enabled: true, cooldownSeconds: 20, maxChars: 180, allowTts: true },
  checkout: {
    enabled: true,
    providerConnected: false,
    localMethods: [
      { id: "pak-local", icon: "🇵🇰", name: "Pakistan payment", detail: "Raast / local method when gateway is connected" },
      { id: "card", icon: "💳", name: "Debit / Credit card", detail: "Visa / Mastercard · Pakistan & international" }
    ],
    trust: ["Payment verified before alert", "No card details stored by this site", "Alert triggers only after confirmation"]
  },
  tts: {
    enabled: true,
    minAmount: 500,
    maxChars: 180,
    defaultOn: true,
    defaultVoice: "serafina",
    languageMode: "auto-roman-urdu-english",
    provider: "elevenlabs",
    apiEndpoint: "/api/tts",
    model: "eleven_v3",
    voices: [
      { id: "serafina", name: "Serafina", gender: "female", style: "Sensual · ElevenLabs", badge: "POPULAR", provider: "elevenlabs", voiceId: "4tRn1lSkEn13EVTuqb0g", model: "eleven_v3", rate: 0.94, pitch: 1.0 },
      { id: "pak-female", name: "Ayla", gender: "female", style: "Natural Pakistani", provider: "browser", langs: ["en-IN","ur-PK","en-GB"], rate: 0.98, pitch: 1.02 },
      { id: "pak-male", name: "Rayyan", gender: "male", style: "Natural Pakistani", provider: "browser", langs: ["en-IN","ur-PK","en-GB"], rate: 0.97, pitch: 0.94 },
      { id: "clear-female", name: "Nova", gender: "female", style: "Bright & energetic", provider: "browser", langs: ["en-GB","en-IN"], rate: 1.04, pitch: 1.05 },
      { id: "clear-male", name: "Atlas", gender: "male", style: "Clear & energetic", provider: "browser", langs: ["en-GB","en-IN"], rate: 1.03, pitch: 0.96 },
      { id: "velvet-male", name: "Velvet Male", gender: "male", style: "Deep & intimate", provider: "browser", langs: ["en-IN","en-GB","ur-PK"], rate: 0.86, pitch: 0.86 }
    ], rate: 1, pitch: 1, volume: 1
  },
  rareDrops: [
    { id:"ember-crate", name:"Ember Crate", rarity:"RARE", price:2500, remaining:8, icon:"🔥", description:"Fire-burst animation + premium alert + TTS.", assetUrl:"", soundUrl:"", ttsIncluded:true, featured:false },
    { id:"void-core", name:"Void Core", rarity:"EPIC", price:5000, remaining:4, icon:"🪐", description:"High-impact dark drop with longer screen time.", assetUrl:"", soundUrl:"", ttsIncluded:true, featured:true },
    { id:"crown-drop", name:"Crown Drop", rarity:"LEGENDARY", price:10000, remaining:1, icon:"👑", description:"The rarest signature alert on the stream.", assetUrl:"", soundUrl:"", ttsIncluded:true, featured:true }
  ],
  challenges: [
    { id:"no-heal", title:"No Healing Round", price:1000, icon:"🩹", category:"Quick", description:"Next eligible round with no healing items.", rules:"Next suitable match/round." },
    { id:"weird-loadout", title:"Viewer Picks My Loadout", price:2500, icon:"🎒", category:"Viewer Control", description:"You choose my loadout for one eligible round.", rules:"Must be game-safe and possible." },
    { id:"hard-mode", title:"Hard Mode Challenge", price:5000, icon:"💀", category:"Hard", description:"Activate the hardest pre-approved challenge.", rules:"Unsafe/impossible requests are skipped." }
  ],
  moderation: { blockLinks:true, cooldownSeconds:15, blockedTerms:["exampleblockedword"] }
};
