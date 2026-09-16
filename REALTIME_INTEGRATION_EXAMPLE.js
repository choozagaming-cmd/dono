/*
Production sketch only — do not expose service-role keys in the browser.
The OBS page should first exchange its private overlay token with a server endpoint
for a short-lived authenticated Supabase session/JWT, then subscribe to a private
Realtime Broadcast topic.

Supabase currently recommends Broadcast over Postgres Changes for scalability/security.
*/

import { createClient } from '@supabase/supabase-js';

export async function connectOverlay({ supabaseUrl, publishableKey, accessToken, onEvent }) {
  const supabase = createClient(supabaseUrl, publishableKey, {
    accessToken: async () => accessToken
  });

  const channel = supabase
    .channel('stream:main', { config: { private: true } })
    .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
      const row = payload?.new ?? payload?.record ?? payload;
      if (!row || row.payment_status !== 'verified' || row.moderation_status !== 'approved') return;
      onEvent({
        verified: true,
        type: row.event_type,
        name: row.viewer_name,
        amount: Number(row.amount_minor || 0) / 100,
        currency: row.currency,
        message: row.message,
        tts: row.tts,
        title: row.title,
        rarity: row.rarity,
        icon: row.icon,
        assetUrl: row.asset_url,
        soundUrl: row.sound_url
      });
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}
