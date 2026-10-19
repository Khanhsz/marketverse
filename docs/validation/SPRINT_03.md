# Sprint 03 validation — 2026-10-20

Tested source: `8d6cf05f300d740de1fb6b6a4f8766c979edcfa4`. Node 22.23.3; real Chromium at laptop sizes.

- `npm run verify`: 17/17 engine/entity/camera tests; TypeScript and production build pass.
- `npm run test:browser`: pass, including all foundation and Sprint 02 regression checks.
- City, company and facility selections resolve stable IDs; save/reload and array reordering preserve identity. The schema accepts an eight-city test scenario while the shipped starter remains three cities.
- Placement validator rejects missing owner/city, invalid kinds, duplicate facility kind per company/city and multiple HQs for one company. Existing references, control types, segment ranges and reciprocal transport links are validated on load.
- Browser selects player HQ via contextual button, owner company, competitor via Competition map diamond, competitor store and connected cities. All five facility-kind markers (HQ/store/factory/warehouse/R&D) are exercised in an isolated valid save fixture; this fixture adds no production content or economic behavior.
- Context shows actual owner, location, cash/debt and transport references; selected assets are highlighted and camera is retained.
- Browser corrupts a location reference: original localStorage bytes remain unchanged, Next Week is disabled, original-save download works and explicit Reset recovers. No silent loss of malformed saves.
- No uncaught page errors or laptop horizontal overflow. Nonfatal bundle-size warning persists. No production, demand, shipment or finance simulation is claimed.

Git push to `codex/marketverse-sprint-continuation` succeeds. GitHub API fails at CONNECT with proxy HTTP 403; remote CI and automatic PR creation remain unverified. No scheduling capability is exposed, so recurring Work execution remains unconfigured.
