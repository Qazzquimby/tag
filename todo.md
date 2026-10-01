## Roadmap for the remaining classes

**To add a class that only needs the existing hooks** (Tracer-like, Skater momentum parts, the Monkey/Prince/Frog movement parts), put these in context:
- `src/classes/index.js`
- `src/classes/types.js`
- `src/classes/tracer.js` (as a template)
- `src/config.js` (for constants and `Shape`)

### Missing systems, in suggested order

1. **Ability HUD.** Cooldown and charge display. Needed by every class.
   - Files: `hud.js`, `main.js`, `style.css`, and `index.html`, which is not currently editable and must be added.
   - Cooldowns already live on `player.cooldowns`. Add an optional `ClassDef.meter(player)` for charge bars.

2. **Entities** (peels, bombs, sticky bombs, clone, walls, fly, strands): Monkey, Bomber, Demoman, Spider, Clone, Frog, Engineer.
   - Add `game.entities`, an entity-type registry mirroring `classes/` with `update`, `draw` and `onTouch` hooks, and `NetEvent` entries for spawn and remove.
   - The spawner simulates the entity and broadcasts it. The client that owns the touched player resolves the touch, the same way `CATCH` works.
   - Files: `config.js`, `game.js`, `main.js`, `render.js`, `collision.js`, `types.js`, new `src/entities/*`.

3. **Impulses and status effects** (stun, pull, push, fear, slow): Monkey peel, Bomber, Demoman, Ghost, Frog, Spider.
   - Add `player.effects`, an `applyImpulse` helper, and a targeted `NetEvent.EFFECT` handled like `handleCatch`.
   - Files: `player.js`, `game.js`, `config.js`, `main.js`.

4. **Movement override** (`move(ctx)` hook that replaces default integration): Snake (grid movement), Prince (wall-sticking), Monkey blast, Frog lunges.
   - Files: `player.js`, `collision.js`, and the class file.

5. **Tile layer** (replace `solid` with a tile-type enum, an immutable-edge flag and per-tile effects): Engineer, Skater ice trail, Ghost and Spider wall-passing, and the "edges can't be changed" rule.
   - Add a collision-bypass flag on the intent or player. Sync map edits over the net.
   - Files: `map.js`, `collision.js`, `vision.js`, `render.js`, `game.js`, `config.js`.

6. **Per-class rendering and visibility** (optional `ClassDef.draw`, alpha and visibility rules): Ghost fading, Spider reveal, Tracer afterimage, charge vfx.
   - Others also need to see some ability state, so add an optional `ClassDef.netState(player)` merged into `toStatePayload` and applied in `applyStatePayload`.
   - Files: `render.js`, `player.js`, `vision.js`, and the class file.

7. **Class selection beyond 9 classes.**
   - The picker buttons already scale. The digit hotkeys in `input.js` cap at 9, so switch to paging or buttons only.
   - Files: `input.js`, `hud.js`.

### Class-to-system map

| Class | Needs |
|---|---|
| Skater | Reverse-momentum primary now; ice trail needs tiles (5) |
| Prince | Movement override (4), tiles (5), position history like Tracer |
| Snake | Movement override (4), body-segment entities (2), score/catch rule changes in `game.js` |
| Ghost | Visibility (6), effects (3), wall-phasing (5) |
| Monkey | Entities (2), effects (3), movement override (4) |
| Bomber | Entities (2), effects (3) |
| Demoman | Entities (2), effects (3) |
| Spider | Entities (2), tiles (5), effects (3) |
| Magnet | Entities (2), effects (3) |
| Frog | Entities (2), movement override (4) |
| Clone | Entities (2) |
| Engineer | Entities (2), tiles (5) |
