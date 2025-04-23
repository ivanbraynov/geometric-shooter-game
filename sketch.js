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

let boss = null; // Track the current boss instance
let bossActive = false; // Track if a boss fight is active
let bossDefeated = false; // Track if boss was defeated this wave

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
// let autoShotButton = { x: 0, y: 0, size: 50, margin: 20 }; // Removed - Replaced by HTML button
let autoShotHtmlButton; // Reference to the HTML button
// ---------------------------

// --- HUD HTML Elements ---
let hudScoreElement;
let hudLivesElement;
// -----------------------

// --- Start Menu HTML Elements ---
let startMenuContainer;
let titleElement;
let instructionsHeadingElement;
let instructionsMoveElement;
let instructionsShootElement;
let instructionsStartElement;
let itemsHeadingElement;
let itemsCanvasPlaceholder; // <<< Make this global
let leaderboardContainerElement; // Div to hold leaderboard table/content
let startPromptElement;
// -----------------------------

let sunImage;

// -------- Setup --------
function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  ellipseMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(18);
  textFont('monospace'); // Consistent look

  // --- Create Auto-Shot HTML Button ---
  autoShotHtmlButton = createButton('AUTO-FIRE');
  autoShotHtmlButton.id('auto-shot-button');
  autoShotHtmlButton.position(width - 80, height - 60);
  
  // Function to toggle state and update button appearance
  const toggleAutoShot = () => {
      isAutoShotEnabled = !isAutoShotEnabled;
      if (isAutoShotEnabled) {
          autoShotHtmlButton.addClass('active');
      } else {
          autoShotHtmlButton.removeClass('active');
      }
  };
  
  autoShotHtmlButton.mousePressed(toggleAutoShot);
  // -----------------------------------

  // --- Create HUD HTML Elements ---
  hudScoreElement = createP('Score: 0');
  hudScoreElement.id('hud-score');
  // Position will be handled by CSS

  hudLivesElement = createP('Lives: 3'); 
  hudLivesElement.id('hud-lives');
  // Position will be handled by CSS
  // -------------------------------

  // --- Create Start Menu HTML Elements (using createElement) ---
  startMenuContainer = select('#start-menu-container');
  if (!startMenuContainer) console.error("Start menu container not found!");

  titleElement = createElement('h1', 'Geometric Shooter'); // Use createElement
  titleElement.parent(startMenuContainer);
  titleElement.id('menu-title');
  
  instructionsHeadingElement = createElement('p', 'How to Play'); // Use createElement
  instructionsHeadingElement.parent(startMenuContainer);
  instructionsHeadingElement.id('menu-instructions-heading');
  
  instructionsMoveElement = createElement('p', 'Move: Arrows; WASD; Touch'); // Use createElement
  instructionsMoveElement.parent(startMenuContainer);
  instructionsMoveElement.addClass('menu-instruction'); // Use class for common style

  instructionsShootElement = createElement('p', 'Shoot: SPACE Bar; AUTO-FIRE on mobile'); // Use createElement
  instructionsShootElement.parent(startMenuContainer);
  instructionsShootElement.addClass('menu-instruction');
  
  instructionsStartElement = createElement('p', 'Start/Restart: SPACE Bar; Touch'); // Use createElement
  instructionsStartElement.parent(startMenuContainer);
  instructionsStartElement.addClass('menu-instruction');

  itemsHeadingElement = createElement('p', 'Items');
  itemsHeadingElement.parent(startMenuContainer);
  itemsHeadingElement.id('menu-items-heading');
  
  // Store reference globally
  itemsCanvasPlaceholder = createDiv(''); 
  itemsCanvasPlaceholder.parent(startMenuContainer);
  itemsCanvasPlaceholder.id('menu-items-placeholder'); 
  
  leaderboardContainerElement = createDiv('');
  leaderboardContainerElement.parent(startMenuContainer);
  leaderboardContainerElement.id('menu-leaderboard-container');
  
  startPromptElement = createElement('p', 'Press SPACE to Start / Touch Screen'); // Use createElement
  startPromptElement.parent(startMenuContainer);
  startPromptElement.id('menu-start-prompt');
  // ---------------------------------------

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
  if (startMenuContainer) {
      if (gameState === 'START_MENU') {
          startMenuContainer.show();
          // Draw animated item examples on canvas BEHIND the HTML menu
          drawItemExamples(); 
      } else {
          startMenuContainer.hide();
      }
  }

  // --- Call appropriate function based on game state --- 
  if (gameState === 'PLAYING') {
    runGame();
  } else if (gameState === 'GAME_OVER') {
    drawGameOver(); // Keep drawing canvas elements for Game Over for now
  }
  // Note: START_MENU logic (showing container, drawing items) is handled above
  // -----------------------------------------------------

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
  console.log(`runGame - Frame: ${frameCount}`);
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

  // --- Boss Fight Logic ---
  // Boss spawns at SPAWN_WAVE and every SPAWN_INTERVAL waves after
  let isBossWave = (wave >= BOSS_SETTINGS.SPAWN_WAVE && (wave - BOSS_SETTINGS.SPAWN_WAVE) % BOSS_SETTINGS.SPAWN_INTERVAL === 0);
  if (isBossWave && !bossActive && !bossDefeated) {
    // Spawn the boss at the center top
    boss = new Boss(width / 2, -120);
    bossActive = true;
    // Pause regular enemy spawns
    enemies = [];
  }

  if (bossActive && boss) {
    let wantsToShoot = boss.update();
    boss.display();
    if (wantsToShoot) {
      boss.shoot(player);
    }
    // Check if boss is offscreen (shouldn't happen, but safety)
    if (boss.isOffscreen()) {
      bossActive = false;
      boss = null;
    }
  }

  // Check Boss defeat
  if (bossActive && boss && boss.health <= 0) {
    score += boss.scoreValue;
    lives++; // Grant 1 extra life for defeating the boss
    particleSystems.push(new ParticleSystem(boss.pos.x, boss.pos.y, boss.color, triggerShake));
    bossActive = false;
    bossDefeated = false; // Reset so next boss can spawn
    boss = null;
    // Optionally: Advance to next wave or give reward
    wave++;
    lastSpawnTime = millis();
    spawnInterval *= 0.95; // Increase difficulty
  }

  // Only spawn enemies if not in boss fight
  if (!bossActive) {
    bossDefeated = false; // Reset bossDefeated for next boss wave
    spawnEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      let wantsToShoot = enemies[i].update();
      enemies[i].display();
      if (wantsToShoot) {
        enemies[i].shoot(player);
      }
      if (enemies[i].isOffscreen()) {
        enemies.splice(i, 1);
      }
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
    // --- Remove canvas text drawing for elements moved to HTML ---
    // Removed Title, Instructions, Leaderboard call, Start Prompt

    // --- Keep Item Example Drawing --- 
    // This function is now only called from draw() when gameState is START_MENU
    // to draw the items BEHIND the HTML container.
    // We need to extract the item drawing logic into its own function.

    // Extracted logic below, this function can be removed or repurposed
}

