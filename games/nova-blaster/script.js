const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.42;
const FALL_GRAVITY = 0.5;
const JUMP_VELOCITY = -12.8;
const COYOTE_TIME = 8;
const JUMP_BUFFER = 8;

const keys = new Set();
const bestScoreKey = 'nova-blaster-best-score';

const game = {
  running: true,
  stageIndex: 0,
  score: 0,
  bestScore: Number(localStorage.getItem(bestScoreKey) || 0),
  cameraX: 0,
  flash: 0,
  overlayMessage: 'READY',
  overlayTimer: 90,
  win: false,
  gameOver: false,
};

const stageBlueprints = [
  {
    name: 'Sector A: Foundry Run',
    width: 1800,
    start: { x: 120, y: 360 },
    platforms: [
      { x: 0, y: 490, w: 360, h: 50 },
      { x: 430, y: 450, w: 210, h: 90 },
      { x: 740, y: 390, w: 180, h: 26 },
      { x: 980, y: 330, w: 160, h: 24 },
      { x: 1200, y: 410, w: 180, h: 24 },
      { x: 1450, y: 490, w: 350, h: 50 },
      { x: 1510, y: 340, w: 120, h: 24 },
    ],
    hazards: [
      { x: 360, y: 520, w: 70, h: 20 },
      { x: 640, y: 520, w: 100, h: 20 },
      { x: 1140, y: 520, w: 60, h: 20 },
    ],
    enemies: [
      { type: 'walker', x: 540, y: 410, left: 455, right: 590 },
      { type: 'turret', x: 1045, y: 290 },
      { type: 'flyer', x: 1320, y: 220, left: 1180, right: 1450 },
      { type: 'walker', x: 1590, y: 450, left: 1480, right: 1730 },
    ],
    pickups: [
      { type: 'energy', x: 808, y: 350 },
      { type: 'energy', x: 1538, y: 300 },
    ],
    gate: { x: 1700, y: 420, w: 46, h: 70 },
  },
  {
    name: 'Sector B: Sky Relay',
    width: 1950,
    start: { x: 100, y: 360 },
    platforms: [
      { x: 0, y: 490, w: 230, h: 50 },
      { x: 290, y: 430, w: 150, h: 20 },
      { x: 520, y: 360, w: 140, h: 20 },
      { x: 760, y: 300, w: 140, h: 20 },
      { x: 980, y: 380, w: 180, h: 20 },
      { x: 1250, y: 320, w: 160, h: 20 },
      { x: 1500, y: 260, w: 180, h: 20 },
      { x: 1780, y: 490, w: 170, h: 50 },
    ],
    hazards: [
      { x: 230, y: 520, w: 60, h: 20 },
      { x: 440, y: 520, w: 80, h: 20 },
      { x: 660, y: 520, w: 100, h: 20 },
      { x: 900, y: 520, w: 80, h: 20 },
      { x: 1160, y: 520, w: 90, h: 20 },
      { x: 1410, y: 520, w: 90, h: 20 },
      { x: 1680, y: 520, w: 100, h: 20 },
    ],
    enemies: [
      { type: 'flyer', x: 585, y: 230, left: 430, right: 840 },
      { type: 'turret', x: 1060, y: 340 },
      { type: 'flyer', x: 1350, y: 190, left: 1180, right: 1600 },
      { type: 'walker', x: 1840, y: 450, left: 1800, right: 1920 },
    ],
    pickups: [
      { type: 'energy', x: 812, y: 260 },
      { type: 'energy', x: 1545, y: 220 },
    ],
    gate: { x: 1885, y: 420, w: 46, h: 70 },
  },
  {
    name: 'Sector C: Core Chamber',
    width: 1500,
    start: { x: 90, y: 360 },
    platforms: [
      { x: 0, y: 490, w: 380, h: 50 },
      { x: 450, y: 400, w: 170, h: 20 },
      { x: 700, y: 320, w: 170, h: 20 },
      { x: 960, y: 400, w: 170, h: 20 },
      { x: 1210, y: 490, w: 290, h: 50 },
    ],
    hazards: [
      { x: 380, y: 520, w: 70, h: 20 },
      { x: 620, y: 520, w: 80, h: 20 },
      { x: 870, y: 520, w: 90, h: 20 },
      { x: 1130, y: 520, w: 80, h: 20 },
    ],
    enemies: [
      { type: 'boss', x: 1310, y: 395 },
      { type: 'turret', x: 770, y: 280 },
    ],
    pickups: [
      { type: 'energy', x: 530, y: 360 },
      { type: 'energy', x: 1035, y: 360 },
    ],
    gate: { x: 1418, y: 420, w: 50, h: 70, requiresBoss: true },
  },
];

