# Country interaction follow-up — 2026-10-21

All 38 named countries visible inside the seven illustrated continents are selectable. Each country has a stable ID, label center, continent, capital, nearest campaign city, economic specialty, population, GDP index, tax rate, stability, infrastructure and trade openness.

Pointer resolution keeps gameplay targets predictable: facility cards and markers resolve first, then public world entities, then city anchors, then the country below the pointer. A coarse polygon for each continent prevents open ocean from resolving to the nearest country. Selecting a country adds a visible gold focus ring and label, routes the contextual panel to its nearest operating city and shows the country's full stats. A persistent country selector provides a keyboard-accessible alternative.

Validation:

- 68 Node behavioral tests pass, including all country centers, unique IDs, complete bounded stats, deterministic resolution across seven continents and ocean exclusion.
- Formatting, TypeScript, image integrity and production build pass.
- Browser smoke covers direct canvas selection of Thuria and verifies its contextual panel; remote CI provides the browser runtime for this follow-up.
- Save version 9 is unchanged because country data and selection are UI/rules data rather than persisted campaign state.
