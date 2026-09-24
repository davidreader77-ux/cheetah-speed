export type Mode = "title" | "playing" | "result";

export type Hud = {
  mode: Mode;
  speedMph: number;
  topMph: number;
  bestMph: number;
  distanceM: number;
  bestDistanceM: number;
  prey: number;
  heat: number;
};

type Kind = "mound" | "branch" | "gazelle";

type Entity = {
  kind: Kind;
  x: number;
  w: number;
  h: number;
  caught: boolean;
  anim: number;
};

type Dust = { x: number; y: number; vx: number; vy: number; life: number; max: number };

const SAVE_KEY = "cheetah-speed-v1";
const VW = 1280;
const VH = 720;
const GROUND = 560;
const PLAYER_X = 248;
const FIXED = 1 / 60;
const MAX_DT = 0.1;
const SPEED_START = 340;
const SPEED_CAP = 760;
const JUMP_V = -920;
const GRAVITY = 2400;
const COYOTE = 0.09;
const JUMP_BUF = 0.12;
const DUCK_T = 0.38;
const HUD_EVERY = 5;

const JUMP_CODES = new Set(["Space", "ArrowUp", "KeyW"]);
const DUCK_CODES = new Set(["ArrowDown", "KeyS"]);
const BLOCK_CODES = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
]);

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pxToMph(px: number) {
  return (px / SPEED_CAP) * 72;
}

function loadBest() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { bestMph: 0, bestDistanceM: 0 };
    const p = JSON.parse(raw) as { v?: number; bestMph?: number; bestDistanceM?: number };
    return {
      bestMph: Number(p.bestMph) || 0,
      bestDistanceM: Number(p.bestDistanceM) || 0,
    };
  } catch {
    return { bestMph: 0, bestDistanceM: 0 };
  }
}

function saveBest(bestMph: number, bestDistanceM: number) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, bestMph, bestDistanceM }));
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function kindSize(kind: Kind) {
  if (kind === "mound") return { w: 96, h: 124 };
  if (kind === "branch") return { w: 196, h: 40 };
  return { w: 92, h: 64 };
}