function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    w: 34,
    h: 52,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    hp: 10,
    maxHp: 10,
    shootCooldown: 0,
    dashCooldown: 0,
    dashTimer: 0,
    invuln: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
  };
}

function loadStage(index) {
  const blueprint = JSON.parse(JSON.stringify(stageBlueprints[index]));
  const stage = {
    name: blueprint.name,
    width: blueprint.width,
    start: blueprint.start,
    platforms: blueprint.platforms,
    hazards: blueprint.hazards,
    pickups: blueprint.pickups.map((p) => ({ ...p, collected: false })),
    gate: { ...blueprint.gate },
    bullets: [],
    enemyBullets: [],
    particles: [],
    enemies: blueprint.enemies.map((enemy) => {
      if (enemy.type === 'walker') {
        return { ...enemy, w: 34, h: 40, vx: 1.2, hp: 3, fireCooldown: 0 };
      }
      if (enemy.type === 'turret') {
        return { ...enemy, w: 32, h: 32, hp: 4, fireCooldown: 70 };
      }
      if (enemy.type === 'flyer') {
        return { ...enemy, w: 36, h: 28, hp: 3, dir: 1, baseY: enemy.y, t: 0, fireCooldown: 95 };
      }
      return { ...enemy, w: 88, h: 95, hp: 24, phase: 0, fireCooldown: 60, vx: 1.2, arenaLeft: 1180, arenaRight: 1400 };
    }),
  };
  game.stage = stage;
  game.stageIndex = index;
  game.cameraX = 0;
  game.overlayMessage = blueprint.name;
  game.overlayTimer = 120;
  player = makePlayer(stage.start);
}

let player;
loadStage(0);

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
    e.preventDefault();
  }
  if (key === 'p') game.running = !game.running;
  if ((game.gameOver || game.win) && key === 'r') resetGame();
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function solidCollision(entity, platforms, axis) {
  for (const p of platforms) {
    if (rectsOverlap(entity, p)) {
      if (axis === 'x') {
        if (entity.vx > 0) entity.x = p.x - entity.w;
        if (entity.vx < 0) entity.x = p.x + p.w;
        entity.vx = 0;
      } else {
        if (entity.vy > 0) {
          entity.y = p.y - entity.h;
          entity.vy = 0;
          entity.grounded = true;
        } else if (entity.vy < 0) {
          entity.y = p.y + p.h;
          entity.vy = 0;
        }
      }
    }
  }
}

function emitParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    game.stage.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 28 + Math.random() * 12,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function shootPlayerBullet() {
  if (player.shootCooldown > 0) return;
  player.shootCooldown = 16;
  game.stage.bullets.push({
    x: player.facing > 0 ? player.x + player.w - 2 : player.x - 14,
    y: player.y + 19,
    w: 14,
    h: 8,
    vx: player.facing * 9,
    power: 1,
  });
}

function damagePlayer(amount) {
  if (player.invuln > 0 || game.gameOver || game.win) return;
  player.hp -= amount;
  player.invuln = 60;
  game.flash = 10;
  emitParticles(player.x + player.w / 2, player.y + player.h / 2, 10, '#ff8080');
  if (player.hp <= 0) {
    player.hp = 0;
    game.gameOver = true;
    game.overlayMessage = 'SYSTEM FAILURE';
    game.overlayTimer = 9999;
  }
}

function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  emitParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 8, '#6cd1ff');
  if (enemy.hp <= 0) {
    enemy.dead = true;
    game.score += enemy.type === 'boss' ? 1000 : 150;
    emitParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.type === 'boss' ? 40 : 18, '#fff08a');
  }
}

