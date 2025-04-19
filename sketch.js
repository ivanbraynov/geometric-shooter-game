// -------- Global Variables --------
let gameState = 'START_MENU'; // START_MENU, PLAYING, GAME_OVER
let player;
let projectiles = []; 
let enemyProjectiles = []; 
let enemies = []; 
let stars =[]; 
let particleSystems =[]; 
let powerUps = []; 

let score = 0;
let lives = 3;
let wave = 0; // To control enemy spawning difficulty


// Effects
let shakeDuration = 0;
let shakeAmplitude = 0;
let maxShakeDuration = 20; // frames
let maxShakeAmplitude = 5; // pixels

// Timing
let lastSpawnTime = 0;
let spawnInterval = 2000; // milliseconds (for enemies)
let lastPowerUpSpawnTime = 0;
let powerUpSpawnInterval = 15000; // milliseconds (e.g., every 15 seconds)


// -------- Setup --------
function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  ellipseMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(18);
  textFont('monospace'); // Consistent look

  // Initialize Player
  player = new Player(width / 2, height - 50);

  // Initialize Starfield
  stars = []; // Ensure stars array is empty before setup
  for (let i = 0; i < 200; i++) {
    stars.push(new Star());
  }

  // Initialize UI Elements (from ui.js)
  initializeUI();

  // Fetch initial leaderboard data (from leaderboard.js)
  displayLeaderboard();
}

// -------- Main Draw Loop --------
function draw() {
  // Apply Screen Shake
  let shakeX = 0;
  let shakeY = 0;
  if (shakeDuration > 0) {
    shakeX = random(-shakeAmplitude, shakeAmplitude);
    shakeY = random(-shakeAmplitude, shakeAmplitude);
    shakeDuration--;
    shakeAmplitude *= 0.95; // Dampen the shake
  }

  push(); // Isolate shake translation
  translate(shakeX, shakeY);

  // Background
  background(10, 10, 30); // Dark blue space

  // Draw Stars
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].update();
    stars[i].display();
  }

  // Game State Logic
  switch (gameState) {
    case 'START_MENU':
      drawStartMenu();
      break;
    case 'PLAYING':
      runGame();
      break;
    case 'GAME_OVER':
      drawGameOver();
      break;
  }

  // Update and Draw Particle Systems (Explosions)
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    particleSystems[i].run();
    if (particleSystems[i].isDead()) {
      particleSystems.splice(i, 1);
    }
  }

  pop(); // End shake translation isolation

  // Draw UI (outside shake)
  drawHUD();
}

// -------- Game State Functions --------
function runGame() {
  // Player Logic
  player.handleInput();
  player.update();
  player.display();
  player.keepInBounds();

  // Projectile Logic (Player)
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update();
    projectiles[i].display();
    if (projectiles[i].isOffscreen()) {
      projectiles.splice(i, 1);
    }
  }

  // Projectile Logic (Enemy)
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    enemyProjectiles[i].update();
    enemyProjectiles[i].display();
    if (enemyProjectiles[i].isOffscreen()) {
      enemyProjectiles.splice(i, 1);
    }
  }

  // Enemy Logic
  spawnEnemies();
  for (let i = enemies.length - 1; i >= 0; i--) {
    let wantsToShoot = enemies[i].update(); // Update returns true if ready to shoot
    enemies[i].display();

    // If enemy wants to shoot, call shoot method with player reference
    if (wantsToShoot) {
        enemies[i].shoot(player);
    }

    if (enemies[i].isOffscreen()) {
      enemies.splice(i, 1);
    }
  }

  // Power-up Logic
  spawnPowerUps();
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update();
    powerUps[i].display();
    if (powerUps[i].isOffscreen()) {
      powerUps.splice(i, 1);
    }
  }

  // Collision Detection
  checkCollisions();

  // Check Game Over Condition
  if (lives <= 0 && gameState !== 'GAME_OVER') { // Only trigger once
    gameState = 'GAME_OVER';
    showScoreForm(score); // Pass current score to the UI function
  }
}

