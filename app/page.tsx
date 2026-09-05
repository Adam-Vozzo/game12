'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Anchor,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Coins,
  Compass,
  Download,
  Fish,
  Fuel,
  Gem,
  Heart,
  HelpCircle,
  Leaf,
  Map as MapIcon,
  Maximize,
  Moon,
  Navigation,
  Package,
  RotateCw,
  Save,
  Settings,
  Shield,
  Ship,
  ShoppingBag,
  Stars,
  Sun,
  Upload,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { createWorld, type WorldView } from '@/game/world';
import {
  Game,
  parseSave,
  holdSize,
  cells,
  cargoValue,
  nearestIsland,
  nearestSpot,
  distance,
  isNight,
  maxDepth,
  rank,
  CONTRACTS,
  type Cargo,
} from '@/game/engine';
import {
  ISLANDS,
  SPECIES,
  UPGRADES,
  RELICS,
  type UpgradeId,
} from '@/game/data';
import { OceanAudio } from '@/game/audio';
import { SeaChart } from '@/game/chart';
import { Joystick, HoldButton } from '@/game/controls';
type Panel =
  | 'cargo'
  | 'chart'
  | 'journal'
  | 'settings'
  | 'dock'
  | 'help'
  | null;
const SAVE_KEY = 'luma-tide-v1';
const BIOMES: Record<string, string> = {
  shoals: 'The sunlit shoals',
  reef: 'The coral gardens',
  kelp: 'The kelp forests',
  moon: 'The moonlit waters',
  volcanic: 'The ember currents',
  abyss: 'The quiet deep',
};
const PANEL_TITLES: Record<string, string> = {
  cargo: 'Your cargo hold',
  chart: 'Chart the unknown',
  journal: 'The voyager’s journal',
  settings: 'Make yourself at home',
  dock: 'Welcome ashore',
  help: 'A little guide to the sea',
};
function Meter({
  value,
  label,
  icon,
  color = 'gold',
}: {
  value: number;
  label: string;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <div className={`meter ${color}`}>
      <div>
        {icon}
        <span>{label}</span>
        <strong>
          {Math.ceil(value)}
          <small>%</small>
        </strong>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        <i style={{ width: `${Math.max(0, value)}%` }} />
      </div>
    </div>
  );
}
export default function Home() {
  const game = useRef<Game>(new Game()),
    host = useRef<HTMLDivElement>(null),
    audio = useRef<OceanAudio | null>(null),
    keys = useRef(new Set<string>()),
    touch = useRef({ x: 0, z: 0, vertical: 0, reel: false }),
    panelRef = useRef<Panel>(null),
    fileInput = useRef<HTMLInputElement>(null),
    world = useRef<ReturnType<typeof createWorld> | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [panel, setPanel] = useState<Panel>(null),
    [selected, setSelected] = useState<string | null>(null),
    [useBait, setUseBait] = useState(false),
    [touchDevice, setTouchDevice] = useState(false),
    [saveLabel, setSaveLabel] = useState('Progress saved locally'),
    [started, setStarted] = useState(false),
    [toast, setToast] = useState<{ text: string; kind: string } | null>(null),
    [, render] = useState(0);
  const update = () => render((v) => v + 1);
  const s = game.current.s,
    g = game.current,
    f = g.fishing,
    d = g.dive;
  const island = nearestIsland(s),
    spot = nearestSpot(s),
    dock = g.dock(),
    objective = g.objective(),
    night = isNight(s),
    size = holdSize(s.upgrades.hold),
    used = s.cargo.reduce((n, c) => n + c.w * c.h, 0) + s.blocked.length;
  const mobile = touchDevice || s.settings.touch;
  const show = (p: Panel) => {
    touch.current = { x: 0, z: 0, vertical: 0, reel: false };
    keys.current.clear();
    panelRef.current = p;
    setPanel(p);
    update();
  };
  function persist(announce = false) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game.current.s));
      game.current.saveDue = false;
      setSaveLabel('Progress saved locally');
      if (announce)
        game.current.tell('Voyage saved on this device.', 'success');
    } catch {
      setSaveLabel('Save unavailable — export a backup');
      if (announce)
        game.current.tell(
          'Device storage is unavailable. Export your voyage in Settings.',
          'warning',
        );
    }
  }
  function act(action: () => unknown) {
    action();
    update();
    if (game.current.saveDue) persist();
  }
  function cast() {
    act(() => g.startFishing(useBait));
  }
  function startAudio() {
    if (!started) {
      setStarted(true);
      if (!game.current.s.settings.muted)
        void audio.current?.setMuted(false).catch(() => {});
    }
  }
  useEffect(() => {
    let saved = false;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = parseSave(raw);
        if (parsed) {
          game.current = new Game(parsed);
          saved = true;
        } else
          setToast({
            text: 'Your saved voyage could not be read. A new voyage is ready; the old save remains until you play.',
            kind: 'warning',
          });
      }
    } catch {
      setSaveLabel('Save unavailable — export a backup');
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      game.current.s.settings.reducedMotion = true;
    setTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    audio.current = new OceanAudio();
    game.current.onEvent = (kind) => audio.current?.play(kind);
    try {
      world.current = createWorld(host.current!, () => {
        const g = game.current,
          s = g.s;
        return {
          x: s.x,
          z: s.z,
          angle: s.angle,
          time: s.time,
          mode: g.mode,
          depth: g.dive?.depth || 0,
          moving: g.moving,
          quality: s.settings.quality,
          reducedMotion: s.settings.reducedMotion,
          hookX: g.fishing?.hookX,
          hookY: g.fishing?.hookY,
          fish: g.fishing?.fish,
          diveX: g.dive?.x,
          diveZ: g.dive?.z,
          loot: g.dive?.loot,
          seabedDepth: g.dive?.bottom,
        } as WorldView;
      });
      setReady(true);
    } catch (e) {
      setError(
        'Your browser could not start 3D graphics. Enable hardware acceleration or try another browser. Your saved voyage is safe.',
      );
      return;
    }
    if (!saved)
      game.current.tell(
        'Welcome aboard. Cast your first line with F, or tap Cast line.',
      );
    let frame = 0,
      last = performance.now(),
      ui = 0,
      autosave = 0,
      lastEvent = 0,
      toastTime = 0;
    let previousButtons: boolean[] = [];
    function trigger(code: string) {
      const g = game.current;
      if (code === 'Escape') {
        if (panelRef.current) {
          panelRef.current = null;
          setPanel(null);
        } else if (g.mode === 'fishing' && g.fishing?.phase !== 'caught')
          g.endActivity();
        else if (g.mode === 'dive') g.surface();
        else {
          panelRef.current = 'settings';
          setPanel('settings');
        }
        return;
      }
      if (panelRef.current) return;
      if (code === 'KeyF') {
        if (g.mode === 'sail') g.startFishing(false);
        else if (g.mode === 'dive') g.collect();
      }
      if (code === 'KeyE') {
        if (g.mode === 'dive') g.surface();
        else if (g.mode === 'sail') g.startDive();
      }
      const p: Panel =
        code === 'KeyI'
          ? 'cargo'
          : code === 'KeyM'
            ? 'chart'
            : code === 'KeyJ'
              ? 'journal'
              : code === 'KeyH'
                ? 'help'
                : code === 'KeyR' && g.dock()
                  ? 'dock'
                  : null;
      if (p) {
        keys.current.clear();
        panelRef.current = p;
        setPanel(p);
      }
    }
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable ||
        target.closest('[data-slot=dialog-content]')
      )
        return;
      if (
        target.closest('button,[role=switch],[role=tab]') &&
        ['Space', 'Enter'].includes(e.code)
      )
        return;
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code,
        ) &&
        !panelRef.current
      )
        e.preventDefault();
      keys.current.add(e.code);
      if (!e.repeat) trigger(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => {
      keys.current.clear();
      touch.current = { x: 0, z: 0, vertical: 0, reel: false };
    };
    const unload = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(game.current.s));
      } catch {}
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    window.addEventListener('pagehide', unload);
    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const g = game.current,
        k = keys.current;
      let sx =
          Number(k.has('KeyD') || k.has('ArrowRight')) -
          Number(k.has('KeyA') || k.has('ArrowLeft')) +
          touch.current.x,
        sz =
          Number(k.has('KeyS') || k.has('ArrowDown')) -
          Number(k.has('KeyW') || k.has('ArrowUp')) +
          touch.current.z;
      let vertical =
          Number(k.has('KeyQ')) -
          Number(k.has('Space')) +
          touch.current.vertical,
        reel = k.has('Space') || touch.current.reel;
      const pad = navigator.getGamepads?.()[0];
      if (pad) {
        sx += Math.abs(pad.axes[0]) > 0.15 ? pad.axes[0] : 0;
        sz += Math.abs(pad.axes[1]) > 0.15 ? pad.axes[1] : 0;
        reel = reel || pad.buttons[7]?.pressed;
        vertical +=
          Number(pad.buttons[5]?.pressed) - Number(pad.buttons[4]?.pressed);
        [0, 1, 2, 3, 9].forEach((b, i) => {
          if (pad.buttons[b]?.pressed && !previousButtons[b])
            trigger(['KeyF', 'KeyE', 'KeyI', 'KeyM', 'Escape'][i]);
        });
        previousButtons = pad.buttons.map((b) => b.pressed);
      }
      const fishing = g.mode === 'fishing';
      g.paused = !!panelRef.current || document.hidden;
      g.update(dt, {
        x: fishing ? sx : sx * 0.8 + sz * 0.6,
        z: fishing ? sz : -sx * 0.6 + sz * 0.8,
        vertical,
        reel,
      });
      ui += dt;
      autosave += dt;
      if (ui > 0.08) {
        ui = 0;
        render((v) => v + 1);
        const event = g.events.at(-1);
        if (event && event.id !== lastEvent) {
          lastEvent = event.id;
          setToast(event);
          toastTime = now;
        } else if (now - toastTime > 5500) setToast(null);
      }
      if ((autosave > 20 || g.saveDue) && !document.hidden) {
        autosave = 0;
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(g.s));
          g.saveDue = false;
        } catch {
          setSaveLabel('Save unavailable — export a backup');
        }
      }
    }
    frame = requestAnimationFrame(loop);
    const modelContext = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void;
        };
      }
    ).modelContext;
    const lifecycle = new AbortController();
    if (modelContext?.registerTool) {
      const opts = { signal: lifecycle.signal };
      try {
        modelContext.registerTool(
          {
            name: 'read_voyage',
            description:
              'Read the current Luma Tide voyage, cargo, location, upgrades and objective.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: () => ({
              mode: game.current.mode,
              coins: game.current.s.coins,
              location: { x: game.current.s.x, z: game.current.s.z },
              cargo: game.current.s.cargo.map((c) => ({
                name: c.name,
                value: cargoValue(game.current.s, c),
              })),
              upgrades: game.current.s.upgrades,
              objective: game.current.objective(),
            }),
          },
          opts,
        );
        modelContext.registerTool(
          {
            name: 'set_chart_waypoint',
            description:
              'Place a visible navigation marker on the sea chart. Does not move the boat.',
            inputSchema: {
              type: 'object',
              properties: {
                x: { type: 'number', minimum: -245, maximum: 245 },
                z: { type: 'number', minimum: -245, maximum: 245 },
              },
              required: ['x', 'z'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const p = input as { x: number; z: number };
              if (
                !p ||
                !Number.isFinite(p.x) ||
                !Number.isFinite(p.z) ||
                Math.abs(p.x) > 245 ||
                Math.abs(p.z) > 245
              )
                throw new Error('Coordinates must be between -245 and 245.');
              game.current.s.waypoint = { x: p.x, z: p.z };
              game.current.saveDue = true;
              render((v) => v + 1);
              return { waypoint: game.current.s.waypoint };
            },
          },
          opts,
        );
      } catch {
        /* WebMCP is optional in browsers without support. */
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      world.current?.dispose();
      audio.current?.dispose();
      lifecycle.abort();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      window.removeEventListener('pagehide', unload);
    };
  }, []);
  const selectedCargo = s.cargo.find((c) => c.id === selected);
  const collectedIds = new Set(s.cargo.flatMap((c) => cells(c, size.w)));
  const allValue = s.cargo.reduce((v, c) => v + cargoValue(s, c), 0);
  function exportSave() {
    const blob = new Blob([JSON.stringify(s, null, 2)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'luma-tide-voyage.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importSave(file: File) {
    if (file.size > 1000000) {
      g.tell('That file is too large to be a voyage save.', 'warning');
      return;
    }
    const parsed = parseSave(await file.text());
    if (!parsed) {
      g.tell(
        'This is not a valid Luma Tide voyage. Your current voyage is unchanged.',
        'warning',
      );
      return;
    }
    game.current = new Game(parsed);
    game.current.onEvent = (kind) => audio.current?.play(kind);
    void audio.current?.setMuted(parsed.settings.muted).catch(() => {});
    persist();
    setSelected(null);
    show(null);
    game.current.tell('Voyage restored. Welcome back.', 'success');
  }
  const cargoContent = (
    <>
      <div className="panel-summary">
        <span>
          <Package size={18} /> {used} / {size.w * size.h} slots
        </span>
        <span>
          <Coins size={18} /> {allValue} estimated value
        </span>
      </div>
      <p className="panel-note">
        Select cargo, then tap an empty slot to move it. Rotate to make room.
        Damaged slots are repaired at a dock.
      </p>
      <div
        className="inventory-grid"
        style={{
          gridTemplateColumns: `repeat(${size.w},1fr)`,
          gridTemplateRows: `repeat(${size.h},54px)`,
        }}
      >
        {Array.from({ length: size.w * size.h }, (_, i) => (
          <button
            key={i}
            className={`inventory-cell ${s.blocked.includes(i) ? 'blocked' : ''}`}
            style={{
              gridColumn: (i % size.w) + 1,
              gridRow: Math.floor(i / size.w) + 1,
            }}
            aria-label={`Slot ${i + 1}${s.blocked.includes(i) ? ', damaged' : collectedIds.has(i) ? ', occupied' : ', empty'}`}
            onClick={() => {
              if (selectedCargo)
                act(() =>
                  g.moveCargo(
                    selectedCargo.id,
                    i % size.w,
                    Math.floor(i / size.w),
                  ),
                );
            }}
          >
            {s.blocked.includes(i) && <X size={18} />}
          </button>
        ))}
        {s.cargo.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(selected === c.id ? null : c.id)}
            aria-label={`${c.name}, ${c.w} by ${c.h} slots, ${cargoValue(s, c)} coins`}
            className={`cargo-item ${selected === c.id ? 'selected' : ''}`}
            style={{
              gridColumn: `${c.x + 1} / span ${c.w}`,
              gridRow: `${c.y + 1} / span ${c.h}`,
              background: c.color + 'b8',
            }}
          >
            {c.kind === 'fish' ? <Fish /> : <Gem />}
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      {selectedCargo ? (
        <div className="selected-cargo">
          <div>
            <strong>{selectedCargo.name}</strong>
            <small>
              {selectedCargo.variant} · {selectedCargo.weight} kg ·{' '}
              {cargoValue(s, selectedCargo)} coins
            </small>
          </div>
          <button
            className="small-button"
            onClick={() =>
              act(() =>
                g.moveCargo(
                  selectedCargo.id,
                  selectedCargo.x,
                  selectedCargo.y,
                  true,
                ),
              )
            }
          >
            <RotateCw size={16} /> Rotate
          </button>
          <button
            className="small-button danger"
            onClick={() => {
              g.s.cargo = g.s.cargo.filter((c) => c.id !== selected);
              setSelected(null);
              g.saveDue = true;
              persist();
              g.tell('Cargo returned to the sea.');
            }}
          >
            Release
          </button>
        </div>
      ) : (
        <div className="empty-hint">
          {s.cargo.length
            ? 'Every catch has its place.'
            : 'An empty hold is the beginning of a good story.'}
        </div>
      )}
    </>
  );
  return (
    <main
      className={`game-shell mode-${g.mode} ${mobile ? 'touch-mode' : ''}`}
      onPointerDown={startAudio}
    >
      <div
        className="world"
        ref={host}
        onPointerDown={(e) => {
          if (g.fishing?.phase === 'hunt') {
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = world.current?.aim(e.clientX, e.clientY);
            if (p) g.aim(p.x, p.y);
          }
        }}
        onPointerMove={(e) => {
          if (
            g.fishing?.phase === 'hunt' &&
            (e.buttons || e.pointerType === 'mouse')
          ) {
            const p = world.current?.aim(e.clientX, e.clientY);
            if (p) g.aim(p.x, p.y);
          }
        }}
      />
      <header className="topbar">
        <div className="brand">
          <Waves />
          <span>
            LUMA TIDE<small>A LITTLE FURTHER, A LITTLE DEEPER</small>
          </span>
        </div>
        <div className="time-pill">
          {night ? <Moon size={17} /> : <Sun size={18} />}
          <span>DAY {s.day}</span>
          <i />
          <span>
            {Math.floor(s.time).toString().padStart(2, '0')}:
            {Math.floor((s.time % 1) * 60)
              .toString()
              .padStart(2, '0')}
          </span>
        </div>
        <nav className="top-actions" aria-label="Game tools">
          <button
            className="icon-button help-button"
            aria-label="How to play"
            title="How to play (H)"
            onClick={() => show('help')}
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="icon-button"
            aria-label={s.settings.muted ? 'Turn sound on' : 'Mute sound'}
            title={s.settings.muted ? 'Turn sound on' : 'Mute sound'}
            onClick={() => {
              s.settings.muted = !s.settings.muted;
              void audio.current
                ?.setMuted(s.settings.muted)
                .catch(() => g.tell('Tap sound again to enable audio.'));
              persist();
              update();
            }}
          >
            {s.settings.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            className="icon-button"
            aria-label="Settings"
            title="Settings"
            onClick={() => show('settings')}
          >
            <Settings size={20} />
          </button>
        </nav>
      </header>
      <div className="wallet">
        <Coins size={18} />
        <strong>{s.coins.toLocaleString()}</strong>
        <span>coins</span>
      </div>
      {g.mode === 'sail' && (
        <>
          <div className="location">
            <span className="eyebrow">{BIOMES[island.biome]}</span>
            <h1>{distance(s, island) < 70 ? island.name : 'Open waters'}</h1>
            <p>
              <Wind size={16} />
              {night
                ? 'The sea is awake with light.'
                : 'A gentle breeze. A sea of possibilities.'}
            </p>
          </div>
          <aside className="quest-card">
            <div className="quest-heading">
              <span className="eyebrow">
                {s.caught === 0 ? 'YOUR FIRST VOYAGE' : 'ON THE HORIZON'}
              </span>
              <Compass size={17} />
            </div>
            <h2>{objective.title}</h2>
            <p>{objective.text}</p>
            <button className="quest-progress" onClick={() => show('journal')}>
              {objective.progress}
              <ChevronRight size={15} />
            </button>
          </aside>
          <aside className="navigation-panel">
            <button
              className="minimap-button"
              title="Open sea chart (M)"
              aria-label="Open sea chart"
              onClick={() => show('chart')}
            >
              <SeaChart state={s} />
              <span>
                <Compass size={13} /> THE ARCHIPELAGO <Maximize size={12} />
              </span>
            </button>
            <div className="boat-meters">
              <Meter value={s.fuel} label="Fuel" icon={<Fuel size={14} />} />
              <Meter
                value={s.hull}
                label="Hull"
                color="green"
                icon={<Shield size={14} />}
              />
            </div>
          </aside>
          {dock ? (
            <button
              className="context-prompt"
              onClick={() => {
                s.fuel = Math.max(s.fuel, 20);
                persist();
                show('dock');
              }}
            >
              <Anchor size={19} />
              <span>
                Dock at <strong>{dock.name}</strong>
              </span>
              <kbd>R</kbd>
              <ChevronRight size={17} />
            </button>
          ) : distance(s, spot) < 16 ? (
            <div className="context-prompt passive">
              <Fish size={19} />
              <span>
                Fish are gathering · <strong>{spot.depth} m</strong>
              </span>
            </div>
          ) : s.waypoint ? (
            <div className="context-prompt passive">
              <Navigation size={18} />
              <span>
                Chart marker · {Math.round(distance(s, s.waypoint))} m
              </span>
            </div>
          ) : null}
          <div className="bottom-dock">
            <button className="action-button" onClick={cast}>
              <Fish />
              Cast line<kbd>F</kbd>
            </button>
            <button
              className="action-button secondary"
              onClick={() => act(() => g.startDive())}
            >
              <Anchor />
              Dive<kbd>E</kbd>
            </button>
            <span className="dock-divider" />
            <button
              className="icon-button"
              aria-label={`Cargo hold, ${used} slots used`}
              title="Cargo (I)"
              onClick={() => show('cargo')}
            >
              <Package size={21} />
              <span className="count-badge">{s.cargo.length}</span>
            </button>
            <button
              className="icon-button"
              aria-label="Sea chart"
              title="Chart (M)"
              onClick={() => show('chart')}
            >
              <MapIcon size={21} />
            </button>
            <button
              className="icon-button journal-button"
              aria-label="Journal"
              title="Journal (J)"
              onClick={() => show('journal')}
            >
              <BookOpen size={20} />
            </button>
          </div>
          <div className="desktop-hint">
            <span>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> Sail
            </span>
            <span>or use a gamepad</span>
          </div>
          <div className="save-status">
            <span /> {saveLabel}
          </div>
        </>
      )}
      {mobile && (g.mode === 'sail' || g.mode === 'dive') && (
        <Joystick
          onMove={(x, z) => {
            touch.current.x = x;
            touch.current.z = z;
          }}
        />
      )}
      {f && (
        <>
          <div className="fishing-title">
            <span className="eyebrow">
              {f.phase === 'hunt'
                ? 'BELOW THE SURFACE'
                : 'SOMETHING ON THE LINE'}
            </span>
            <h1>
              {f.phase === 'hunt'
                ? 'A world beneath the waves'
                : f.reward?.name ||
                  SPECIES.find((sp) => sp.id === f.fish[f.target]?.species)
                    ?.name}
            </h1>
            <p>
              {f.phase === 'hunt'
                ? mobile
                  ? 'Touch the water to guide your hook into a fish.'
                  : 'Move your mouse or use WASD to guide the hook into a fish.'
                : 'Hold to reel in. Release to ease tension.'}
            </p>
          </div>
          {f.phase === 'hunt' && (
            <div className="fish-guide">
              <span>
                <Fish size={16} /> {BIOMES[nearestSpot(s).biome]}
              </span>
              <small>
                {UPGRADES[0].detail[s.upgrades.rod]}{' '}
                {f.bait ? '· Lure equipped' : ''}
              </small>
            </div>
          )}
          {f.phase === 'reel' && (
            <div className="fishing-control">
              <div className="tension-label">
                <span>LINE TENSION</span>
                <strong>
                  {f.tension < 0.2 - s.upgrades.rod * 0.02
                    ? 'Too loose'
                    : f.tension > 0.77 + s.upgrades.rod * 0.025
                      ? 'Ease off!'
                      : 'Steady does it'}
                </strong>
              </div>
              <div
                className="tension-track"
                role="meter"
                aria-label="Line tension"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(f.tension * 100)}
              >
                <div
                  className="safe-zone"
                  style={{
                    left: `${(0.2 - s.upgrades.rod * 0.02) * 100}%`,
                    right: `${(1 - 0.77 - s.upgrades.rod * 0.025) * 100}%`,
                  }}
                />
                <i style={{ left: `${f.tension * 100}%` }} />
              </div>
              <div className="catch-progress">
                <span>Catch progress</span>
                <strong>{Math.min(100, Math.round(f.progress * 100))}%</strong>
              </div>
              <div className="reel-progress-track">
                <i style={{ width: `${f.progress * 100}%` }} />
              </div>
            </div>
          )}
          {f.phase !== 'caught' && (
            <div className="bottom-dock fishing-actions">
              {f.phase === 'reel' && (
                <HoldButton
                  label="Hold to reel in the fish"
                  className="action-button reel-button"
                  onHold={(v) => (touch.current.reel = v)}
                >
                  <RotateCw size={22} />
                  HOLD TO REEL<kbd>SPACE</kbd>
                </HoldButton>
              )}
              <button
                className="action-button secondary"
                onClick={() => act(() => g.endActivity())}
              >
                <X size={18} />
                Pull line in
              </button>
            </div>
          )}
        </>
      )}
      {d && (
        <>
          <div className="dive-title">
            <span className="eyebrow">{BIOMES[island.biome]}</span>
            <h1>Under the tide</h1>
            <p>Swim to a glimmer. Match its depth. Bring it home.</p>
          </div>
          <div className="dive-stats">
            <Meter
              value={d.oxygen}
              label="Oxygen"
              color={d.oxygen < 25 ? 'red' : 'green'}
              icon={<Wind size={18} />}
            />
            <div className="depth-reading">
              <span>DEPTH</span>
              <strong>
                {d.depth.toFixed(1)} <small>m</small>
              </strong>
              <small>Suit limit {maxDepth(s)} m</small>
            </div>
          </div>
          {g.closestLoot() && (
            <div className="loot-tracker">
              <Gem size={22} />
              <div>
                <strong>{g.closestLoot()!.name}</strong>
                <small>
                  {Math.round(
                    Math.hypot(
                      g.closestLoot()!.x - d.x,
                      g.closestLoot()!.z - d.z,
                    ),
                  )}{' '}
                  m away · {g.closestLoot()!.depth.toFixed(0)} m deep
                </small>
              </div>
              <span>
                {g.closestLoot()!.depth > d.depth + 3
                  ? '↓'
                  : g.closestLoot()!.depth < d.depth - 3
                    ? '↑'
                    : '↔'}
              </span>
            </div>
          )}
          <div className="depth-controls">
            <HoldButton
              label="Swim up"
              className="icon-button"
              onHold={(held) => (touch.current.vertical = held ? -1 : 0)}
            >
              <ArrowUp />
            </HoldButton>
            <HoldButton
              label="Swim down"
              className="icon-button"
              onHold={(held) => (touch.current.vertical = held ? 1 : 0)}
            >
              <ArrowDown />
            </HoldButton>
            <span>DEPTH</span>
          </div>
          <div className="bottom-dock">
            <button
              className="action-button"
              onClick={() => act(() => g.collect())}
            >
              <Gem size={20} />
              Collect<kbd>F</kbd>
            </button>
            <button
              className="action-button secondary"
              onClick={() => act(() => g.surface())}
            >
              <ArrowUp size={20} />
              Surface<kbd>E</kbd>
            </button>
          </div>
          <div className="dive-key-hint">
            WASD swim · Q descend · Space ascend
          </div>
        </>
      )}
      {toast && (
        <div className={`toast ${toast.kind}`} role="status">
          {toast.kind === 'warning' ? (
            <Shield size={18} />
          ) : toast.kind === 'discovery' ? (
            <Stars size={18} />
          ) : (
            <Waves size={18} />
          )}
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {(!ready || error) && (
        <div className="loading">
          <div>
            <Waves size={42} />
            <h1>Luma Tide</h1>
            <p>{error || 'The tide is coming in…'}</p>
            {error && (
              <button
                className="action-button"
                onClick={() => location.reload()}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
      <Dialog
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) show(null);
        }}
      >
        <DialogContent className={`game-panel panel-${panel}`}>
          <DialogTitle className="panel-title">
            {panel === 'dock' && dock
              ? dock.name
              : PANEL_TITLES[panel || 'settings']}
          </DialogTitle>
          <DialogDescription className="panel-description">
            {panel === 'dock'
              ? 'A safe harbour. A fresh start.'
              : panel === 'chart'
                ? 'Explore to reveal the sea. Tap the chart to set a course marker.'
                : 'Take your time. The voyage is paused.'}
          </DialogDescription>
          {panel === 'cargo' && cargoContent}
          {panel === 'chart' && (
            <>
              <SeaChart
                state={s}
                large
                onMark={(x, z) => {
                  s.waypoint = {
                    x: Math.max(-245, Math.min(245, x)),
                    z: Math.max(-245, Math.min(245, z)),
                  };
                  persist();
                  update();
                }}
              />
              <div className="chart-legend">
                <span>
                  <span className="legend-dot" />
                  You
                </span>
                <span>○ Fishing grounds</span>
                <span>✧ Relic</span>
                <span>
                  {s.discovered.length} / {ISLANDS.length} islands
                </span>
              </div>
              <div className="charted-islands">
                {ISLANDS.filter((i) => s.discovered.includes(i.id)).map((i) => (
                  <button
                    key={i.id}
                    className="small-button"
                    onClick={() => {
                      s.waypoint = { ...i.port };
                      persist();
                      update();
                    }}
                  >
                    <Anchor size={14} />
                    {i.name}
                  </button>
                ))}
              </div>
              {s.waypoint && (
                <button
                  className="small-button"
                  onClick={() => {
                    s.waypoint = null;
                    persist();
                    update();
                  }}
                >
                  Clear marker
                </button>
              )}
            </>
          )}
          {panel === 'journal' && (
            <Tabs defaultValue="voyage" className="nautical-tabs">
              <TabsList>
                <TabsTrigger value="voyage">Voyage</TabsTrigger>
                <TabsTrigger value="fish">Field guide</TabsTrigger>
                <TabsTrigger value="relics">Relics</TabsTrigger>
              </TabsList>
              <TabsContent value="voyage">
                <div className="journal-intro">
                  <Compass size={34} />
                  <div>
                    <span className="eyebrow">VOYAGER RANK {rank(s)}</span>
                    <h2>{objective.title}</h2>
                    <p>{objective.text}</p>
                  </div>
                </div>
                <div className="stat-row">
                  <div>
                    <strong>{s.caught}</strong>
                    <span>fish landed</span>
                  </div>
                  <div>
                    <strong>{s.dives}</strong>
                    <span>dives taken</span>
                  </div>
                  <div>
                    <strong>{s.discovered.length}</strong>
                    <span>islands found</span>
                  </div>
                </div>
                <h3 className="section-label">ISLAND ORDERS</h3>
                {CONTRACTS.map((c) => (
                  <div className="contract" key={c.id}>
                    <div>
                      <span className="eyebrow">{c.npc}</span>
                      <h3>{c.title}</h3>
                      <p>
                        {c.count} ×{' '}
                        {SPECIES.find((f) => f.id === c.species)?.name} ·
                        Deliver at {ISLANDS.find((i) => i.id === c.port)?.name}
                      </p>
                    </div>
                    {s.completed.includes(c.id) ? (
                      <CheckCheck size={23} />
                    ) : (
                      <strong>
                        {c.reward}
                        <Coins size={15} />
                      </strong>
                    )}
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="fish">
                <p className="panel-note">
                  {s.catalogue.length} of {SPECIES.length} species recorded.
                  Upgrade your fishing gear to catch stronger fish. Luminous
                  species emerge after 19:00.
                </p>
                <div className="fish-catalogue">
                  {SPECIES.map((fish) => (
                    <div
                      className={`fish-entry ${s.catalogue.includes(fish.id) ? 'recorded' : ''}`}
                      key={fish.id}
                    >
                      <Fish style={{ color: fish.color }} size={35} />
                      <div>
                        <strong>{fish.name}</strong>
                        <small>
                          {fish.rarity} · {BIOMES[fish.biome]}
                        </small>
                        <small>
                          Gear {fish.level + 1} ·{' '}
                          {fish.night ? 'Night only' : 'Any time'} · {fish.w} ×{' '}
                          {fish.h} slots
                        </small>
                      </div>
                      {s.catalogue.includes(fish.id) && <Check size={17} />}
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="relics">
                <p className="story-prologue">
                  “There was a time,” the elder says, “when every wave carried a
                  song. Find what we left below, little voyager. The keeper is
                  still listening.”
                </p>
                {RELICS.map((r) => (
                  <div
                    className={`relic-entry ${s.relics.includes(r.id) ? 'found' : ''}`}
                    key={r.id}
                  >
                    <Gem size={28} />
                    <div>
                      <h3>{r.name}</h3>
                      <p>
                        {s.relics.includes(r.id)
                          ? r.story
                          : `Unrecovered · ${r.depth} m deep · ${r.id === 'tide' ? 'Coral Crown' : r.id === 'song' ? 'The Green Veil' : 'The Quiet Deep'}`}
                      </p>
                    </div>
                  </div>
                ))}
                {s.ending && (
                  <div className="ending-note">
                    <Stars />
                    <h3>
                      {s.ending === 'restore'
                        ? 'The song returns'
                        : 'A different kind of treasure'}
                    </h3>
                    <p>
                      {s.ending === 'restore'
                        ? 'You returned the relics to the ocean. The keeper’s gift is a Starlight rig and a sea full of possibility.'
                        : 'You sold the relics for 1,500 coins. Somewhere below, a lantern still burns.'}{' '}
                      Your voyage continues.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          {panel === 'dock' && dock && (
            <Tabs defaultValue="market" className="nautical-tabs">
              <TabsList>
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="craft">Workshop</TabsTrigger>
              </TabsList>
              <TabsContent value="market">
                <div className="harbour-greeting">
                  <Anchor size={36} />
                  <div>
                    <h2>
                      {dock.id === 'haven'
                        ? '“Good to see you, voyager.”'
                        : '“There’s always room at our dock.”'}
                    </h2>
                    <p>
                      Sell your haul, mend your boat, and stay for the sunset.
                    </p>
                  </div>
                </div>
                <div className="market-haul">
                  <span>
                    Your haul
                    <small>
                      {s.cargo.length} items · includes fish and materials
                    </small>
                  </span>
                  <strong>
                    {allValue}
                    <Coins size={21} />
                  </strong>
                </div>
                <button
                  className="action-button full-width"
                  disabled={!s.cargo.length}
                  onClick={() => act(() => g.sellAll())}
                >
                  <ShoppingBag size={20} />
                  Sell all cargo
                </button>
                <p className="panel-note">
                  Keep requested fish for orders and sea kelp for crafting.
                  Fresh catches earn more.
                </p>
                <div className="harbour-services">
                  <button onClick={() => act(() => g.service())}>
                    <Wrench />
                    <strong>Refuel & repair</strong>
                    <span>
                      {Math.ceil((100 - s.fuel) * 0.15 + (100 - s.hull) * 0.2)}{' '}
                      coins
                    </span>
                  </button>
                  <button onClick={() => act(() => g.rest(false))}>
                    <Sun />
                    <strong>Rest until morning</strong>
                    <span>Free · 08:00</span>
                  </button>
                  <button onClick={() => act(() => g.rest(true))}>
                    <Moon />
                    <strong>Wait for nightfall</strong>
                    <span>Free · 20:00</span>
                  </button>
                </div>
                <button className="small-button" onClick={() => show('cargo')}>
                  <Package size={16} />
                  Arrange cargo
                </button>
              </TabsContent>
              <TabsContent value="upgrades">
                <div className="panel-summary">
                  <span>
                    <Coins size={19} /> {s.coins} coins
                  </span>
                  <span>Equipment is fitted immediately</span>
                </div>
                {UPGRADES.map((u) => {
                  const lv = s.upgrades[u.id];
                  return (
                    <div className="upgrade-row" key={u.id}>
                      <div className="upgrade-icon">
                        {u.id === 'rod' ? (
                          <Fish />
                        ) : u.id === 'oxygen' ? (
                          <Wind />
                        ) : u.id === 'engine' ? (
                          <Ship />
                        ) : (
                          <Package />
                        )}
                      </div>
                      <div>
                        <span className="eyebrow">
                          {u.name} · LEVEL {lv + 1}
                        </span>
                        <h3>{u.detail[lv]}</h3>
                        <p>
                          {lv === 3
                            ? 'Fully upgraded. Ready for the far horizon.'
                            : u.description}
                        </p>
                        {lv < 3 && <small>Next: {u.detail[lv + 1]}</small>}
                      </div>
                      <button
                        className="small-button buy"
                        disabled={lv === 3 || s.coins < u.cost[lv]}
                        onClick={() => act(() => g.upgrade(u.id as UpgradeId))}
                      >
                        {lv === 3 ? (
                          <Check size={19} />
                        ) : (
                          <>
                            {u.cost[lv]}
                            <Coins size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </TabsContent>
              <TabsContent value="orders">
                <p className="panel-note">
                  Deliver within 6 minutes of catching the fish for a 20%
                  freshness bonus. Orders remain available until completed.
                </p>
                {CONTRACTS.filter((c) => c.port === dock.id).map((c) => (
                  <div className="contract" key={c.id}>
                    <div>
                      <span className="eyebrow">{c.npc}</span>
                      <h3>{c.title}</h3>
                      <p>
                        {Math.min(
                          c.count,
                          s.cargo.filter((i) => i.species === c.species).length,
                        )}{' '}
                        / {c.count} ×{' '}
                        {SPECIES.find((f) => f.id === c.species)?.name}
                      </p>
                      <small>{c.reward} coins + freshness bonus</small>
                    </div>
                    <button
                      className="small-button"
                      disabled={
                        s.completed.includes(c.id) ||
                        s.cargo.filter((i) => i.species === c.species).length <
                          c.count
                      }
                      onClick={() => act(() => g.deliver(c.id))}
                    >
                      {s.completed.includes(c.id) ? 'Completed' : 'Deliver'}
                    </button>
                  </div>
                ))}
                {!CONTRACTS.some((c) => c.port === dock.id) && (
                  <div className="empty-hint">
                    No orders at this harbour. Other islanders could use a hand.
                  </div>
                )}
                {dock.id === 'abyss' && s.relics.length === 3 && !s.ending && (
                  <div className="ending-choice">
                    <Stars size={30} />
                    <h2>The keeper is listening.</h2>
                    <p>
                      Three relics. One choice. Return them to awaken the keeper
                      and receive the Starlight rig, or trade them for 1,500
                      coins.
                    </p>
                    <button
                      className="action-button"
                      onClick={() => act(() => g.chooseEnding('restore'))}
                    >
                      Restore the ocean’s song
                    </button>
                    <button
                      className="small-button"
                      onClick={() => act(() => g.chooseEnding('profit'))}
                    >
                      Sell the relics · 1,500 coins
                    </button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="craft">
                <div className="craft-row">
                  <Leaf size={32} />
                  <div>
                    <h3>Sea-kelp lures</h3>
                    <p>1 sea kelp → 4 lures. Lures help reel fish in faster.</p>
                  </div>
                  <button
                    className="small-button"
                    onClick={() => act(() => g.craft('bait'))}
                  >
                    Craft
                  </button>
                </div>
                <div className="craft-row">
                  <Heart size={32} />
                  <div>
                    <h3>Sea-garden stew</h3>
                    <p>
                      1 sea kelp + 1 fish → easier reeling and longer dives for
                      5 minutes.
                    </p>
                  </div>
                  <button
                    className="small-button"
                    onClick={() => act(() => g.craft('meal'))}
                  >
                    Cook
                  </button>
                </div>
                <p className="panel-note">
                  Find sea kelp on dives. Your pack contains {s.bait} lures.
                  {s.meal > 0
                    ? ` Stew bonus: ${Math.ceil(s.meal / 60)} minutes remaining.`
                    : ''}
                </p>
              </TabsContent>
            </Tabs>
          )}
          {panel === 'settings' && (
            <>
              <div className="setting-row">
                <div>
                  <strong>Relaxed seas</strong>
                  <p>
                    No fuel, oxygen, freshness or damage penalties. Take your
                    time.
                  </p>
                </div>
                <Switch
                  checked={s.settings.relaxed}
                  onCheckedChange={(v) => {
                    s.settings.relaxed = v;
                    persist();
                    update();
                  }}
                  aria-label="Relaxed seas"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Ocean sounds</strong>
                  <p>Soft waves and musical notes for your discoveries.</p>
                </div>
                <Switch
                  checked={!s.settings.muted}
                  onCheckedChange={(v) => {
                    s.settings.muted = !v;
                    void audio.current?.setMuted(!v).catch(() => {});
                    persist();
                    update();
                  }}
                  aria-label="Ocean sounds"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Show touch controls</strong>
                  <p>Always show the virtual steering stick.</p>
                </div>
                <Switch
                  checked={s.settings.touch || touchDevice}
                  onCheckedChange={(v) => {
                    s.settings.touch = v;
                    setTouchDevice(v);
                    persist();
                    update();
                  }}
                  aria-label="Show touch controls"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Reduced motion</strong>
                  <p>Still waves and a steady boat.</p>
                </div>
                <Switch
                  checked={s.settings.reducedMotion}
                  onCheckedChange={(v) => {
                    s.settings.reducedMotion = v;
                    persist();
                    update();
                  }}
                  aria-label="Reduced motion"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Battery saver</strong>
                  <p>Lower rendering resolution for smaller devices.</p>
                </div>
                <Switch
                  checked={s.settings.quality === 'low'}
                  onCheckedChange={(v) => {
                    s.settings.quality = v ? 'low' : 'high';
                    persist();
                    update();
                  }}
                  aria-label="Battery saver"
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Use a lure · {s.bait} available</strong>
                  <p>Equip for the next cast made with the Cast line button.</p>
                </div>
                <Switch
                  checked={useBait}
                  onCheckedChange={setUseBait}
                  aria-label="Use a lure"
                />
              </div>
              <div className="save-actions">
                <button className="small-button" onClick={() => persist(true)}>
                  <Save size={17} />
                  Save voyage
                </button>
                <button className="small-button" onClick={exportSave}>
                  <Download size={17} />
                  Export backup
                </button>
                <button
                  className="small-button"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={17} />
                  Import backup
                </button>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    void importSave(file).catch(() =>
                      g.tell('That save could not be opened.', 'warning'),
                    );
                  e.currentTarget.value = '';
                }}
              />
              <p className="panel-note">
                Progress stays in this browser and saves automatically. Export a
                backup to continue on another device. Importing a valid backup
                replaces this voyage.
              </p>
              <button className="small-button" onClick={() => show('help')}>
                <HelpCircle size={17} />
                How to play
              </button>
            </>
          )}
          {panel === 'help' && (
            <>
              <div className="guide-intro">
                <Waves size={34} />
                <p>
                  A little boat. A living sea. Follow your curiosity, and return
                  home with a story.
                </p>
              </div>
              <div className="guide-step">
                <span>01</span>
                <div>
                  <h3>Sail & explore</h3>
                  <p>
                    Use WASD, arrow keys, a gamepad’s left stick, or the touch
                    joystick. The boat moves in the direction you push on the
                    screen. Approach a dock and press R to trade.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <span>02</span>
                <div>
                  <h3>Cast & catch</h3>
                  <p>
                    Press F or Cast line. Guide the hook into a fish using the
                    mouse, touch, or movement keys. Hold Space or the reel
                    button to bring it in. Release to keep tension in the green
                    zone. Strong fish need upgraded gear.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <span>03</span>
                <div>
                  <h3>Dive for forgotten things</h3>
                  <p>
                    Press E to dive. Move with WASD or the stick. Hold Q to
                    descend and Space to ascend, or use the depth buttons. Swim
                    within 6 m of a glimmer, including its depth, then press F
                    to collect. Press E to surface before air runs out.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <span>04</span>
                <div>
                  <h3>Make room. Make progress.</h3>
                  <p>
                    Open cargo with I, select an item, rotate it, and tap an
                    empty slot to move it. Sell at any dock to buy gear. Find
                    the three relics with upgraded dive equipment and bring them
                    to The Quiet Deep.
                  </p>
                </div>
              </div>
              <div className="guide-step">
                <span>05</span>
                <div>
                  <h3>Play at your pace</h3>
                  <p>
                    Open the chart with M and the journal with J. Escape pauses.
                    Gamepad: A casts / collects, B dives / surfaces, X opens
                    cargo, Y opens the chart, RT reels, LB / RB change depth.
                    Relaxed seas in Settings removes resource penalties.
                  </p>
                </div>
              </div>
              <button
                className="action-button full-width"
                onClick={() => show(null)}
              >
                Back to the sea
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={f?.phase === 'caught' && !panel} onOpenChange={() => {}}>
        <DialogContent
          className="game-panel catch-panel"
          showCloseButton={false}
        >
          <div className="catch-art" style={{ color: f?.reward?.color }}>
            <span />
            <Fish size={90} strokeWidth={1.3} />
            <Stars size={25} />
          </div>
          <span className="eyebrow">
            {f?.reward && !s.catalogue.includes(f.reward.species)
              ? 'A NEW DISCOVERY'
              : 'A FINE CATCH'}
          </span>
          <DialogTitle className="panel-title">{f?.reward?.name}</DialogTitle>
          <DialogDescription>
            {f?.reward?.variant} · {f?.reward?.weight} kg ·{' '}
            {SPECIES.find((sp) => sp.id === f?.reward?.species)?.rarity}
          </DialogDescription>
          <div className="catch-details">
            <span>
              <Coins size={18} />
              {f?.reward?.price} coins
            </span>
            <span>
              <Package size={18} />
              {f?.reward?.w} × {f?.reward?.h} slots
            </span>
          </div>
          <button
            className="action-button full-width"
            onClick={() => act(() => g.keepCatch())}
          >
            <Package size={20} />
            Keep this catch
          </button>
          <div className="catch-secondary">
            <button className="small-button" onClick={() => show('cargo')}>
              Make room
            </button>
            <button
              className="small-button"
              onClick={() => act(() => g.releaseCatch())}
            >
              Release to the sea
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
