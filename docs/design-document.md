# Game Design Document – 3D Fishing & Exploration Adventure

## Executive summary

This document outlines the design for a stylised 3D fishing and exploration game set in a small open‑world archipelago.  Players captain a small boat, explore islands and reefs, and dive beneath the waves to catch and collect an ever‑changing variety of fish.  The core gameplay combines **exploration**, **resource management**, **fishing mini‑games**, and **boat and gear upgrades**, drawing inspiration from titles like *Cat Goes Fishing*, *Dredge*, *Subnautica*, *The Legend of Zelda: The Wind Waker* and *Loddlenaut*.  A dynamic day–night cycle, procedurally generated fish variants, and a flexible spatial inventory create a game that rewards both relaxed play and strategic planning.  Players can sell their catch, deliver orders to islanders or merchants, and use earnings to improve their boat, fishing gear and diving equipment, gradually unlocking deeper biomes and more exotic creatures.

## Core concept and pillars

**Gameplay loop:** cast off from harbour, sail to promising fishing spots, play a skill‑based fishing mini‑game and/or dive to collect fish and materials, manage your limited inventory, return to port to sell or deliver your haul, and invest in upgrades for longer or deeper expeditions.  Exploration is reward‑driven; discovering new islands and reef systems yields unique fish, upgrade materials, NPC quests and story clues.

**Pillars**

| Pillar | Description |
| --- | --- |
| Exploration & discovery | Inspired by *Wind Waker*’s ocean world, players sail across a grid of sea sections to uncover islands and secretsen.wikipedia.org. Each region has unique biomes, fish species and materials.  A day–night cycle adds risk/reward; staying out after dark increases encounters with rare luminous fish but also raises danger levelsen.wikipedia.org#:~:text=Dredge%20sees%20the%20player%20control,which%20can%20attack%20the%20player). |
| Spatial inventory & resource management | Like *Dredge*, the boat’s hold is a grid where fish and equipment of different shapes must be fitted efficientlygamedeveloper.com.  Damage or negative events consume slots, reducing capacitygamedeveloper.com.  Players must balance cargo, fuel, and gear. |
| Skill‑based fishing & diving | Fishing uses a mini‑game inspired by *Cat Goes Fishing* where players control the hook underwater to snag fish of different sizes and behaviourscat-goes-fishing.updatestar.com.  Diving introduces oxygen management reminiscent of *Subnautica*realgamingdomain.com.  Players can catch or avoid predators, collect sunken treasure and upgrade materials. |
| Progression & upgrades | Selling fish and fulfilling deliveries yield currency to upgrade rods, reels, lines, diving gear, boat engines, hulls and hold size.  New equipment grants access to deeper depths and faster travel, echoing *Subnautica*’s tiered explorationrealgamingdomain.com.  Upgrades to the hold change its shape, introducing new spatial puzzlesgamedeveloper.com. |
| Mood & aesthetic | A peaceful yet mysterious tone.  Daytime is colourful and bright; nights become neon‑tinged with bioluminescent creatures inspired by real deep‑sea organisms—90 % of open‑ocean organisms produce light, and anglerfish use symbiotic bacteria in their lures to attract preyocean.si.edu.  Optional cosmic‑horror undertones can emerge in late game, influenced by *Dredge*en.wikipedia.org#:~:text=2025.). |

## Game world & narrative

### Setting

The game takes place in a **small archipelago** scattered across a vast ocean.  Each sea square contains an island, reef or notable landmark—reflecting the grid‐based overworld of *The Wind Waker*en.wikipedia.org.  These islands range from tropical sandbars and kelp forests to eerie deep trenches and bioluminescent caverns.  As players upgrade their boat and diving gear, they can venture farther and deeper.

### Story overview

Players assume the role of an adventurous fisher starting out with a basic dinghy and humble rod.  Early in the game they hear rumours of **legendary luminous fish** whose parts can unlock powerful technology.  An elder explains that the ocean has a delicate balance; overfishing or ignoring strange anomalies can awaken ancient creatures.  Through side‑quests and deliveries for islanders, players uncover lore about an abandoned civilisation and a benevolent deep‑sea entity that once maintained harmony.  By collecting relics and helping NPCs, players eventually choose between harnessing the ocean’s secrets for profit or restoring balance.

### NPCs & quests