function advanceStage() {
  if (game.stageIndex >= stageBlueprints.length - 1) {
    game.win = true;
    game.overlayMessage = 'MISSION COMPLETE';
    game.overlayTimer = 9999;
    game.bestScore = Math.max(game.bestScore, game.score);
    localStorage.setItem(bestScoreKey, String(game.bestScore));
    return;
  }
  loadStage(game.stageIndex + 1);
}

function resetGame() {
  game.score = 0;
  game.win = false;
  game.gameOver = false;
  game.running = true;
  loadStage(0);
}

function updatePlayer() {
  if (game.gameOver || game.win) return;

  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const jumpHeld = keys.has('w') || keys.has('arrowup') || keys.has(' ');
  const shoot = keys.has('j') || keys.has('x');
  const dash = keys.has('k') || keys.has('c');

  if (jumpHeld) {
    player.jumpBufferTimer = JUMP_BUFFER;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - 1);
  }

  const speed = player.dashTimer > 0 ? 6.8 : 3.2;

  if (left && !right) {
    player.vx = -speed;
    player.facing = -1;
  } else if (right && !left) {
    player.vx = speed;
    player.facing = 1;
  } else {
    player.vx *= player.grounded ? 0.78 : 0.92;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  if (player.grounded) {
    player.coyoteTimer = COYOTE_TIME;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - 1);
  }

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = JUMP_VELOCITY;
    player.grounded = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
  }

  if (dash && player.dashCooldown <= 0) {
    player.dashTimer = 12;
    player.dashCooldown = 70;
    player.vx = player.facing * 7.4;
  }

  if (shoot) shootPlayerBullet();

  player.shootCooldown = Math.max(0, player.shootCooldown - 1);
  player.dashCooldown = Math.max(0, player.dashCooldown - 1);
  player.dashTimer = Math.max(0, player.dashTimer - 1);
  player.invuln = Math.max(0, player.invuln - 1);

  const currentGravity = player.vy < 0 ? GRAVITY : FALL_GRAVITY;
  player.vy += currentGravity;

  if (!jumpHeld && player.vy < -4.5) {
    player.vy += 0.22;
  }

  if (player.vy > 9.5) {
    player.vy = 9.5;
  }

  player.grounded = false;
  player.x += player.vx;
  solidCollision(player, game.stage.platforms, 'x');
  player.y += player.vy;
  solidCollision(player, game.stage.platforms, 'y');

  if (player.y > HEIGHT + 120) {
    damagePlayer(3);
    player.x = game.stage.start.x;
    player.y = game.stage.start.y;
    player.vx = 0;
    player.vy = 0;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
  }

  for (const hazard of game.stage.hazards) {
    if (rectsOverlap(player, hazard)) {
      damagePlayer(1);
      player.vy = -6.5;
      player.x -= player.facing * 18;
    }
  }

  for (const pickup of game.stage.pickups) {
    if (!pickup.collected && rectsOverlap(player, { x: pickup.x, y: pickup.y, w: 20, h: 20 })) {
      pickup.collected = true;
      player.hp = Math.min(player.maxHp, player.hp + 2);
      game.score += 100;
      emitParticles(pickup.x + 10, pickup.y + 10, 12, '#77e0ff');
    }
  }

  const bossAlive = game.stage.enemies.some((enemy) => enemy.type === 'boss' && !enemy.dead);
  if (rectsOverlap(player, game.stage.gate) && (!game.stage.gate.requiresBoss || !bossAlive)) {
    advanceStage();
  }

  player.x = clamp(player.x, 0, game.stage.width - player.w);
  game.cameraX = clamp(player.x - WIDTH * 0.36, 0, game.stage.width - WIDTH);
}

