// -------- Global Variables --------
let gameState = 'START_MENU'; // START_MENU, PLAYING, GAME_OVER
let player;
let projectiles = []; 
let enemyProjectiles = []; 
let enemies = []; 
let stars =[]; 
let particleSystems =[]; 
let powerUps = []; 
let celestialBodies = []; // Array for background planets/suns

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

// --- Mobile Controls State ---
let isAutoShotEnabled = false;
let autoShotButton = { x: 0, y: 0, size: 50, margin: 20 }; // Button properties
// ---------------------------

let sunImage;

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

  // Initialize Celestial Bodies
  celestialBodies = []; // Ensure array is empty
  let numBodies = 4; // Number of background planets/suns
  for (let i = 0; i < numBodies; i++) {
      // Spread them out vertically initially
      let startY = map(i, 0, numBodies, 0, height); 
      celestialBodies.push(new CelestialBody(startY));
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

  // --- Draw Celestial Bodies (Behind Stars) ---
  for (let i = celestialBodies.length - 1; i >= 0; i--) {
    celestialBodies[i].update();
    celestialBodies[i].display();
  }
  // --- End Celestial Bodies ---

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
  player.handleInput(initialTouchPos !== null, touchDelta);
  player.update();
  player.display();
  player.keepInBounds();

  // --- Auto-Shooting --- 
  if (isAutoShotEnabled) {
    player.shoot(); // Attempt to shoot (respects cooldown)
  }
  // ---------------------

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
    const titleSize = 64;
    const headingSize = 28;
    const textSizeLarge = 20;
    const textSizeSmall = 16;
    const sectionSpacing = 80; // Vertical space between sections
    let currentY = height * 0.1;

    // --- 1. Game Title ---
    fill(255);
    textSize(titleSize);
    textAlign(CENTER, TOP);
    text('Geometric Shooter', width / 2, currentY);
    currentY += titleSize + sectionSpacing * 0.8;

    // --- 2. Instructions ---
    textSize(headingSize);
    textAlign(CENTER, TOP);
    text('How to Play', width / 2, currentY);
    currentY += headingSize + 15;

    textSize(textSizeLarge);
    textAlign(CENTER, TOP);
    text('Move: Arrow Keys or WASD', width / 2, currentY);
    currentY += textSizeLarge + 5;
    text('Shoot: SPACE Bar', width / 2, currentY);
    currentY += textSizeLarge + 5;
    text('Start/Restart: SPACE Bar', width / 2, currentY);
    currentY += textSizeLarge + sectionSpacing;

    // --- 3. Item Examples ---
    textSize(headingSize);
    textAlign(CENTER, TOP);
    text('Items', width / 2, currentY);
    currentY += headingSize + 15;

    const itemSize = 20;
    const labelOffsetX = 25;
    const column1X = width * 0.4; // Adjusted column positions slightly
    const column2X = width * 0.6;
    let examplesY = currentY;

    // Enemies Column
    textSize(textSizeSmall);
    textAlign(LEFT, CENTER);
    // Drone
    let bobOffset1 = sin(frameCount * 0.05) * 3; // Calculate bobbing offset
    push(); translate(column1X, examplesY + itemSize / 2 + bobOffset1); scale(itemSize / 25);
    fill(150, 150, 150); stroke(255); strokeWeight(1.5); rect(0, 0, 25, 25, 3);
    fill(75, 75, 75, 180); noStroke(); rect(0, 0, 25 * 0.6, 25 * 0.6, 2);
    pop();
    text("Drone", column1X + labelOffsetX, examplesY + itemSize / 2);
    examplesY += itemSize + 15;
    // Scout
    let bobOffset2 = sin(frameCount * 0.06 + 1) * 3; // Different speed/phase
    push(); translate(column1X, examplesY + itemSize / 2 + bobOffset2); scale(itemSize / 20);
    fill(200, 100, 255); stroke(255); strokeWeight(1.5); triangle(0, -20 / 1.5, -10, 10, 10, 10);
    fill(255, 255, 0); noStroke(); ellipse(0, 2, 6, 6);
    pop();
    text("Scout", column1X + labelOffsetX, examplesY + itemSize / 2);
    examplesY += itemSize + 15;
    // Heavy
    let bobOffset3 = sin(frameCount * 0.04 + 2) * 3; // Different speed/phase
    push(); translate(column1X, examplesY + itemSize / 2 + bobOffset3); scale(itemSize / 40);
    fill(50, 100, 200); stroke(255); strokeWeight(1.5); rect(0, 0, 40, 32, 5);
    fill(35, 70, 140); stroke(200); strokeWeight(1); rect(-12, 16, 8, 16); rect(12, 16, 8, 16);
    pop();
    text("Heavy", column1X + labelOffsetX, examplesY + itemSize / 2);

    // Power-ups Column
    examplesY = currentY; // Reset Y for second column
    textSize(textSizeSmall);
    textAlign(LEFT, CENTER);
    const powerUpBaseSize = 15; // Original size defined in PowerUp class

    // Rapid Fire
    push();
    translate(column2X, examplesY + itemSize / 2);
    // Re-add pulsing calculation
    let pulse1 = sin(frameCount * 0.1 + 0) * 0.15 + 0.85; 
    let currentPuSize1 = powerUpBaseSize * pulse1 * (itemSize / powerUpBaseSize); // Scale based on itemSize
    fill(255, 255, 0); noStroke(); beginShape(); 
    for (let i = 0; i < 5; i++) { let angle = TWO_PI / 5 * i - HALF_PI; let x = cos(angle) * currentPuSize1; let y = sin(angle) * currentPuSize1; vertex(x, y); angle += TWO_PI / 10; x = cos(angle) * currentPuSize1 * 0.5; y = sin(angle) * currentPuSize1 * 0.5; vertex(x, y); } endShape(CLOSE);
    pop();
    text("Rapid Fire", column2X + labelOffsetX, examplesY + itemSize / 2);
    examplesY += itemSize + 15;

    // Extra Life
    push();
    translate(column2X, examplesY + itemSize / 2);
    // Re-add pulsing calculation (different phase)
    let pulse2 = sin(frameCount * 0.1 + PI / 2) * 0.15 + 0.85; 
    let currentPuSize2 = powerUpBaseSize * pulse2 * (itemSize / powerUpBaseSize); // Scale based on itemSize
    fill(0, 255, 0); noStroke(); beginShape(); 
    for (let i = 0; i < 5; i++) { let angle = TWO_PI / 5 * i - HALF_PI; let x = cos(angle) * currentPuSize2; let y = sin(angle) * currentPuSize2; vertex(x, y); angle += TWO_PI / 10; x = cos(angle) * currentPuSize2 * 0.5; y = sin(angle) * currentPuSize2 * 0.5; vertex(x, y); } endShape(CLOSE);
    pop();
    text("Extra Life", column2X + labelOffsetX, examplesY + itemSize / 2);
    examplesY += itemSize + 15;

    // Nuke
    push();
    translate(column2X, examplesY + itemSize / 2);
    // Re-add pulsing calculation (different phase)
    let pulse3 = sin(frameCount * 0.1 + PI) * 0.15 + 0.85;
    let currentPuSize3 = powerUpBaseSize * pulse3 * (itemSize / powerUpBaseSize); // Scale based on itemSize
    fill(255, 0, 0); noStroke(); beginShape(); 
    for (let i = 0; i < 5; i++) { let angle = TWO_PI / 5 * i - HALF_PI; let x = cos(angle) * currentPuSize3; let y = sin(angle) * currentPuSize3; vertex(x, y); angle += TWO_PI / 10; x = cos(angle) * currentPuSize3 * 0.5; y = sin(angle) * currentPuSize3 * 0.5; vertex(x, y); } endShape(CLOSE);
    pop();
    text("Nuke", column2X + labelOffsetX, examplesY + itemSize / 2);

    // Determine end Y based on longest column + spacing
    currentY = examplesY + itemSize + sectionSpacing;

    // --- 4. Leaderboard ---
    // Leaderboard takes care of its own title
    drawLeaderboardToCanvas(width / 2, currentY);

    // --- 5. Start Prompt ---
    textSize(32);
    textAlign(CENTER, CENTER);
    fill(255);
    text('Press SPACE to Start', width / 2, height * 0.95); // Position at very bottom
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

  // --- Draw Auto-Shot Button --- 
  autoShotButton.x = width - autoShotButton.margin - autoShotButton.size / 2;
  autoShotButton.y = height - autoShotButton.margin - autoShotButton.size / 2;
  
  push();
  translate(autoShotButton.x, autoShotButton.y);
  stroke(255); // White outline
  strokeWeight(2);
  if (isAutoShotEnabled) {
    fill(0, 200, 0, 150); // Greenish when active
  } else {
    fill(200, 0, 0, 150); // Reddish when inactive
  }
  ellipse(0, 0, autoShotButton.size, autoShotButton.size);
  
  // Draw text indicator inside button
  noStroke();
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(isAutoShotEnabled ? "AUTO" : "AUTO-FIRE", 0, 0);
  pop();
  // ---------------------------

  textAlign(CENTER, CENTER); // Reset alignment
  textSize(20); // Reset text size just in case
}