- **Harbormaster:** sells basic gear, offers tutorial quests and introduces the spatial inventory.
- **Island traders/chefs:** request specific fish or materials; completing deliveries for them provides money, recipes and reputation. Quests are time‑sensitive: the fresher the fish, the better the reward.
- **Inventor:** crafts new equipment, requiring rare fish parts, pearls and metals. May ask players to retrieve deep‑sea relics.
- **Mystic:** provides lore and hints about cosmic anomalies, gradually unlocking a narrative thread reminiscent of *Dredge*’s eerie discoveriesen.wikipedia.org#:~:text=2025.).

## Gameplay mechanics

### Fishing mini‑game

- **Casting & reeling:** players select bait and cast their line. Underwater, they see a stylised 3D side view of fish and obstacles. Using the mouse or controller, they move the hook to avoid smaller fish and snag target species, as in *Cat Goes Fishing*cat-goes-fishing.updatestar.com.
- **Fish behaviour:** different species have unique patterns—darting, hovering, or hiding behind rocks. Predatory fish may chase the hook; hooking them requires stronger gear.
- **Hook tension:** players must maintain tension within a safe range by alternating reel speed. Breaking tension loses the fish and risks line damage.
- **Lures & bait:** certain fish respond to specific baits. Rare luminous fish appear only at night or deep down, adding risk.

### Diving exploration

- **Oxygen management:** players equip a diving suit and can leave the boat to swim freely underwater. Like *Subnautica*, depth and oxygen limit dive lengthrealgamingdomain.com. Upgrades extend capacity and enable deeper explorationrealgamingdomain.com.
- **Swimming controls:** third‑person movement with simple acceleration and vertical control. Players can harvest seaweed, pearls, ores and small creatures.
- **Hazards:** aggressive fauna, toxic vents and low visibility. Players can use tools like nets, harpoons or lights. Getting attacked damages the inventory grid (representing hull or suit integrity), reducing space and forcing strategic decisionsgamedeveloper.com.

### Sailing & exploration

- **Boat controls:** steer with keyboard/controller, adjusting sail direction or engine throttle. Wind direction matters; players can hoist sails to save fuel, echoing *Wind Waker*’s sailing mechanicsen.wikipedia.org.
- **Fuel & time:** the boat consumes fuel or stamina. A day–night cycle influences fish behaviour; staying out at night increases risk of panic events or hallucinations reminiscent of *Dredge*en.wikipedia.org#:~:text=Dredge%20sees%20the%20player%20control,which%20can%20attack%20the%20player).
- **Map & fog‑of‑war:** the world map starts blank. As players explore new sea tiles, icons mark discovered islands, fishing spots, and hazards. They can drop markers for known fish or materials.

### Inventory & upgrades

- **Spatial grid:** the boat’s hold, diving suit pockets and backpack share a Tetris‑like grid. Fish, equipment and materials vary in shape; players rotate and place items to maximise capacitygamedeveloper.com. Damage from collisions or attacks blocks random grid slots, reducing carrying capacitygamedeveloper.com.
- **Upgrades:** players can buy or craft larger holds, additional slots, or specialised equipment (e.g., dedicated live-wells for fish, tool racks). Upgrades may alter the grid shape, offering new Tetris puzzles.
- **Crafting & cooking:** certain materials allow crafting of bait, lures, or cooking meals that grant temporary buffs (e.g., increased oxygen, faster reel speed).

### Economic & progression systems

- **Selling & deliveries:** players earn currency by selling fish based on freshness, size and rarity. Delivery contracts require specific fish or materials by a deadline and may grant special upgrades.
- **Reputation:** completing quests and deliveries increases standing with NPCs, unlocking new areas and storyline events.
- **Skill & tech trees:** separate trees for fishing, diving and sailing. Skill points can improve hook control, reduce fuel consumption, increase inventory space, or unlock special abilities (e.g., sonar ping to reveal fish). Tech upgrades from the inventor require rare components.

### Procedural content

- **Fish generation:** to keep the fish catalogue fresh, species are procedurally generated using modular parts (body, fins, patterns, lights) with controlled randomness, as recommended by procedural generation techniquesjobtalle.com. Weighted distributions control rarity and ensure common species appear frequently while rare luminous variants remain specialjobtalle.com.
- **Quests & events:** side quests and random encounters can be procedurally generated—e.g., rescuing a stranded sailor or investigating a mysterious glow. The underlying system ensures variety while maintaining narrative coherence.