export class SprintGame {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  hud: (h: Hud) => void;
  mode: Mode = "title";
  keys = new Set<string>();
  images: Record<string, HTMLImageElement> = {};
  ready = false;
  last = 0;
  acc = 0;
  raf = 0;
  speed = SPEED_START;
  dist = 0;
  y = GROUND;
  vy = 0;
  duck = 0;
  coyote = 0;
  jumpBuf = 0;
  onGround = true;
  shake = 0;
  heat = 0;
  prey = 0;
  topMph = 0;
  bestMph = 0;
  bestDistanceM = 0;
  entities: Entity[] = [];
  pool: Entity[] = [];
  dust: Dust[] = [];
  spawnAt = 900;
  lastKind: Kind | null = null;
  grassOff = 0;
  hillOff = 0;
  farOff = 0;
  animT = 0;
  swipeY0 = 0;
  audio: AudioContext | null = null;
  muted = false;
  hudTick = 0;
  bufW = 0;
  bufH = 0;
  _unkeys: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, hud: (h: Hud) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    this.ctx = ctx;
    this.hud = hud;
    const saved = loadBest();
    this.bestMph = saved.bestMph;
    this.bestDistanceM = saved.bestDistanceM;
    this.bind();
    void this.load();
    this.emit();
  }

  async load() {
    const names = ["cheetah", "gazelle", "mound", "branch"] as const;
    await Promise.all(
      names.map(
        (n) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              this.images[n] = this.chromaKey(img);
              res();
            };
            img.onerror = () => res();
            img.src = `/sprites/${n}.png`;
          }),
      ),
    );
    this.ready = true;
    this.loop(0);
  }

  /** Magenta (#FF00FF) chroma-key → transparent canvas-backed image. */
  chromaKey(src: HTMLImageElement): HTMLImageElement {
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const g = c.getContext("2d");
    if (!g) return src;
    g.drawImage(src, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 200 && d[i + 1] < 80 && d[i + 2] > 200) d[i + 3] = 0;
    }
    g.putImageData(id, 0, 0);
    const out = new Image();
    out.src = c.toDataURL("image/png");
    return out;
  }

  bind() {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (BLOCK_CODES.has(e.code)) e.preventDefault();
      if (JUMP_CODES.has(e.code)) {
        this.jumpBuf = JUMP_BUF;
        if (this.mode !== "playing") this.start();
      }
      if (e.code === "KeyR" && this.mode === "result") this.start();
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
      else void this.audio?.resume();
    });
    this._unkeys = () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };

    window.__controlsTest = {
      getSpeed: () => this.speed,
      getYaw: () => (this.duck > 0 ? -0.4 : this.y < GROUND - 6 ? 0.4 : 0),
      setKeys: (codes: string[]) => {
        this.keys.clear();
        for (const c of codes) this.keys.add(c);
      },
    };
  }

  unlockAudio() {
    if (this.audio) {
      void this.audio.resume();
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.audio = new Ctor();
  }

  beep(freq: number, dur: number, type: OscillatorType, gain = 0.05) {
    if (!this.audio || this.muted) return;
    const t = this.audio.currentTime;
    const o = this.audio.createOscillator();
    const g = this.audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.audio.destination);
    o.start(t);
    o.stop(t + dur);
  }

  start() {
    this.unlockAudio();
    this.recycleAll();
    this.mode = "playing";
    this.speed = SPEED_START;
    this.dist = 0;
    this.y = GROUND;
    this.vy = 0;
    this.duck = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.onGround = true;
    this.shake = 0;
    this.heat = 0;
    this.prey = 0;
    this.topMph = pxToMph(SPEED_START);
    this.dust = [];
    this.spawnAt = this.dist + 640;
    this.lastKind = null;
    this.animT = 0;
    this.beep(220, 0.08, "triangle", 0.04);
    this.emit();
  }

  slide() {
    if (this.mode !== "playing") {
      this.start();
      return;
    }
    if (this.onGround) this.duck = DUCK_T;
  }

  pollPad(act: { jump: boolean; duck: boolean }) {
    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (!pads) return;
    for (const p of pads) {
      if (!p) continue;
      if (p.buttons[0]?.pressed || p.buttons[12]?.pressed) act.jump = true;
      if (p.buttons[1]?.pressed || p.buttons[13]?.pressed) act.duck = true;
    }
  }

  jump() {
    if (this.coyote <= 0 && !this.onGround) return;
    this.vy = JUMP_V;
    this.onGround = false;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.duck = 0;
    this.beep(420, 0.07, "square", 0.035);
  }

  crash() {
    if (this.mode !== "playing") return;
    this.mode = "result";
    this.shake = 14;
    const metres = this.dist / 18;
    if (this.topMph > this.bestMph) this.bestMph = this.topMph;
    if (metres > this.bestDistanceM) this.bestDistanceM = metres;
    saveBest(this.bestMph, this.bestDistanceM);
    this.beep(90, 0.28, "sawtooth", 0.06);
    this.emit();
  }

  alloc(kind: Kind): Entity {
    const size = kindSize(kind);
    const e = this.pool.pop() ?? {
      kind,
      x: 0,
      w: size.w,
      h: size.h,
      caught: false,
      anim: 0,
    };
    e.kind = kind;
    e.x = VW + 48;
    e.w = size.w;
    e.h = size.h;
    e.caught = false;
    e.anim = 0;
    return e;
  }

  recycleAll() {
    for (const e of this.entities) this.pool.push(e);
    this.entities.length = 0;
  }

  spawn() {
    const roll = Math.random();
    let kind: Kind;
    if (roll < 0.36) kind = "mound";
    else if (roll < 0.7) kind = "branch";
    else kind = "gazelle";
    if (kind === this.lastKind && kind !== "gazelle") {
      kind = kind === "mound" ? "branch" : "mound";
    }
    this.lastKind = kind;
    this.entities.push(this.alloc(kind));
    const react = this.speed * 1.25;
    this.spawnAt = this.dist + react + 160 + Math.random() * 200;
  }

  entityBox(e: Entity) {
    if (e.kind === "mound") {
      return { x: e.x + 16, y: GROUND - e.h + 10, w: e.w - 32, h: e.h - 10 };
    }
    if (e.kind === "branch") {
      return { x: e.x + 12, y: GROUND - 76, w: e.w - 24, h: 34 };
    }
    return { x: e.x + 10, y: GROUND - e.h + 6, w: e.w - 20, h: e.h - 8 };
  }

  step(dt: number) {
    if (this.mode !== "playing") {
      this.animT += dt;
      this.grassOff = (this.grassOff + 48 * dt) % 140;
      this.hillOff = (this.hillOff + 18 * dt) % VW;
      this.farOff = (this.farOff + 8 * dt) % VW;
      this.shake = Math.max(0, this.shake - dt * 28);
      return;
    }

    const act = {
      jump: this.keys.has("Space") || this.keys.has("ArrowUp") || this.keys.has("KeyW"),
      duck: this.keys.has("ArrowDown") || this.keys.has("KeyS"),
    };
    this.pollPad(act);

    this.speed = clamp(this.speed + 15 * dt, SPEED_START, SPEED_CAP);
    this.dist += this.speed * dt;
    this.animT += dt;
    this.heat = clamp((this.speed - SPEED_START) / (SPEED_CAP - SPEED_START), 0, 1);
    this.topMph = Math.max(this.topMph, pxToMph(this.speed));

    if (act.duck && this.onGround) this.duck = DUCK_T;
    if (act.jump) this.jumpBuf = JUMP_BUF;
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.duck = Math.max(0, this.duck - dt);

    if (this.onGround) this.coyote = COYOTE;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuf > 0 && (this.onGround || this.coyote > 0) && this.duck <= 0) {
      this.jump();
    }

    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND) {
      this.y = GROUND;
      this.vy = 0;
      if (!this.onGround) {
        this.onGround = true;
        this.puff(PLAYER_X - 10, GROUND - 6, 5);
      }
    } else {
      this.onGround = false;
    }

    if (this.dist >= this.spawnAt) this.spawn();

    const pH = this.duck > 0 ? 30 : 50;
    const pW = 72;
    const pTop = this.y - pH;
    const pLeft = PLAYER_X - 18;

    for (const e of this.entities) {
      e.x -= this.speed * dt;
      e.anim += dt;
      if (e.kind === "gazelle" && !e.caught) e.x -= 34 * dt;

      const box = this.entityBox(e);
      const hit = aabb(pLeft, pTop, pW, pH, box.x, box.y, box.w, box.h);

      if (e.kind === "gazelle") {
        if (hit && !e.caught && this.duck <= 0) {
          e.caught = true;
          this.prey += 1;
          this.beep(660, 0.09, "sine", 0.045);
        }
      } else if (hit) {
        this.crash();
        break;
      }
    }

    const keep: Entity[] = [];
    for (const e of this.entities) {
      if (e.x + e.w < -80 || (e.caught && e.x < PLAYER_X - 48)) this.pool.push(e);
      else keep.push(e);
    }
    this.entities = keep;

    if (this.onGround && this.duck <= 0 && Math.random() < 0.4) {
      this.puff(PLAYER_X - 28, GROUND - 4, 1);
    }
    for (const d of this.dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
    }
    this.dust = this.dust.filter((d) => d.life > 0);
    if (this.dust.length > 48) this.dust.splice(0, this.dust.length - 48);

    this.grassOff = (this.grassOff + this.speed * dt) % 140;
    this.hillOff = (this.hillOff + this.speed * 0.35 * dt) % VW;
    this.farOff = (this.farOff + this.speed * 0.12 * dt) % VW;
    this.shake = Math.max(0, this.shake - dt * 28);

    this.hudTick += 1;
    if (this.hudTick >= HUD_EVERY) {
      this.hudTick = 0;
      this.emit();
    }
  }

  puff(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.dust.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 6,
        vx: -this.speed * 0.25 - Math.random() * 40,
        vy: -20 - Math.random() * 40,
        life: 0.25 + Math.random() * 0.2,
        max: 0.45,
      });
    }
  }

  emit() {
    this.hud({
      mode: this.mode,
      speedMph: pxToMph(this.speed),
      topMph: this.topMph,
      bestMph: this.bestMph,
      distanceM: this.dist / 18,
      bestDistanceM: this.bestDistanceM,
      prey: this.prey,
      heat: this.heat,
    });
  }

  fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const bw = Math.max(1, Math.floor(w * dpr));
    const bh = Math.max(1, Math.floor(h * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.bufW = w;
    this.bufH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const scale = Math.max(w / VW, h / VH);
    const ox = (w - VW * scale) / 2;
    const oy = (h - VH * scale) / 2;
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(ox + sx, oy + sy);
    ctx.scale(scale, scale);

    this.drawSky(ctx);
    this.drawHills(ctx);
    this.drawGround(ctx);
    for (const e of this.entities) this.drawEntity(ctx, e);
    this.drawCheetah(ctx);
    this.drawDust(ctx);
    this.drawGrass(ctx);
    ctx.restore();
  }

  drawSky(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#5a3a22");
    g.addColorStop(0.38, "#c47a32");
    g.addColorStop(0.62, "#e8b15a");
    g.addColorStop(1, "#d4a017");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    ctx.beginPath();
    ctx.fillStyle = "#f3d7a0";
    ctx.arc(1080, 128, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(243, 215, 160, 0.18)";
    ctx.arc(1080, 128, 150, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHills(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#7a5428";
    ctx.beginPath();
    ctx.moveTo(-40, GROUND - 160);
    for (let x = 0; x <= VW + 80; x += 40) {
      const y =
        GROUND - 150 - Math.sin((x + this.farOff) * 0.006) * 28 - Math.sin((x + this.farOff) * 0.013) * 16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW + 40, VH);
    ctx.lineTo(-40, VH);
    ctx.fill();

    ctx.fillStyle = "#8d6330";
    ctx.beginPath();
    ctx.moveTo(-40, GROUND - 80);
    for (let x = 0; x <= VW + 80; x += 36) {
      const y =
        GROUND - 90 - Math.sin((x + this.hillOff) * 0.01) * 22 - Math.cos((x + this.hillOff) * 0.018) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW + 40, VH);
    ctx.lineTo(-40, VH);
    ctx.fill();
  }

  drawGround(ctx: CanvasRenderingContext2D) {
    const ctx2 = ctx;
    ctx2.fillStyle = "#c4a05a";
    ctx2.fillRect(0, GROUND - 8, VW, VH - GROUND + 8);
    ctx2.fillStyle = "#b08948";
    ctx2.fillRect(0, GROUND - 8, VW, 10);
    ctx2.fillStyle = "#9a7338";
    for (let i = 0; i < 18; i++) {
      const x = ((i * 90 - this.grassOff * 0.4) % (VW + 90)) - 40;
      ctx2.fillRect(x, GROUND + 18 + (i % 3) * 16, 70, 6);
    }
  }

  drawGrass(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "#6e4c1e";
    ctx.lineWidth = 2;
    for (let i = 0; i < 42; i++) {
      const x = ((i * 38 - this.grassOff) % (VW + 40)) - 20;
      const h = 14 + (i % 5) * 3;
      ctx.beginPath();
      ctx.moveTo(x, VH);
      ctx.quadraticCurveTo(x + 4, VH - h * 0.5, x - 3, VH - h);
      ctx.stroke();
    }
  }

  drawSheet(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cols: number,
    rows: number,
    frame: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) {
    const fw = img.width / cols;
    const fh = img.height / rows;
    const c = frame % cols;
    const r = Math.floor(frame / cols) % rows;
    ctx.drawImage(img, c * fw, r * fh, fw, fh, dx, dy, dw, dh);
  }

  drawEntity(ctx: CanvasRenderingContext2D, e: Entity) {
    if (e.caught) ctx.globalAlpha = 0.35;
    if (e.kind === "mound") {
      const img = this.images.mound;
      if (img) ctx.drawImage(img, e.x, GROUND - e.h, e.w, e.h);
      else {
        ctx.fillStyle = "#6b4a28";
        ctx.beginPath();
        ctx.moveTo(e.x, GROUND);
        ctx.quadraticCurveTo(e.x + e.w * 0.5, GROUND - e.h, e.x + e.w, GROUND);
        ctx.fill();
      }
    } else if (e.kind === "branch") {
      const img = this.images.branch;
      const top = GROUND - 78;
      if (img) ctx.drawImage(img, e.x, top, e.w, e.h);
      else {
        ctx.strokeStyle = "#4a3218";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(e.x, top + 18);
        ctx.quadraticCurveTo(e.x + e.w * 0.5, top, e.x + e.w, top + 16);
        ctx.stroke();
      }
    } else {
      const img = this.images.gazelle;
      const f = Math.floor(e.anim * 10) % 4;
      if (img && img.width > 0) this.drawSheet(ctx, img, 2, 2, f, e.x, GROUND - e.h, e.w, e.h);
      else this.drawGazelleFrame(ctx, e.x, GROUND, e.w, e.h, f);
    }
    ctx.globalAlpha = 1;
  }

  drawCheetah(ctx: CanvasRenderingContext2D) {
    const img = this.images.cheetah;
    const duck = this.duck > 0;
    const h = duck ? 58 : 92;
    const w = duck ? 128 : 148;
    const y = this.y - h + 8;
    ctx.save();
    if (duck) {
      ctx.translate(PLAYER_X, this.y);
      ctx.scale(1.08, 0.72);
      ctx.translate(-PLAYER_X, -this.y);
    }
    if (img && img.width > 0) {
      const f = this.onGround ? Math.floor(this.animT * (8 + this.speed / 180)) % 6 : 2;
      this.drawSheet(ctx, img, 3, 2, f, PLAYER_X - w * 0.45, y, w, h);
    } else {
      // Clean 6-frame procedural run: one body + four legs, shared baseline
      this.drawCheetahFrame(ctx, PLAYER_X, this.y, w, h, this.onGround ? Math.floor(this.animT * (8 + this.speed / 180)) % 6 : 2);
    }
    ctx.restore();
  }

  /** Procedural cheetah: single body, exactly four legs, feet on shared baseline. */
  drawCheetahFrame(ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, frame: number) {
    const gold = "#d4a017";
    const tawny = "#c48c28";
    const cream = "#f3e6c8";
    const dark = "#3c2810";
    const charcoal = "#1a140c";
    const baseline = py - 2;
    const bodyH = h * 0.42;
    const bodyY = baseline - bodyH - 6;
    const bodyW = w * 0.55;
    const bodyX = px - bodyW * 0.35;

    // Tail
    ctx.strokeStyle = tawny;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bodyX + 6, bodyY + bodyH * 0.4);
    ctx.quadraticCurveTo(bodyX - 18, bodyY - 4, bodyX - 28, bodyY + 10);
    ctx.stroke();

    // Body
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW / 2, bodyY + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Underbelly
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW / 2 + 4, bodyY + bodyH * 0.7, bodyW * 0.38, bodyH * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spots
    ctx.fillStyle = dark;
    for (const [sx, sy] of [[0.25, 0.3], [0.45, 0.22], [0.65, 0.35], [0.35, 0.55], [0.55, 0.5]] as const) {
      ctx.beginPath();
      ctx.ellipse(bodyX + bodyW * sx, bodyY + bodyH * sy, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    const hx = bodyX + bodyW - 4;
    const hy = bodyY - 2;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.ellipse(hx + 14, hy + 10, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Snout
    ctx.fillStyle = tawny;
    ctx.beginPath();
    ctx.ellipse(hx + 24, hy + 12, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ear
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(hx + 6, hy + 4);
    ctx.lineTo(hx + 2, hy - 8);
    ctx.lineTo(hx + 14, hy + 2);
    ctx.fill();
    // Eye + tear
    ctx.fillStyle = charcoal;
    ctx.beginPath();
    ctx.ellipse(hx + 12, hy + 7, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = charcoal;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 10);
    ctx.lineTo(hx + 6, hy + 16);
    ctx.stroke();

    // Four legs — phase by frame (gallop), feet share baseline
    const phases = [
      // frame 0 gathered
      { f: [0.62, 0.15, 0.72, 0.55, 0.68, 1], h: [0.22, 0.15, 0.12, 0.55, 0.18, 1] },
      // 1 extend front
      { f: [0.68, 0.1, 0.82, 0.45, 0.88, 0.95], h: [0.18, 0.2, 0.08, 0.6, 0.1, 1] },
      // 2 airborne-ish
      { f: [0.7, 0.05, 0.8, 0.35, 0.78, 0.75], h: [0.15, 0.25, 0.05, 0.5, 0.02, 0.9] },
      // 3 stretch
      { f: [0.72, 0.1, 0.88, 0.4, 0.95, 0.85], h: [0.12, 0.15, -0.02, 0.45, -0.05, 0.95] },
      // 4 recover
      { f: [0.65, 0.15, 0.75, 0.5, 0.7, 1], h: [0.25, 0.1, 0.18, 0.45, 0.22, 0.8] },
      // 5 push
      { f: [0.6, 0.2, 0.68, 0.6, 0.62, 1], h: [0.28, 0.08, 0.35, 0.4, 0.4, 0.9] },
    ];
    const p = phases[frame % 6];
    const drawLeg = (sx: number, sy: number, kx: number, ky: number, fx: number, fy: number) => {
      const x0 = bodyX + bodyW * sx;
      const y0 = bodyY + bodyH * sy;
      const x1 = bodyX + bodyW * kx;
      const y1 = bodyY + bodyH * ky;
      const x2 = bodyX + bodyW * fx;
      const y2 = baseline - (1 - fy) * 8;
      ctx.strokeStyle = tawny;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = charcoal;
      ctx.beginPath();
      ctx.ellipse(x2, y2, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawLeg(p.f[0], p.f[1], p.f[2], p.f[3], p.f[4], p.f[5]);
    // second front (slight offset)
    drawLeg(p.f[0] - 0.06, p.f[1] + 0.05, p.f[2] - 0.05, p.f[3] + 0.05, p.f[4] - 0.08, p.f[5]);
    drawLeg(p.h[0], p.h[1], p.h[2], p.h[3], p.h[4], p.h[5]);
    drawLeg(p.h[0] + 0.06, p.h[1] + 0.05, p.h[2] + 0.05, p.h[3] + 0.05, p.h[4] + 0.08, p.h[5]);
  }

  /** Procedural gazelle: consistent animal, 4-frame run, shared baseline. */
  drawGazelleFrame(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number, h: number, frame: number) {
    const body = "#d2be96";
    const dark = "#8c6e46";
    const cream = "#f3e6c8";
    const charcoal = "#1a140c";
    const baseline = ground - 2;
    const bodyH = h * 0.45;
    const bodyY = baseline - bodyH - 4;
    const bodyW = w * 0.65;
    const bodyX = x + (w - bodyW) / 2;

    // Horns
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 4, bodyY);
    ctx.lineTo(bodyX + bodyW + 4, bodyY - 14);
    ctx.moveTo(bodyX + bodyW + 2, bodyY);
    ctx.lineTo(bodyX + bodyW + 10, bodyY - 12);
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(bodyX + 4, bodyY + bodyH * 0.3);
    ctx.lineTo(bodyX - 8, bodyY + 2);
    ctx.stroke();

    // Body
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW / 2, bodyY + bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.ellipse(bodyX + bodyW / 2 + 2, bodyY + bodyH * 0.65, bodyW * 0.35, bodyH * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const hx = bodyX + bodyW - 2;
    const hy = bodyY - 2;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(hx + 10, hy + 8, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + 18, hy + 9, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = charcoal;
    ctx.beginPath();
    ctx.ellipse(hx + 8, hy + 5, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs — 4 frames, same animal
    const phases = [
      { f: [0.7, 0.2, 0.82, 0.55, 0.8, 1], h: [0.25, 0.2, 0.15, 0.55, 0.2, 1] },
      { f: [0.75, 0.15, 0.9, 0.45, 0.95, 0.9], h: [0.2, 0.25, 0.1, 0.6, 0.12, 1] },
      { f: [0.78, 0.1, 0.88, 0.4, 0.85, 0.7], h: [0.18, 0.2, 0.05, 0.5, 0.02, 0.95] },
      { f: [0.7, 0.2, 0.8, 0.6, 0.75, 1], h: [0.28, 0.15, 0.35, 0.45, 0.4, 0.85] },
    ];
    const p = phases[frame % 4];
    const drawLeg = (sx: number, sy: number, kx: number, ky: number, fx: number, fy: number) => {
      const x0 = bodyX + bodyW * sx;
      const y0 = bodyY + bodyH * sy;
      const x1 = bodyX + bodyW * kx;
      const y1 = bodyY + bodyH * ky;
      const x2 = bodyX + bodyW * fx;
      const y2 = baseline - (1 - fy) * 6;
      ctx.strokeStyle = dark;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = charcoal;
      ctx.beginPath();
      ctx.ellipse(x2, y2, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawLeg(p.f[0], p.f[1], p.f[2], p.f[3], p.f[4], p.f[5]);
    drawLeg(p.f[0] - 0.08, p.f[1] + 0.05, p.f[2] - 0.06, p.f[3] + 0.05, p.f[4] - 0.1, p.f[5]);
    drawLeg(p.h[0], p.h[1], p.h[2], p.h[3], p.h[4], p.h[5]);
    drawLeg(p.h[0] + 0.08, p.h[1] + 0.05, p.h[2] + 0.06, p.h[3] + 0.05, p.h[4] + 0.1, p.h[5]);
  }

  drawDust(ctx: CanvasRenderingContext2D) {
    for (const d of this.dust) {
      const a = d.life / d.max;
      ctx.fillStyle = `rgba(90, 60, 28, ${0.35 * a})`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 7 * a + 2, 4 * a + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  loop = (t: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.ready) return;
    if (!this.last) this.last = t;
    let dt = (t - this.last) / 1000;
    this.last = t;
    dt = Math.min(dt, MAX_DT);
    this.acc += dt;
    while (this.acc >= FIXED) {
      this.step(FIXED);
      this.acc -= FIXED;
    }
    this.fit();
    this.draw();
  };

  onPointerDown(y: number) {
    this.swipeY0 = y;
    if (this.mode !== "playing") {
      this.start();
      return;
    }
    this.jumpBuf = JUMP_BUF;
  }

  onPointerUp(y: number) {
    const dy = y - this.swipeY0;
    if (dy > 36 && this.mode === "playing") this.duck = DUCK_T;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this._unkeys?.();
    delete window.__controlsTest;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
    };
  }
}