// -------- Input Handling --------

// --- Touch State Variables ---
let currentTouchX = null;
let currentTouchY = null;
let initialTouchPos = null; // Store starting position for drag
let touchDelta = { x: 0, y: 0 }; // Store drag difference
let isTouchingLeft = false;
let isTouchingRight = false;
// ---------------------------

function touchStarted(event) { // Add event parameter
  // Check if the touch target is the canvas
  let isCanvas = (event.target && event.target.id === 'defaultCanvas0');

  // Only handle the first touch point
  if (touches.length > 0) {
    let touch = touches[0];
    currentTouchX = touch.x;
    currentTouchY = touch.y;
    initialTouchPos = { x: currentTouchX, y: currentTouchY }; // Record start
    touchDelta = { x: 0, y: 0 }; // Reset delta

    // --- Check for Auto-Shot Button Tap (only if touch is on canvas) ---
    if (isCanvas) {
        let d = dist(currentTouchX, currentTouchY, autoShotButton.x, autoShotButton.y);
        if (d < autoShotButton.size / 2) {
          // Tapped the button
          isAutoShotEnabled = !isAutoShotEnabled; // Toggle state
          isTouchingLeft = false; 
          isTouchingRight = false; 
          initialTouchPos = null; // Don't track drag if button tapped
        } else {
          // --- Tap elsewhere on canvas ---
          // Determine initial touch side
          if (currentTouchX < width / 2) {
              isTouchingLeft = true;
              isTouchingRight = false; 
          } else {
              isTouchingRight = true; 
              isTouchingLeft = false;
          }
        }
    }
    
    // Game state specific actions for taps (can happen on or off canvas for start/restart)
    if (gameState === 'GAME_OVER') {
        // Only restart if the score form is NOT visible
        if (scoreFormDiv && scoreFormDiv.style('display') === 'none') {
           resetGame();
           gameState = 'PLAYING';
        }
      } else if (gameState === 'START_MENU') {
        resetGame();
        gameState = 'PLAYING';
    }
  }
  
  // Prevent default only if touch was on the canvas
  return !isCanvas;
}

