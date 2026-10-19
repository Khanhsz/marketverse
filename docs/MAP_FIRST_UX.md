# Country Strategy Map — UX and Visual Contract

## Layout (laptop first)
- Top: compact company bar, current Year/Week, cash, profit, alerts.
- Left: very narrow icon navigation. Map remains visible during most tasks.
- Center: large continuous map with stable camera and uncluttered geometry.
- Right: contextual city/company/facility panel, collapsible.
- Bottom: market pulse and Next Week control, plus pending-decision indicators.
- Detailed analytics and editors may open overlays/side panels, not route the player to a dashboard as default home.

## Art direction
Light tech modernism, monochrome/minimally tinted low-poly angular geography, medium-contrast roads, few restrained company icons. Clearly distinguish player assets, opponents and public entities. Preserve generous map space. Dense economy, not excessive decorative trees. No raster image that breaks when zooming.

## Geographic visual layers
Market (demand/segments), Competition (ownership/presence), Operations (factories/warehouses/stores), Logistics (route costs and times), Economy (growth, wages, purchasing power). Switching changes emphasis/colors but never obscures the world.

## Interaction
- Drag to pan, mouse wheel/trackpad to zoom around cursor, buttons for zoom and reset.
- Distinguish clicks from drags; prevent click-through when a modal is open.
- Select city, company, facility. Context panel shows grounded state and actions.
- Keyboard focus, Escape to dismiss, visible hover/focus feedback and accessible labels.
- Camera bounds allow exploring a map larger than viewport with sensible min/max zoom.
- Resizing window doesn't reset the player's camera unexpectedly.
- Only show actual gameplay objects; do not fake live revenue or AI actions in foundation stage.

## Acceptance for Sprint 02
Demonstrate pan, zoom, selection, layer switch, large map, no fog, desktop responsiveness, preserved state, consistent pointer behavior and browser smoke. Map is a source of spatial gameplay context; avoid fixed decorative background-only implementation.