function updateBullets() {
  for (const bullet of game.stage.bullets) {
    bullet.x += bullet.vx;
    for (const platform of game.stage.platforms) {
      if (rectsOverlap(bullet, platform)) bullet.dead = true;
    }
    for (const enemy of game.stage.enemies) {
      if (!enemy.dead && rectsOverlap(bullet, enemy)) {
        damageEnemy(enemy, bullet.power);
        bullet.dead = true;
      }
    }
    if (bullet.x < -40 || bullet.x > game.stage.width + 40) bullet.dead = true;
  }
  game.stage.bullets = game.stage.bullets.filter((b) => !b.dead);

  for (const bullet of game.stage.enemyBullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    if (rectsOverlap(bullet, player)) {
      damagePlayer(1);
      bullet.dead = true;
    }
    for (const platform of game.stage.platforms) {
      if (rectsOverlap(bullet, platform)) bullet.dead = true;
    }
    if (bullet.x < -50 || bullet.x > game.stage.width + 50 || bullet.y < -50 || bullet.y > HEIGHT + 50) bullet.dead = true;
  }
  game.stage.enemyBullets = game.stage.enemyBullets.filter((b) => !b.dead);
}

function updateEnemies() {
  for (const enemy of game.stage.enemies) {
    if (enemy.dead) continue;

    if (enemy.type === 'walker') {
      enemy.x += enemy.vx;
      if (enemy.x <= enemy.left || enemy.x + enemy.w >= enemy.right) enemy.vx *= -1;
      if (Math.abs(player.x - enemy.x) < 220 && enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 90;
        game.stage.enemyBullets.push({ x: enemy.x + enemy.w / 2, y: enemy.y + 18, w: 10, h: 6, vx: player.x > enemy.x ? 4.5 : -4.5, vy: 0 });
      }
      enemy.fireCooldown -= 1;
    }

    if (enemy.type === 'turret') {
      enemy.fireCooldown -= 1;
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 75;
        const dx = (player.x + player.w / 2) - (enemy.x + enemy.w / 2);
        const dy = (player.y + player.h / 2) - (enemy.y + enemy.h / 2);
        const len = Math.hypot(dx, dy) || 1;
        game.stage.enemyBullets.push({
          x: enemy.x + enemy.w / 2,
          y: enemy.y + enemy.h / 2,
          w: 10,
          h: 10,
          vx: (dx / len) * 4.2,
          vy: (dy / len) * 4.2,
        });
      }
    }

    if (enemy.type === 'flyer') {
      enemy.t += 0.04;
      enemy.x += enemy.dir * 1.7;
      enemy.y = enemy.baseY + Math.sin(enemy.t) * 24;
      if (enemy.x <= enemy.left || enemy.x + enemy.w >= enemy.right) enemy.dir *= -1;
      enemy.fireCooldown -= 1;
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 100;
        game.stage.enemyBullets.push({ x: enemy.x + 8, y: enemy.y + enemy.h, w: 9, h: 9, vx: 0, vy: 4.2 });
      }
    }

    if (enemy.type === 'boss') {
      enemy.fireCooldown -= 1;
      enemy.x += enemy.vx;
      if (enemy.x <= enemy.arenaLeft || enemy.x + enemy.w >= enemy.arenaRight) enemy.vx *= -1;
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 45;
        for (let i = -1; i <= 1; i++) {
          game.stage.enemyBullets.push({
            x: enemy.x + 18,
            y: enemy.y + 50,
            w: 12,
            h: 12,
            vx: -4.8,
            vy: i * 1.4,
          });
        }
      }
      if (Math.random() < 0.02 && enemy.y > 300) {
        enemy.y -= 70;
      } else if (enemy.y < 395) {
        enemy.y += 2.4;
      }
    }

    if (rectsOverlap(player, enemy)) {
      damagePlayer(enemy.type === 'boss' ? 2 : 1);
      player.vy = -5.5;
      player.x += player.x < enemy.x ? -15 : 15;
    }
  }
}

function updateParticles() {
  for (const p of game.stage.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    p.vx *= 0.98;
    p.vy *= 0.98;
  }
  game.stage.particles = game.stage.particles.filter((p) => p.life > 0);
}

