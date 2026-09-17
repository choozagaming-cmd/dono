const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const buckets = globalThis.__streamHubTtsBuckets || new Map();
globalThis.__streamHubTtsBuckets = buckets;

const ALLOWED_VOICES = {
  serafina: {
    voiceId: '4tRn1lSkEn13EVTuqb0g',
    modelId: 'eleven_v3'
  }
};

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const record = buckets.get(ip) || { start: now, count: 0 };
  if (now - record.start > WINDOW_MS) {
    record.start = now;
    record.count = 0;
  }
  record.count += 1;
  buckets.set(ip, record);
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'TTS is not configured on the server.' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many TTS requests. Please wait a minute.' });
  }

  const { text, voice = 'serafina' } = req.body || {};
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return res.status(400).json({ error: 'Text is required.' });
  if (clean.length > 240) return res.status(400).json({ error: 'TTS text is too long.' });

  const selected = ALLOWED_VOICES[voice];
  if (!selected) return res.status(400).json({ error: 'Voice is not allowed.' });

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selected.voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: clean,
          model_id: selected.modelId
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('ElevenLabs TTS error', response.status, detail.slice(0, 500));
      return res.status(response.status === 401 ? 502 : response.status).json({
        error: 'ElevenLabs could not generate this voice right now.'
      });
    }

    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(audio);
  } catch (error) {
    console.error('TTS route failure', error);
    return res.status(500).json({ error: 'TTS generation failed.' });
  }
}
