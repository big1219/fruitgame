import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

/* ─────────────────────── GAME DATA ─────────────────────── */
const FRUITS = [
  { emoji: "🍎", name: "apple", color: "#e74c3c", points: 1, size: 48 },
  { emoji: "🍊", name: "orange", color: "#f39c12", points: 1, size: 48 },
  { emoji: "🍉", name: "watermelon", color: "#27ae60", points: 2, size: 56 },
  { emoji: "🍋", name: "lemon", color: "#f1c40f", points: 1, size: 44 },
  { emoji: "🍇", name: "grape", color: "#8e44ad", points: 2, size: 44 },
  { emoji: "🍑", name: "peach", color: "#e17055", points: 1, size: 46 },
  { emoji: "🥝", name: "kiwi", color: "#6ab04c", points: 2, size: 42 },
  { emoji: "🍍", name: "pineapple", color: "#fdcb6e", points: 3, size: 52 },
  { emoji: "🫐", name: "blueberry", color: "#6c5ce7", points: 3, size: 36 },
  { emoji: "🍓", name: "strawberry", color: "#fd79a8", points: 1, size: 42 },
  { emoji: "🥭", name: "mango", color: "#e67e22", points: 2, size: 48 },
  { emoji: "🍒", name: "cherry", color: "#d63031", points: 2, size: 38 },
];
const STAR_FRUIT = { emoji: "⭐", name: "star", color: "#ffd700", points: 10, size: 40, isSpecial: true };
const HAZARDS = [
  { emoji: "💣", name: "bomb", color: "#2d3436", size: 46, effect: "instant_death", label: "폭탄! 즉사!", flashColor: "rgba(231,76,60,0.6)" },
  { emoji: "🧊", name: "ice", color: "#74b9ff", size: 44, effect: "freeze", label: "냉동! 2초 정지!", flashColor: "rgba(116,185,255,0.6)" },
  { emoji: "☠️", name: "poison", color: "#00b894", size: 44, effect: "poison", label: "독! -2 생명!", flashColor: "rgba(0,184,148,0.6)" },
  { emoji: "👻", name: "ghost", color: "#dfe6e9", size: 46, effect: "score_drain", label: "유령! 점수 반감!", flashColor: "rgba(223,230,233,0.6)" },
  { emoji: "⚡", name: "lightning", color: "#fdcb6e", size: 42, effect: "combo_break", label: "번개! 콤보 초기화!", flashColor: "rgba(253,203,110,0.6)" },
];
const COMBO_TIERS = [
  { min: 0, mult: 1, label: "", color: "#fff" },
  { min: 3, mult: 2, label: "NICE!", color: "#f39c12" },
  { min: 5, mult: 3, label: "GREAT!", color: "#e67e22" },
  { min: 8, mult: 4, label: "AMAZING!", color: "#e74c3c" },
  { min: 12, mult: 5, label: "INCREDIBLE!", color: "#d63031" },
  { min: 16, mult: 7, label: "LEGENDARY!", color: "#6c5ce7" },
  { min: 25, mult: 10, label: "GOD MODE", color: "#fd79a8" },
];
const GAME_STATES = { MENU: "menu", PLAYING: "playing", OVER: "over" };

function randomBetween(a, b) { return a + Math.random() * (b - a); }
function getComboTier(combo) {
  let tier = COMBO_TIERS[0];
  for (const t of COMBO_TIERS) { if (combo >= t.min) tier = t; }
  return tier;
}

/* ─────────────────────── AUDIO ENGINE ─────────────────────── */
class AudioEngine {
  constructor() {
    this.ready = false;
    this.muted = false;
    this.bgmPlaying = false;
  }