function touchMoved(event) { // Add event parameter
  // Check if the touch target is the canvas
  let isCanvas = (event.target && event.target.id === 'defaultCanvas0');

  // Update position and delta if currently touching and dragging started (on canvas)
  if (touches.length > 0 && initialTouchPos && isCanvas) { 
    let touch = touches[0];
    currentTouchX = touch.x;
    currentTouchY = touch.y;

    // Calculate delta from initial touch position
    touchDelta.x = currentTouchX - initialTouchPos.x;
    touchDelta.y = currentTouchY - initialTouchPos.y;
  }
  
  // Prevent default only if touch was on the canvas
  return !isCanvas;
}

function touchEnded(event) { // Add event parameter
   // Check if the touch target is the canvas
  let isCanvas = (event.target && event.target.id === 'defaultCanvas0');

  // Reset touch state regardless of where touch ended
  currentTouchX = null;
  currentTouchY = null;
  initialTouchPos = null; // Clear initial position
  touchDelta = { x: 0, y: 0 }; // Reset delta
  isTouchingLeft = false;
  isTouchingRight = false; 
  // isAutoShotEnabled state persists
  
  // Prevent default only if touch was on the canvas
  return !isCanvas;
}

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

  // Player Projectiles vs Enemy Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    // Ensure player projectile exists
    if (!projectiles[i]) continue;

    for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
      // Ensure enemy projectile exists
      if (!enemyProjectiles[j]) continue;

      // Check collision (using projectile's method)
      if (projectiles[i].collidesWith(enemyProjectiles[j])) {
        // Remove both projectiles
        projectiles.splice(i, 1);
        enemyProjectiles.splice(j, 1);

        // Optional: Add a small particle effect for projectile collision
        // particleSystems.push(new ParticleSystem(enemyProjectiles[j].pos.x, enemyProjectiles[j].pos.y, color(200, 200, 200), triggerShake));

        // Break inner loop as player projectile is gone
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

    // Increase difficulty slightly over time (spawn interval)
    if (spawnInterval > 500) {
        spawnInterval *= 0.99;
    }

    // Spawn more enemies in later waves
    let enemiesToSpawn = 1 + floor(wave / 7); // SLOWED DOWN: Changed from 5 to 7
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

    // Determine which power-up type to spawn based on weights
    let powerUpType;
    let rand = random(1); // Get a random number between 0 and 1
    if (rand < 0.10) { // DECREASED: 10% chance for Extra Life (was 0.20)
        powerUpType = POWERUP_TYPES.EXTRA_LIFE;
    } else if (rand < 0.30) { // ADJUSTED: 20% chance for Nuke (0.30 - 0.10 = 0.20)
        powerUpType = POWERUP_TYPES.NUKE;
    } else { // Remaining 70% chance for Rapid Fire
        powerUpType = POWERUP_TYPES.RAPID_FIRE;
    }

    // Create a power-up at a random x position near the top
    let x = random(50, width - 50);
    let y = random(-100, -50);
    powerUps.push(new PowerUp(x, y, powerUpType)); // Pass the selected type
    console.log(`Power-up spawned: ${powerUpType}`);
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