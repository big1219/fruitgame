import { useState, useEffect, useRef, useCallback } from "react";

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

const STAR_FRUIT = {
  emoji: "⭐",
  name: "star",
  color: "#ffd700",
  points: 10,
  size: 40,
  isSpecial: true,
};

const HAZARDS = [
  {
    emoji: "💣",
    name: "bomb",
    color: "#2d3436",
    size: 46,
    effect: "instant_death",
    label: "폭탄! 즉사!",
    flashColor: "rgba(231,76,60,0.6)",
  },
  {
    emoji: "🧊",
    name: "ice",
    color: "#74b9ff",
    size: 44,
    effect: "freeze",
    label: "냉동! 2초 정지!",
    flashColor: "rgba(116,185,255,0.6)",
  },
  {
    emoji: "☠️",
    name: "poison",
    color: "#00b894",
    size: 44,
    effect: "poison",
    label: "독! -2 생명!",
    flashColor: "rgba(0,184,148,0.6)",
  },
  {
    emoji: "👻",
    name: "ghost",
    color: "#dfe6e9",
    size: 46,
    effect: "score_drain",
    label: "유령! 점수 반감!",
    flashColor: "rgba(223,230,233,0.6)",
  },
  {
    emoji: "⚡",
    name: "lightning",
    color: "#fdcb6e",
    size: 42,
    effect: "combo_break",
    label: "번개! 콤보 초기화!",
    flashColor: "rgba(253,203,110,0.6)",
  },
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

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function getComboTier(combo) {
  let tier = COMBO_TIERS[0];
  for (const t of COMBO_TIERS) {
    if (combo >= t.min) tier = t;
  }
  return tier;
}

function createFruit(canvasW, canvasH, difficulty) {
  const hazardChance = Math.min(0.22, 0.08 + difficulty * 0.012);
  const starChance = Math.max(0.01, 0.04 - difficulty * 0.003);
  const roll = Math.random();

  let fruitData;
  let isHazard = false;
  let isSpecial = false;

  if (roll < hazardChance) {
    isHazard = true;
    if (difficulty < 3) {
      fruitData =
        Math.random() < 0.6
          ? HAZARDS[0]
          : HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
    } else {
      fruitData = HAZARDS[Math.floor(Math.random() * HAZARDS.length)];
    }
  } else if (roll < hazardChance + starChance) {
    isSpecial = true;
    fruitData = STAR_FRUIT;
  } else {
    fruitData = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  }

  const x = randomBetween(canvasW * 0.12, canvasW * 0.88);
  const vx = randomBetween(-3.5, 3.5);
  const vy = randomBetween(-canvasH * 0.019, -canvasH * 0.027);
  const gravity = canvasH * 0.00042;

  return {
    id: Date.now() + Math.random(),
    ...fruitData,
    isHazard,
    isSpecial,
    x,
    y: canvasH + 50,
    vx,
    vy,
    gravity,
    rotation: 0,
    rotationSpeed: randomBetween(-6, 6),
    sliced: false,
    opacity: 1,
    glowPhase: Math.random() * Math.PI * 2,
  };
}

function createParticle(x, y, color, count = 12) {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(2, 9);
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      gravity: 0.18,
      size: randomBetween(3, 10),
      color,
      opacity: 1,
      life: 1,
    };
  });
}

function createSliceHalf(fruit, side) {
  return {
    id: Date.now() + Math.random() + side,
    emoji: fruit.emoji,
    x: fruit.x + (side === "left" ? -14 : 14),
    y: fruit.y,
    vx: side === "left" ? randomBetween(-6, -2) : randomBetween(2, 6),
    vy: randomBetween(-5, -1),
    gravity: 0.22,
    rotation: 0,
    rotationSpeed: side === "left" ? -10 : 10,
    size: fruit.size * 0.7,
    opacity: 1,
    clipSide: side,
  };
}

