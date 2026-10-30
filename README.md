# Rooftop Parkour: Apex Flow 🏙️⚡

A high-performance, responsive 3D first-person / third-person rooftop parkour game built in the browser with **Three.js** and **Cannon-es** physics.

Features physics-driven parkour movement, variable jumping, double-jumping, low-profile sliding, dynamic wall-running with camera roll tilt, procedural ledge vaults and mantles, cyber grapple ziplines, momentum chaining, coyote time, jump buffering, timed landing dive rolls, procedural Web Audio SFX, and holographic ghost speedrun replays!

---

## 🎮 Controls

### ⌨️ Keyboard & Mouse
| Input | Action |
|---|---|
| **W, A, S, D** / Arrows | Move forward, backward, strafe left/right |
| **Mouse Look** | Rotate Camera (Click canvas to lock pointer) |
| **SPACE** | Jump (Hold for high leap, tap for short hop) |
| **SPACE (in air)** | Double Jump (Air flip boost) |
| **SHIFT (Left/Right)** | Sprint / Wall-Run adhesion |
| **C / Left Ctrl** | Crouch Slide (on ground) / Safety Dive Roll (on high drop) |
| **E** / Left Click | Fire Cyber Grapple Hook at target beacons |
| **V** | Toggle First-Person ↔ Third-Person view |
| **R** | Instant Respawn at latest reached checkpoint |
| **ESC / P** | Pause Game & Settings Menu |

### 🕹️ Gamepad (Xbox / PlayStation / Generic USB)
| Button | Action |
|---|---|
| **Left Stick** | Directional Movement |
| **Right Stick** | 360° Camera Look |
| **A / Cross (Button 0)** | Jump / Double Jump |
| **B / Circle (Button 1)** | Slide / Dive Roll |
| **X / Square (Button 2)** | Grapple Hook |
| **Y / Triangle (Button 3)** | Toggle 1st / 3rd Person View |
| **L1 / R2 (Button 4/7)** | Sprint |
| **Start / Options (Button 9)** | Pause Menu |

### 📱 Touch & Mobile
- **Virtual Analog Joystick (Bottom Left):** Omnidirectional run & strafe.
- **Action Cluster (Bottom Right):** Dedicated **Jump**, **Slide**, **Roll**, and **Zip** (Grapple) touch buttons.
- **Swipe Look:** Drag finger anywhere on the right side of the screen to smoothly rotate the camera.

---

## 🏃 Core Parkour Movement & Kinematics

### 1. Momentum System & Combo Multipliers
- Chaining parkour techniques without stopping builds your **Flow Ratio** (up to 1.85x speed multiplier).
- Example combo chain: `Slide -> Slide-Jump -> Wall-Run -> Wall-Kick -> Ledge Mantle -> Safety Roll`.
- Stopping or standing idle decays momentum smoothly via exponential damping (`THREE.MathUtils.damp`).

### 2. Wall-Running & Wall-Jumping
- Approach any vertical wall or billboard while airborne and hold **Shift / Forward**.
- Raycasts detect the surface normal and project your velocity along the wall tangent.
- Gravity falloff is reduced by 72% and camera rolls 13° outward.
- Pressing **Jump** during a wall-run launches the runner up and away with a high kinetic kick!

### 3. Obstacle Vaulting & Mantle Climbing
- Forward dual-tier raycasts check chest height (1.1m) and overhead clearance (2.2m).
- **Vault (0.6m – 1.35m):** Smoothly vaults low AC vents and pipes without shedding horizontal speed.
- **Mantle (1.4m – 2.8m):** Pulls runner up onto high rooftop ledges with a smooth cubic Hermite kinematic curve.

### 4. Cyber Grapple Hook & Zipline
- Look toward illuminated cyan beacon rings stationed on cranes, water towers, and antenna arrays.
- Press **E** to launch a tension cable: swings and pulls the runner across chasms at high velocity.
- Release with **Space** at the apex of the arc to rocket high above rooftops!

### 5. Coyote Time & Jump Buffering
- **Coyote Time (180ms):** Allows jumping for several frames after sprinting off a rooftop lip.
- **Jump Buffering (160ms):** Pressing jump slightly before touching the ground queues the jump so it executes frame-perfect upon touchdown.

### 6. Safety Dive Roll vs Hard Landings
- Falling from extreme heights triggers a hard landing impact (screen shake and temporary speed drop).
- Timing a **Roll** (`C` key or button) right before impact initiates a full parkour dive roll, absorbing the shock and converting downward velocity directly into a forward sprint boost!

### 7. Holographic Speedrun Ghost Replay
- Every completed level run records frame positions and orientation at 20Hz.
- On achieving a new personal best, the ghost is saved to `localStorage`.
- In subsequent runs, a translucent cyan holographic runner dashes along your exact personal best path so you can race against your record!

---

## 🌆 Sectors (Levels)

1. **Level 1: Neon Skyline (Rookie Run)**
   - Introduces rooftop leaping, low AC unit vaulting, and billboard wall-running.
   - 5 Checkpoints • 4 Collectibles • Par Time: 45s.
2. **Level 2: District 9 (Industrial Vertigo)**
   - High-altitude moving crane platforms, narrow balance pipes, and deep chasm gaps.
   - 5 Checkpoints • 5 Collectibles • Par Time: 55s.
3. **Level 3: Apex Spire (Cyber Chasm)**
   - Extreme rooftop gaps requiring chained wall-runs, grapple hook ziplines, and precision mantle climbs.
   - 6 Checkpoints • 6 Collectibles • Par Time: 70s.

---

## 👑 Specialists Roster

- **The Rebel (Scout):** 10/10 Speed, 9.5/10 Agility, ultra-fast wall-hops.
- **The Brawler (Heavy):** 10/10 Resilience, smash-vaults through obstacles, impervious to drop penalties.
- **The Thinker (Mind):** 10/10 Precision, extended ledge climb reach, +40% grapple hook distance.
- **The Free Spirit (Vibe):** 2.0x Flow Multiplier, buoyant double-jumps, air-spin kicks.

---

## 🔊 Procedural Web Audio Engine

Zero external audio files or 404 risks:
- Synthesized footstep impacts with stereo panning.
- Frequency-swept jump and double-jump whooshes.
- Low-rumble landing thumps and slide friction noise.
- Metallic grapple hook cables and pentatonic checkpoint chimes.
- Dynamic wind rush noise filter that opens up at high speeds!

---

## 💡 5 Ideas to Improve the Game Further

1. **Procedural Endless Rooftop Mode (City Generator):** An endless rooftop runner mode where buildings, gaps, cranes, and collectibles generate endlessly based on a procedural seed, with escalating speed and weather hazards.
2. **Trick System & Score Multiplier Animations:** Add acrobatic trick inputs in mid-air (e.g. front flips, 360 bar spins, wall-spin kicks) rewarded with combo multipliers and stylish visual slow-motion pauses on apex trick leaps.
3. **Dynamic Day / Night & Neon Weather Cycle:** Introduce transition between golden hour sunset, rainy cyberpunk night with wet roof reflections (`roughness` puddles), and volumetric lightning fog.
4. **Online Global Speedrun Leaderboard:** Store fastest runs via a backend database with downloadable ghost run telemetry files so players can race against friends' ghosts worldwide.
5. **Level Editor / Custom Track Sharing:** An in-game modular level creator where players can drag and drop rooftop buildings, cranes, billboards, and grapple points, then export their level code to share with other runners.