function drawStartMenu() {
  fill(255);
  textSize(48);
  text('Geometric Shooter', width / 2, height / 3);
  textSize(24);
  text('Use Arrow Keys or WASD to Move', width / 2, height / 2 - 60);
  text('Press SPACE to Shoot', width / 2, height / 2 - 20);
  textSize(32);
  text('Press SPACE to Start', width / 2, height / 2 + 40);

  // Draw Leaderboard on Start Menu
  drawLeaderboardToCanvas(width / 2, height * 0.65);
}

function drawGameOver() {
  fill(255, 0, 0);
  textSize(64);
  text('GAME OVER', width / 2, height / 4); // Position higher
  fill(255);
  textSize(32);
  // Don't show final score here if the form is visible
  if (scoreFormDiv.style('display') === 'none') {
     text(`Final Score: ${score}`, width / 2, height / 3 + 20);
     textSize(24);
     text('Press SPACE to Restart', width / 2, height * 0.9); // Position lower
  }

  // Draw Leaderboard on Game Over screen (if form is hidden)
  if (scoreFormDiv.style('display') === 'none') {
      drawLeaderboardToCanvas(width / 2, height / 2);
  }
}

function drawHUD() {
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 20, 20);

  // Display Power-up Timer if active
  if (player && player.powerUpActive) {
    let remainingSeconds = ceil(player.powerUpTimer / 60);
    fill(255, 255, 0); // Yellow for timer text
    textSize(18);
    textAlign(CENTER, TOP);
    text(`${player.powerUpType.replace('_', ' ').toUpperCase()} ACTIVE: ${remainingSeconds}s`, width / 2, 15);
    fill(255); // Reset fill color
    textSize(20); // Reset text size
  }

  textAlign(RIGHT, TOP);
  // Draw lives as icons (mini player ships)
  let lifeIconSize = 15;
  for (let i = 0; i < lives; i++) {
      let x = width - 30 - i * (lifeIconSize + 10);
      let y = 20 + lifeIconSize / 2;
      push();
      translate(x, y);
      fill(0, 200, 255);
      noStroke();
      triangle(0, -lifeIconSize * 0.6, -lifeIconSize * 0.4, lifeIconSize * 0.4, lifeIconSize * 0.4, lifeIconSize * 0.4); // Body
      fill(255, 150, 0);
      rect(0, lifeIconSize * 0.5, lifeIconSize * 0.3, lifeIconSize * 0.2); // Engine
      pop();
  }
  // text(`Lives: ${lives}`, width - 20, 20); // Alternative text lives
  textAlign(CENTER, CENTER); // Reset alignment
}


// -------- Input Handling --------
function keyPressed() {
  // Player Shooting & State Transitions (using direct key check)
  if (key === ' ' || keyCode === 32) { // Check Space bar directly
      if (gameState === 'PLAYING') {
          player.shoot();
      } else if (gameState === 'GAME_OVER') {
          // Only restart if the score form is NOT visible
          // Otherwise space might be used for username input
          if (scoreFormDiv && scoreFormDiv.style('display') === 'none') {
             resetGame();
             gameState = 'PLAYING';
          }
      } else if (gameState === 'START_MENU') {
          resetGame();
          gameState = 'PLAYING';
      }
  }
}


// -------- Game Reset --------
function resetGame() {
  score = 0;
  lives = 3;
  wave = 0;
  projectiles = []; 
  enemyProjectiles =[]; 
  enemies =[]; 
  particleSystems =[];
  powerUps = [];
  player.reset(width / 2, height - 50);
  lastSpawnTime = millis(); 
  spawnInterval = 2000; 
  lastPowerUpSpawnTime = millis();
  powerUpSpawnInterval = 15000;
}

