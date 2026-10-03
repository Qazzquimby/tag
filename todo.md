Kick players who are afk for a full round. They stop being connected to a room.

Add sfx on placing and detonating sticky bombs. Give sticky bombs an emoji sprite rather than being a circle (which looks like food)


## Roadmap for the remaining classes


**To add a class that only needs the existing hooks** (Tracer-like, Skater momentum parts, the Monkey/Prince/Frog movement parts), put these in context:
- `src/classes/index.js`
- `src/classes/types.js`
- `src/classes/tracer.js` (as a template)
- `src/config.js` (for constants and `Shape`)

### Missing systems, in suggested order

Add an optional `ClassDef.meter(player)` on abilities for charge bars.

4. **Movement override** (`move(ctx)` hook that replaces default integration): Snake (grid movement), Wall running, Monkey blast, Frog lunges.
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
| Snake | Movement override (4), body-segment entities (2), score/catch rule changes in `game.js` |
| Ghost | Visibility (6), effects (3), wall-phasing (5) |
| Monkey | Entities (2), effects (3), movement override (4) |
| Spider | Entities (2), tiles (5), effects (3) |
| Frog | Entities (2), movement override (4) |
| Engineer | Entities (2), tiles (5) |


---


"Entity" is a player or object.
Tiles can be passed over and may apply an effect on things above it.
Edges of the map can't be changed the way inner walls can.


Classes:

# Monster

Can see the highest score player even without LoS.
All players leave trails lasting 2s
Move faster while on a trail
Left click does a lunge, which refreshes when you eat anything
Right click makes an illusion of you at the cursor location for 3s, with impulse toward the nearest prey player, giving you vision. 8s cd. Makes the same 'lunge' sfx

# Ghost
Passively gets increasingly transparent to more distant players

Left click
For 3s appear to be predator to all players.
Prey players in close range are 'feared', lose momentum, and move directly away from ghost for 2s.
cooldown 8s

Right click, while held move slower, become increasingly transparent, can see through and move through walls.
Max charge of 5s, recharge at 2s/1s.



# Monkey

left click, throw banana peel toward cursor with strength proportional to distance to cursor with some maximum.
Cooldown 4 seconds. Lasts 8 seconds before flashing and disappearing.
Anyone who touches the banana peel, including you, loses control for 0.5s and is pulled in the direction of the banana peel, and the banana peel is destroyed.

Right click, stop moving while holding right mouse button. On release or after 3s, launch in the direction of the mouse cursor with strength proportional to the charge time.
Preferably has some kind of vfx and sfx. Should be able to steer left and right somewhat with mouse cursor, but direction is mostly fixed at launch time. Get more controllable toward the end of the blast. 
Cooldown 8 seconds

# Snake
Only moves orthogonally at a fixed speed. No momentum conservation. Accelerates the longer it moves in a straight line.
On eating a player or food, gain a body segment. Can't move through own body.
Can catch prey with body, but can only be caught at head. Dies and loses 10pt if it can't move.

Left click, gain speed for 1s. 6s cd.
Right click, swap head and tail (change direction to move away from body)

# Bomber

left click drop a bomb adjacent to you in that direction (orthogonally). After 2 seconds it creates an orthogonal explosion (bomberman).
On hitting anyone, including you, pushes them away from bomb source. Non-edge walls hit by the explosion
Bomb collides with players and is pushed with them, and has its own momentum.
Cooldown 4 seconds

Right click knock nearby entities away. Pushes bombs much farther. 2s cd.



# Skater
low friction, can conserve momentum into smooth turns. (Monkey jetpack should work the same)

Leaves fading trail of ice tiles behind her which reduce friction for other players.

left click reverse momentum
Right click spin momentum around mouse cursor as pivot point 

# Tracer

Left click teleport short distance towards mouse cursor 
right click teleport to where you were 2s ago

# Spider
left click shoot strand forward and backward which stretches across entire map, ignoring walls.
Max 3, replace oldest, cd 8

Enemies touching strand are visible to you and slowed.
right click while touching a strand quickly moves along the strand, even through walls.

# Magnet

left click reposition magnet to cursor location (moves over time, doesnt teleport)
Right click toggles magnet from pulling you to pushing you

# Frog
Moves in small lunges
left click charges tongue, curved projectile (similar to monkey jetpack). On hitting entity pulls them in. On hitting wall pulls frog to it while conserving momentum.

Right click repositions a fly to the cursor position (moves over time, doesnt teleport). Frog has vision from the fly and can grapple to it with tongue.


# Engineer
Press into wall to destroy it after a delay.
Left click places a 1x3 wall (show preview). Wall segments are destroyed when someone touches it, after a delay.
right click to push a nearby wall orthogonally away.

# Car
driving controls, w is forwards, left and right steer.
Forwards is determined by car facing, not mouse
left click beeps horn as long as its held
right mouse button changes physics for drifting.




----
Right click rewinds location while held. Has a maximum charge of 1s. Regains the charge at 1s/3s.