// NEW function to draw only the item examples
function drawItemExamples() {
    // Need access to constants/sizes if not global
    const itemSize = 20; 
    const labelOffsetX = 25; // Re-introduce offset for labels
    const itemTextSize = 12; // Smaller text size for labels
    const column1X = width * 0.4;
    const column2X = width * 0.6;
    
    // --- Calculate Y position based on placeholder --- 
    let examplesY = height * 0.5; // Default fallback Y
    if (itemsCanvasPlaceholder) {
        let placeholderY = itemsCanvasPlaceholder.position().y;
        let placeholderH = itemsCanvasPlaceholder.size().height;
        // Start drawing slightly below the placeholder's top, 
        // assuming placeholder CSS gives enough height
        examplesY = placeholderY + itemSize; // Adjust padding as needed
        // Optional: Center vertically within placeholder? 
        // examplesY = placeholderY + placeholderH / 2 - (itemSize * 1.5); // Rough vertical center
    }
    // -------------------------------------------------

    push(); // Isolate transformations and styles
    fill(255); // Default fill for text
    textSize(itemTextSize);
    textAlign(LEFT, CENTER); // Set alignment for text labels
    
    // Enemies Column
    // Drone
    let bobOffset1 = sin(frameCount * 0.05) * 3; 
    push(); translate(column1X, examplesY + itemSize / 2 + bobOffset1); scale(itemSize / 25);
    fill(150, 150, 150); stroke(255); strokeWeight(1.5); rect(0, 0, 25, 25, 3);
    fill(75, 75, 75, 180); noStroke(); rect(0, 0, 25 * 0.6, 25 * 0.6, 2);
    pop();
    fill(255); // Ensure text is white
    text("Drone", column1X + labelOffsetX, examplesY + itemSize / 2); // Uncommented text
    let currentY1 = examplesY + itemSize + 15;
    // Scout
    let bobOffset2 = sin(frameCount * 0.06 + 1) * 3;
    push(); translate(column1X, currentY1 + itemSize / 2 + bobOffset2); scale(itemSize / 20);
    fill(200, 100, 255); stroke(255); strokeWeight(1.5); triangle(0, -20 / 1.5, -10, 10, 10, 10);
    fill(255, 255, 0); noStroke(); ellipse(0, 2, 6, 6);
    pop();
    fill(255); // Ensure text is white
    text("Scout", column1X + labelOffsetX, currentY1 + itemSize / 2); // Uncommented text
    let currentY2 = currentY1 + itemSize + 15;
    // Heavy
    let bobOffset3 = sin(frameCount * 0.04 + 2) * 3; 
    push(); translate(column1X, currentY2 + itemSize / 2 + bobOffset3); scale(itemSize / 40);
    fill(50, 100, 200); stroke(255); strokeWeight(1.5); rect(0, 0, 40, 32, 5);
    fill(35, 70, 140); stroke(200); strokeWeight(1); rect(-12, 16, 8, 16); rect(12, 16, 8, 16);
    pop();
    fill(255); // Ensure text is white
    text("Heavy", column1X + labelOffsetX, currentY2 + itemSize / 2);
    let currentY3 = currentY2 + itemSize + 25;
    // Boss Icon (left side, under enemies)
    let bossBobOffset = sin(frameCount * 0.045 + 3) * 3; // Animate up and down like enemies
    push();
    translate(column1X, currentY3 + itemSize / 2 + bossBobOffset);
    let bossR = itemSize * 1.2;
    fill(255, 80, 0);
    stroke(255, 200, 0);
    strokeWeight(2);
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = PI / 3 * i - PI / 6;
      vertex(cos(angle) * bossR, sin(angle) * bossR);
    }
    endShape(CLOSE);
    // Eyes
    fill(255, 255, 0, 220);
    noStroke();
    let eyeOffsetY = -bossR * 0.2;
    let eyeOffsetX = bossR * 0.35;
    let eyeW = bossR * 0.22;
    let eyeH = bossR * 0.18;
    rect(-eyeOffsetX, eyeOffsetY, eyeW, eyeH, 2);
    rect(eyeOffsetX, eyeOffsetY, eyeW, eyeH, 2);
    // Core
    fill(255, 80, 0, 120);
    ellipse(0, bossR * 0.25, bossR * 0.7, bossR * 0.7);
    pop();
    fill(255);
    text("Boss", column1X + labelOffsetX, currentY3 + itemSize / 2 + bossBobOffset);

    // Power-ups Column
    const powerUpBaseSize = 15;
    let currentY4 = examplesY; // Reset Y for second column
    // Rapid Fire
    push();
    translate(column2X, currentY4 + itemSize / 2);
    let pulse1 = sin(frameCount * 0.1 + 0) * 0.15 + 0.85;
    let currentPuSize1 = powerUpBaseSize * pulse1 * (itemSize / powerUpBaseSize);
    fill(255, 255, 0); noStroke(); beginShape(); 
    for (let i = 0; i < 5; i++) { let angle = TWO_PI / 5 * i - HALF_PI; let x = cos(angle) * currentPuSize1; let y = sin(angle) * currentPuSize1; vertex(x, y); angle += TWO_PI / 10; x = cos(angle) * currentPuSize1 * 0.5; y = sin(angle) * currentPuSize1 * 0.5; vertex(x, y); } endShape(CLOSE);
    pop();
    fill(255); // Ensure text is white
    text("Rapid Fire", column2X + labelOffsetX, currentY4 + itemSize / 2); // Uncommented text
    let currentY5 = currentY4 + itemSize + 15;
    // Extra Life
    push();
    translate(column2X, currentY5 + itemSize / 2);
    let pulse2 = sin(frameCount * 0.1 + PI / 2) * 0.15 + 0.85;
    let currentPuSize2 = powerUpBaseSize * pulse2 * (itemSize / powerUpBaseSize);
    fill(0, 255, 0); noStroke();
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI / 5 * i - HALF_PI;
      let x = cos(angle) * currentPuSize2;
      let y = sin(angle) * currentPuSize2;
      vertex(x, y);
      angle += TWO_PI / 10;
      x = cos(angle) * currentPuSize2 * 0.5;
      y = sin(angle) * currentPuSize2 * 0.5;
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
    fill(255); // Ensure text is white
    text("Extra Life", column2X + labelOffsetX, currentY5 + itemSize / 2);
    let currentY6 = currentY5 + itemSize + 15;
    // Nuke
    push();
    translate(column2X, currentY6 + itemSize / 2);
    let pulse3 = sin(frameCount * 0.1 + PI) * 0.15 + 0.85;
    let currentPuSize3 = powerUpBaseSize * pulse3 * (itemSize / powerUpBaseSize);
    fill(255, 0, 0); noStroke(); beginShape(); 
    for (let i = 0; i < 5; i++) { let angle = TWO_PI / 5 * i - HALF_PI; let x = cos(angle) * currentPuSize3; let y = sin(angle) * currentPuSize3; vertex(x, y); angle += TWO_PI / 10; x = cos(angle) * currentPuSize3 * 0.5; y = sin(angle) * currentPuSize3 * 0.5; vertex(x, y); } endShape(CLOSE);
    pop();
    fill(255); // Ensure text is white
    text("Nuke", column2X + labelOffsetX, currentY6 + itemSize / 2);
    
    pop(); // End isolation push
}