// -------- Collision Detection --------
function checkCollisions() {
  // Player Projectiles vs Enemies
  for (let i = projectiles.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      // Ensure both projectile and enemy exist before checking collision
      if (projectiles[i] && enemies[j] && projectiles[i].collidesWith(enemies[j])) {
        let enemyKilled = enemies[j].hit();
        projectiles.splice(i, 1); // Remove projectile
        if (enemyKilled) {
          score += enemies[j].scoreValue;
          // Pass triggerShake function as the shakeCallback
          particleSystems.push(new ParticleSystem(enemies[j].pos.x, enemies[j].pos.y, enemies[j].color, triggerShake));
          enemies.splice(j, 1); // Remove enemy
        }
        // Important: break after collision to prevent projectile hitting multiple enemies in one frame
        break;
      }
    }
  }

  // Enemy Projectiles vs Player
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    // Ensure projectile exists before checking collision
    if (enemyProjectiles[i] && player.collidesWith(enemyProjectiles[i])) {
      enemyProjectiles.splice(i, 1);
      player.hit();
      // Important: break after collision to prevent multiple hits in one frame
      break;
    }
  }

  // Enemies vs Player
  for (let i = enemies.length - 1; i >= 0; i--) {
     // Ensure enemy exists before checking collision
    if (enemies[i] && player.collidesWith(enemies[i])) {
      // Pass triggerShake function as the shakeCallback
      particleSystems.push(new ParticleSystem(enemies[i].pos.x, enemies[i].pos.y, enemies[i].color, triggerShake));
      let enemyScoreValue = enemies[i].scoreValue; // Get score before splicing
      enemies.splice(i, 1);
      player.hit(); // Player takes damage
      // Optional: Award points for ramming? Usually not, but could add `score += enemyScoreValue;` here if desired.
      // Important: break after collision to prevent multiple hits in one frame
      break;
    }
  }

  // Player Projectiles vs PowerUps
  for (let i = projectiles.length - 1; i >= 0; i--) {
    // Ensure projectile exists before checking collision
    if (!projectiles[i]) continue; // Skip if projectile was already removed (e.g., hit enemy)

    for (let j = powerUps.length - 1; j >= 0; j--) {
      // Ensure powerUp exists
      if (powerUps[j] && projectiles[i].collidesWith(powerUps[j])) {
        console.log("Player hit power-up!"); // Debug log
        let powerUpType = powerUps[j].type;
        
        // Remove the power-up and the projectile
        powerUps.splice(j, 1);
        projectiles.splice(i, 1);

        // --- ACTIVATE POWER-UP ON PLAYER (Phase 4) ---
        player.activatePowerUp(powerUpType, 10); // Activate for 10 seconds
        // --- End Activate Power-up ---

        // Important: break inner loop after collision to prevent projectile hitting multiple powerups
        break; 
      }
    }
  }
}


// -------- Enemy Spawning --------
function spawnEnemies() {
  let currentTime = millis();
  if (currentTime > lastSpawnTime + spawnInterval) {
    wave++;
    lastSpawnTime = currentTime;

    // Increase difficulty slightly over time
    if (spawnInterval > 500) {
        spawnInterval *= 0.98; // Decrease time between spawns
    }

    let enemiesToSpawn = 1 + floor(wave / 5); // Spawn more enemies in later waves
    for (let i = 0; i < enemiesToSpawn; i++) {
        let x = random(50, width - 50);
        let y = random(-100, -50);
        // Get available types (values from the constant object)
        const availableEnemyTypes = Object.values(ENEMY_TYPES);
        let enemyType = random(availableEnemyTypes); // Select a random type value

        // Introduce enemy types gradually (use constants for checking)
        if (wave < 3 && enemyType !== ENEMY_TYPES.DRONE) enemyType = ENEMY_TYPES.DRONE; // Only Drones early on
        if (wave < 6 && enemyType === ENEMY_TYPES.HEAVY) enemyType = random([ENEMY_TYPES.DRONE, ENEMY_TYPES.SCOUT]); // Drones and Scouts before Heavy

        enemies.push(new Enemy(x, y, enemyType));
    }
  }
}

// -------- Power-Up Spawning --------
function spawnPowerUps() {
  let currentTime = millis();
  if (currentTime > lastPowerUpSpawnTime + powerUpSpawnInterval) {
    lastPowerUpSpawnTime = currentTime;

    // Create a power-up at a random x position near the top
    let x = random(50, width - 50);
    let y = random(-100, -50);
    powerUps.push(new PowerUp(x, y));
    console.log('Power-up spawned!'); // Optional: for debugging
  }
}

// -------- Screen Shake Trigger --------
function triggerShake(duration, amplitude) {
  shakeDuration = max(shakeDuration, duration);
  shakeAmplitude = max(shakeAmplitude, amplitude);
}

// -------- Window Resize Handling --------
// Adjusts the canvas size when the browser window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optional: Recalculate positions if needed (e.g., recenter player)
  // player.pos.set(width / 2, height - 50); // Example: Recenter player
}