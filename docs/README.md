# Menthera Documentation

In-depth technical and feature documentation for the Menthera monorepo.

This directory is intended for readers who want to understand **how** and **why** the system is built the way it is — beyond the top-level overview in the repository root [`README.md`](../README.md) and the per-directory deep dives in [`backend/README.md`](../backend/README.md) and [`mobile/README.md`](../mobile/README.md).

---

## Architecture

- [**`architecture.md`**](./architecture.md) — The full system architecture. Cross-stack wiring, the two HTTP surfaces (API Gateway and Lambda Function URL), DynamoDB table topology, the CloudFormation dependency graph, deployment order, and the core infrastructure patterns that shape everything else.

## Feature flows

Each feature doc walks through a single product capability end-to-end — mobile UX, mobile code path, backend Lambda handlers, downstream dependencies, design rationale, trade-offs, and known gaps. File paths referenced in each doc are clickable so reviewers can navigate directly into the source.

- [**`features/authentication.md`**](./features/authentication.md) — Clerk sign-in, JWT caching in Expo SecureStore, two distinct backend auth paths (Hono middleware for API Gateway, a lightweight Lambda helper for Function URL), webhook flow with `svix` signature verification, and the sync-vs-async split between Clerk and RevenueCat webhooks.

- [**`features/text-chat.md`**](./features/text-chat.md) — Streaming text chat via Lambda Function URL (not API Gateway), why the two HTTP surfaces exist, the Vercel AI SDK provider abstraction, mem0 long-term memory integration, and how the mobile client consumes server-sent tokens through `@ai-sdk/react` hooks.

- [**`features/voice-calls.md`**](./features/voice-calls.md) — ECS Fargate-based Pipecat voice agent, Daily.co WebRTC mesh, the full voice pipeline (Silero VAD → Smart Turn v3 turn detection → LLM → TTS), call lifecycle from start to teardown, and the `user-left` cost-protection pattern that prevents ECS task leaks.

- [**`features/quests.md`**](./features/quests.md) — Psychometric quest flow, the `quest_definitions` / `quest_sessions` DynamoDB table split (static definitions vs user execution data), the scoring engine, and how quests reuse the chat infrastructure so every quest is a structured conversation with an agent.

- [**`features/engagement-and-achievements.md`**](./features/engagement-and-achievements.md) — Activity event writes from every user interaction, the streak computation rollup, the achievements unlock checker composing signals across messaging / calls / quests, and the TTL-based retention for activity history.

- [**`features/subscriptions-and-byok.md`**](./features/subscriptions-and-byok.md) — RevenueCat integration on mobile, the native paywall UI, the RevenueCat webhook flow through SQS with retry and DLQ, the BYOK (Bring Your Own Key) tier model, and the subscription audit log that records every plan transition.

---

## How to read these docs

Each document is written to stand alone — you can click into any feature doc from a GitHub code search result and have enough context to understand what's going on without reading the others first. If you want the full mental model of the system, read them in this order:

1. Top-level [`README.md`](../README.md) — product framing and system summary (5 minutes)
2. [`architecture.md`](./architecture.md) — technical deep dive on the architecture (15 minutes)
3. Any feature doc that interests you — they are independent and can be read in any order

Every doc that describes a feature contains:

- **What the user experiences** — grounding the flow in the product
- **End-to-end walkthrough** — step-by-step across mobile, backend, and third parties
- **Why it's designed this way** — the decision and the rejected alternatives
- **Known gaps and trade-offs** — what is incomplete, what is a compromise, and what would change in a production-hardened version

Docs favour directness over exhaustiveness. When a subject is covered better by the actual code than by prose, they point at the file and stop writing.
