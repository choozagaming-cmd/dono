window.STREAM_CONFIG = {
  brand: "MY STREAM",
  creatorName: "Your Stream Name",
  handle: "@yourhandle",
  currency: "PKR",
  currencyLabel: "Rs",
  accent: "#ff6a1a",

  // Live overlay preview transport.
  // Leave Supabase fields blank for same-browser preview.
  // Add your public/publishable Supabase credentials to test directly in OBS.
  realtime: {
    enabled: true,
    supabaseUrl: "https://bvuqhluroturqthatsqr.supabase.co",
    publishableKey: "sb_publishable_osxFky8RKkmxIpHT0XXtbg_-r_35CGl",
    channel: "stream-preview-main"
  },

  standardAmounts: [200, 500, 1000, 2500],
  minTip: 100,

  // Free viewer-to-OBS demo alerts. Keep this separate from paid events.
  viewerDemo: {
    enabled: true,
    cooldownSeconds: 20,
    maxChars: 180,
    allowTts: true
  },

  tts: {
    enabled: true,
    minAmount: 500,
    maxChars: 180,
    defaultOn: true,
    defaultVoice: "pak-female",
    languageMode: "auto-roman-urdu-english",
    provider: "browser", // Browser fallback now; switch to server TTS later without changing events.
    voices: [
      { id: "pak-female", name: "Ayla", gender: "female", style: "Natural Pakistani", langs: ["en-IN","ur-PK","en-GB"], rate: 0.98, pitch: 1.02 },
      { id: "pak-male", name: "Rayyan", gender: "male", style: "Natural Pakistani", langs: ["en-IN","ur-PK","en-GB"], rate: 0.97, pitch: 0.94 },
      { id: "clear-female", name: "Nova", gender: "female", style: "Clear & energetic", langs: ["en-GB","en-IN"], rate: 1.04, pitch: 1.05 },
      { id: "clear-male", name: "Atlas", gender: "male", style: "Clear & energetic", langs: ["en-GB","en-IN"], rate: 1.03, pitch: 0.96 },
      { id: "velvet-female", name: "Velvet Female", gender: "female", style: "Seductive · warm · intimate", langs: ["en-IN","en-GB","ur-PK"], rate: 0.88, pitch: 1.00 },
      { id: "velvet-male", name: "Velvet Male", gender: "male", style: "Seductive · deep · intimate", langs: ["en-IN","en-GB","ur-PK"], rate: 0.86, pitch: 0.86 }
    ],
    rate: 1,
    pitch: 1,
    volume: 1
  },

  rareDrops: [
    {
      id: "ember-crate",
      name: "Ember Crate",
      rarity: "RARE",
      price: 2500,
      remaining: 8,
      icon: "🔥",
      description: "A premium fire-burst alert with a longer on-stream entrance.",
      assetUrl: "", // e.g. assets/ember-crate.webm or .gif/.png
      soundUrl: "", // e.g. assets/ember-crate.mp3
      ttsIncluded: true
    },
    {
      id: "void-core",
      name: "Void Core",
      rarity: "EPIC",
      price: 5000,
      remaining: 4,
      icon: "🪐",
      description: "A darker high-impact drop built for big support moments.",
      assetUrl: "",
      soundUrl: "",
      ttsIncluded: true
    },
    {
      id: "crown-drop",
      name: "Crown Drop",
      rarity: "LEGENDARY",
      price: 10000,
      remaining: 1,
      icon: "👑",
      description: "Your rarest signature drop. One available for this demo stream.",
      assetUrl: "",
      soundUrl: "",
      ttsIncluded: true
    }
  ],

  challenges: [
    {
      id: "no-heal",
      title: "No Healing Round",
      price: 1000,
      icon: "🩹",
      description: "Play the next eligible round without using healing items.",
      rules: "Applies to the next suitable match/round."
    },
    {
      id: "weird-loadout",
      title: "Viewer Picks My Loadout",
      price: 2500,
      icon: "🎒",
      description: "Use the loadout requested by the buyer for one eligible round.",
      rules: "Keep requests game-safe and possible with the current game."
    },
    {
      id: "hard-mode",
      title: "Hard Mode Challenge",
      price: 5000,
      icon: "💀",
      description: "Activate your stream's hardest pre-agreed challenge for one attempt.",
      rules: "Streamer can skip anything unsafe, impossible, or against platform rules."
    }
  ],

  moderation: {
    blockLinks: true,
    cooldownSeconds: 15,
    blockedTerms: ["exampleblockedword"]
  }
};