function update() {
  if (!game.running) return;
  if (game.overlayTimer > 0) game.overlayTimer -= 1;
  if (game.flash > 0) game.flash -= 1;
  updatePlayer();
  updateBullets();
  updateEnemies();
  updateParticles();
  game.stage.enemies = game.stage.enemies.filter((e) => !e.dead || e.type === 'boss');
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#10284d');
  gradient.addColorStop(0.58, '#0b1730');
  gradient.addColorStop(1, '#060b17');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 18; i++) {
    const x = ((i * 180) - (game.cameraX * 0.25)) % (WIDTH + 220) - 120;
    ctx.fillStyle = 'rgba(100, 170, 255, 0.08)';
    ctx.fillRect(x, 140 + (i % 5) * 18, 80, 260);
  }

  for (let i = 0; i < 60; i++) {
    const x = ((i * 91) - game.cameraX * 0.08) % WIDTH;
    const y = (i * 47) % 260;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(108, 209, 255, 0.35)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawWorldRect(x, y, w, h, fill, stroke) {
  const sx = Math.round(x - game.cameraX);
  ctx.fillStyle = fill;
  ctx.fillRect(sx, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, y, w, h);
  }
}

function drawStage() {
  for (const platform of game.stage.platforms) {
    drawWorldRect(platform.x, platform.y, platform.w, platform.h, '#29476d', '#6fb9ff');
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(platform.x - game.cameraX + 4, platform.y + 4, platform.w - 8, 8);
  }

  for (const hazard of game.stage.hazards) {
    const sx = hazard.x - game.cameraX;
    ctx.fillStyle = '#ff5f70';
    for (let i = 0; i < hazard.w; i += 16) {
      ctx.beginPath();
      ctx.moveTo(sx + i, hazard.y + hazard.h);
      ctx.lineTo(sx + i + 8, hazard.y);
      ctx.lineTo(sx + i + 16, hazard.y + hazard.h);
      ctx.fill();
    }
  }

  for (const pickup of game.stage.pickups) {
    if (pickup.collected) continue;
    const sx = pickup.x - game.cameraX;
    ctx.fillStyle = '#77e0ff';
    ctx.beginPath();
    ctx.arc(sx + 10, pickup.y + 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9f7ff';
    ctx.stroke();
  }

  const gate = game.stage.gate;
  const bossAlive = game.stage.enemies.some((e) => e.type === 'boss' && !e.dead);
  drawWorldRect(gate.x, gate.y, gate.w, gate.h, bossAlive && gate.requiresBoss ? '#44344f' : '#204f86', '#85d1ff');
  ctx.fillStyle = bossAlive && gate.requiresBoss ? '#ff5f70' : '#7df7ff';
  ctx.fillRect(gate.x - game.cameraX + 10, gate.y + 12, gate.w - 20, gate.h - 24);
}

function drawPlayer() {
  if (player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0) return;
  const x = player.x - game.cameraX;
  const bob = !player.grounded ? Math.sin(performance.now() * 0.02) * 1.5 : 0;

  ctx.fillStyle = '#27a4ff';
  ctx.fillRect(x + 6, player.y + bob, 22, 18);
  ctx.fillStyle = '#89d8ff';
  ctx.fillRect(x + 2, player.y + 16 + bob, 30, 24);
  ctx.fillStyle = '#ddf6ff';
  ctx.fillRect(x + 9, player.y + 4 + bob, 10, 8);
  ctx.fillStyle = '#1b5f98';
  ctx.fillRect(x + (player.facing > 0 ? 28 : -4), player.y + 22 + bob, 10, 8);
  ctx.fillStyle = '#5bc5ff';
  ctx.fillRect(x + 4, player.y + 40 + bob, 10, 12);
  ctx.fillRect(x + 20, player.y + 40 + bob, 10, 12);

  if (player.dashTimer > 0) {
    ctx.fillStyle = 'rgba(108,209,255,0.28)';
    ctx.fillRect(x - player.facing * 18, player.y + 10 + bob, 32, 28);
  }
}

function drawEnemies() {
  for (const enemy of game.stage.enemies) {
    if (enemy.dead) continue;
    const x = enemy.x - game.cameraX;
    if (enemy.type === 'walker') {
      ctx.fillStyle = '#f7a24e';
      ctx.fillRect(x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = '#381f10';
      ctx.fillRect(x + 6, enemy.y + 10, 8, 8);
      ctx.fillRect(x + 20, enemy.y + 10, 8, 8);
    } else if (enemy.type === 'turret') {
      ctx.fillStyle = '#a871ff';
      ctx.fillRect(x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = '#e5d4ff';
      ctx.fillRect(x + 10, enemy.y + 10, 12, 12);
    } else if (enemy.type === 'flyer') {
      ctx.fillStyle = '#ffdc62';
      ctx.fillRect(x + 4, enemy.y + 8, enemy.w - 8, enemy.h - 8);
      ctx.fillStyle = '#fff7d1';
      ctx.fillRect(x, enemy.y + 12, enemy.w, 4);
    } else if (enemy.type === 'boss') {
      ctx.fillStyle = '#f84f95';
      ctx.fillRect(x, enemy.y, enemy.w, enemy.h);
      ctx.fillStyle = '#ffd3e7';
      ctx.fillRect(x + 20, enemy.y + 16, 18, 18);
      ctx.fillRect(x + 52, enemy.y + 16, 18, 18);
      ctx.fillStyle = '#7b2149';
      ctx.fillRect(x - 14, enemy.y + 34, 16, 18);
      ctx.fillStyle = '#f2aac8';
      ctx.fillRect(x + 14, enemy.y + 72, 20, 20);
      ctx.fillRect(x + 54, enemy.y + 72, 20, 20);

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(WIDTH - 260, 26, 220, 20);
      ctx.fillStyle = '#f84f95';
      ctx.fillRect(WIDTH - 260, 26, 220 * Math.max(enemy.hp, 0) / 24, 20);
      ctx.strokeStyle = '#ffd3e7';
      ctx.strokeRect(WIDTH - 260, 26, 220, 20);
      ctx.fillStyle = '#e7f3ff';
      ctx.font = '16px Inter, Arial';
      ctx.fillText('CORE TITAN', WIDTH - 260, 20);
    }
  }
}

function drawProjectiles() {
  for (const bullet of game.stage.bullets) {
    drawWorldRect(bullet.x, bullet.y, bullet.w, bullet.h, '#6cd1ff');
  }
  for (const bullet of game.stage.enemyBullets) {
    drawWorldRect(bullet.x, bullet.y, bullet.w, bullet.h, '#ff7b8a');
  }
}

function drawParticles() {
  for (const p of game.stage.particles) {
    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - game.cameraX, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawHud() {
  ctx.fillStyle = 'rgba(7, 13, 24, 0.68)';
  ctx.fillRect(16, 16, 250, 96);
  ctx.strokeStyle = 'rgba(125, 205, 255, 0.35)';
  ctx.strokeRect(16, 16, 250, 96);

  ctx.fillStyle = '#e7f3ff';
  ctx.font = '16px Inter, Arial';
  ctx.fillText(game.stage.name, 28, 40);
  ctx.fillText(`Score: ${game.score}`, 28, 64);
  ctx.fillText(`Best: ${game.bestScore}`, 28, 88);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(300, 22, 180, 18);
  ctx.fillStyle = '#6cd1ff';
  ctx.fillRect(300, 22, 180 * player.hp / player.maxHp, 18);
  ctx.strokeStyle = '#d8f4ff';
  ctx.strokeRect(300, 22, 180, 18);
  ctx.fillStyle = '#e7f3ff';
  ctx.fillText('HP', 486, 37);

  if (!game.running && !game.gameOver && !game.win) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#e7f3ff';
    ctx.font = 'bold 42px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
    ctx.textAlign = 'left';
  }

  if (game.overlayTimer > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, HEIGHT / 2 - 45, WIDTH, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(game.overlayMessage, WIDTH / 2, HEIGHT / 2 + 10);
    ctx.textAlign = 'left';
  }

  if (game.gameOver || game.win) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(game.overlayMessage, WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '20px Inter, Arial';
    ctx.fillText(`Final Score: ${game.score}`, WIDTH / 2, HEIGHT / 2 + 18);
    ctx.fillText('Press R to restart', WIDTH / 2, HEIGHT / 2 + 56);
    ctx.textAlign = 'left';
  }
}

function render() {
  drawBackground();
  drawStage();
  drawProjectiles();
  drawEnemies();
  drawParticles();
  drawPlayer();
  drawHud();

  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${game.flash / 20})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

loop();