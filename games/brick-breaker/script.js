const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const restartBtn = document.getElementById('restart');

let paddle, ball, bricks, score, level, over = false, win = false;
const keys = {};
const MAX_LEVEL = 5;

function makeBricks() {
  bricks = [];
  const rows = 4 + level;
  const cols = 8;
  const bw = 68;
  const bh = 22;
  const gap = 8;
  const ox = 18;
  const oy = 45;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: ox + c * (bw + gap),
        y: oy + r * (bh + gap),
        w: bw,
        h: bh,
        color: ['#ef8354','#f6bd60','#84a59d','#4f8f32','#6d597a','#457b9d'][r % 6]
      });
    }
  }
}

function resetBallAndPaddle() {
  paddle = {
    x: 260,
    y: 430,
    w: 120,
    h: 14,
    speed: 7
  };

  ball = {
    x: 320,
    y: 300,
    vx: 3 * (Math.random() > 0.5 ? 1 : -1),
    vy: -4 - Math.min(level, 4) * 0.25,
    r: 8
  };
}

function reset() {
  score = 0;
  level = 1;
  over = false;
  win = false;
  resetBallAndPaddle();
  makeBricks();
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function nextLevel() {
  if (level >= MAX_LEVEL) {
    win = true;
    return;
  }

  level++;
  levelEl.textContent = level;
  resetBallAndPaddle();
  makeBricks();
}

function update() {
  if (over || win) return;

  if (keys.ArrowLeft || keys.a) paddle.x -= paddle.speed;
  if (keys.ArrowRight || keys.d) paddle.x += paddle.speed;

  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < ball.r) {
    ball.x = ball.r;
    ball.vx *= -1;
  }

  if (ball.x > canvas.width - ball.r) {
    ball.x = canvas.width - ball.r;
    ball.vx *= -1;
  }

  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.vy *= -1;
  }

  if (ball.y > canvas.height + 20) {
    over = true;
  }

  if (
    ball.y + ball.r > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.vy > 0
  ) {
    const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.vx = hit * 5.2;
    ball.vy = -Math.abs(ball.vy);
    ball.y = paddle.y - ball.r;
  }

  for (const b of bricks) {
    if (
      !b.dead &&
      ball.x + ball.r > b.x &&
      ball.x - ball.r < b.x + b.w &&
      ball.y + ball.r > b.y &&
      ball.y - ball.r < b.y + b.h
    ) {
      b.dead = true;
      score += 10;
      scoreEl.textContent = score;
      ball.vy *= -1;
      break;
    }
  }

  bricks = bricks.filter(b => !b.dead);

  if (bricks.length === 0) {
    nextLevel();
  }
}

function draw() {
  ctx.fillStyle = '#e0f1ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#c7e5ff';
  ctx.fillRect(0, 0, canvas.width, 40);

  bricks.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(b.x + 3, b.y + 3, b.w - 6, 5);
  });

  ctx.fillStyle = '#2f2a24';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, 14);

  ctx.fillStyle = '#fff';
  ctx.fillRect(paddle.x + 4, paddle.y + 3, paddle.w - 8, 3);

  ctx.fillStyle = '#d96c06';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  if (over) {
    ctx.fillStyle = 'rgba(255,249,232,.94)';
    ctx.fillRect(185, 180, 270, 110);
    ctx.strokeStyle = '#2f2a24';
    ctx.lineWidth = 4;
    ctx.strokeRect(185, 180, 270, 110);
    ctx.fillStyle = '#2c2a26';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('TRY AGAIN', 320, 220);
    ctx.font = '16px monospace';
    ctx.fillText('Press Restart', 320, 248);
  }

  if (win) {
    ctx.fillStyle = 'rgba(255,249,232,.96)';
    ctx.fillRect(160, 170, 320, 130);
    ctx.strokeStyle = '#2f2a24';
    ctx.lineWidth = 4;
    ctx.strokeRect(160, 170, 320, 130);
    ctx.fillStyle = '#2c2a26';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('YOU WIN!', 320, 212);
    ctx.font = '16px monospace';
    ctx.fillText(`Final Score: ${score}`, 320, 240);
    ctx.fillText('Cleared all 5 levels', 320, 264);
    ctx.fillText('Press Restart to play again', 320, 288);
  }

  ctx.textAlign = 'left';
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  paddle.x = ((e.clientX - r.left) / r.width) * canvas.width - paddle.w / 2;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
});

restartBtn.onclick = reset;

reset();
loop();