## Art style & visual direction

The game adopts a stylised, slightly cel‑shaded 3D look blending **peaceful blue tones** with neon highlights at night.  Daytime evokes tranquil island vibes, while night dives reveal glowing coral and fish inspired by real bioluminescent organismsocean.si.edu.  Weather systems like rain and fog add mood; heavy rain may recall the raw atmosphere of *Blue Drifter*’s rainy planetsokpop.itch.io.

**Character & creature design**

- Fish use exaggerated forms and bright patterns for readability. Rare luminous fish have unique glowing patterns. Some deep‑sea creatures may have grotesque Lovecraftian elements, hinting at cosmic horror influences from *Dredge*en.wikipedia.org#:~:text=2025.).
- NPCs are stylised humans and anthropomorphic animals, lending charm and expressiveness.

**User interface**

UI follows a minimalist nautical theme: parchment‑style inventory grid overlays, compass and time indicator, and soft ambient colours.  The spatial inventory is clearly presented, with rotation buttons and tooltips.  On the boat, gauges show speed, fuel and wind direction; underwater, HUD displays oxygen and depth.

## Sound & music

Ambient ocean sounds (waves, gulls, distant whale songs) set the relaxing tone.  Each biome features subtle music that shifts at night to include synth pads and echoing tones, emphasising mystery.  Fishing mini‑games have gentle plucked strings; hooking a rare fish triggers a dynamic music swell.  Diving uses muffled effects and sonar pings, adding tension when oxygen runs low.  A dynamic soundtrack responds to the day–night cycle and story events.

## Technical requirements & platform

The game targets PC and consoles (Nintendo Switch, PlayStation, Xbox).  It is developed using a modern game engine such as Unity or Unreal Engine.  Core technical requirements include:

- **Ocean simulation:** simple wave shader and buoyancy for boat movement; dynamic weather and lighting.
- **Procedural generation:** algorithm for fish and quest variation, using seed values for reproducibility.
- **Physics & AI:** basic fish AI for movement patterns and pursuit; simple boat collision with rocks; diving physics including buoyancy and drag.
- **Multiplatform controls:** keyboard/mouse and gamepad support; optional gyro/tilt controls on Switch.
- **Save system:** autosaves at docking; manual saves at any time; persistent world state.

## Monetization & modes

This is a premium, single‑player game with no mandatory microtransactions.  Optional cosmetic DLC packs (boat skins, hat styles) or major expansion packs could extend the world and story.  An optional **relaxed mode** removes damage and time penalties, allowing players to focus on exploring and fishing without stress, aligning with the user’s desire for a chill experience.

## Development roadmap & milestones

| Milestone | Duration | Key tasks |
| --- | --- | --- |
| **Pre‑production** | 3 months | Refine concept & scope, assemble core team (designer, programmer, artist, composer), create GDD & prototype fishing mini‑game. |
| **Vertical slice** | 4 months | Develop one island tile with full gameplay loop: sailing, fishing, simple diving, spatial inventory, NPC interactions, basic day–night cycle.  Conduct playtests to validate fun and pacing. |
| **Production – content & systems** | 8 months | Build full archipelago (approx. 20 sea tiles), implement procedural fish generator, design varied biomes, add diving hazards, implement upgrade systems, craft narrative quests.  Create art assets, animations and sound. |
| **Beta & polish** | 3 months | Optimise performance, refine AI and controls, balance economy and fish rarity, add accessibility options, fix bugs.  Run closed beta tests and iterate. |
| **Launch & post‑release** | 2 months | Final bug fixes, marketing push, release on target platforms.  Plan DLC or expansions based on player feedback. |

## Conclusion

This fishing and exploration game aims to blend the relaxing joy of casting a line with the thrill of discovering uncharted waters.  By combining spatial inventory puzzles, skill‑based mini‑games, deep‑sea diving and a mysterious narrative, the game offers depth for players seeking strategy and progression while remaining accessible to those who want a soothing maritime adventure.  The design draws on proven mechanics from successful titles—*Dredge*’s grid system, *Cat Goes Fishing*’s hook control, *Subnautica*’s depth‑based progression and *Wind Waker*’s sailing—while introducing unique elements like procedurally generated fish and a reactive day–night cycle.  The result is a rich, evolving experience that invites players to lose themselves in a luminous ocean world.