  async init() {
    if (this.ready) return;
    await Tone.start();

    // Master volume
    this.masterVol = new Tone.Volume(-6).toDestination();

    // SFX channel
    this.sfxVol = new Tone.Volume(-2).connect(this.masterVol);

    // BGM channel
    this.bgmVol = new Tone.Volume(-14).connect(this.masterVol);

    // --- SFX Synths ---
    this.sliceSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
    }).connect(this.sfxVol);

    this.comboSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.2 },
    }).connect(this.sfxVol);

    this.bombSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    }).connect(this.sfxVol);

    this.bombNoise = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.2 },
    }).connect(new Tone.Volume(-8).connect(this.sfxVol));

    this.iceSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
    }).connect(new Tone.Chorus(4, 2.5, 0.5).connect(this.sfxVol));

    this.poisonSynth = new Tone.FMSynth({
      modulationIndex: 12,
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 },
    }).connect(this.sfxVol);

    this.ghostSynth = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0, release: 0.6 },
    }).connect(new Tone.Reverb(1.5).connect(this.sfxVol));

    this.lightningSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    }).connect(this.sfxVol);

    this.starSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.3 },
    }).connect(new Tone.Reverb(0.8).connect(this.sfxVol));

    this.missSynth = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
    }).connect(new Tone.Volume(-4).connect(this.sfxVol));

    this.gameOverSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 },
    }).connect(this.sfxVol);

    // --- BGM ---
    this.bgmSynth1 = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 },
      volume: -4,
    }).connect(this.bgmVol);

    this.bgmSynth2 = new Tone.Synth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -10,
    }).connect(this.bgmVol);

    this.bgmKick = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -6,
    }).connect(this.bgmVol);

    this.bgmHihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
      volume: -16,
    }).connect(this.bgmVol);

    this.bgmLoop = null;
    this.ready = true;
  }

  playSlice(combo) {
    if (!this.ready || this.muted) return;
    const baseNote = 500 + Math.min(combo, 20) * 40;
    this.sliceSynth.triggerAttackRelease(baseNote + Math.random() * 100, 0.08);
  }

  playCombo(combo) {
    if (!this.ready || this.muted) return;
    const tier = getComboTier(combo);
    const base = 60 + tier.mult * 2;
    const notes = [base, base + 4, base + 7].map((n) => Tone.Frequency(n, "midi").toFrequency());
    this.comboSynth.triggerAttackRelease(notes, 0.12);
  }

  playBomb() {
    if (!this.ready || this.muted) return;
    this.bombSynth.triggerAttackRelease("C1", 0.3);
    this.bombNoise.triggerAttackRelease(0.25);
  }

  playIce() {
    if (!this.ready || this.muted) return;
    this.iceSynth.triggerAttackRelease("C6", 0.4);
    setTimeout(() => this.ready && this.iceSynth.triggerAttackRelease("E6", 0.3), 100);
  }

  playPoison() {
    if (!this.ready || this.muted) return;
    this.poisonSynth.triggerAttackRelease("C3", 0.2);
  }

  playGhost() {
    if (!this.ready || this.muted) return;
    this.ghostSynth.triggerAttackRelease("A4", 0.4);
    setTimeout(() => this.ready && this.ghostSynth.triggerAttackRelease("F4", 0.3), 150);
  }

  playLightning() {
    if (!this.ready || this.muted) return;
    this.lightningSynth.triggerAttackRelease(0.06);
    setTimeout(() => this.ready && this.lightningSynth.triggerAttackRelease(0.04), 80);
  }

  playStar() {
    if (!this.ready || this.muted) return;
    const notes = ["C5", "E5", "G5", "C6"];
    notes.forEach((n, i) => {
      setTimeout(() => this.ready && this.starSynth.triggerAttackRelease(n, 0.15), i * 60);
    });
  }

  playMiss() {
    if (!this.ready || this.muted) return;
    this.missSynth.triggerAttackRelease("E3", 0.2);
  }

  playGameOver() {
    if (!this.ready || this.muted) return;
    this.gameOverSynth.triggerAttackRelease(["E3", "Bb3", "Db4"], 0.5);
  }

  startBGM() {
    if (!this.ready || this.bgmPlaying) return;
    this.bgmPlaying = true;

    const chords = [
      ["C4", "E4", "G4"],
      ["A3", "C4", "E4"],
      ["F3", "A3", "C4"],
      ["G3", "B3", "D4"],
      ["C4", "E4", "G4"],
      ["D4", "F4", "A4"],
      ["F3", "A3", "C4"],
      ["G3", "B3", "D4"],
    ];
    const bassNotes = ["C2", "A1", "F1", "G1", "C2", "D2", "F1", "G1"];
    let step = 0;

    this.bgmLoop = new Tone.Loop((time) => {
      if (this.muted) return;
      const bar = Math.floor(step / 4) % chords.length;
      const beat = step % 4;

      // Kick on 1 and 3
      if (beat === 0 || beat === 2) {
        this.bgmKick.triggerAttackRelease("C1", 0.1, time);
      }
      // Hihat on every beat
      this.bgmHihat.triggerAttackRelease(0.03, time);

      // Chord on beat 1
      if (beat === 0) {
        this.bgmSynth1.triggerAttackRelease(chords[bar], "4n", time);
      }

      // Bass on 1 and 3
      if (beat === 0 || beat === 2) {
        this.bgmSynth2.triggerAttackRelease(bassNotes[bar], "8n", time);
      }

      step++;
    }, "8n");

    Tone.getTransport().bpm.value = 128;
    this.bgmLoop.start(0);
    Tone.getTransport().start();
  }

  stopBGM() {
    if (this.bgmLoop) {
      this.bgmLoop.stop();
      Tone.getTransport().stop();
    }
    this.bgmPlaying = false;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }

  dispose() {
    this.stopBGM();
    this.ready = false;
  }
}

