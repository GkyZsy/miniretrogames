const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restart');

let best = +localStorage.getItem('flappy-birb-best') || 0;
bestEl.textContent = best;

const state = {
  bird: null,
  pipes: [],
  score: 0,
  started: false,
  over: false,
  spawn: 0,
  bgOffset: 0
};

function reset() {
  state.bird = { x: 110, y: 280, vy: 0, size: 18 };
  state.pipes = [];
  state.score = 0;
  state.started = false;
  state.over = false;
  state.spawn = 0;
  state.bgOffset = 0;
  scoreEl.textContent = 0;
}

function flap() {
  if (state.over) reset();
  state.started = true;
  state.bird.vy = -6.8;
}

function pipePair() {
  const gap = 150;
  const top = Math.random() * 250 + 80;
  state.pipes.push({ x: canvas.width + 40, top, gap, passed: false });
}

function drawPixelBird(b) {
  const angle = Math.max(-0.45, Math.min(1.05, b.vy * 0.08));

  ctx.save();
  ctx.translate(b.x + b.size / 2, b.y + b.size / 2);
  ctx.rotate(angle);
  ctx.translate(-b.size / 2, -b.size / 2);

  ctx.fillStyle = '#f2c230';
  ctx.fillRect(0, 0, b.size, b.size);

  ctx.fillStyle = '#fff';
  ctx.fillRect(10, 4, 6, 6);

  ctx.fillStyle = '#000';
  ctx.fillRect(13, 6, 2, 2);

  ctx.fillStyle = '#e36b2c';
  ctx.fillRect(16, 8, 8, 4);

  ctx.fillStyle = '#8c5a12';
  ctx.fillRect(-2, 5, 4, 8);

  const wingY = b.vy < 0 ? 8 : 10;
  ctx.fillStyle = '#d9a91e';
  ctx.fillRect(5, wingY, 8, 5);

  ctx.restore();
}

function cloud(x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(x, y, s * 2, s);
  ctx.fillRect(x + s * 0.5, y - s * 0.5, s * 2, s);
  ctx.fillRect(x + s, y, s * 2, s);
}

function hill(x, baseY, w, h, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + w * 0.5, baseY - h, x + w, baseY);
  ctx.lineTo(x + w, canvas.height);
  ctx.lineTo(x, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawRepeatingCloud(offset, y, size, speed, phase = 0) {
  const spacing = 220;
  const shift = ((offset * speed + phase) % spacing + spacing) % spacing;

  for (let i = -1; i < 5; i++) {
    const x = i * spacing - shift;
    cloud(x, y, size);
  }
}

function drawRepeatingHill(offset, baseY, width, height, color, speed, phase = 0) {
  const spacing = width - 30;
  const shift = ((offset * speed + phase) % spacing + spacing) % spacing;

  for (let i = -1; i < 4; i++) {
    const x = i * spacing - shift;
    hill(x, baseY, width, height, color);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // sky
  ctx.fillStyle = '#9dd6ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // clouds
  drawRepeatingCloud(state.bgOffset, 90, 18, 0.20, 0);
  drawRepeatingCloud(state.bgOffset, 145, 16, 0.14, 70);
  drawRepeatingCloud(state.bgOffset, 70, 14, 0.26, 140);

  // ground strip
  ctx.fillStyle = '#8fcaf4';
  ctx.fillRect(0, 590, canvas.width, 20);

  // hills - tabanı yere oturuyor
  const hillBaseY = 610;
  drawRepeatingHill(state.bgOffset, hillBaseY, 260, 62, '#82c95e', 0.35, 0);
  drawRepeatingHill(state.bgOffset, hillBaseY, 300, 86, '#74b952', 0.55, 110);
  drawRepeatingHill(state.bgOffset, hillBaseY, 240, 70, '#8fd266', 0.75, 210);

  // ground
  ctx.fillStyle = '#d6c27b';
  ctx.fillRect(0, 610, canvas.width, 30);

  // pipes
  for (const p of state.pipes) {
    ctx.fillStyle = '#4f8f32';
    ctx.fillRect(p.x, 0, 44, p.top);
    ctx.fillRect(p.x, p.top + p.gap, 44, canvas.height - (p.top + p.gap));

    ctx.fillStyle = '#78b84d';
    ctx.fillRect(p.x - 4, p.top - 16, 52, 16);
    ctx.fillRect(p.x - 4, p.top + p.gap, 52, 16);
  }

  drawPixelBird(state.bird);

  if (!state.started && !state.over) {
    ctx.fillStyle = 'rgba(44,42,38,.9)';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO START', canvas.width / 2, 310);
  }

  if (state.over) {
    ctx.fillStyle = 'rgba(255,249,232,.92)';
    ctx.fillRect(100, 220, 280, 120);
    ctx.strokeStyle = '#2f2a24';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 220, 280, 120);
    ctx.fillStyle = '#2c2a26';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 240, 265);
    ctx.font = '16px monospace';
    ctx.fillText('Press Space or Restart', 240, 300);
  }
}

function update() {
  if (state.over) return;

  if (state.started) {
    state.bgOffset += 1.5;
    state.bird.vy += 0.34;
    state.bird.y += state.bird.vy;

    state.spawn++;
    if (state.spawn > 95) {
      pipePair();
      state.spawn = 0;
    }

    for (const p of state.pipes) {
      p.x -= 2.7;

      if (!p.passed && p.x + 44 < state.bird.x) {
        p.passed = true;
        state.score++;
        scoreEl.textContent = state.score;

        if (state.score > best) {
          best = state.score;
          localStorage.setItem('flappy-birb-best', best);
          bestEl.textContent = best;
        }
      }

      const hitX = state.bird.x + state.bird.size > p.x && state.bird.x < p.x + 44;
      const hitY = state.bird.y < p.top || state.bird.y + state.bird.size > p.top + p.gap;

      if (hitX && hitY) state.over = true;
    }

    state.pipes = state.pipes.filter(p => p.x > -60);

    if (state.bird.y < 0 || state.bird.y + state.bird.size > 610) {
      state.over = true;
    }
  } else {
    state.bgOffset += 0.4;
    state.bird.y += Math.sin(Date.now() / 150) * 0.35;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  if ([' ', 'w', 'ArrowUp'].includes(e.key)) {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener('pointerdown', flap);
restartBtn.onclick = reset;

reset();
loop();