function drawGameOver() {
  // To be converted later? Keep canvas text for now or move to HTML?
  // For now, keep drawing on canvas.
  fill(255, 0, 0);
  textSize(64);
  text('GAME OVER', width / 2, height / 4); 
  fill(255);
  textSize(32);
  if (scoreFormDiv.style('display') === 'none') {
     text(`Final Score: ${score}`, width / 2, height / 3 + 20);
     textSize(24);
     text('Press SPACE to Restart', width / 2, height * 0.9); 
  }
  // Draw Leaderboard on Game Over screen? 
  // If we move leaderboard to HTML, we need a separate container for it here.
  if (scoreFormDiv.style('display') === 'none') {
      // drawLeaderboardToCanvas(width / 2, height / 2); // Keep canvas version for now?
  }
}

function drawHUD() {
  // --- Update HTML HUD Elements --- 
  if (hudScoreElement) {
    hudScoreElement.html(`Score: ${score}`);
  }
  if (hudLivesElement) {
    hudLivesElement.html(`Lives: ${lives}`);
  }
  // ------------------------------

  // Display Power-up Timer if active (Keep this on canvas for now? Or convert too?)
  let powerupTextY = 40;
  if (player && player.powerUpActive) {
    let remainingSeconds = ceil(player.powerUpTimer / 60);
    fill(255, 255, 0); // Yellow for timer text
    textSize(18); 
    textAlign(CENTER, TOP);
    text(`${player.powerUpType.replace('_', ' ').toUpperCase()} ACTIVE: ${remainingSeconds}s`, width / 2, powerupTextY); // Increased Y from 15 to 40
    fill(255); // Reset fill color
    textSize(20); // Reset text size
  }

  // Draw boss health bar if active, below the power-up timer
  if (bossActive && boss) {
    let barWidth = width * 0.4;
    let barHeight = 24;
    let x = width / 2 - barWidth / 2;
    let barY = powerupTextY + 28; // 18px text + 10px gap
    let pct = boss.health / boss.maxHealth;
    // Center the health bar visually
    push();
    rectMode(CORNER);
    // Background
    fill(60, 0, 0, 180);
    rect(x, barY, barWidth, barHeight, 8);
    // Health
    fill(255, 80, 0);
    rect(x, barY, barWidth * pct, barHeight, 8);
    // Border
    noFill();
    stroke(255, 200, 0);
    strokeWeight(2);
    rect(x, barY, barWidth, barHeight, 8);
    noStroke();
    pop();
  }

  textAlign(CENTER, CENTER); 
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

function touchStarted(event) { 
  let isCanvas = (event.target && event.target.id === 'defaultCanvas0');
  let targetId = event.target?.id;
  // console.log(`Touch Started - Target: ${targetId || 'unknown'}, Is Canvas: ${isCanvas}, Current State: ${gameState}`); 

  // --- Handle State Change on Touch (if appropriate) --- 
  // Check if the touch is NOT on an interactive HTML element we want to isolate
  let allowStateChange = true;
  if (targetId === 'auto-shot-button' || 
      targetId === 'username-input' || 
      targetId === 'submit-score-button' || 
      targetId === 'start-menu-button') {
      allowStateChange = false; // Don't change game state if specific buttons/inputs are tapped
  }

  if (allowStateChange) {
      if (gameState === 'START_MENU') {
          console.log("Touch starting game from Start Menu..."); 
          resetGame();
          gameState = 'PLAYING';
      } else if (gameState === 'GAME_OVER') {
          if (scoreFormDiv && scoreFormDiv.style('display') === 'none') { // Only restart if form hidden
              console.log("Touch restarting game from Game Over..."); 
              resetGame();
              gameState = 'PLAYING';
          }
      }
  }
  // -----------------------------------------------------

  // --- Handle touch movement logic if on canvas --- 
  if (isCanvas && touches.length > 0) {
    let touch = touches[0];
    currentTouchX = touch.x;
    currentTouchY = touch.y;
    initialTouchPos = { x: currentTouchX, y: currentTouchY }; 
    touchDelta = { x: 0, y: 0 }; 
    if (currentTouchX < width / 2) {
        isTouchingLeft = true;
        isTouchingRight = false; 
    } else {
        isTouchingRight = true; 
        isTouchingLeft = false;
    }
  } 

  // Prevent default only if touch was on the canvas AND it wasn't the auto-shot button
  // We want default behavior for HTML buttons etc.
  return !isCanvas || targetId === 'auto-shot-button'; // Prevent default for canvas OR auto-shot button taps
}

function touchMoved(event) { 
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

function touchEnded(event) { 
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
  // console.log(`Key Pressed: ${key} (${keyCode}), Game State: ${gameState}`); // Remove log
  
  if (key === ' ' || keyCode === 32) { 
      // console.log("Space bar detected!"); // Remove log
      if (gameState === 'PLAYING') {
          // console.log("Attempting to shoot..."); // Remove log
          player.shoot();
      } else if (gameState === 'GAME_OVER') {
          if (scoreFormDiv && scoreFormDiv.style('display') === 'none') {
             // console.log("Restarting game from Game Over..."); // Remove log
             resetGame();
             gameState = 'PLAYING';
          }
      } else if (gameState === 'START_MENU') {
          // console.log("Starting game from Start Menu..."); // Remove log
          resetGame(); // <<< CRITICAL: This must run
          gameState = 'PLAYING';
          // console.log(`New Game State: ${gameState}`); // Remove log
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
  boss = null;
  bossActive = false;
  bossDefeated = false;
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

  // Player Projectiles vs Boss
  if (bossActive && boss) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (projectiles[i] && boss && dist(projectiles[i].pos.x, projectiles[i].pos.y, boss.pos.x, boss.pos.y) < boss.size / 2) {
        let killed = boss.hit();
        projectiles.splice(i, 1);
        if (killed) {
          // Handled in runGame
        }
        break;
      }
    }
  }
}


// -------- Enemy Spawning --------
function spawnEnemies() {
  let currentTime = millis();
  if (currentTime > lastSpawnTime + spawnInterval) {
    console.log(`spawnEnemies - Spawning wave ${wave + 1}`); // <<< Log spawning
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
  // HTML elements positions are handled by CSS, no need to update here usually
  // unless their container size changes in a way CSS doesn't handle automatically.
  // Keep button position update for now as it was simple absolute.
  if (autoShotHtmlButton) {
    autoShotHtmlButton.position(width - 80, height - 60); 
  }
}