/* ─────────────────────── FRUIT FACTORY ─────────────────────── */
function createFruit(canvasW, canvasH, difficulty) {
  const hazardChance = Math.min(0.22, 0.08 + difficulty * 0.012);
  const starChance = Math.max(0.01, 0.04 - difficulty * 0.003);
  const roll = Math.random();
  let fruitData, isHazard = false, isSpecial = false;

  if (roll < hazardChance) {
    isHazard = true;
    fruitData = difficulty < 3 && Math.random() < 0.6
      ? HAZARDS[0]
      : HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
  } else if (roll < hazardChance + starChance) {
    isSpecial = true;
    fruitData = STAR_FRUIT;
  } else {
    fruitData = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  }

  return {
    id: Date.now() + Math.random(),
    ...fruitData, isHazard, isSpecial,
    x: randomBetween(canvasW * 0.12, canvasW * 0.88),
    y: canvasH + 50,
    vx: randomBetween(-3.5, 3.5),
    vy: randomBetween(-canvasH * 0.019, -canvasH * 0.027),
    gravity: canvasH * 0.00042,
    rotation: 0,
    rotationSpeed: randomBetween(-6, 6),
    sliced: false, opacity: 1,
    glowPhase: Math.random() * Math.PI * 2,
  };
}

function createParticle(x, y, color, count = 12) {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(2, 9);
    return {
      id: Date.now() + Math.random(), x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
      gravity: 0.18, size: randomBetween(3, 10),
      color, opacity: 1, life: 1,
    };
  });
}

