---
"@condorpay/co": patch
"@condorpay/medusa": patch
---

Fix Wompi event checksum validation to follow the documented `signature.properties` plus timestamp and events integrity key flow, and update Medusa webhook parsing to accept Wompi snake_case transaction payloads and `X-Event-Checksum`.
