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
let score = 0;
let speed = 2;
let inkActive = false;
let gameOver = false;
let gameStarted = false;

// --- Audio ---
const audioCurrent = new Audio('audio/current.mp3'); // ambient water
audioCurrent.loop = true;
audioCurrent.volume = 0.3;

const audioFail = new Audio('audio/fail.mp3'); // fail collision
audioFail.volume = 0.6;

const audioInk = new Audio('audio/ink.mp3'); // ink ability
audioInk.volume = 0.4;

const audioBubble = new Audio('audio/bubble.mp3'); // bubble pop
audioBubble.volume = 0.2;

// --- Flavor text ---
function getFlavorText(score){
  if(score < 20) return "The sea is calm...";
  if(score < 50) return "Currents pick up...";
  if(score < 100) return "Predators lurking...";
  if(score < 200) return "Darkness deepens...";
  return "Survive the depths!";
}

// --- Player movement ---
let keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if(e.key === " ") {
    if(!gameStarted){
      // Start the game on first SPACE
      gameStarted = true;
      audioCurrent.play().catch(err => console.log("User gesture required for audio."));
    } else if(!inkActive){
      // Ink ability only after game started
      inkActive = true;
      audioInk.currentTime = 0;
      audioInk.play();
      setTimeout(()=>inkActive=false, 2000);
    }
  }
});

document.addEventListener("keyup", e => keys[e.key] = false);

// --- Obstacles ---
function spawnObstacle(){
  const width = 30 + Math.random()*20;
  const x = Math.random()*(canvas.width - width);
  const type = Math.random()<0.2?"#ff5555":"#888888"; // jellyfish or rock
  obstacles.push({x: x, y: -30, width: width, height: 20, color: type});
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

// --- Update game ---
function update(){
  if(!gameStarted) return; // freeze until start

  // Player move
  if(keys["ArrowLeft"] && player.x>0) player.x -= 4;
  if(keys["ArrowRight"] && player.x + player.size < canvas.width) player.x +=4;
  if(keys["ArrowUp"] && player.y>0) player.y -=4;
  if(keys["ArrowDown"] && player.y + player.size < canvas.height) player.y +=4;

  // Add bubble
  addBubble();

  // Move bubbles
  bubbles.forEach(b => {
    b.y -= 1;
    b.alpha -= 0.02;
  });
  bubbles = bubbles.filter(b => b.alpha>0);

  // Spawn obstacles
  if(Math.random()<0.03) spawnObstacle();

  // Move obstacles
  obstacles.forEach(o => o.y += speed);

  // Collision check
  obstacles.forEach(o=>{
    if(!gameOver &&
       o.x < player.x + player.size && o.x + o.width > player.x &&
       o.y < player.y + player.size && o.y + o.height > player.y){

      gameOver = true;      // prevent multiple triggers
      audioFail.currentTime = 0;
      audioFail.play();

      setTimeout(() => {
        alert("Game Over! Score: " + Math.floor(score));

        // Reset game
        score = 0;
        obstacles = [];
        speed = 2;
        player.x = canvas.width/2 - tileSize/2;
        player.y = canvas.height - 80;

        gameOver = false;
      }, 100);
    }
  });

  // Remove offscreen obstacles
  obstacles = obstacles.filter(o => o.y < canvas.height + 50);

  // Increase score & speed
  score += 0.1;
  if(score%10<0.1) speed = 2 + score*0.02;
}

// --- Draw ---
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(!gameStarted){
    // Start screen
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press SPACE to Start", canvas.width/2, canvas.height/2);
    ctx.textAlign = "left";
    return;
  }

  // Draw bubbles
  bubbles.forEach(b=>{
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = "#88ccff";
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x,player.y,player.size,player.size);

  // Draw obstacles
  obstacles.forEach(o=>{
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x,o.y,o.width,o.height);
  });

  // Ink overlay
  if(inkActive){
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // Score
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: "+Math.floor(score),10,25);

  // Flavor text
  ctx.font = "16px Arial";
  ctx.fillText(getFlavorText(score),10,50);
}

// --- Game loop ---
function gameLoop(){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();