function createSliceHalf(fruit, side) {
  return {
    id: Date.now() + Math.random() + side,
    emoji: fruit.emoji,
    x: fruit.x + (side === "left" ? -14 : 14), y: fruit.y,
    vx: side === "left" ? randomBetween(-6, -2) : randomBetween(2, 6),
    vy: randomBetween(-5, -1), gravity: 0.22,
    rotation: 0, rotationSpeed: side === "left" ? -10 : 10,
    size: fruit.size * 0.7, opacity: 1, clipSide: side,
  };
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function FruitSlash() {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const stateRef = useRef({
    gameState: GAME_STATES.MENU, score: 0, combo: 0, maxCombo: 0,
    lives: 3, fruits: [], particles: [], halves: [], trail: [],
    comboTexts: [], warningTexts: [], spawnTimer: 0, difficulty: 1,
    frameCount: 0, isPointerDown: false, lastPointerPos: null,
    bestScore: 0, frozen: false, frozenTimer: 0,
    screenFlash: null, screenShake: { x: 0, y: 0, intensity: 0 },
  });
  const [uiState, setUiState] = useState({
    gameState: GAME_STATES.MENU, score: 0, combo: 0, lives: 3,
    bestScore: 0, comboTier: COMBO_TIERS[0], frozen: false, muted: false,
  });
  const [rankings, setRankings] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const animFrameRef = useRef(null);

  // Load rankings
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("fruitslash_rankings") || "[]");
      setRankings(saved);
      const best = saved.length > 0 ? saved[0].score : 0;
      stateRef.current.bestScore = best;
      setUiState((p) => ({ ...p, bestScore: best }));
    } catch {}
    const savedName = localStorage.getItem("fruitslash_name") || "";
    setPlayerName(savedName);
  }, []);

  const saveRanking = useCallback((name, score, maxCombo) => {
    const entry = { name, score, maxCombo, date: new Date().toLocaleDateString("ko-KR") };
    const updated = [...rankings, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    setRankings(updated);
    try {
      localStorage.setItem("fruitslash_rankings", JSON.stringify(updated));
      localStorage.setItem("fruitslash_name", name);
    } catch {}
    return updated;
  }, [rankings]);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setUiState((p) => ({
      ...p, gameState: s.gameState, score: s.score, combo: s.combo,
      lives: s.lives, bestScore: s.bestScore,
      comboTier: getComboTier(s.combo), frozen: s.frozen,
    }));
  }, []);

  const startGame = useCallback(async () => {
    if (!audioRef.current) audioRef.current = new AudioEngine();
    await audioRef.current.init();
    audioRef.current.startBGM();

    const s = stateRef.current;
    s.gameState = GAME_STATES.PLAYING;
    s.score = 0; s.combo = 0; s.maxCombo = 0; s.lives = 3;
    s.fruits = []; s.particles = []; s.halves = []; s.trail = [];
    s.comboTexts = []; s.warningTexts = []; s.spawnTimer = 0;
    s.difficulty = 1; s.frameCount = 0; s.frozen = false;
    s.frozenTimer = 0; s.screenFlash = null;
    s.screenShake = { x: 0, y: 0, intensity: 0 };
    setShowRanking(false);
    setShowNameInput(false);
    syncUI();
  }, [syncUI]);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = GAME_STATES.OVER;
    if (s.score > s.bestScore) s.bestScore = s.score;
    s.screenShake = { x: 0, y: 0, intensity: 15 };
    audioRef.current?.stopBGM();
    audioRef.current?.playGameOver();

    // Check if score qualifies for ranking
    if (s.score > 0) {
      const dominated = rankings.length < 10 || s.score > (rankings[rankings.length - 1]?.score || 0);
      if (dominated) {
        setShowNameInput(true);
      }
    }
    syncUI();
  }, [syncUI, rankings]);

  const handleSubmitScore = useCallback(() => {
    const s = stateRef.current;
    const name = playerName.trim() || "익명";
    setPlayerName(name);
    saveRanking(name, s.score, s.maxCombo);
    setShowNameInput(false);
    setShowRanking(true);
  }, [playerName, saveRanking]);

  const applyHazardEffect = useCallback((hazard) => {
    const s = stateRef.current;
    const audio = audioRef.current;
    switch (hazard.effect) {
      case "instant_death":
        s.lives = 0;
        s.screenFlash = { color: hazard.flashColor, life: 1 };
        s.screenShake = { x: 0, y: 0, intensity: 20 };
        audio?.playBomb();
        endGame(); return;
      case "freeze":
        s.frozen = true; s.frozenTimer = 120;
        s.screenFlash = { color: hazard.flashColor, life: 1 };
        audio?.playIce(); break;
      case "poison":
        s.lives = Math.max(0, s.lives - 2);
        s.screenFlash = { color: hazard.flashColor, life: 1 };
        s.screenShake = { x: 0, y: 0, intensity: 10 };
        audio?.playPoison();
        if (s.lives <= 0) { endGame(); return; }
        break;
      case "score_drain":
        s.score = Math.max(0, Math.floor(s.score / 2));
        s.screenFlash = { color: hazard.flashColor, life: 1 };
        audio?.playGhost(); break;
      case "combo_break":
        s.combo = 0;
        s.screenFlash = { color: hazard.flashColor, life: 1 };
        s.screenShake = { x: 0, y: 0, intensity: 8 };
        audio?.playLightning(); break;
    }
    s.warningTexts.push({
      id: Date.now() + Math.random(), x: hazard.x, y: hazard.y - 20,
      text: hazard.label, color: hazard.flashColor,
      opacity: 1, vy: -2.5, life: 1, scale: 1.5,
    });
    syncUI();
  }, [endGame, syncUI]);

  const sliceFruit = useCallback((fruit) => {
    const s = stateRef.current;
    const audio = audioRef.current;
    if (fruit.sliced) return;
    fruit.sliced = true;

    if (fruit.isHazard) {
      s.particles.push(...createParticle(fruit.x, fruit.y, fruit.color, 20));
      s.particles.push(...createParticle(fruit.x, fruit.y, "#e74c3c", 15));
      applyHazardEffect({ ...fruit, x: fruit.x, y: fruit.y });
      return;
    }

    s.combo++;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;
    const tier = getComboTier(s.combo);
    const gained = (fruit.points || 1) * tier.mult;
    s.score += gained;

    audio?.playSlice(s.combo);
    if (s.combo >= 3) audio?.playCombo(s.combo);

    if (s.combo >= 3) {
      s.comboTexts.push({
        id: Date.now() + Math.random(), x: fruit.x, y: fruit.y - 35,
        text: `${tier.label} ${s.combo}x → +${gained}`, color: tier.color,
        opacity: 1, vy: -2.2, life: 1,
        scale: s.combo >= 12 ? 1.4 : s.combo >= 8 ? 1.2 : 1,
      });
    }
    if (fruit.isSpecial) {
      audio?.playStar();
      s.comboTexts.push({
        id: Date.now() + Math.random(), x: fruit.x, y: fruit.y - 60,
        text: `⭐ BONUS +${gained}! ⭐`, color: "#ffd700",
        opacity: 1, vy: -3, life: 1, scale: 1.3,
      });
      s.particles.push(...createParticle(fruit.x, fruit.y, "#ffd700", 20));
    }
    s.particles.push(...createParticle(fruit.x, fruit.y, fruit.color, 14));
    s.halves.push(createSliceHalf(fruit, "left"));
    s.halves.push(createSliceHalf(fruit, "right"));
    syncUI();
  }, [applyHazardEffect, syncUI]);

  const checkSliceCollision = useCallback((x, y) => {
    const s = stateRef.current;
    if (s.gameState !== GAME_STATES.PLAYING || s.frozen) return;
    for (const fruit of s.fruits) {
      if (fruit.sliced) continue;
      if (Math.hypot(fruit.x - x, fruit.y - y) < fruit.size * 0.75) sliceFruit(fruit);
    }
  }, [sliceFruit]);

  /* ─────────────── CANVAS & GAME LOOP ─────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const c = canvas.parentElement;
      canvas.width = c.clientWidth; canvas.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const onDown = (e) => { e.preventDefault(); const s = stateRef.current; s.isPointerDown = true; const pos = getPos(e); s.lastPointerPos = pos; s.combo = 0; checkSliceCollision(pos.x, pos.y); };
    const onMove = (e) => {
      e.preventDefault(); const s = stateRef.current;
      if (!s.isPointerDown) return;
      const pos = getPos(e);
      s.trail.push({ x: pos.x, y: pos.y, opacity: 1, life: 1 });
      if (s.trail.length > 30) s.trail.shift();
      if (s.lastPointerPos) {
        const dx = pos.x - s.lastPointerPos.x, dy = pos.y - s.lastPointerPos.y;
        const steps = Math.ceil(Math.hypot(dx, dy) / 8);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          checkSliceCollision(s.lastPointerPos.x + dx * t, s.lastPointerPos.y + dy * t);
        }
      }
      s.lastPointerPos = pos;
    };
    const onUp = (e) => { e.preventDefault(); stateRef.current.isPointerDown = false; stateRef.current.lastPointerPos = null; };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp, { passive: false });

    let stars = null;

    const gameLoop = () => {
      const s = stateRef.current;
      animFrameRef.current = requestAnimationFrame(gameLoop);
      const w = canvas.width, h = canvas.height;

      ctx.save();
      if (s.screenShake.intensity > 0) {
        s.screenShake.x = (Math.random() - 0.5) * s.screenShake.intensity;
        s.screenShake.y = (Math.random() - 0.5) * s.screenShake.intensity;
        s.screenShake.intensity *= 0.9;
        if (s.screenShake.intensity < 0.5) s.screenShake.intensity = 0;
        ctx.translate(s.screenShake.x, s.screenShake.y);
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (s.frozen) { bgGrad.addColorStop(0, "#0a1a2e"); bgGrad.addColorStop(0.5, "#102040"); bgGrad.addColorStop(1, "#0a1530"); }
      else { bgGrad.addColorStop(0, "#0a0a1a"); bgGrad.addColorStop(0.5, "#121230"); bgGrad.addColorStop(1, "#1a0a2e"); }
      ctx.fillStyle = bgGrad; ctx.fillRect(-20, -20, w + 40, h + 40);

      if (!stars || s.frameCount % 300 === 0) {
        stars = Array.from({ length: 50 }, () => ({
          x: Math.random() * w, y: Math.random() * h * 0.6,
          r: Math.random() * 1.5 + 0.5, tw: Math.random() * Math.PI * 2,
        }));
      }
      for (const star of stars) {
        ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(s.frameCount * 0.02 + star.tw)})`;
        ctx.fill();
      }

      s.frameCount++;
      if (s.gameState !== GAME_STATES.PLAYING) { ctx.restore(); return; }

      if (s.frozen) { s.frozenTimer--; if (s.frozenTimer <= 0) { s.frozen = false; syncUI(); } }
      s.difficulty = 1 + s.score * 0.02;

      // Spawn
      if (!s.frozen) {
        s.spawnTimer++;
        const interval = Math.max(22, 65 - s.difficulty * 3);
        if (s.spawnTimer >= interval) {
          s.spawnTimer = 0;
          const count = Math.random() < 0.15 + s.difficulty * 0.01 ? Math.min(3, 1 + Math.floor(Math.random() * (1 + s.difficulty * 0.2))) : 1;
          for (let i = 0; i < count; i++) s.fruits.push(createFruit(w, h, s.difficulty));
        }
      }

      // Update fruits
      for (const f of s.fruits) {
        if (s.frozen && !f.isHazard) { f.vy += f.gravity * 0.1; f.y += f.vy * 0.1; f.rotation += f.rotationSpeed * 0.1; }
        else { f.x += f.vx; f.vy += f.gravity; f.y += f.vy; f.rotation += f.rotationSpeed; }
      }

      // Missed
      const missed = s.fruits.filter((f) => !f.sliced && !f.isHazard && !f.isSpecial && f.y > h + 80 && f.vy > 0);
      if (missed.length > 0) {
        s.lives -= missed.length;
        audioRef.current?.playMiss();
        if (s.lives <= 0) { s.lives = 0; endGame(); ctx.restore(); return; }
        syncUI();
      }
      s.fruits = s.fruits.filter((f) => !f.sliced && f.y < h + 100);

      // Draw fruits
      for (const f of s.fruits) {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate((f.rotation * Math.PI) / 180);
        if (f.isHazard) {
          const pulse = 0.6 + 0.4 * Math.sin(s.frameCount * 0.1 + f.glowPhase);
          ctx.shadowColor = f.color; ctx.shadowBlur = 18 * pulse;
          ctx.beginPath(); ctx.arc(0, 0, f.size * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,80,80,${0.3 * pulse})`; ctx.lineWidth = 2; ctx.stroke();
          const xS = f.size * 0.35;
          ctx.strokeStyle = `rgba(255,0,0,${0.25 * pulse})`; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(-xS, -xS); ctx.lineTo(xS, xS); ctx.moveTo(xS, -xS); ctx.lineTo(-xS, xS); ctx.stroke();
        } else if (f.isSpecial) {
          ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 25 * (0.5 + 0.5 * Math.sin(s.frameCount * 0.15 + f.glowPhase));
        } else { ctx.shadowColor = f.color; ctx.shadowBlur = 10; }
        if (s.frozen && !f.isHazard) ctx.globalAlpha = 0.7;
        ctx.font = `${f.size}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, 0, 0); ctx.shadowBlur = 0; ctx.restore();
      }

      // Halves
      s.halves = s.halves.filter((it) => { it.x += it.vx; it.vy += it.gravity; it.y += it.vy; it.rotation += it.rotationSpeed; it.opacity -= 0.018; return it.opacity > 0 && it.y < h + 100; });
      for (const half of s.halves) {
        ctx.save(); ctx.globalAlpha = half.opacity; ctx.translate(half.x, half.y); ctx.rotate((half.rotation * Math.PI) / 180);
        ctx.beginPath();
        if (half.clipSide === "left") ctx.rect(-half.size, -half.size, half.size, half.size * 2);
        else ctx.rect(0, -half.size, half.size, half.size * 2);
        ctx.clip(); ctx.font = `${half.size}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(half.emoji, 0, 0); ctx.restore();
      }

      // Particles
      s.particles = s.particles.filter((p) => { p.x += p.vx; p.vy += p.gravity; p.y += p.vy; p.life -= 0.025; p.opacity = p.life; return p.life > 0; });
      for (const p of s.particles) { ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }

      // Trail
      s.trail = s.trail.filter((t) => { t.life -= 0.055; t.opacity = t.life; return t.life > 0; });
      if (s.trail.length > 1) {
        const tier = getComboTier(s.combo);
        for (let i = 1; i < s.trail.length; i++) {
          const prev = s.trail[i - 1], curr = s.trail[i];
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(255,255,255,${curr.opacity * 0.9})`; ctx.lineWidth = 3 * curr.opacity + 1; ctx.lineCap = "round"; ctx.stroke();
          const ga = Math.floor(curr.opacity * 128).toString(16).padStart(2, "0");
          ctx.strokeStyle = s.combo >= 3 ? `${tier.color}${ga}` : `rgba(100,200,255,${curr.opacity * 0.5})`;
          ctx.lineWidth = (s.combo >= 8 ? 14 : s.combo >= 3 ? 10 : 8) * curr.opacity; ctx.stroke();
        }
      }

      // Texts
      const allTexts = [...s.comboTexts, ...s.warningTexts];
      for (const ct of allTexts) { ct.y += ct.vy; ct.life -= 0.016; ct.opacity = ct.life; }
      s.comboTexts = s.comboTexts.filter((t) => t.life > 0);
      s.warningTexts = s.warningTexts.filter((t) => t.life > 0);
      for (const ct of allTexts) {
        if (ct.life <= 0) continue;
        ctx.save(); ctx.globalAlpha = ct.opacity;
        ctx.font = `bold ${Math.round(22 * (ct.scale || 1))}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center"; ctx.fillStyle = ct.color || "#ffd32a";
        ctx.shadowColor = ct.color || "#f39c12"; ctx.shadowBlur = 12;
        ctx.fillText(ct.text, ct.x, ct.y); ctx.restore();
      }

      // Flash & Freeze overlay
      if (s.screenFlash && s.screenFlash.life > 0) {
        ctx.save(); ctx.globalAlpha = s.screenFlash.life * 0.6; ctx.fillStyle = s.screenFlash.color;
        ctx.fillRect(-20, -20, w + 40, h + 40); ctx.restore(); s.screenFlash.life -= 0.04;
      }
      if (s.frozen) {
        ctx.save(); ctx.globalAlpha = 0.15 + 0.05 * Math.sin(s.frameCount * 0.05);
        ctx.fillStyle = "#74b9ff"; ctx.fillRect(-20, -20, w + 40, h + 40);
        const barW = w * 0.4, barH = 6, barX = (w - barW) / 2, barY = h * 0.12;
        ctx.globalAlpha = 0.8; ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#74b9ff"; ctx.fillRect(barX, barY, barW * (s.frozenTimer / 120), barH);
        ctx.restore();
      }

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onDown); canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp); canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown); canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [checkSliceCollision, endGame, syncUI]);

  // Cleanup audio
  useEffect(() => () => { audioRef.current?.dispose(); }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const muted = audioRef.current.toggleMute();
    if (!muted && stateRef.current.gameState === GAME_STATES.PLAYING) audioRef.current.startBGM();
    setUiState((p) => ({ ...p, muted }));
  }, []);

  const tier = uiState.comboTier;

  /* ─────────────── OVERLAY STYLES ─────────────── */
  const overlay = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20 };
  const btn = {
    padding: "16px 52px", fontSize: "20px", fontWeight: "700", color: "#fff",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)", border: "none", borderRadius: "50px",
    cursor: "pointer", boxShadow: "0 4px 25px rgba(231,76,60,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
    transition: "transform 0.2s", pointerEvents: "auto",
  };
  const hoverIn = (e) => (e.currentTarget.style.transform = "scale(1.08)");
  const hoverOut = (e) => (e.currentTarget.style.transform = "scale(1)");

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", fontFamily: "'Segoe UI','Noto Sans KR',sans-serif", userSelect: "none", touchAction: "none", cursor: uiState.frozen ? "not-allowed" : "crosshair", background: "#0a0a1a" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />

      {/* Mute Button */}
      {uiState.gameState !== GAME_STATES.MENU && (
        <button onClick={toggleMute} style={{ position: "absolute", bottom: 16, right: 16, zIndex: 30, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 44, height: 44, fontSize: "20px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          {uiState.muted ? "🔇" : "🔊"}
        </button>
      )}

      {/* HUD */}
      {uiState.gameState === GAME_STATES.PLAYING && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)", pointerEvents: "none", zIndex: 10 }}>
          <div style={{ display: "flex", gap: "3px" }}>
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ fontSize: "22px", opacity: i < uiState.lives ? 1 : 0.15, filter: i < uiState.lives ? "none" : "grayscale(1)", transition: "all 0.3s" }}>❤️</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div style={{ fontSize: "38px", fontWeight: "800", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)", letterSpacing: "-1px", lineHeight: 1 }}>{uiState.score}</div>
            {uiState.combo >= 3 && (
              <div style={{ fontSize: "13px", fontWeight: "800", color: tier.color, textShadow: `0 0 10px ${tier.color}`, animation: uiState.combo >= 12 ? "megaPulse 0.3s ease infinite alternate" : "pulse 0.5s ease infinite alternate", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                {tier.label} {uiState.combo}x (×{tier.mult})
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", minWidth: "60px" }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>배율</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: tier.color, textShadow: `0 0 8px ${tier.color}`, lineHeight: 1 }}>×{tier.mult}</div>
          </div>
        </div>
      )}

      {/* Frozen text */}
      {uiState.gameState === GAME_STATES.PLAYING && uiState.frozen && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "clamp(28px,6vw,48px)", fontWeight: "900", color: "#74b9ff", textShadow: "0 0 30px rgba(116,185,255,0.8)", pointerEvents: "none", zIndex: 15, animation: "pulse 0.8s ease infinite alternate", letterSpacing: "4px" }}>
          🧊 FROZEN 🧊
        </div>
      )}

      {/* ────── MENU ────── */}
      {uiState.gameState === GAME_STATES.MENU && (
        <div style={{ ...overlay, background: "radial-gradient(ellipse at center, rgba(26,10,46,0.85), rgba(10,10,26,0.95))", padding: "20px" }}>
          <div style={{ fontSize: "clamp(48px,10vw,80px)", marginBottom: "8px", animation: "float 2s ease-in-out infinite" }}>🍉</div>
          <h1 style={{ fontSize: "clamp(32px,7vw,56px)", fontWeight: "900", color: "#fff", textShadow: "0 0 30px rgba(231,76,60,0.5), 0 4px 20px rgba(0,0,0,0.5)", margin: "0 0 12px", letterSpacing: "-2px" }}>FRUIT SLASH</h1>
          <p style={{ fontSize: "clamp(13px,2.8vw,17px)", color: "rgba(255,255,255,0.55)", marginBottom: "16px", textAlign: "center", lineHeight: 1.6 }}>스와이프로 과일을 자르세요! 🔊 사운드 ON 추천!</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px", maxWidth: "420px" }}>
            {HAZARDS.map((hz) => (
              <div key={hz.name} style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.06)", padding: "5px 10px", borderRadius: "16px", fontSize: "12px", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "16px" }}>{hz.emoji}</span><span>{hz.label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,215,0,0.08)", padding: "5px 10px", borderRadius: "16px", fontSize: "12px", color: "#ffd700", border: "1px solid rgba(255,215,0,0.15)" }}>
              <span style={{ fontSize: "16px" }}>⭐</span><span>보너스! +10점!</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "28px" }}>
            {COMBO_TIERS.filter((t) => t.mult > 1).slice(0, 5).map((t) => (
              <div key={t.min} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "10px", background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}44`, fontWeight: "700" }}>
                {t.min}+ → ×{t.mult}
              </div>
            ))}
          </div>

          <button onClick={startGame} style={btn} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            게임 시작 🔪
          </button>

          {rankings.length > 0 && (
            <button onClick={() => setShowRanking(!showRanking)} style={{ ...btn, background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", marginTop: "12px", padding: "12px 36px", fontSize: "16px", boxShadow: "0 4px 20px rgba(108,92,231,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              🏆 랭킹 보기
            </button>
          )}

          {uiState.bestScore > 0 && <p style={{ marginTop: "16px", fontSize: "15px", color: "rgba(255,255,255,0.4)" }}>최고 점수: {uiState.bestScore}</p>}

          {showRanking && <RankingBoard rankings={rankings} onClose={() => setShowRanking(false)} />}
        </div>
      )}

      {/* ────── GAME OVER ────── */}
      {uiState.gameState === GAME_STATES.OVER && (
        <div style={{ ...overlay, background: "radial-gradient(ellipse at center, rgba(46,10,10,0.9), rgba(10,10,26,0.95))", animation: "fadeIn 0.5s ease", padding: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>💥</div>
          <h2 style={{ fontSize: "clamp(28px,6vw,44px)", fontWeight: "900", color: "#e74c3c", textShadow: "0 0 20px rgba(231,76,60,0.4)", margin: "0 0 24px" }}>GAME OVER</h2>

          <div style={{ display: "flex", gap: "28px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "점수", value: uiState.score, color: "#fff" },
              { label: "최대 콤보", value: `${uiState.combo}x`, color: "#ffd32a" },
              { label: "최고 점수", value: uiState.bestScore, color: "#27ae60" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>{stat.label}</div>
                <div style={{ fontSize: "38px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Name Input */}
          {showNameInput && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center", pointerEvents: "auto" }}>
              <input
                type="text" placeholder="이름 입력" maxLength={12}
                value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitScore()}
                style={{ padding: "10px 16px", fontSize: "16px", borderRadius: "25px", border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", outline: "none", width: "160px", textAlign: "center" }}
              />
              <button onClick={handleSubmitScore} style={{ padding: "10px 20px", fontSize: "16px", fontWeight: "700", color: "#fff", background: "linear-gradient(135deg, #27ae60, #2ecc71)", border: "none", borderRadius: "25px", cursor: "pointer" }}>
                등록
              </button>
            </div>
          )}

          {showRanking && <RankingBoard rankings={rankings} onClose={() => setShowRanking(false)} compact />}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", pointerEvents: "auto" }}>
            <button onClick={startGame} style={btn} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>다시 하기 🔄</button>
            {rankings.length > 0 && !showRanking && (
              <button onClick={() => setShowRanking(true)} style={{ ...btn, background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", boxShadow: "0 4px 20px rgba(108,92,231,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                🏆 랭킹
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { from{transform:scale(1)} to{transform:scale(1.1)} }
        @keyframes megaPulse { from{transform:scale(1);text-shadow:0 0 10px currentColor} to{transform:scale(1.2);text-shadow:0 0 25px currentColor} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ─────────────── RANKING BOARD ─────────────── */
function RankingBoard({ rankings, onClose, compact }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{
      background: "rgba(0,0,0,0.85)", borderRadius: "20px", padding: compact ? "16px" : "24px",
      border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)",
      width: "min(360px, 90vw)", maxHeight: compact ? "260px" : "400px",
      overflowY: "auto", animation: "slideUp 0.3s ease",
      marginBottom: compact ? "16px" : "0", marginTop: compact ? "0" : "16px",
      pointerEvents: "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#ffd700" }}>🏆 TOP 10</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>
      {rankings.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px 0" }}>아직 기록이 없어요!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {rankings.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 12px", borderRadius: "12px",
              background: i === 0 ? "rgba(255,215,0,0.1)" : i === 1 ? "rgba(192,192,192,0.08)" : i === 2 ? "rgba(205,127,50,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${i < 3 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)"}`,
            }}>
              <span style={{ fontSize: i < 3 ? "20px" : "14px", width: "28px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                {i < 3 ? medals[i] : `${i + 1}`}
              </span>
              <span style={{ flex: 1, fontSize: "15px", fontWeight: "600", color: "#fff" }}>{r.name}</span>
              <span style={{ fontSize: "16px", fontWeight: "800", color: i === 0 ? "#ffd700" : "#fff" }}>{r.score}</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{r.maxCombo}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
