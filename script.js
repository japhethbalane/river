let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let audio = document.getElementById('audio');
let audioContext, analyser, source, bufferLength, dataArray;

let particles = [];
let max = 0;
let playerRadius = 10;
let gameOver = false;

let score = localStorage.getItem('score')
if (score == null) {
  score = 0;
} else {
  score = parseInt(score);
}

let mouseX = 0;
let mouseY = canvas.height / 2;
document.addEventListener('mousemove', (event) => {
  if (!gameOver) {
    mouseX = event.pageX;
    mouseY = event.pageY;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code == 'Space') {
    pauseOrPlay();
  }
});

document.addEventListener('click', () => {
  if (gameOver) {
    particles = [];
    // score = 0;
    audio.currentTime = 0;
    gameOver = false;
  }
  if (audioContext) {
    return;
  }
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaElementSource(audio);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  audio.play();
  loop();
});

setInterval(() => {
  if (max > 3 && !audio.paused) {
    particles.push(new Particle(max));
  }
}, 100);

clearCanvas();
context.fillStyle = '#fff';
context.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 200, 400, 400);
context.fillStyle = '#000';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.font = '30px serif';
context.fillText('River-Dodge', canvas.width / 2, canvas.height / 2);
context.font = '15px serif';
context.fillText('( FREE to play )', canvas.width / 2, canvas.height / 2 + 40);
function loop() {
  if (!audio.paused) {
    clearCanvas();
    bufferLength = analyser.frequencyBinCount;

    dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    drawWaveform();

    max = Math.max(...dataArray) - 128;

    for (let particle of particles) {
      particle.update().draw();
    }

    // player
    context.lineWidth = 5;
    context.strokeStyle = '#fff';
    context.beginPath();
    context.arc(mouseX, mouseY, playerRadius + max, Math.PI * 2, false);
    context.stroke();
    context.fillStyle = '#000';
    context.beginPath();
    context.arc(mouseX, mouseY, playerRadius + max, Math.PI * 2, false);
    context.fill();

    dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    drawFrequency();

    // score
    context.fillStyle = '#fff';
    context.textAlign = 'start';
    context.textBaseline = 'bottom';
    context.font = '15px serif';
    context.fillText('Song: River Flows in You', 10, 30);
    context.fillText('Artist: Yiruma', 10, 50);
    context.font = '30px serif';
    context.fillText('Score : ' + score, 10, canvas.height - 10);

    // gameover
    if (gameOver) {
      context.fillStyle = '#fff';
      context.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 200, 400, 400);
      context.fillStyle = '#000';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '30px serif';
      context.fillText('Score : ' + score, canvas.width / 2, canvas.height / 2 - 40);
      context.fillText('Good Game', canvas.width / 2, canvas.height / 2);
      context.font = '15px serif';
      context.fillText('( click here to play again )', canvas.width / 2, canvas.height / 2 + 40);
    }
  }
  window.requestAnimationFrame(loop);
};

function Particle(r) {
  this.x = canvas.width + r;
  this.y = randomBetween(0, canvas.height);
  if (randomBetween(0, 2) == 1) {
    this.y = mouseY;
  }
  this.r = r;
  this.speed = r / 3;
  this.update = function() {
    this.x -= this.speed;
    if (!gameOver) {
      if (this.x < 0 - this.r) {
        let index = particles.indexOf(this);
        particles.splice(index, 1);
        score += this.r;
      }
      if (getHypothenuse(this, {x: mouseX, y: mouseY}) < this.r + playerRadius + max) {
        localStorage.setItem('score', score);
        gameOver = true;
      }
    }
    return this;
  };
  this.draw = function() {
    context.lineWidth = 1;
    context.fillStyle = '#fff';
    context.beginPath();
    context.arc(this.x, this.y, this.r, Math.PI * 2, false);
    context.fill();
  }
}

function clearCanvas() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

function getHypothenuse(p1, p2) {
  let x = Math.abs(p1.x - p2.x);
  let y = Math.abs(p1.y - p2.y);
  return Math.sqrt((x * x) + (y * y));
};

function pauseOrPlay() {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};

function drawWaveform() {
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.beginPath();
  let sliceWidth = canvas.width / bufferLength;
  let x = 0;
  for(let i = 0; i < bufferLength; i++) {
    let v = dataArray[i] / 128;
    let y = v * mouseY;
    if(i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
    x += sliceWidth;
  }
  context.stroke();

  context.beginPath();
  sliceWidth = canvas.width / bufferLength;
  y = 0;
  for(let i = 0; y < canvas.height; i++) {
    let v = dataArray[i] / 128;
    let x = v * mouseX;
    if(i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
    y += sliceWidth;
  }
  context.stroke();
};

function drawFrequency() {
  context.lineWidth = 1;
  context.strokeStyle = '#fff';
  context.beginPath();
  let sliceWidth = canvas.width / bufferLength;
  let x = 0;
  for(let i = bufferLength - 1; i >= 0; i--) {
    let v = dataArray[i] / 255;
    let y = v * canvas.height / 2;

    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, y);
    context.stroke();

    context.beginPath();
    context.moveTo(x, canvas.height);
    context.lineTo(x, canvas.height - y);
    context.stroke();

    x += sliceWidth;
  }
};
