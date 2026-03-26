const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const tileSize = 30;

// --- Player ---
let player = {
  x: canvas.width/2 - tileSize/2,
  y: canvas.height - 80,
  size: tileSize,
  color: "#00ffff"
};

// --- Game objects ---
let obstacles = [];
let bubbles = [];
let particles = [];
let score = 0;
let speed = 2;
let spawnRate = 0.03;
let intensityLevel = 0;

let inkActive = false;
let gameOver = false;
let gameStarted = false;

// --- Audio ---
const audioCurrent = new Audio('audio/current.mp3');
audioCurrent.loop = true;
audioCurrent.volume = 0.3;

const audioFail = new Audio('audio/fail.mp3');
audioFail.volume = 0.6;

const audioInk = new Audio('audio/ink.mp3');
audioInk.volume = 0.4;

const audioBubble = new Audio('audio/bubble.mp3');
audioBubble.volume = 0.2;

// --- Particles ---
for(let i=0;i<40;i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    size: Math.random()*2+1,
    speed: Math.random()*0.5+0.2
  });
}

// --- Flavor text ---
function getFlavorText(score){
  if(score < 20) return "The sea is calm...";
  if(score < 50) return "Currents pick up...";
  if(score < 100) return "Predators lurking...";
  if(score < 200) return "Darkness deepens...";
  return "Survive the depths!";
}

// ===== INPUT =====
let keys = {};

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if(e.key === " ") handleAction();
});
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  player.x = touch.clientX - rect.left - player.size/2;
  player.y = touch.clientY - rect.top - player.size/2;
});

canvas.addEventListener("touchstart", () => handleAction());

function handleAction(){
  if(!gameStarted){
    gameStarted = true;
    audioCurrent.play().catch(()=>{});
  } else if(!inkActive && !gameOver){
    inkActive = true;
    audioInk.currentTime = 0;
    audioInk.play();
    setTimeout(()=>inkActive=false, 2000);
  }
}

// --- Obstacles ---
function spawnObstacle(){
  const width = 30 + Math.random()*20;
  const x = Math.random()*(canvas.width - width);
  const type = Math.random()<0.2?"#ff5555":"#888888";

  obstacles.push({
    x: x,
    y: -30,
    width: width,
    height: 20,
    color: type,
    drift: (Math.random()-0.5) * intensityLevel * 0.5 // horizontal movement
  });
}

// --- Bubbles ---
function addBubble(){
  const bubble = {
    x: player.x + player.size/2 + (Math.random()*10-5),
    y: player.y + player.size,
    radius: 2 + Math.random()*3,
    alpha: 1
  };
  bubbles.push(bubble);

  audioBubble.currentTime = 0;
  audioBubble.play();
}

// --- Update ---
function update(){
  if(!gameStarted || gameOver) return;

  // Increase difficulty every 100 score
  let newLevel = Math.floor(score / 100);
  if(newLevel > intensityLevel){
    intensityLevel = newLevel;
    speed += 1;
    spawnRate += 0.01;
  }

  // Particles
  particles.forEach(p=>{
    p.y -= p.speed;
    if(p.y < 0) p.y = canvas.height;
  });

  // Keyboard movement
  if(keys["ArrowLeft"]) player.x -= 4;
  if(keys["ArrowRight"]) player.x +=4;
  if(keys["ArrowUp"]) player.y -=4;
  if(keys["ArrowDown"]) player.y +=4;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  addBubble();

  bubbles.forEach(b=>{
    b.y -= 1;
    b.alpha -= 0.02;
  });
  bubbles = bubbles.filter(b=>b.alpha>0);

  if(Math.random()<spawnRate) spawnObstacle();

  obstacles.forEach(o=>{
    o.y += speed;
    o.x += o.drift; // horizontal movement

    // keep inside screen
    if(o.x < 0 || o.x + o.width > canvas.width){
      o.drift *= -1;
    }

    if(o.x < player.x + player.size && o.x + o.width > player.x &&
       o.y < player.y + player.size && o.y + o.height > player.y){

      gameOver = true;
      audioCurrent.pause();
      audioFail.currentTime = 0;
      audioFail.play();

      setTimeout(()=>{
        alert("Game Over! Score: " + Math.floor(score));

        score = 0;
        speed = 2;
        spawnRate = 0.03;
        intensityLevel = 0;

        obstacles = [];
        bubbles = [];
        player.x = canvas.width/2 - tileSize/2;
        player.y = canvas.height - 80;

        gameStarted = false;
        gameOver = false;
      },200);
    }
  });

  obstacles = obstacles.filter(o=>o.y < canvas.height+50);

  score += 0.1;
}

// --- Draw ---
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
  gradient.addColorStop(0,"#005f8f");
  gradient.addColorStop(1,"#001a26");
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
  });

  if(!gameStarted){
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Tap or Press SPACE to Start", canvas.width/2, canvas.height/2);
    return;
  }

  bubbles.forEach(b=>{
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = "#88ccff";
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x,player.y,player.size,player.size);

  obstacles.forEach(o=>{
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x,o.y,o.width,o.height);
  });

  if(inkActive){
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: "+Math.floor(score),10,25);

  ctx.font = "16px Arial";
  ctx.fillText(getFlavorText(score),10,50);
}

// --- Loop ---
function gameLoop(){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();