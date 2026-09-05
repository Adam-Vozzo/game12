import {
  ISLANDS,
  SPOTS,
  SPECIES,
  UPGRADES,
  RELICS,
  WORLD_LIMIT,
  type UpgradeId,
} from './data';
export type Cargo = {
  id: string;
  species: string;
  name: string;
  color: string;
  price: number;
  w: number;
  h: number;
  x: number;
  y: number;
  caughtAt: number;
  weight: number;
  variant: string;
  kind: 'fish' | 'material';
};
export type SaveState = {
  version: 1;
  x: number;
  z: number;
  angle: number;
  time: number;
  day: number;
  elapsed: number;
  coins: number;
  fuel: number;
  hull: number;
  cargo: Cargo[];
  blocked: number[];
  upgrades: Record<UpgradeId, number>;
  discovered: string[];
  charted: string[];
  catalogue: string[];
  relics: string[];
  completed: string[];
  caught: number;
  sold: number;
  dives: number;
  xp: number;
  seed: number;
  bait: number;
  meal: number;
  ending: string | null;
  waypoint: { x: number; z: number } | null;
  settings: {
    relaxed: boolean;
    muted: boolean;
    quality: 'low' | 'high';
    reducedMotion: boolean;
    touch: boolean;
  };
};
export type SwimmingFish = {
  species: string;
  x: number;
  y: number;
  originY: number;
  speed: number;
  phase: number;
  color: string;
  scale: number;
};
export type Fishing = {
  phase: 'hunt' | 'reel' | 'caught';
  hookX: number;
  hookY: number;
  fish: SwimmingFish[];
  target: number;
  tension: number;
  progress: number;
  danger: number;
  timer: number;
  reward: Cargo | null;
  bait: boolean;
};
export type Loot = {
  id: string;
  name: string;
  kind: 'pearl' | 'scrap' | 'kelp' | 'relic';
  x: number;
  z: number;
  depth: number;
  collected: boolean;
};
export type Dive = {
  x: number;
  z: number;
  depth: number;
  oxygen: number;
  loot: Loot[];
  cargoIds: string[];
  bottom: number;
  timer: number;
};
export type Input = { x: number; z: number; vertical: number; reel: boolean };
export const emptyInput = (): Input => ({
  x: 0,
  z: 0,
  vertical: 0,
  reel: false,
});
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const distance = (
  a: { x: number; z: number },
  b: { x: number; z: number },
) => Math.hypot(a.x - b.x, a.z - b.z);
export const holdSize = (level: number) => ({
  w: 6 + level,
  h: level < 2 ? 4 : 5,
});
export const isNight = (s: SaveState) => s.time >= 19 || s.time < 5;
export const maxDepth = (s: SaveState) => [20, 40, 65, 100][s.upgrades.oxygen];
export const rank = (s: SaveState) => 1 + Math.floor(s.xp / 120);
export function initialState(): SaveState {
  return {
    version: 1,
    x: 0,
    z: 14,
    angle: Math.PI,
    time: 9,
    day: 1,
    elapsed: 0,
    coins: 60,
    fuel: 100,
    hull: 100,
    cargo: [],
    blocked: [],
    upgrades: { rod: 0, oxygen: 0, engine: 0, hold: 0 },
    discovered: ['haven'],
    charted: [],
    catalogue: [],
    relics: [],
    completed: [],
    caught: 0,
    sold: 0,
    dives: 0,
    xp: 0,
    seed: 731,
    bait: 3,
    meal: 0,
    ending: null,
    waypoint: null,
    settings: {
      relaxed: false,
      muted: true,
      quality: 'high',
      reducedMotion: false,
      touch: false,
    },
  };
}
export function cells(item: Pick<Cargo, 'x' | 'y' | 'w' | 'h'>, width: number) {
  const result: number[] = [];
  for (let y = item.y; y < item.y + item.h; y++)
    for (let x = item.x; x < item.x + item.w; x++) result.push(y * width + x);
  return result;
}
export function fits(
  s: SaveState,
  item: Pick<Cargo, 'x' | 'y' | 'w' | 'h'>,
  ignoreId?: string,
) {
  const size = holdSize(s.upgrades.hold);
  if (
    item.x < 0 ||
    item.y < 0 ||
    item.x + item.w > size.w ||
    item.y + item.h > size.h
  )
    return false;
  const occupied = new Set(s.blocked);
  s.cargo
    .filter((c) => c.id !== ignoreId)
    .forEach((c) => cells(c, size.w).forEach((n) => occupied.add(n)));
  return cells(item, size.w).every((n) => !occupied.has(n));
}
export function autoPlace(s: SaveState, item: Cargo) {
  const size = holdSize(s.upgrades.hold);
  for (const rotated of [false, true])
    for (let y = 0; y < size.h; y++)
      for (let x = 0; x < size.w; x++) {
        const p = {
          ...item,
          x,
          y,
          w: rotated ? item.h : item.w,
          h: rotated ? item.w : item.h,
        };
        if (fits(s, p)) {
          s.cargo.push(p);
          return true;
        }
      }
  return false;
}
export function cargoValue(s: SaveState, item: Cargo) {
  const freshness =
    s.settings.relaxed || item.kind === 'material'
      ? 1
      : clamp(1 - (s.elapsed - item.caughtAt) / 1600, 0.45, 1);
  return Math.max(1, Math.round(item.price * freshness));
}
export function nearestIsland(s: { x: number; z: number }) {
  return ISLANDS.reduce((a, b) => (distance(s, a) < distance(s, b) ? a : b));
}
export function nearestSpot(s: { x: number; z: number }) {
  return SPOTS.reduce((a, b) => (distance(s, a) < distance(s, b) ? a : b));
}
export const CONTRACTS = [
  {
    id: 'breakfast',
    npc: 'Mara · Harbormaster',
    title: 'Breakfast at the quay',
    species: 'sprat',
    count: 2,
    reward: 95,
    port: 'haven',
  },
  {
    id: 'reef-supper',
    npc: 'Jun · Island chef',
    title: 'A colourful supper',
    species: 'clown',
    count: 2,
    reward: 170,
    port: 'coral',
  },
  {
    id: 'forest-study',
    npc: 'Iris · Naturalist',
    title: 'Secrets of the green veil',
    species: 'perch',
    count: 2,
    reward: 180,
    port: 'kelp',
  },
  {
    id: 'night-light',
    npc: 'Orin · Inventor',
    title: 'A light of our own',
    species: 'lantern',
    count: 1,
    reward: 240,
    port: 'moon',
  },
] as const;
export function parseSave(raw: string): SaveState | null {
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1) return null;
    const base = initialState();
    const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
    for (const field of [
      'x',
      'z',
      'angle',
      'time',
      'day',
      'elapsed',
      'coins',
      'fuel',
      'hull',
      'caught',
      'sold',
      'dives',
      'xp',
      'seed',
      'bait',
      'meal',
    ] as const)
      if (!finite(value[field])) return null;
    if (
      !value.upgrades ||
      UPGRADES.some(
        (u) =>
          !Number.isInteger(value.upgrades[u.id]) ||
          value.upgrades[u.id] < 0 ||
          value.upgrades[u.id] > 3,
      )
    )
      return null;
    if (
      !value.settings ||
      ['relaxed', 'muted', 'reducedMotion', 'touch'].some(
        (k) => typeof value.settings[k] !== 'boolean',
      ) ||
      !['low', 'high'].includes(value.settings.quality)
    )
      return null;
    if (value.ending !== null && !['restore', 'profit'].includes(value.ending))
      return null;
    if (
      !Array.isArray(value.cargo) ||
      value.cargo.length > 45 ||
      !Array.isArray(value.blocked) ||
      !value.blocked.every((n: unknown) => Number.isInteger(n))
    )
      return null;
    for (const key of [
      'discovered',
      'charted',
      'catalogue',
      'relics',
      'completed',
    ])
      if (
        !Array.isArray(value[key]) ||
        value[key].length > 200 ||
        !value[key].every((x: unknown) => typeof x === 'string') ||
        new Set(value[key]).size !== value[key].length
      )
        return null;
    const s = {
      ...base,
      ...value,
      settings: { ...base.settings, ...value.settings },
      cargo: [],
    } as SaveState;
    s.x = clamp(s.x, -WORLD_LIMIT, WORLD_LIMIT);
    s.z = clamp(s.z, -WORLD_LIMIT, WORLD_LIMIT);
    s.fuel = clamp(s.fuel, 0, 100);
    s.hull = clamp(s.hull, 1, 100);
    if (s.time < 0 || s.time >= 24) s.time = ((s.time % 24) + 24) % 24;
    s.coins = clamp(s.coins, 0, 10000000);
    s.day = Math.max(1, Math.floor(s.day));
    s.bait = clamp(s.bait, 0, 10000);
    const size = holdSize(s.upgrades.hold);
    s.blocked = s.blocked.filter((n) => n >= 0 && n < size.w * size.h);
    const ids = new Set();
    for (const c of value.cargo) {
      if (
        !c ||
        ['x', 'y', 'w', 'h', 'price', 'caughtAt', 'weight'].some(
          (k) => !finite(c[k]),
        ) ||
        !['x', 'y', 'w', 'h'].every((k) => Number.isInteger(c[k])) ||
        c.w < 1 ||
        c.h < 1 ||
        typeof c.id !== 'string' ||
        ids.has(c.id) ||
        typeof c.name !== 'string' ||
        typeof c.color !== 'string' ||
        typeof c.species !== 'string' ||
        c.price < 0 ||
        !['fish', 'material'].includes(c.kind) ||
        !fits(s, c)
      )
        return null;
      s.cargo.push(c);
      ids.add(c.id);
    }
    if (s.waypoint && (!finite(s.waypoint.x) || !finite(s.waypoint.z)))
      s.waypoint = null;
    return s;
  } catch {
    return null;
  }
}
export class Game {
  s: SaveState;
  mode: 'sail' | 'fishing' | 'dive' = 'sail';
  fishing: Fishing | null = null;
  dive: Dive | null = null;
  paused = false;
  moving = false;
  speed = 0;
  collisionCooldown = 0;
  saveDue = false;
  events: { id: number; text: string; kind: string }[] = [];
  eventId = 0;
  onEvent: ((kind: string) => void) | null = null;
  constructor(state = initialState()) {
    this.s = state;
  }
  random() {
    this.s.seed = (Math.imul(this.s.seed, 1664525) + 1013904223) >>> 0;
    return this.s.seed / 4294967296;
  }
  tell(text: string, kind = 'info') {
    this.events.push({ id: ++this.eventId, text, kind });
    if (this.events.length > 4) this.events.shift();
    this.onEvent?.(kind);
  }
  dock() {
    if (this.mode !== 'sail') return null;
    return ISLANDS.find((i) => distance(this.s, i.port) < 13) || null;
  }
  update(dt: number, input: Input) {
    if (this.paused) return;
    dt = clamp(dt, 0, 0.05);
    const s = this.s;
    s.elapsed += dt;
    s.time += dt / 27;
    if (s.time >= 24) {
      s.time -= 24;
      s.day++;
      this.saveDue = true;
    }
    s.meal = Math.max(0, s.meal - dt);
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    if (this.mode === 'sail') {
      const length = Math.hypot(input.x, input.z);
      this.moving = length > 0.12;
      this.speed = this.moving
        ? s.fuel > 0
          ? 10 + s.upgrades.engine * 2.8
          : 3
        : 0;
      if (this.moving) {
        const ix = input.x / Math.max(1, length),
          iz = input.z / Math.max(1, length);
        s.angle = Math.atan2(ix, iz);
        s.x = clamp(s.x + ix * this.speed * dt, -WORLD_LIMIT, WORLD_LIMIT);
        s.z = clamp(s.z + iz * this.speed * dt, -WORLD_LIMIT, WORLD_LIMIT);
        if (!s.settings.relaxed)
          s.fuel = Math.max(
            0,
            s.fuel - (dt * 0.075) / (1 + s.upgrades.engine * 0.3),
          );
        for (const island of ISLANDS) {
          const d = distance(s, island),
            r = island.radius + 2;
          if (d < r) {
            const a = Math.atan2(s.z - island.z, s.x - island.x);
            s.x = island.x + Math.cos(a) * r;
            s.z = island.z + Math.sin(a) * r;
            if (this.collisionCooldown === 0 && !s.settings.relaxed) {
              this.damage(7);
              this.collisionCooldown = 3;
              this.tell(
                'Mind the shallows! Return to port for repairs.',
                'warning',
              );
            }
          }
        }
      }
      for (const i of ISLANDS)
        if (distance(s, i) < 65 && !s.discovered.includes(i.id)) {
          s.discovered.push(i.id);
          s.xp += 35;
          this.tell('Discovered ' + i.name + ' · +35 experience', 'discovery');
          this.saveDue = true;
        }
      const tx = Math.floor((s.x + 250) / 50),
        tz = Math.floor((s.z + 250) / 50);
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${tx + dx},${tz + dz}`;
          if (!s.charted.includes(key)) s.charted.push(key);
        }
      if (s.waypoint && distance(s, s.waypoint) < 8) {
        s.waypoint = null;
        this.tell('You reached your chart marker.');
      }
    } else if (this.mode === 'fishing') this.updateFishing(dt, input);
    else this.updateDive(dt, input);
  }
  damage(amount: number) {
    if (this.s.settings.relaxed) return;
    this.s.hull = Math.max(0, this.s.hull - amount);
    const size = holdSize(this.s.upgrades.hold);
    if (
      this.s.hull < 70 &&
      this.s.blocked.length < Math.floor((100 - this.s.hull) / 20)
    ) {
      for (let i = size.w * size.h - 1; i >= 0; i--)
        if (
          fits(this.s, { x: i % size.w, y: Math.floor(i / size.w), w: 1, h: 1 })
        ) {
          this.s.blocked.push(i);
          break;
        }
    }
    if (this.s.hull <= 0) this.rescue();
  }
  rescue() {
    if (this.dive) {
      const ids = this.dive.cargoIds;
      this.s.cargo = this.s.cargo.filter((c) => !ids.includes(c.id));
    }
    const port = ISLANDS[0].port;
    this.s.x = port.x + 4;
    this.s.z = port.z + 8;
    this.s.fuel = Math.max(25, this.s.fuel);
    this.s.hull = 60;
    this.s.coins = Math.max(0, this.s.coins - 15);
    this.mode = 'sail';
    this.fishing = null;
    this.dive = null;
    this.tell(
      'Mara brought you home. 15 coins paid for the rescue.',
      'warning',
    );
    this.saveDue = true;
  }
  startFishing(useBait = false) {
    if (this.mode !== 'sail') return false;
    const spot = nearestSpot(this.s);
    const biome = distance(this.s, spot) < 35 ? spot.biome : 'shoals';
    let pool = SPECIES.filter(
      (f) => f.biome === biome && (!f.night || isNight(this.s)),
    );
    if (!pool.length) pool = SPECIES.filter((f) => f.biome === 'shoals');
    const bait = useBait && this.s.bait > 0;
    if (bait) this.s.bait--;
    const fish: SwimmingFish[] = Array.from({ length: 7 }, (_, i) => {
      const sp = pool[Math.floor(this.random() * pool.length)];
      return {
        species: sp.id,
        x: 0.13 + this.random() * 0.74,
        y: 0.24 + i * 0.09,
        originY: 0.24 + i * 0.09,
        speed: (0.023 + this.random() * 0.017) * (i % 2 ? 1 : -1),
        phase: this.random() * 6.28,
        color: sp.color,
        scale: 0.65 + sp.w * 0.16,
      };
    });
    this.fishing = {
      phase: 'hunt',
      hookX: 0.5,
      hookY: 0.12,
      fish,
      target: -1,
      tension: 0.48,
      progress: 0,
      danger: 0,
      timer: 0,
      reward: null,
      bait,
    };
    this.mode = 'fishing';
    this.moving = false;
    return true;
  }
  aim(x: number, y: number) {
    if (this.fishing?.phase === 'hunt') {
      this.fishing.hookX = clamp(x, 0.02, 0.98);
      this.fishing.hookY = clamp(y, 0.05, 0.97);
    }
  }
  updateFishing(dt: number, input: Input) {
    const f = this.fishing;
    if (!f) return;
    f.timer += dt;
    if (f.phase === 'hunt') {
      f.hookX = clamp(f.hookX + input.x * dt * 0.38, 0.02, 0.98);
      f.hookY = clamp(f.hookY + input.z * dt * 0.38, 0.05, 0.97);
      f.fish.forEach((fish, i) => {
        fish.x += fish.speed * dt;
        if (fish.x < 0.08 || fish.x > 0.92) fish.speed *= -1;
        fish.y = fish.originY + Math.sin(f.timer * 1.8 + fish.phase) * 0.028;
        if (
          Math.hypot((fish.x - f.hookX) * 1.4, fish.y - f.hookY) < 0.064 &&
          f.timer > 1
        ) {
          const species = SPECIES.find((s) => s.id === fish.species)!;
          if (species.level > this.s.upgrades.rod) {
            if (this.collisionCooldown === 0) {
              this.tell(
                species.name +
                  ' needs fishing gear level ' +
                  (species.level + 1) +
                  '.',
                'warning',
              );
              this.collisionCooldown = 3;
            }
            return;
          }
          f.target = i;
          f.phase = 'reel';
          f.tension = 0.48;
          f.timer = 0;
          this.tell('Fish on! Hold to reel. Release to ease the line.', 'hook');
        }
      });
    } else if (f.phase === 'reel') {
      const species = SPECIES.find((s) => s.id === f.fish[f.target].species)!;
      f.tension = clamp(
        f.tension +
          (input.reel ? 0.37 : -0.25) * dt +
          Math.sin(f.timer * 3.2) * dt * (0.1 + species.level * 0.025),
        0,
        1,
      );
      const low = 0.2 - this.s.upgrades.rod * 0.02,
        high = 0.77 + this.s.upgrades.rod * 0.025;
      const safe = f.tension >= low && f.tension <= high;
      f.danger = clamp(f.danger + (safe ? -0.9 : 1) * dt, 0, 3);
      if (input.reel && safe)
        f.progress +=
          (dt *
            (0.14 +
              this.s.upgrades.rod * 0.012 +
              (f.bait ? 0.035 : 0) +
              (this.s.meal > 0 ? 0.025 : 0))) /
          (1 + species.level * 0.22);
      else if (!safe) f.progress = Math.max(0, f.progress - dt * 0.025);
      f.hookX = f.fish[f.target].x;
      f.hookY = f.fish[f.target].y;
      if (f.danger >= 3 && !this.s.settings.relaxed) {
        this.tell(
          'The fish slipped away. Try keeping the marker inside the green zone.',
          'warning',
        );
        this.endActivity();
      } else if (f.progress >= 1) {
        const weight = +(
          species.w * 0.3 +
          this.random() * species.w * 0.5
        ).toFixed(2);
        const variant =
          this.random() < 0.12
            ? 'Opalescent'
            : this.random() < 0.25
              ? 'Dappled'
              : 'Classic';
        const item: Cargo = {
          id: 'catch-' + this.s.seed + '-' + Math.round(this.s.elapsed * 100),
          species: species.id,
          name: species.name,
          color: species.color,
          price: Math.round(
            species.price *
              (0.85 + weight * 0.16) *
              (variant === 'Opalescent' ? 1.6 : 1),
          ),
          w: species.w,
          h: species.h,
          x: 0,
          y: 0,
          caughtAt: this.s.elapsed,
          weight,
          variant,
          kind: 'fish',
        };
        f.reward = item;
        f.phase = 'caught';
        this.onEvent?.('catch');
      }
    }
  }
  keepCatch() {
    const f = this.fishing;
    if (f?.phase !== 'caught' || !f.reward) return false;
    if (!autoPlace(this.s, f.reward)) {
      this.tell(
        'Your hold is full. Rearrange the cargo or release this fish.',
        'warning',
      );
      return false;
    }
    this.s.caught++;
    this.s.xp += 12;
    if (!this.s.catalogue.includes(f.reward.species))
      this.s.catalogue.push(f.reward.species);
    if (this.s.caught === 1) {
      this.s.coins += 40;
      this.tell('First catch! Mara’s welcome gift: 40 coins.', 'success');
    } else this.tell(f.reward.name + ' stowed in the hold.', 'success');
    this.endActivity();
    this.saveDue = true;
    return true;
  }
  releaseCatch() {
    if (this.fishing?.reward) {
      this.s.xp += 4;
      this.tell('Released to the sea · +4 experience.');
    }
    this.endActivity();
  }
  endActivity() {
    this.mode = 'sail';
    this.fishing = null;
    this.dive = null;
    this.moving = false;
  }
  startDive() {
    if (this.mode !== 'sail') return false;
    const spot = nearestSpot(this.s),
      bottom = distance(this.s, spot) < 45 ? spot.depth + 8 : 25;
    const loot: Loot[] = Array.from({ length: 12 }, (_, i) => ({
      id: 'loot-' + this.s.seed + '-' + i,
      name: i % 3 === 0 ? 'Pearl' : i % 3 === 1 ? 'Salvaged metal' : 'Sea kelp',
      kind: i % 3 === 0 ? 'pearl' : i % 3 === 1 ? 'scrap' : 'kelp',
      x: (this.random() - 0.5) * 36,
      z: (this.random() - 0.5) * 36,
      depth: 6 + this.random() * Math.min(bottom - 6, maxDepth(this.s) - 2),
      collected: false,
    }));
    for (const r of RELICS)
      if (distance(this.s, r) < 48 && !this.s.relics.includes(r.id))
        loot.push({
          id: r.id,
          name: r.name,
          kind: 'relic',
          x: r.x - this.s.x,
          z: r.z - this.s.z,
          depth: r.depth,
          collected: false,
        });
    this.dive = {
      x: 0,
      z: 0,
      depth: 4,
      oxygen: 100,
      loot,
      cargoIds: [],
      bottom: Math.max(bottom, ...loot.map((l) => l.depth + 3)),
      timer: 0,
    };
    this.mode = 'dive';
    this.s.dives++;
    this.moving = false;
    return true;
  }
  updateDive(dt: number, input: Input) {
    const d = this.dive;
    if (!d) return;
    d.timer += dt;
    const len = Math.max(1, Math.hypot(input.x, input.z));
    d.x = clamp(d.x + (input.x / len) * dt * 6, -55, 55);
    d.z = clamp(d.z + (input.z / len) * dt * 6, -55, 55);
    d.depth = clamp(
      d.depth + input.vertical * dt * 5,
      1,
      Math.min(maxDepth(this.s), d.bottom),
    );
    if (input.x || input.z) this.s.angle = Math.atan2(input.x, input.z);
    if (!this.s.settings.relaxed)
      d.oxygen -=
        (dt * (1 + d.depth * 0.007)) /
        (1 + this.s.upgrades.oxygen * 0.3 + (this.s.meal > 0 ? 0.3 : 0));
    if (d.oxygen <= 0) {
      this.tell('Out of air! Your new dive cargo was lost.', 'warning');
      this.rescue();
    } else if (d.oxygen < 22 && this.collisionCooldown === 0) {
      this.tell('Air is running low. Surface soon.', 'warning');
      this.collisionCooldown = 10;
    }
  }
  closestLoot() {
    const d = this.dive;
    if (!d) return null;
    return (
      d.loot
        .filter((l) => !l.collected)
        .sort(
          (a, b) =>
            Math.hypot(a.x - d.x, a.z - d.z, a.depth - d.depth) -
            Math.hypot(b.x - d.x, b.z - d.z, b.depth - d.depth),
        )[0] || null
    );
  }
  collect() {
    const d = this.dive,
      l = this.closestLoot();
    if (!d || !l) return false;
    const dist = Math.hypot(l.x - d.x, l.z - d.z, l.depth - d.depth);
    if (dist > 6) {
      this.tell('Swim closer to the treasure, including its depth.');
      return false;
    }
    if (l.kind === 'relic') {
      this.s.relics.push(l.id);
      this.s.xp += 80;
      l.collected = true;
      this.tell(
        'Recovered ' + l.name + '! Read its story in your journal.',
        'discovery',
      );
      this.saveDue = true;
      return true;
    }
    const item: Cargo = {
      id: l.id + '-' + Math.round(this.s.elapsed * 100),
      species: l.kind,
      name: l.name,
      color:
        l.kind === 'pearl'
          ? '#d0bbeb'
          : l.kind === 'scrap'
            ? '#9fbbb9'
            : '#82b696',
      price: l.kind === 'pearl' ? 55 : l.kind === 'scrap' ? 30 : 16,
      w: 1,
      h: 1,
      x: 0,
      y: 0,
      caughtAt: this.s.elapsed,
      weight: 0.1,
      variant: 'Salvage',
      kind: 'material',
    };
    if (!autoPlace(this.s, item)) {
      this.tell(
        'No room in the hold. Surface to rearrange your cargo.',
        'warning',
      );
      return false;
    }
    l.collected = true;
    d.cargoIds.push(item.id);
    this.s.xp += 8;
    this.tell(l.name + ' collected.', 'success');
    return true;
  }
  surface() {
    if (this.mode !== 'dive') return;
    this.endActivity();
    this.tell('Back aboard. Take a breath.');
    this.saveDue = true;
  }
  moveCargo(id: string, x: number, y: number, rotate = false) {
    const item = this.s.cargo.find((c) => c.id === id);
    if (!item) return false;
    const next = {
      ...item,
      x,
      y,
      w: rotate ? item.h : item.w,
      h: rotate ? item.w : item.h,
    };
    if (!fits(this.s, next, id)) {
      this.tell('That space is blocked or too small.', 'warning');
      return false;
    }
    Object.assign(item, next);
    this.saveDue = true;
    return true;
  }
  sellAll() {
    if (!this.dock()) return 0;
    const value = this.s.cargo.reduce(
      (sum, c) => sum + cargoValue(this.s, c),
      0,
    );
    if (!value) return 0;
    this.s.sold += this.s.cargo.filter((c) => c.kind === 'fish').length;
    this.s.coins += value;
    this.s.cargo = [];
    this.tell('Cargo sold for ' + value + ' coins.', 'success');
    this.saveDue = true;
    return value;
  }
  upgrade(id: UpgradeId) {
    if (!this.dock()) return false;
    const upgrade = UPGRADES.find((u) => u.id === id);
    if (!upgrade) return false;
    const level = this.s.upgrades[id],
      cost = upgrade.cost[level];
    if (level >= 3 || this.s.coins < cost) return false;
    if (id === 'hold') {
      const oldWidth = holdSize(level).w,
        newWidth = holdSize(level + 1).w;
      this.s.blocked = this.s.blocked.map(
        (cell) => Math.floor(cell / oldWidth) * newWidth + (cell % oldWidth),
      );
    }
    this.s.coins -= cost;
    this.s.upgrades[id]++;
    this.s.xp += 20;
    this.tell(upgrade.detail[level + 1] + ' fitted.', 'success');
    this.saveDue = true;
    return true;
  }
  service() {
    if (!this.dock()) return false;
    const cost = Math.ceil(
      (100 - this.s.fuel) * 0.15 + (100 - this.s.hull) * 0.2,
    );
    if (this.s.coins < cost) {
      this.tell(
        'Not enough coins. Docking always supplies 20 fuel for free.',
        'warning',
      );
      this.s.fuel = Math.max(this.s.fuel, 20);
      return false;
    }
    this.s.coins -= cost;
    this.s.fuel = 100;
    this.s.hull = 100;
    this.s.blocked = [];
    this.tell('Fuel topped up and hull repaired.', 'success');
    this.saveDue = true;
    return true;
  }
  rest(night = false) {
    if (!this.dock()) return false;
    if (!night || this.s.time >= 19) this.s.day++;
    this.s.time = night ? 20 : 8;
    this.s.fuel = Math.max(this.s.fuel, 20);
    this.s.elapsed += 60;
    this.tell(
      night
        ? 'The lanterns are lit. Night fishing awaits.'
        : 'A new morning. The sea is yours.',
    );
    this.saveDue = true;
    return true;
  }
  deliver(id: string) {
    const c = CONTRACTS.find((c) => c.id === id),
      dock = this.dock();
    if (!c || dock?.id !== c.port || this.s.completed.includes(id))
      return false;
    const items = this.s.cargo
      .filter((i) => i.species === c.species)
      .sort((a, b) => b.caughtAt - a.caughtAt);
    if (items.length < c.count) return false;
    const used = items.slice(0, c.count);
    const fresh = used.every(
      (i) => this.s.elapsed - i.caughtAt < 360 || this.s.settings.relaxed,
    );
    const reward = c.reward + (fresh ? Math.round(c.reward * 0.2) : 0);
    this.s.cargo = this.s.cargo.filter((i) => !used.some((u) => u.id === i.id));
    this.s.completed.push(id);
    this.s.coins += reward;
    this.s.sold += c.count;
    this.s.xp += 50;
    this.tell(
      'Order delivered · ' +
        reward +
        ' coins' +
        (fresh ? ' including a freshness bonus.' : '.'),
      'success',
    );
    this.saveDue = true;
    return true;
  }
  craft(type: 'bait' | 'meal') {
    if (!this.dock()) return false;
    const kelp = this.s.cargo.find((c) => c.species === 'kelp');
    if (!kelp) {
      this.tell('Collect sea kelp on a dive first.');
      return false;
    }
    if (type === 'meal') {
      const fish = this.s.cargo.find((c) => c.kind === 'fish');
      if (!fish) {
        this.tell('The stew needs a fish and sea kelp.');
        return false;
      }
      this.s.cargo = this.s.cargo.filter(
        (c) => c.id !== fish.id && c.id !== kelp.id,
      );
      this.s.meal = 300;
      this.tell(
        'Sea-garden stew: easier reeling and longer dives for 5 minutes.',
        'success',
      );
    } else {
      this.s.cargo = this.s.cargo.filter((c) => c.id !== kelp.id);
      this.s.bait += 4;
      this.tell('Crafted four lures.', 'success');
    }
    this.saveDue = true;
    return true;
  }
  chooseEnding(choice: 'restore' | 'profit') {
    if (
      this.s.relics.length < 3 ||
      this.dock()?.id !== 'abyss' ||
      this.s.ending
    )
      return false;
    this.s.ending = choice;
    this.s.xp += 300;
    if (choice === 'profit') this.s.coins += 1500;
    else {
      this.s.upgrades.rod = 3;
      this.s.fuel = 100;
    }
    this.tell(
      choice === 'restore'
        ? 'The keeper awakens. Its song lights every shore.'
        : 'The relics find a buyer. The sea keeps the rest of its secrets.',
      'discovery',
    );
    this.saveDue = true;
    return true;
  }
  objective() {
    if (this.s.caught === 0)
      return {
        title: 'Something on the line',
        text: 'Cast a line and land your first fish.',
        progress: 'First catch · 0 / 1',
      };
    if (this.s.sold === 0)
      return {
        title: 'Bring the sea home',
        text: 'Return to any dock and sell your catch.',
        progress: 'First sale · 0 / 1',
      };
    if (Object.values(this.s.upgrades).every((v) => v === 0))
      return {
        title: 'A little further',
        text: 'Fit your first upgrade at a harbour.',
        progress: 'First upgrade · 0 / 1',
      };
    if (this.s.relics.length < 3)
      return {
        title: 'The keeper’s song',
        text:
          this.s.relics.length === 0
            ? 'Dive near Coral Crown. A tide compass rests at 18 m.'
            : this.s.relics.length === 1
              ? 'Find the Echo conch near The Green Veil at 34 m.'
              : 'The last lantern lies near The Quiet Deep at 72 m.',
        progress: `Ancient relics · ${this.s.relics.length} / 3`,
      };
    return {
      title: this.s.ending
        ? 'The sea is still calling'
        : 'What the sea remembers',
      text: this.s.ending
        ? 'Explore every island and complete your field guide.'
        : 'Bring the three relics to the dock at The Quiet Deep.',
      progress: `Field guide · ${this.s.catalogue.length} / ${SPECIES.length}`,
    };
  }
}