export default function FruitSlash() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    gameState: GAME_STATES.MENU,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    fruits: [],
    particles: [],
    halves: [],
    trail: [],
    comboTexts: [],
    warningTexts: [],
    spawnTimer: 0,
    difficulty: 1,
    frameCount: 0,
    isPointerDown: false,
    lastPointerPos: null,
    bestScore: 0,
    frozen: false,
    frozenTimer: 0,
    screenFlash: null,
    screenShake: { x: 0, y: 0, intensity: 0 },
  });
  const [uiState, setUiState] = useState({
    gameState: GAME_STATES.MENU,
    score: 0,
    combo: 0,
    lives: 3,
    bestScore: 0,
    comboTier: COMBO_TIERS[0],
    frozen: false,
  });
  const animFrameRef = useRef(null);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setUiState({
      gameState: s.gameState,
      score: s.score,
      combo: s.combo,
      lives: s.lives,
      bestScore: s.bestScore,
      comboTier: getComboTier(s.combo),
      frozen: s.frozen,
    });
  }, []);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = GAME_STATES.PLAYING;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.lives = 3;
    s.fruits = [];
    s.particles = [];
    s.halves = [];
    s.trail = [];
    s.comboTexts = [];
    s.warningTexts = [];
    s.spawnTimer = 0;
    s.difficulty = 1;
    s.frameCount = 0;
    s.frozen = false;
    s.frozenTimer = 0;
    s.screenFlash = null;
    s.screenShake = { x: 0, y: 0, intensity: 0 };
    syncUI();
  }, [syncUI]);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = GAME_STATES.OVER;
    if (s.score > s.bestScore) s.bestScore = s.score;
    s.screenShake = { x: 0, y: 0, intensity: 15 };
    syncUI();
  }, [syncUI]);

  const applyHazardEffect = useCallback(
    (hazard) => {
      const s = stateRef.current;
      switch (hazard.effect) {
        case "instant_death":
          s.lives = 0;
          s.screenFlash = { color: hazard.flashColor, life: 1 };
          s.screenShake = { x: 0, y: 0, intensity: 20 };
          endGame();
          return;
        case "freeze":
          s.frozen = true;
          s.frozenTimer = 120;
          s.screenFlash = { color: hazard.flashColor, life: 1 };
          break;
        case "poison":
          s.lives = Math.max(0, s.lives - 2);
          s.screenFlash = { color: hazard.flashColor, life: 1 };
          s.screenShake = { x: 0, y: 0, intensity: 10 };
          if (s.lives <= 0) {
            endGame();
            return;
          }
          break;
        case "score_drain":
          s.score = Math.max(0, Math.floor(s.score / 2));
          s.screenFlash = { color: hazard.flashColor, life: 1 };
          break;
        case "combo_break":
          s.combo = 0;
          s.screenFlash = { color: hazard.flashColor, life: 1 };
          s.screenShake = { x: 0, y: 0, intensity: 8 };
          break;
      }
      s.warningTexts.push({
        id: Date.now() + Math.random(),
        x: hazard.x,
        y: hazard.y - 20,
        text: hazard.label,
        color: hazard.flashColor,
        opacity: 1,
        vy: -2.5,
        life: 1,
        scale: 1.5,
      });
      syncUI();
    },
    [endGame, syncUI]
  );

  const sliceFruit = useCallback(
    (fruit) => {
      const s = stateRef.current;
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
      const basePoints = fruit.points || 1;
      const gained = basePoints * tier.mult;
      s.score += gained;

      if (s.combo >= 3) {
        s.comboTexts.push({
          id: Date.now() + Math.random(),
          x: fruit.x,
          y: fruit.y - 35,
          text: `${tier.label} ${s.combo}x \u2192 +${gained}`,
          color: tier.color,
          opacity: 1,
          vy: -2.2,
          life: 1,
          scale: s.combo >= 12 ? 1.4 : s.combo >= 8 ? 1.2 : 1,
        });
      }

      if (fruit.isSpecial) {
        s.comboTexts.push({
          id: Date.now() + Math.random(),
          x: fruit.x,
          y: fruit.y - 60,
          text: `\u2b50 BONUS +${gained}! \u2b50`,
          color: "#ffd700",
          opacity: 1,
          vy: -3,
          life: 1,
          scale: 1.3,
        });
        s.particles.push(...createParticle(fruit.x, fruit.y, "#ffd700", 20));
      }

      s.particles.push(...createParticle(fruit.x, fruit.y, fruit.color, 14));
      s.halves.push(createSliceHalf(fruit, "left"));
      s.halves.push(createSliceHalf(fruit, "right"));

      syncUI();
    },
    [applyHazardEffect, syncUI]
  );

  const checkSliceCollision = useCallback(
    (x, y) => {
      const s = stateRef.current;
      if (s.gameState !== GAME_STATES.PLAYING || s.frozen) return;
      for (const fruit of s.fruits) {
        if (fruit.sliced) continue;
        const dist = Math.hypot(fruit.x - x, fruit.y - y);
        if (dist < fruit.size * 0.75) {
          sliceFruit(fruit);
        }
      }
    },
    [sliceFruit]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
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

    const onDown = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.isPointerDown = true;
      const pos = getPos(e);
      s.lastPointerPos = pos;
      s.combo = 0;
      checkSliceCollision(pos.x, pos.y);
    };
    const onMove = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      if (!s.isPointerDown) return;
      const pos = getPos(e);
      s.trail.push({ x: pos.x, y: pos.y, opacity: 1, life: 1 });
      if (s.trail.length > 30) s.trail.shift();
      if (s.lastPointerPos) {
        const dx = pos.x - s.lastPointerPos.x;
        const dy = pos.y - s.lastPointerPos.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 8);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          checkSliceCollision(
            s.lastPointerPos.x + dx * t,
            s.lastPointerPos.y + dy * t
          );
        }
      }
      s.lastPointerPos = pos;
    };
    const onUp = (e) => {
      e.preventDefault();
      stateRef.current.isPointerDown = false;
      stateRef.current.lastPointerPos = null;
    };

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

      const w = canvas.width;
      const h = canvas.height;

      ctx.save();

      if (s.screenShake.intensity > 0) {
        s.screenShake.x = (Math.random() - 0.5) * s.screenShake.intensity;
        s.screenShake.y = (Math.random() - 0.5) * s.screenShake.intensity;
        s.screenShake.intensity *= 0.9;
        if (s.screenShake.intensity < 0.5) s.screenShake.intensity = 0;
        ctx.translate(s.screenShake.x, s.screenShake.y);
      }

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (s.frozen) {
        bgGrad.addColorStop(0, "#0a1a2e");
        bgGrad.addColorStop(0.5, "#102040");
        bgGrad.addColorStop(1, "#0a1530");
      } else {
        bgGrad.addColorStop(0, "#0a0a1a");
        bgGrad.addColorStop(0.5, "#121230");
        bgGrad.addColorStop(1, "#1a0a2e");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, w + 40, h + 40);

      if (!stars || s.frameCount % 300 === 0) {
        stars = Array.from({ length: 50 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h * 0.6,
          r: Math.random() * 1.5 + 0.5,
          tw: Math.random() * Math.PI * 2,
        }));
      }
      for (const star of stars) {
        const alpha = 0.3 + 0.3 * Math.sin(s.frameCount * 0.02 + star.tw);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      s.frameCount++;

      if (s.gameState !== GAME_STATES.PLAYING) {
        ctx.restore();
        return;
      }

      if (s.frozen) {
        s.frozenTimer--;
        if (s.frozenTimer <= 0) {
          s.frozen = false;
          syncUI();
        }
      }

      s.difficulty = 1 + s.score * 0.02;

      if (!s.frozen) {
        s.spawnTimer++;
        const interval = Math.max(22, 65 - s.difficulty * 3);
        if (s.spawnTimer >= interval) {
          s.spawnTimer = 0;
          const count =
            Math.random() < 0.15 + s.difficulty * 0.01
              ? Math.min(3, 1 + Math.floor(Math.random() * (1 + s.difficulty * 0.2)))
              : 1;
          for (let i = 0; i < count; i++) {
            s.fruits.push(createFruit(w, h, s.difficulty));
          }
        }
      }

      for (const f of s.fruits) {
        if (s.frozen && !f.isHazard) {
          f.vy += f.gravity * 0.1;
          f.y += f.vy * 0.1;
          f.rotation += f.rotationSpeed * 0.1;
        } else {
          f.x += f.vx;
          f.vy += f.gravity;
          f.y += f.vy;
          f.rotation += f.rotationSpeed;
        }
      }

      const missed = s.fruits.filter(
        (f) => !f.sliced && !f.isHazard && !f.isSpecial && f.y > h + 80 && f.vy > 0
      );
      if (missed.length > 0) {
        s.lives -= missed.length;
        if (s.lives <= 0) {
          s.lives = 0;
          endGame();
          ctx.restore();
          return;
        }
        syncUI();
      }

      s.fruits = s.fruits.filter((f) => !f.sliced && f.y < h + 100);

      for (const f of s.fruits) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate((f.rotation * Math.PI) / 180);

        if (f.isHazard) {
          const pulse = 0.6 + 0.4 * Math.sin(s.frameCount * 0.1 + f.glowPhase);
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 18 * pulse;
          ctx.beginPath();
          ctx.arc(0, 0, f.size * 0.55, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,80,80,${0.3 * pulse})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          const xSize = f.size * 0.35;
          ctx.strokeStyle = `rgba(255,0,0,${0.25 * pulse})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-xSize, -xSize);
          ctx.lineTo(xSize, xSize);
          ctx.moveTo(xSize, -xSize);
          ctx.lineTo(-xSize, xSize);
          ctx.stroke();
        } else if (f.isSpecial) {
          const pulse = 0.5 + 0.5 * Math.sin(s.frameCount * 0.15 + f.glowPhase);
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 25 * pulse;
        } else {
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 10;
        }

        if (s.frozen && !f.isHazard) {
          ctx.globalAlpha = 0.7;
        }

        ctx.font = `${f.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      s.halves = s.halves.filter((item) => {
        item.x += item.vx;
        item.vy += item.gravity;
        item.y += item.vy;
        item.rotation += item.rotationSpeed;
        item.opacity -= 0.018;
        return item.opacity > 0 && item.y < h + 100;
      });
      for (const half of s.halves) {
        ctx.save();
        ctx.globalAlpha = half.opacity;
        ctx.translate(half.x, half.y);
        ctx.rotate((half.rotation * Math.PI) / 180);
        ctx.beginPath();
        if (half.clipSide === "left") {
          ctx.rect(-half.size, -half.size, half.size, half.size * 2);
        } else {
          ctx.rect(0, -half.size, half.size, half.size * 2);
        }
        ctx.clip();
        ctx.font = `${half.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(half.emoji, 0, 0);
        ctx.restore();
      }

      s.particles = s.particles.filter((p) => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.life -= 0.025;
        p.opacity = p.life;
        return p.life > 0;
      });
      for (const p of s.particles) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      s.trail = s.trail.filter((t) => {
        t.life -= 0.055;
        t.opacity = t.life;
        return t.life > 0;
      });
      if (s.trail.length > 1) {
        const tier = getComboTier(s.combo);
        for (let i = 1; i < s.trail.length; i++) {
          const prev = s.trail[i - 1];
          const curr = s.trail[i];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(255,255,255,${curr.opacity * 0.9})`;
          ctx.lineWidth = 3 * curr.opacity + 1;
          ctx.lineCap = "round";
          ctx.stroke();
          const glowAlpha = Math.floor(curr.opacity * 128)
            .toString(16)
            .padStart(2, "0");
          ctx.strokeStyle =
            s.combo >= 3 ? `${tier.color}${glowAlpha}` : `rgba(100,200,255,${curr.opacity * 0.5})`;
          ctx.lineWidth = (s.combo >= 8 ? 14 : s.combo >= 3 ? 10 : 8) * curr.opacity;
          ctx.stroke();
        }
      }

      const allTexts = [...s.comboTexts, ...s.warningTexts];
      for (const ct of allTexts) {
        ct.y += ct.vy;
        ct.life -= 0.016;
        ct.opacity = ct.life;
      }
      s.comboTexts = s.comboTexts.filter((t) => t.life > 0);
      s.warningTexts = s.warningTexts.filter((t) => t.life > 0);

      for (const ct of allTexts) {
        if (ct.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = ct.opacity;
        const fontSize = Math.round(22 * (ct.scale || 1));
        ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = ct.color || "#ffd32a";
        ctx.shadowColor = ct.color || "#f39c12";
        ctx.shadowBlur = 12;
        ctx.fillText(ct.text, ct.x, ct.y);
        ctx.restore();
      }

      if (s.screenFlash && s.screenFlash.life > 0) {
        ctx.save();
        ctx.globalAlpha = s.screenFlash.life * 0.6;
        ctx.fillStyle = s.screenFlash.color;
        ctx.fillRect(-20, -20, w + 40, h + 40);
        ctx.restore();
        s.screenFlash.life -= 0.04;
      }

      if (s.frozen) {
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.05 * Math.sin(s.frameCount * 0.05);
        ctx.fillStyle = "#74b9ff";
        ctx.fillRect(-20, -20, w + 40, h + 40);
        const barW = w * 0.4;
        const barH = 6;
        const barX = (w - barW) / 2;
        const barY = h * 0.12;
        const progress = s.frozenTimer / 120;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#74b9ff";
        ctx.fillRect(barX, barY, barW * progress, barH);
        ctx.restore();
      }

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [checkSliceCollision, endGame, syncUI]);

  const renderLives = () =>
    Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        style={{
          fontSize: "22px",
          opacity: i < uiState.lives ? 1 : 0.15,
          filter: i < uiState.lives ? "none" : "grayscale(1)",
          transition: "all 0.3s",
        }}
      >
        ❤️
      </span>
    ));

  const tier = uiState.comboTier;

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', 'Noto Sans KR', sans-serif",
        userSelect: "none",
        touchAction: "none",
        cursor: uiState.frozen ? "not-allowed" : "crosshair",
        background: "#0a0a1a",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      />

      {uiState.gameState === GAME_STATES.PLAYING && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: "3px" }}>{renderLives()}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div
              style={{
                fontSize: "38px",
                fontWeight: "800",
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              {uiState.score}
            </div>
            {uiState.combo >= 3 && (
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: tier.color,
                  textShadow: `0 0 10px ${tier.color}`,
                  animation: uiState.combo >= 12 ? "megaPulse 0.3s ease infinite alternate" : "pulse 0.5s ease infinite alternate",
                  letterSpacing: "1px",
                  whiteSpace: "nowrap",
                }}
              >
                {tier.label} {uiState.combo}x (\u00d7{tier.mult})
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", minWidth: "60px" }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
              배율
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: tier.color, textShadow: `0 0 8px ${tier.color}`, lineHeight: 1 }}>
              \u00d7{tier.mult}
            </div>
          </div>
        </div>
      )}

      {uiState.gameState === GAME_STATES.PLAYING && uiState.frozen && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(28px, 6vw, 48px)",
            fontWeight: "900",
            color: "#74b9ff",
            textShadow: "0 0 30px rgba(116,185,255,0.8)",
            pointerEvents: "none",
            zIndex: 15,
            animation: "pulse 0.8s ease infinite alternate",
            letterSpacing: "4px",
          }}
        >
          🧊 FROZEN 🧊
        </div>
      )}

      {uiState.gameState === GAME_STATES.MENU && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            background: "radial-gradient(ellipse at center, rgba(26,10,46,0.85), rgba(10,10,26,0.95))",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "clamp(48px, 10vw, 80px)", marginBottom: "8px", animation: "float 2s ease-in-out infinite" }}>
            🍉
          </div>
          <h1
            style={{
              fontSize: "clamp(32px, 7vw, 56px)",
              fontWeight: "900",
              color: "#fff",
              textShadow: "0 0 30px rgba(231,76,60,0.5), 0 4px 20px rgba(0,0,0,0.5)",
              margin: "0 0 12px",
              letterSpacing: "-2px",
            }}
          >
            FRUIT SLASH
          </h1>
          <p style={{ fontSize: "clamp(13px, 2.8vw, 17px)", color: "rgba(255,255,255,0.55)", marginBottom: "16px", textAlign: "center", lineHeight: 1.6 }}>
            스와이프로 과일을 자르세요!
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px", maxWidth: "420px" }}>
            {HAZARDS.map((hz) => (
              <div
                key={hz.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255,255,255,0.06)",
                  padding: "5px 10px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontSize: "16px" }}>{hz.emoji}</span>
                <span>{hz.label}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255,215,0,0.08)",
                padding: "5px 10px",
                borderRadius: "16px",
                fontSize: "12px",
                color: "#ffd700",
                border: "1px solid rgba(255,215,0,0.15)",
              }}
            >
              <span style={{ fontSize: "16px" }}>⭐</span>
              <span>보너스! +10점!</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "28px" }}>
            {COMBO_TIERS.filter((t) => t.mult > 1)
              .slice(0, 5)
              .map((t) => (
                <div
                  key={t.min}
                  style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    borderRadius: "10px",
                    background: `${t.color}22`,
                    color: t.color,
                    border: `1px solid ${t.color}44`,
                    fontWeight: "700",
                  }}
                >
                  {t.min}+ \u2192 \u00d7{t.mult}
                </div>
              ))}
          </div>

          <button
            onClick={startGame}
            style={{
              padding: "16px 52px",
              fontSize: "20px",
              fontWeight: "700",
              color: "#fff",
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 4px 25px rgba(231,76,60,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              transition: "transform 0.2s, box-shadow 0.2s",
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            게임 시작 🔪
          </button>
          {uiState.bestScore > 0 && (
            <p style={{ marginTop: "16px", fontSize: "15px", color: "rgba(255,255,255,0.4)" }}>
              최고 점수: {uiState.bestScore}
            </p>
          )}
        </div>
      )}

      {uiState.gameState === GAME_STATES.OVER && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            background: "radial-gradient(ellipse at center, rgba(46,10,10,0.9), rgba(10,10,26,0.95))",
            animation: "fadeIn 0.5s ease",
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>💥</div>
          <h2
            style={{
              fontSize: "clamp(28px, 6vw, 44px)",
              fontWeight: "900",
              color: "#e74c3c",
              textShadow: "0 0 20px rgba(231,76,60,0.4)",
              margin: "0 0 24px",
            }}
          >
            GAME OVER
          </h2>
          <div style={{ display: "flex", gap: "28px", marginBottom: "32px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "점수", value: uiState.score, color: "#fff" },
              { label: "최대 콤보", value: `${uiState.combo}x`, color: "#ffd32a" },
              { label: "최고 점수", value: uiState.bestScore, color: "#27ae60" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "38px", fontWeight: "800", color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
          <button
            onClick={startGame}
            style={{
              padding: "16px 52px",
              fontSize: "20px",
              fontWeight: "700",
              color: "#fff",
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 4px 25px rgba(231,76,60,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              transition: "transform 0.2s",
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            다시 하기 🔄
          </button>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        @keyframes megaPulse {
          from { transform: scale(1); text-shadow: 0 0 10px currentColor; }
          to { transform: scale(1.2); text-shadow: 0 0 25px currentColor; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
