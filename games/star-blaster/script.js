const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const keys = {};

let player, bullets, enemies, particles, score, lives, timer, spawnTimer, gameOver, hitFlash;

function reset() {
  player = {
    x: 70,
    y: 220,
    w: 26,
    h: 18,
    speed: 4,
    cooldown: 0,
    invuln: 0
  };

  bullets = [];
  enemies = [];
  particles = [];
  score = 0;
  lives = 3;
  timer = 0;
  spawnTimer = 0;
  gameOver = false;
  hitFlash = 0;

  scoreEl.textContent = score;
  livesEl.textContent = lives;
}

function drawShip(x, y, c1 = '#3557d6', c2 = '#d8e4ff') {
  if (player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0) return;

  ctx.fillStyle = c1;
  ctx.fillRect(x, y + 6, 26, 10);
  ctx.fillRect(x + 6, y, 12, 18);

  ctx.fillStyle = c2;
  ctx.fillRect(x + 18, y + 7, 6, 4);

  ctx.fillStyle = '#f39c12';
  ctx.fillRect(x - 4, y + 8, 4, 3);
}

function drawEnemy(e) {
  ctx.fillStyle = e.type === 0 ? '#b23a48' : '#5c2a9d';
  ctx.fillRect(e.x, e.y, 24, 18);

  ctx.fillStyle = '#f7e26b';
  ctx.fillRect(e.x + 4, e.y + 4, 4, 4);
  ctx.fillRect(e.x + 16, e.y + 4, 4, 4);

  ctx.fillStyle = '#2f2a24';
  ctx.fillRect(e.x + 8, e.y + 10, 8, 3);
}

function drawBg() {
  ctx.fillStyle = '#09162d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 70; i++) {
    const x = (i * 91 + timer * 0.02 * (i % 3 + 1)) % canvas.width;
    const y = (i * 57) % canvas.height;
    ctx.fillStyle = i % 2 ? '#fff' : '#a9d6ff';
    ctx.fillRect(canvas.width - x, y, 2, 2);
  }

  ctx.fillStyle = '#1f325c';
  ctx.fillRect(0, 430, canvas.width, 50);
}

function explode(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      life: 30,
      color
    });
  }
}

function loseLife(x, y) {
  if (player.invuln > 0 || gameOver) return;

  lives--;
  player.invuln = 75;
  hitFlash = 10;
  livesEl.textContent = lives;
  explode(x, y, '#ff6b6b');

  if (lives <= 0) {
    gameOver = true;
  }
}

function update() {
  if (gameOver) return;

  timer++;
  spawnTimer++;

  if (hitFlash > 0) hitFlash--;
  if (player.invuln > 0) player.invuln--;

  if (keys.ArrowUp || keys.w) player.y -= player.speed;
  if (keys.ArrowDown || keys.s) player.y += player.speed;
  if (keys.ArrowLeft || keys.a) player.x -= player.speed;
  if (keys.ArrowRight || keys.d) player.x += player.speed;

  player.x = Math.max(10, Math.min(canvas.width - 50, player.x));
  player.y = Math.max(10, Math.min(400, player.y));

  if (player.cooldown > 0) player.cooldown--;

  if ((keys[' '] || keys.Space) && player.cooldown === 0) {
    bullets.push({
      x: player.x + 28,
      y: player.y + 8,
      w: 10,
      h: 3,
      vx: 7
    });
    player.cooldown = 11;
  }

  const difficultyRamp = Math.min(1.35, 1 + timer / 5000);
  const spawnInterval = Math.max(52, 90 - Math.floor(timer / 400));

  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;

    const type = Math.random() > 0.5 ? 1 : 0;
    const baseSpeed = type === 0 ? 1.15 : 1.45;

    enemies.push({
      x: canvas.width + 10,
      y: 40 + Math.random() * 360,
      w: 24,
      h: 18,
      vx: baseSpeed * difficultyRamp + Math.random() * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      type
    });
  }

  bullets.forEach(b => {
    b.x += b.vx;
  });

  enemies.forEach(e => {
    e.x -= e.vx;
    e.y += e.vy;

    if (e.y < 20 || e.y > 405) {
      e.vy *= -1;
    }
  });

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });

  for (const b of bullets) {
    for (const e of enemies) {
      if (
        !b.dead &&
        !e.dead &&
        b.x < e.x + e.w &&
        b.x + b.w > e.x &&
        b.y < e.y + e.h &&
        b.y + b.h > e.y
      ) {
        b.dead = true;
        e.dead = true;
        score += 10;
        scoreEl.textContent = score;
        explode(e.x + 10, e.y + 8, '#ffd166');
      }
    }
  }

  for (const e of enemies) {
    if (
      e.x < player.x + player.w &&
      e.x + e.w > player.x &&
      e.y < player.y + player.h &&
      e.y + e.h > player.y
    ) {
      e.dead = true;
      loseLife(player.x + 10, player.y + 8);
    }

    if (e.x < -30) {
      e.dead = true;
      loseLife(player.x + 10, player.y + 8);
    }
  }

  bullets = bullets.filter(b => !b.dead && b.x < canvas.width + 20);
  enemies = enemies.filter(e => !e.dead);
  particles = particles.filter(p => p.life > 0);
}

function draw() {
  drawBg();
  drawShip(player.x, player.y);

  bullets.forEach(b => {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  enemies.forEach(drawEnemy);

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255, 120, 120, ${hitFlash / 20})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(255,249,232,.92)';
    ctx.fillRect(180, 180, 280, 110);

    ctx.strokeStyle = '#2f2a24';
    ctx.lineWidth = 4;
    ctx.strokeRect(180, 180, 280, 110);

    ctx.fillStyle = '#2c2a26';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('MISSION FAILED', 320, 220);

    ctx.font = '16px monospace';
    ctx.fillText('Restart to play again', 320, 250);
    ctx.textAlign = 'left';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') e.preventDefault();
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

restartBtn.onclick = reset;

reset();
loop();