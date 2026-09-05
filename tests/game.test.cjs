const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  Game,
  initialState,
  fits,
  autoPlace,
  holdSize,
  cargoValue,
  parseSave,
  emptyInput,
  CONTRACTS,
  maxDepth,
} = require('../work/test-build/engine.js');
const { ISLANDS, RELICS } = require('../work/test-build/data.js');
const item = (id = 'fish', w = 2, h = 1) => ({
  id,
  species: 'sprat',
  name: 'Sunstripe sprat',
  color: '#f3bc59',
  price: 30,
  w,
  h,
  x: 0,
  y: 0,
  caughtAt: 0,
  weight: 0.7,
  variant: 'Classic',
  kind: 'fish',
});
const atDock = (g) => Object.assign(g.s, ISLANDS[0].port);
function landFish(g) {
  g.startFishing();
  for (let i = 0; i < 300 && g.fishing?.phase === 'hunt'; i++) {
    const f = g.fishing.fish[0];
    g.aim(f.x, f.y);
    g.update(0.05, emptyInput());
  }
  assert.equal(g.fishing?.phase, 'reel');
  for (let i = 0; i < 1000 && g.fishing?.phase === 'reel'; i++)
    g.update(0.05, { ...emptyInput(), reel: g.fishing.tension < 0.62 });
  assert.equal(g.fishing?.phase, 'caught');
}
test('cargo placement rejects overlaps, blocked cells, and bounds', () => {
  const s = initialState();
  autoPlace(s, item());
  assert.equal(fits(s, { x: 0, y: 0, w: 1, h: 1 }), false);
  assert.equal(fits(s, { x: 5, y: 0, w: 2, h: 1 }), false);
  assert.equal(fits(s, { x: -1, y: 0, w: 1, h: 1 }), false);
  s.blocked = [2];
  assert.equal(fits(s, { x: 2, y: 0, w: 1, h: 1 }), false);
  assert.equal(fits(s, { x: 0, y: 1, w: 2, h: 1 }), true);
});
test('auto placement rotates a fish to fit the remaining space', () => {
  const s = initialState();
  s.blocked = Array.from({ length: 24 }, (_, i) => i).filter(
    (i) => ![0, 6, 12, 18].includes(i),
  );
  assert.equal(autoPlace(s, item('eel', 4, 1)), true);
  assert.equal(s.cargo[0].w, 1);
  assert.equal(s.cargo[0].h, 4);
});
test('moving and rotating cargo is transactional', () => {
  const g = new Game();
  autoPlace(g.s, item());
  autoPlace(g.s, item('second'));
  const old = structuredClone(g.s.cargo[0]);
  assert.equal(g.moveCargo('fish', 2, 0), false);
  assert.deepEqual(g.s.cargo[0], old);
  assert.equal(g.moveCargo('fish', 0, 1, true), true);
  assert.equal(g.s.cargo[0].h, 2);
});
test('catch, sale, upgrade and save form a complete playable loop', () => {
  const g = new Game();
  landFish(g);
  assert.equal(g.keepCatch(), true);
  assert.equal(g.s.caught, 1);
  assert.equal(g.s.coins, 100);
  assert.equal(g.s.catalogue.length, 1);
  assert.equal(g.keepCatch(), false);
  atDock(g);
  const value = g.sellAll();
  assert.ok(value > 0);
  assert.equal(g.s.cargo.length, 0);
  assert.equal(g.s.sold, 1);
  assert.equal(g.upgrade('oxygen'), true);
  assert.equal(maxDepth(g.s), 40);
  assert.deepEqual(parseSave(JSON.stringify(g.s)), g.s);
});
test('a full hold leaves the landed catch available for release', () => {
  const g = new Game();
  for (let i = 0; i < 24; i++) autoPlace(g.s, item('cargo' + i, 1, 1));
  landFish(g);
  assert.equal(g.keepCatch(), false);
  assert.equal(g.fishing.phase, 'caught');
  g.releaseCatch();
  assert.equal(g.mode, 'sail');
  assert.equal(g.s.cargo.length, 24);
});
test('reeling continuously breaks the line in normal mode', () => {
  const g = new Game();
  g.startFishing();
  const f = g.fishing;
  f.phase = 'reel';
  f.target = 0;
  for (let i = 0; i < 250 && g.mode === 'fishing'; i++)
    g.update(0.05, { ...emptyInput(), reel: true });
  assert.equal(g.mode, 'sail');
  assert.equal(g.s.cargo.length, 0);
});
test('higher-level fish cannot be hooked with starter gear', () => {
  const g = new Game();
  g.s.x = 24;
  g.s.z = -154;
  g.startFishing();
  assert.ok(g.fishing.fish.every((f) => f.species === 'glass'));
  for (let i = 0; i < 80; i++) {
    const f = g.fishing.fish[0];
    g.aim(f.x, f.y);
    g.update(0.05, emptyInput());
  }
  assert.equal(g.fishing.phase, 'hunt');
});
test('night species only appear at night and can be caught with matching gear', () => {
  const g = new Game();
  g.s.x = 107;
  g.s.z = 76;
  g.startFishing();
  assert.ok(
    g.fishing.fish.every((f) => ['sprat', 'bream'].includes(f.species)),
  );
  g.endActivity();
  g.s.time = 21;
  g.s.upgrades.rod = 2;
  landFish(g);
  assert.ok(['lantern', 'ray'].includes(g.fishing.reward.species));
});
test('a lure is consumed once per equipped cast', () => {
  const g = new Game();
  g.startFishing(true);
  assert.equal(g.s.bait, 2);
  g.startFishing(true);
  assert.equal(g.s.bait, 2);
  g.endActivity();
  g.s.bait = 0;
  g.startFishing(true);
  assert.equal(g.s.bait, 0);
  assert.equal(g.fishing.bait, false);
});
test('transactions require a dock and cannot spend below zero', () => {
  const g = new Game();
  g.s.x = 200;
  g.s.z = 0;
  autoPlace(g.s, item());
  assert.equal(g.sellAll(), 0);
  assert.equal(g.upgrade('hold'), false);
  atDock(g);
  g.s.coins = 0;
  assert.equal(g.upgrade('hold'), false);
  assert.equal(g.s.upgrades.hold, 0);
});
test('hold upgrade preserves damaged slot coordinates', () => {
  const g = new Game();
  atDock(g);
  g.s.coins = 1000;
  g.s.blocked = [8, 23];
  assert.equal(g.upgrade('hold'), true);
  assert.deepEqual(g.s.blocked, [9, 26]);
  assert.deepEqual(holdSize(g.s.upgrades.hold), { w: 7, h: 4 });
});
test('freshness has a floor and materials do not spoil', () => {
  const s = initialState(),
    c = item();
  s.elapsed = 10000;
  assert.equal(cargoValue(s, c), 14);
  c.kind = 'material';
  assert.equal(cargoValue(s, c), 30);
  s.settings.relaxed = true;
  c.kind = 'fish';
  assert.equal(cargoValue(s, c), 30);
});
test('delivery consumes the right cargo and pays only once', () => {
  const g = new Game();
  atDock(g);
  g.s.coins = 0;
  autoPlace(g.s, item('a'));
  autoPlace(g.s, item('b'));
  autoPlace(g.s, { ...item('other'), species: 'bream' });
  assert.equal(g.deliver(CONTRACTS[0].id), true);
  assert.equal(g.s.coins, 114);
  assert.equal(g.s.cargo.length, 1);
  assert.equal(g.deliver(CONTRACTS[0].id), false);
  assert.equal(g.s.coins, 114);
});
test('diving respects the depth limit and spatial collection distance', () => {
  const g = new Game();
  g.startDive();
  for (let i = 0; i < 300; i++)
    g.update(0.05, { ...emptyInput(), vertical: 1 });
  assert.equal(g.dive.depth, 20);
  const l = g.dive.loot[0];
  Object.assign(g.dive, { x: l.x, z: l.z, depth: l.depth });
  assert.equal(g.collect(), true);
  assert.ok(g.s.cargo.length > 0);
  assert.equal(l.collected, true);
  g.surface();
  assert.equal(g.mode, 'sail');
});
test('out-of-air rescue removes new dive cargo, preserves older cargo and avoids a soft lock', () => {
  const g = new Game();
  autoPlace(g.s, item('old'));
  g.startDive();
  const l = g.dive.loot[0];
  Object.assign(g.dive, { x: l.x, z: l.z, depth: l.depth });
  g.collect();
  g.dive.oxygen = 0.001;
  g.update(0.05, emptyInput());
  assert.equal(g.mode, 'sail');
  assert.deepEqual(
    g.s.cargo.map((c) => c.id),
    ['old'],
  );
  assert.ok(g.s.fuel >= 25);
  assert.ok(g.dock());
});
test('all three relics can be recovered and restoration is permanent', () => {
  const g = new Game();
  g.s.upgrades.oxygen = 3;
  for (const relic of RELICS) {
    g.s.x = relic.x;
    g.s.z = relic.z;
    g.startDive();
    Object.assign(g.dive, { x: 0, z: 0, depth: relic.depth });
    assert.equal(g.collect(), true);
    assert.ok(g.s.relics.includes(relic.id));
    g.surface();
  }
  Object.assign(g.s, ISLANDS.find((i) => i.id === 'abyss').port);
  assert.equal(g.chooseEnding('restore'), true);
  assert.equal(g.s.ending, 'restore');
  assert.equal(g.s.upgrades.rod, 3);
  assert.equal(g.chooseEnding('profit'), false);
});
test('crafting consumes kelp and fish exactly once', () => {
  const g = new Game();
  atDock(g);
  autoPlace(g.s, { ...item('kelp', 1, 1), species: 'kelp', kind: 'material' });
  autoPlace(g.s, item('fish'));
  assert.equal(g.craft('meal'), true);
  assert.equal(g.s.cargo.length, 0);
  assert.equal(g.s.meal, 300);
  assert.equal(g.craft('meal'), false);
});
test('relaxed mode prevents resource loss and collision damage', () => {
  const g = new Game();
  g.s.settings.relaxed = true;
  g.damage(1000);
  assert.equal(g.s.hull, 100);
  g.update(0.05, { ...emptyInput(), x: 1 });
  assert.equal(g.s.fuel, 100);
  g.startDive();
  for (let i = 0; i < 200; i++) g.update(0.05, emptyInput());
  assert.equal(g.dive.oxygen, 100);
});
test('fuel exhaustion still allows a slow return to port', () => {
  const g = new Game();
  g.s.fuel = 0;
  const x = g.s.x;
  g.update(0.05, { ...emptyInput(), x: 1 });
  assert.ok(g.s.x > x);
  assert.equal(g.speed, 3);
});
test('pause freezes all gameplay clocks and resources', () => {
  const g = new Game(),
    before = structuredClone(g.s);
  g.paused = true;
  g.update(0.05, { ...emptyInput(), x: 1 });
  assert.deepEqual(g.s, before);
});
test('save validation rejects malformed, duplicate and overlapping cargo', () => {
  assert.equal(parseSave('not json'), null);
  const s = initialState();
  s.cargo = [item('a'), item('b')];
  assert.equal(parseSave(JSON.stringify(s)), null);
  s.cargo = [item('a'), { ...item('a'), x: 2 }];
  assert.equal(parseSave(JSON.stringify(s)), null);
  s.cargo = [];
  s.upgrades.hold = 99;
  assert.equal(parseSave(JSON.stringify(s)), null);
});
test('seeded fishing is reproducible', () => {
  const a = new Game(),
    b = new Game();
  a.startFishing();
  b.startFishing();
  assert.deepEqual(a.fishing, b.fishing);
});
