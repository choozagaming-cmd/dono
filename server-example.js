/**
 * PERSONAL STREAM BACKEND SKELETON
 * --------------------------------
 * This file documents the production responsibilities for ONE streamer's
 * support page. It is intentionally provider-agnostic.
 *
 * Production event types:
 *  - support: normal payment + optional TTS
 *  - drop: fixed premium item with custom alert assets + optional TTS
 *  - challenge: fixed streamer-approved challenge
 *
 * NEVER trust price, item details or payment success from browser JavaScript.
 */

import express from 'express';
const app = express();

// Example catalogue should really live in your database.
const CATALOGUE = {
  drops: {
    'ember-crate': { price: 2500, name: 'Ember Crate', active: true, stock: 8 },
    'void-core': { price: 5000, name: 'Void Core', active: true, stock: 4 },
    'crown-drop': { price: 10000, name: 'Crown Drop', active: true, stock: 1 }
  },
  challenges: {
    'no-heal': { price: 1000, name: 'No Healing Round', active: true },
    'weird-loadout': { price: 2500, name: 'Viewer Picks My Loadout', active: true },
    'hard-mode': { price: 5000, name: 'Hard Mode Challenge', active: true }
  }
};

// 1) Create a pending interaction and payment checkout session.
app.post('/api/checkout', express.json(), async (req, res) => {
  const { type, itemId, amount, donorName, message, ttsRequested } = req.body;

  // IMPORTANT: determine the payable amount on the SERVER.
  let serverAmount;
  if (type === 'drop') {
    const item = CATALOGUE.drops[itemId];
    if (!item?.active || item.stock <= 0) return res.status(400).json({ error: 'Drop unavailable' });
    serverAmount = item.price;
  } else if (type === 'challenge') {
    const item = CATALOGUE.challenges[itemId];
    if (!item?.active) return res.status(400).json({ error: 'Challenge unavailable' });
    serverAmount = item.price;
  } else {
    serverAmount = Math.max(Number(amount || 0), 100);
  }

  // Moderate donorName/message server-side here.
  // Insert a pending_interactions database row with an unpredictable ID.
  // Call your payment gateway using secret credentials and serverAmount.
  // Attach only the pending interaction ID as trusted checkout metadata.
  res.json({
    demo: true,
    pendingInteraction: 'int_demo_123',
    amount: serverAmount,
    checkoutUrl: 'https://payment-provider.example/hosted-checkout'
  });
});

// 2) Payment provider webhook. Verify signature using RAW BODY in production.
app.post('/api/webhooks/payment-provider', express.raw({ type: '*/*' }), async (req, res) => {
  // verifyWebhookSignature(req)
  // const event = parseVerifiedEvent(req.body)
  // Ignore anything except confirmed/settled payment events.
  // Enforce idempotency using provider event ID / transaction ID.
  // Load pending interaction from DB; compare amount + currency.
  // Mark payment PAID in a database transaction.
  // For limited Rare Drops, decrement stock atomically here.
  // If TTS applies, moderate final text and optionally generate neural audio.
  // Add interaction to the single stream alert_queue.
  // Publish a signed event to the private OBS overlay via WebSocket/SSE.
  res.sendStatus(200);
});

// 3) Overlay event channel. Production version authenticates a private overlay token.
app.get('/api/overlay/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  // Keep connection open and publish queued verified events.
});

app.listen(3000, () => console.log('Personal stream backend example on :3000'));
