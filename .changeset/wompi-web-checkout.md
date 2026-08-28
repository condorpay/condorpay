---
"@condorpay/medusa": major
"@condorpay/co": minor
---

Reconcile Wompi payments with the order that started them.

The Medusa providers created a Wompi **payment link** for each checkout. A
payment link cannot carry a merchant reference, so Wompi minted its own, and
the resulting webhook arrived bearing an identifier Medusa had never issued.
`session_id` never matched a payment session, so an approved payment produced
no order: the shopper was charged and the sale was lost.

The providers now redirect to **Wompi Web Checkout**, which takes the reference
as an input. Medusa's payment session id is sent as that reference and comes
back verbatim in the webhook, so the callback resolves to the session that
opened it.

Alongside that:

- `authorizePayment` queries Wompi for the transaction instead of always
  answering `pending`, so a payment can actually reach `authorized`.
- A `redirectUrl` option returns the shopper to the store; previously they were
  left on Wompi's receipt with no way back.
- `integritySecret` is now a distinct option from `eventsIntegrityKey`. Wompi
  issues two different secrets — `prod_integrity_*` signs outgoing checkouts,
  `prod_events_*` verifies incoming webhooks — and they are not interchangeable.
- Checkout no longer makes an API call, so it cannot fail on a network round
  trip or on the payment-link amount minimum.

**Breaking:** `wompi.integritySecret` is now required. Session data carries
`wompiReference` in place of `wompiId`; `wompiUrl` is unchanged.
