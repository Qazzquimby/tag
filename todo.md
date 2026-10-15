Desired new state (as things should be, not as they are):
Monster moves faster depending on leaderboard position.
Monster lunge recharges after 6s (or upon eating)
Ghost not phasing is pushed out of walls.
Ghost fear only works on prey
Tracer has some graphic to show her teleport movement. An arrow or smear sprite?
Clone and monster illusion appear full opacity to enemies, but transparent to the player

Prey spawn locations are not visible, only predators.
2s invulnerability on spawning and 1s after eating something.
Map should start scrolling when larger than view area. Currently it just grows past the bounds of the screen which is useless.
Some kind of warning when there are 15s remaining.
Food should spawn more with more players.


Rocket jumper, shoots projectile like sticky bomb. Upon reaching near 0 speed immediately explodes. Has a minimum starting velocity.

Grapple: Left and right click while held fires grapple at mouse cursor. On connecting to wall or entity pulls towards them. Each button controls a separate grapple.

Portal: Left and right click create blue and orange portal tiles. Any entity entering one portal moves to the same pixel location on the other portal. 

Ricochet: Very little wasd control. Lmb gives high velocity in aimed direction. Right mouse button clicked on an empty space creates a wall there for 1s. Clicked on a wall removes the wall for 1s.

# Car
driving controls, w is forwards, left and right steer.
Forwards is determined by car facing, not mouse
left click beeps horn as long as its held
right mouse button changes physics for drifting.

# Snake
Only moves orthogonally at a fixed speed. No momentum conservation. Accelerates the longer it moves in a straight line.
On eating a player or food, gain a body segment. Can't move through own body.
Can catch prey with body, but can only be caught at head. Dies and loses 10pt if it can't move.

Left click, gain speed for 1s. 6s cd.
Right click, swap head and tail (change direction to move away from body)


Should be able to select next class while alive. Change takes place after next death.

###### Later

# Spider
left click shoot strand forward and backward which stretches across entire map, ignoring walls.
Max 3, replace oldest, cd 8

Enemies touching strand are visible to you and slowed.
right click while touching a strand quickly moves along the strand, even through walls.

# Frog
Moves in small lunges
left click charges tongue, curved projectile (similar to monkey jetpack). On hitting entity pulls them in. On hitting wall pulls frog to it while conserving momentum.

Right click repositions a fly to the cursor position (moves over time, doesnt teleport). Frog has vision from the fly and can grapple to it with tongue.

# Engineer
Press into wall (not outer edge) to destroy it after a delay. Destroyed walls respawn after a delay. 
Left click places a breakable wall at the cursor. Breakable walls are destroyed when someone touches it, after a delay.
right click to push a nearby wall orthogonally away.


----
Right click rewinds location while held. Has a maximum charge of 1s. Regains the charge at 1s/3s.