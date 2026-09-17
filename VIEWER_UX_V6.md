# Viewer UX V6

This build makes the public page easier to understand before real payment gateway integration.

## New viewer experience
- Three-step “Choose → Customise → Pay” guide
- How-it-works modal
- More amount presets
- Anonymous toggle
- Message-on-screen option
- Voice cards instead of a plain dropdown
- Rare Drop and Challenge filters
- Mobile sticky interaction controls
- Checkout review sheet with payment-method selection
- Security/trust explanations before payment
- Exact-alert OBS demo retained inside each real interaction

## Payments
The checkout interface is production-shaped, but `checkout.providerConnected` is still `false`. The final payment buttons intentionally do not charge anyone yet. Connect the chosen gateway next, then wire the final checkout action to the server-side payment-session endpoint.
