// -------- Global Variables --------
let gameState = 'START_MENU'; // START_MENU, PLAYING, GAME_OVER
let player;
let projectiles = []; // Corrected: Initialize as empty array
let enemyProjectiles = []; // Corrected: Initialize as empty array
let enemies = []; // Corrected: Initialize as empty array
let stars =[]; // Corrected: Initialize as empty array
let particleSystems =[]; // Corrected: Initialize as empty array
let powerUps = []; // Array for power-up items

let score = 0;
let lives = 3;
let wave = 0; // To control enemy spawning difficulty

// Input Handling
// let pressedKeys = {}; // REMOVED: Using keyIsDown() directly

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

// -------- Supabase Setup --------
// Configuration constants are now in config.js
// !! IMPORTANT: Replace placeholders in config.js with your actual Supabase URL and Anon Key !!


let supabase = null; // Global variable to hold the Supabase client instance
try {
  // Correctly call the createClient function from the global Supabase object
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase client initialized.");
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  alert("Could not connect to the leaderboard service. Leaderboard will be unavailable.");
}
// -------- End Supabase Setup --------

// -------- DOM Elements (for score form) --------
let scoreFormDiv;
let finalScoreDisplay;
let usernameInput;
let submitScoreButton;
let scoreFeedback;

// -------- Leaderboard Data --------
let leaderboardScores = []; // To store fetched scores
let leaderboardError = null; // To store fetch error message

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

  // Get references to score form elements
  scoreFormDiv = select('#score-form');
  finalScoreDisplay = select('#final-score-display');
  usernameInput = select('#username-input');
  submitScoreButton = select('#submit-score-button');
  scoreFeedback = select('#score-feedback');

  // Add event listener for score submission
  submitScoreButton.mousePressed(handleScoreSubmit);

  // Ensure form is hidden initially
  scoreFormDiv.hide();

  // Fetch initial leaderboard data
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
    enemies[i].update();
    enemies[i].display();
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
    showScoreForm(); // Show the form when game ends
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
  drawLeaderboardToCanvas(width / 2, height * 0.65); // Position below start text
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
      drawLeaderboardToCanvas(width / 2, height / 2); // Position in the middle
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

// -------- Score Form Handling --------
function showScoreForm() {
  if (scoreFormDiv && finalScoreDisplay && usernameInput) {
    finalScoreDisplay.html(`Final Score: ${score}`); // Update score display
    usernameInput.value(''); // Clear previous input
    scoreFeedback.html(''); // Clear previous feedback
    submitScoreButton.removeAttribute('disabled'); // Ensure button is enabled
    scoreFormDiv.show();
  }
}

async function handleScoreSubmit() {
  if (!supabase) {
    scoreFeedback.html('Error: Leaderboard service unavailable.');
    return;
  }

  const username = usernameInput.value().trim();
  if (!username) {
    alert('Please enter a username.');
    return;
  }

  // Disable button while submitting
  submitScoreButton.attribute('disabled', true);
  scoreFeedback.html('Submitting...');

  try {
    const { data, error } = await supabase
      .from('scores')
      .insert([{ username: username, score: score }])
      .select(); // Select to potentially get back the inserted data (optional)

    if (error) {
      throw error; // Throw error to be caught by catch block
    }

    console.log('Score submitted successfully:', data);
    scoreFeedback.html('Score Submitted!');

    // Fetch updated leaderboard after successful submission
    displayLeaderboard();

    setTimeout(() => {
        scoreFormDiv.hide();
        // Leaderboard will be drawn automatically in drawGameOver now
    }, 1500);

  } catch (error) {
    console.error('Error submitting score:', error.message);
    scoreFeedback.html(`Error: ${error.message}`);
    submitScoreButton.removeAttribute('disabled'); // Re-enable button on error
  }
}

// -------- Leaderboard Handling --------
async function displayLeaderboard() {
    if (!supabase) {
        leaderboardError = "Leaderboard service unavailable.";
        console.warn(leaderboardError);
        return;
    }

    console.log("Fetching leaderboard...");
    leaderboardError = null; // Clear previous error
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('username, score, created_at')
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        leaderboardScores = data || []; // Store fetched data, default to empty array
        console.log("Leaderboard fetched:", leaderboardScores);

    } catch (error) {
        console.error('Error fetching leaderboard:', error.message);
        leaderboardError = `Error loading scores: ${error.message}`;
        leaderboardScores = []; // Clear scores on error
    }
    // No drawing here, drawing happens in drawLeaderboardToCanvas
}

// Function to draw the leaderboard onto the canvas
function drawLeaderboardToCanvas(x, y) {
    push(); // Isolate text settings
    fill(255);
    textSize(20);
    textAlign(CENTER, TOP);
    text("--- Leaderboard --- ", x, y);

    if (leaderboardError) {
        fill(255, 100, 100); // Red for error message
        textSize(16);
        text(leaderboardError, x, y + 30);
    } else if (leaderboardScores.length === 0) {
        textSize(16);
        text("No scores yet!", x, y + 30);
    } else {
        textSize(18);
        textAlign(CENTER, TOP); // Center alignment for the whole line
        const startY = y + 35;
        const lineHeight = 22;

        for (let i = 0; i < leaderboardScores.length; i++) {
            const currentY = startY + i * lineHeight;
            const rank = i + 1;
            const entry = leaderboardScores[i];
            let formattedDateTime = "";

            // Format the timestamp
            try {
                const date = new Date(entry.created_at);
                const dateString = date.toLocaleDateString();
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                formattedDateTime = `${dateString} ${timeString}`;
            } catch (e) {
                formattedDateTime = "-invalid date-";
                console.error("Error formatting date:", entry.created_at, e);
            }

            // Construct the single line string
            const scoreText = `${rank}. ${entry.username} - ${entry.score} - ${formattedDateTime}`;

            // Draw the centered text
            text(scoreText, x, currentY);
        }
    }
    pop(); // Restore previous text settings
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

// REMOVED keyReleased function entirely
// function keyReleased() { ... }

// -------- Game Reset --------
function resetGame() {
  score = 0;
  lives = 3;
  wave = 0;
  projectiles = []; // Corrected: Reset to empty array
  enemyProjectiles =[]; // Corrected: Reset to empty array
  enemies =[]; // Corrected: Reset to empty array
  particleSystems =[]; // Corrected: Reset to empty array
  powerUps = []; // Reset power-up array
  player.reset(width / 2, height - 50);
  lastSpawnTime = millis(); // Reset spawn timer
  spawnInterval = 2000; // Reset spawn interval
  lastPowerUpSpawnTime = millis(); // Reset power-up spawn timer
  powerUpSpawnInterval = 15000; // Reset power-up spawn interval
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
          particleSystems.push(new ParticleSystem(enemies[j].pos.x, enemies[j].pos.y, enemies[j].color)); // Explosion
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
      particleSystems.push(new ParticleSystem(enemies[i].pos.x, enemies[i].pos.y, enemies[i].color)); // Enemy explodes on collision
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
        let enemyType = floor(random(3)); // 0, 1, 2

        // Introduce enemy types gradually
        if (wave < 3 && enemyType > 0) enemyType = 0; // Only Drones early on
        if (wave < 6 && enemyType > 1) enemyType = floor(random(2)); // Drones and Scouts

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

// -------- Player Class --------
class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.size = 20; // Base size for collision and drawing scale
    this.speed = 5; // Movement speed factor
    this.thrusting = false;
    this.lastShotTime = 0;
    this.fireRateCooldown = 150; // milliseconds between shots
    this.hitTimer = 0; // Invincibility frames after hit
    this.hitDuration = 60; // How many frames invincibility lasts

    // Power-up state
    this.powerUpActive = false;
    this.powerUpType = null;
    this.powerUpTimer = 0; // Remaining frames for the power-up
  }

  reset(x, y) {
      this.pos.set(x, y);
      this.vel.set(0, 0);
      this.hitTimer = 0;
      // Reset power-up state on game reset
      this.powerUpActive = false;
      this.powerUpType = null;
      this.powerUpTimer = 0;
  }

  // Revised Input Handling - Using keyIsDown()
  handleInput() { // No longer needs 'keys' argument
    this.thrusting = false;
    this.vel.set(0, 0); // Reset velocity at the start of each frame

    let moveX = 0;
    let moveY = 0;

    // Determine direction based on keyIsDown()
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 65 = 'A'
        moveX -= 1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 68 = 'D'
        moveX += 1;
    }
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // 87 = 'W'
        moveY -= 1;
        this.thrusting = true;
    }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // 83 = 'S'
        moveY += 1;
    }

    // If any movement key is pressed, set velocity
    if (moveX !== 0 || moveY !== 0) {
        this.vel.set(moveX, moveY); // Set direction vector
        // Normalize and scale to speed for consistent movement
        this.vel.normalize().mult(this.speed);
    }
  }


  update() {
    this.pos.add(this.vel); // Update position based on velocity

    // Countdown invincibility timer
    if (this.hitTimer > 0) {
        this.hitTimer--;
    }

    // Countdown power-up timer
    if (this.powerUpActive) {
        this.powerUpTimer--;
        if (this.powerUpTimer <= 0) {
            this.powerUpActive = false;
            this.powerUpType = null;
            console.log("Power-up expired!");
        }
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // Determine fill color based on power-up state
    let bodyColor = this.powerUpActive ? color(100, 255, 100) : color(0, 200, 255); // Green if active, else Cyan

    // Optional: Pulsing outline when power-up is active
    if (this.powerUpActive) {
        let pulseAlpha = map(sin(frameCount * 0.2), -1, 1, 100, 255);
        stroke(255, 255, 0, pulseAlpha); // Pulsing yellow outline
        strokeWeight(2);
    } else {
        noStroke();
    }

    // Main Body (Triangle)
    fill(bodyColor);
    triangle(0, -this.size * 0.8, -this.size * 0.5, this.size * 0.5, this.size * 0.5, this.size * 0.5);

    noStroke(); // Ensure rest of ship parts have no stroke unless specified

    // Cockpit (Small Ellipse)
    fill(255); // White
    ellipse(0, -this.size * 0.2, this.size * 0.3, this.size * 0.4);

    // Engine (Rectangle)
    fill(255, 150, 0); // Orange
    rect(0, this.size * 0.6, this.size * 0.4, this.size * 0.3);

    // Thrust Flame (when moving up/thrusting)
    if (this.thrusting) {
        fill(255, random(100, 200), 0, 200); // Flickering orange/yellow, semi-transparent
        triangle(0, this.size * 0.8, -this.size * 0.2, this.size * 1.1, this.size * 0.2, this.size * 1.1);
    }
    pop();
  }

  shoot() {
    let currentTime = millis();
    // Adjust fire rate if power-up is active (optional)
    let currentFireRate = this.powerUpActive && this.powerUpType === 'rapid_fire' ? this.fireRateCooldown * 0.7 : this.fireRateCooldown;

    if (currentTime > this.lastShotTime + currentFireRate) {
      // Check for active power-up
      if (this.powerUpActive && this.powerUpType === 'rapid_fire') {
        // Rapid Fire: Shoot 3 projectiles in a spread
        let spreadAngle = PI / 18; // ~10 degrees spread total
        // Center shot
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player'));
        // Left shot
        let leftVel = p5.Vector.fromAngle(-HALF_PI - spreadAngle, 10);
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player', leftVel));
        // Right shot
        let rightVel = p5.Vector.fromAngle(-HALF_PI + spreadAngle, 10);
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player', rightVel));
        console.log("Rapid fire shot!");
      } else {
        // Normal shot
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player'));
      }
      this.lastShotTime = currentTime;
    }
  }

  keepInBounds() {
    // Horizontal check
    if (this.pos.x <= this.size / 2) {
        this.pos.x = this.size / 2;
        if (this.vel.x < 0) { // Only stop if moving into the left wall
            this.vel.x = 0;
        }
    } else if (this.pos.x >= width - this.size / 2) {
        this.pos.x = width - this.size / 2;
        if (this.vel.x > 0) { // Only stop if moving into the right wall
             this.vel.x = 0;
        }
    }

    // Vertical check
    if (this.pos.y <= this.size / 2) {
        this.pos.y = this.size / 2;
        if (this.vel.y < 0) { // Only stop if moving into the top wall
            this.vel.y = 0;
        }
    } else if (this.pos.y >= height - this.size / 2) {
        this.pos.y = height - this.size / 2;
        if (this.vel.y > 0) { // Only stop if moving into the bottom wall
             this.vel.y = 0;
        }
    }
  }

  // Collision check based on distance (circle approximation)
  collidesWith(other) {
    if (this.hitTimer > 0) return false; // Invincible check

    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);

    // Determine the radius of the 'other' object
    let otherRadius = 0;
    if (other instanceof Projectile) {
        // Projectiles use size.x for radius (enemy) or max(size.x, size.y) for player
        // Since player checks collision, other is always an enemy projectile here.
        otherRadius = other.size.x / 2; // Enemy projectiles are circles using size.x
    } else if (other instanceof Enemy) {
        // Enemies use a simple size property
        otherRadius = other.size / 2;
    } else {
        // Default/fallback if type is unknown (shouldn't happen with current code)
        otherRadius = (other.size || 0) / 2;
    }

    // Use half of the player's 'size' property as its radius
    let playerRadius = this.size / 2;

    return d < playerRadius + otherRadius;
  }

  hit() {
      // Prevent damage if power-up is active
      if (this.powerUpActive) {
          console.log("Hit absorbed by active power-up!");
          // Optional: Add different visual/audio feedback for absorbed hit
          // triggerShake(5, 1); // e.g., smaller shake
          return; // Exit before taking damage
      }

      // Only register hit if not currently invincible from previous hit
      if (this.hitTimer <= 0) {
          lives--;
          this.hitTimer = this.hitDuration; // Start invincibility timer
          triggerShake(15, 4); // Trigger screen shake on hit
      }
  }

  activatePowerUp(type, durationSeconds) {
    console.log(`Player activated ${type} power-up for ${durationSeconds} seconds`);
    this.powerUpActive = true;
    this.powerUpType = type;
    this.powerUpTimer = durationSeconds * 60; // Convert seconds to frames (assuming 60fps)
    // Add visual/audio feedback here if desired
  }
}

// -------- Projectile Class --------
class Projectile {
  constructor(x, y, owner, initialVel = null) { // Added initialVel parameter
    this.pos = createVector(x, y);
    this.owner = owner;

    if (this.owner === 'player') {
      // Use initialVel if provided, otherwise default upwards velocity
      this.vel = initialVel ? initialVel.copy() : createVector(0, -10);
      this.size = createVector(3, 15);
      this.color = color(255, 255, 255);
    } else { // Enemy projectile
       // Enemy projectiles might also use initialVel if aiming logic needs it
      this.vel = initialVel ? initialVel.copy() : createVector(0, 5);
      this.size = createVector(8, 8);
      this.color = color(255, 50, 50);
    }
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill(this.color);
    noStroke();
    if (this.owner === 'player') {
      rect(0, 0, this.size.x, this.size.y); // Draw as rectangle
    } else {
      ellipse(0, 0, this.size.x, this.size.y); // Draw enemy shots as circles
    }
    pop();
  }

  // Corrected: Use logical OR ||
  isOffscreen() {
    // Check if projectile is completely off the screen (top or bottom)
    return (this.pos.y < -this.size.y / 2 || this.pos.y > height + this.size.y / 2);
  }

  // Collision check based on distance (circle approximation)
  collidesWith(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    // Use half of width/height (max for player, width for enemy circle) as radius approx
    let collisionRadius = (this.owner === 'player'? max(this.size.x, this.size.y) / 2 : this.size.x / 2);
    // Other object's radius is assumed to be other.size / 2
    return d < collisionRadius + other.size / 2;
  }
}


// -------- Enemy Class --------
class Enemy {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 0: Drone, 1: Scout, 2: Heavy

    // Type-specific properties
    switch (this.type) {
      case 0: // Drone
        this.size = 25;
        this.color = color(150, 150, 150); // Grey
        this.health = 1;
        this.speed = random(1, 2.5);
        this.vel = createVector(0, this.speed);
        this.fireRate = 2500; // ms
        this.scoreValue = 10;
        this.movementPattern = 'linear';
        break;
      case 1: // Scout
        this.size = 20;
        this.color = color(200, 100, 255); // Purple
        this.health = 2;
        this.speed = random(2.5, 4);
        // Start with a random horizontal component for diagonal movement
        this.vel = createVector(random(-1, 1), 1);
        this.vel.normalize().mult(this.speed);
        this.fireRate = 1500; // ms
        this.scoreValue = 30;
        this.movementPattern = 'sine'; // Can also be 'diagonal' or others
        this.sineOffsetX = this.pos.x; // Base X for sine wave
        this.sineFrequency = random(0.01, 0.05);
        this.sineAmplitude = random(30, 80);
        break;
      case 2: // Heavy
        this.size = 40;
        this.color = color(50, 100, 200); // Dark Blue
        this.health = 5;
        this.speed = random(0.8, 1.5);
        this.vel = createVector(0, this.speed);
        this.fireRate = 2000; // ms
        this.scoreValue = 100;
        this.movementPattern = 'stop_and_go';
        this.stopY = random(height * 0.2, height * 0.4); // Y position to stop at
        this.stopped = false;
        break;
    }
    this.lastShotTime = millis() + random(this.fireRate); // Stagger initial shots
  }

  update() {
    // Movement Logic
    switch (this.movementPattern) {
        case 'linear':
            this.pos.add(this.vel);
            break;
        case 'sine':
            // Move primarily downwards
            this.pos.y += this.vel.y;
            // Apply sine wave horizontally
            this.pos.x = this.sineOffsetX + sin(this.pos.y * this.sineFrequency) * this.sineAmplitude;
            // Keep within horizontal bounds
            this.pos.x = constrain(this.pos.x, this.size/2, width - this.size/2);
            break;
        case 'stop_and_go':
            if (!this.stopped && this.pos.y < this.stopY) {
                this.pos.add(this.vel); // Move down until stopY
            } else {
                this.stopped = true;
                // Optional: Add slight horizontal drift when stopped
                this.pos.x += sin(frameCount * 0.02 + this.pos.y) * 0.5; // Add unique offset based on Y
                this.pos.x = constrain(this.pos.x, this.size/2, width - this.size/2);
            }
            break;
        // Add other patterns like 'diagonal' if needed
    }


    // Firing Logic
    let currentTime = millis();
    if (currentTime > this.lastShotTime + this.fireRate) {
      // Only shoot if on screen (or just entering)
      if (this.pos.y > -this.size / 2) {
          this.shoot();
          this.lastShotTime = currentTime;
      }
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill(this.color);
    stroke(255); // White outline for visibility
    strokeWeight(1.5);

    // Draw based on type
    switch (this.type) {
      case 0: // Drone (Square with inset)
        rect(0, 0, this.size, this.size, 3); // Slightly rounded corners
        fill(red(this.color)*0.5, green(this.color)*0.5, blue(this.color)*0.5, 180); // Darker inset
        noStroke();
        rect(0, 0, this.size * 0.6, this.size * 0.6, 2);
        break;
      case 1: // Scout (Pointy Triangle)
        triangle(0, -this.size / 1.5, -this.size / 2, this.size / 2, this.size / 2, this.size / 2);
        fill(255, 255, 0); // Yellow detail/cockpit
        noStroke();
        ellipse(0, this.size * 0.1, this.size * 0.3, this.size * 0.3);
        break;
      case 2: // Heavy (Bulky Rectangle with 'cannons')
        rect(0, 0, this.size, this.size * 0.8, 5); // Main body
        // Use a darker shade of the base color for cannons
        fill(red(this.color)*0.7, green(this.color)*0.7, blue(this.color)*0.7);
        stroke(200); // Slightly lighter stroke for cannons
        strokeWeight(1);
        // Cannons
        rect(-this.size * 0.3, this.size * 0.4, this.size * 0.2, this.size * 0.4);
        rect(this.size * 0.3, this.size * 0.4, this.size * 0.2, this.size * 0.4);
        break;
    }
    pop();
  }

  shoot() {
    // Create a projectile originating from the enemy's position
    let proj = new Projectile(this.pos.x, this.pos.y + this.size / 2, 'enemy');

    // Type specific firing modifications
    if (this.type === 1) { // Scout aims slightly towards player
        // Calculate angle from enemy to player
        let aimAngle = atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
        // Add some slight inaccuracy
        aimAngle += random(-0.15, 0.15); // Radians
        // Set projectile velocity based on angle and a fixed speed
        proj.vel = p5.Vector.fromAngle(aimAngle, 4); // Aimed, speed 4
    } else if (this.type === 2) { // Heavy shoots faster projectile straight down
        proj.vel.set(0, 7); // Faster downward shot, speed 7
        // Could add multiple shots (burst fire) here later
    }
    // Add the configured projectile to the global list
    enemyProjectiles.push(proj);
  }

  // Called when hit by player projectile
  hit() {
    this.health--;
    return this.health <= 0; // Return true if health is 0 or less (killed)
  }

  // Check if enemy is completely off the bottom of the screen
  isOffscreen() {
    return (this.pos.y > height + this.size / 2);
  }
}


// -------- Star Class --------
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height); // Start stars anywhere on screen initially
    this.size = random(0.5, 3);
    // Parallax: Smaller/distant stars move slower, larger/closer stars move faster
    this.speed = map(this.size, 0.5, 3, 0.5, 2.5); // Adjust speed range for desired effect
    this.color = color(random(150, 255)); // Shades of grey/white
  }

  update() {
    this.y += this.speed; // Move star down based on its speed
    // If star goes off the bottom edge...
    if (this.y > height + this.size) {
      this.y = random(-50, -this.size); // Reset position above the screen
      this.x = random(width); // Give it a new horizontal position
    }
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
    // point(this.x, this.y); // Alternative: Use point() for potentially better performance with many stars
  }
}

// -------- Particle Class --------
class Particle {
  constructor(x, y, baseColor) {
    this.pos = createVector(x, y);
    // Give particle a random outward velocity
    this.vel = p5.Vector.random2D().mult(random(1, 6)); // Adjust speed range
    this.lifespan = random(30, 70); // How many frames the particle lives
    // Corrected: Use logical OR || for default value assignment
    this.baseColor = baseColor || color(255, 150, 0); // Default orange/yellow if no color passed
    this.size = random(3, 8);
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.95); // Apply friction to slow down
    this.lifespan--; // Decrease lifespan each frame
  }

  display() {
    // Calculate alpha based on remaining lifespan (fade out)
    let currentAlpha = map(this.lifespan, 0, 70, 0, 255); // Map lifespan to alpha
    // Create color with calculated alpha
    let currentColor = color(
        red(this.baseColor),
        green(this.baseColor),
        blue(this.baseColor),
        currentAlpha // Apply fading alpha
    );
    fill(currentColor);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }

  // Check if particle's lifespan is over
  isDead() {
    return this.lifespan <= 0;
  }
}


// -------- Particle System Class --------
// Manages a collection of particles for effects like explosions
class ParticleSystem {
  constructor(x, y, baseColor) {
    this.origin = createVector(x, y);
    this.particles =[]; // Initialize particle array for this system
    let numParticles = floor(random(15, 30)); // Number of particles per explosion
    // Create the specified number of particles
    for (let i = 0; i < numParticles; i++) {
      this.particles.push(new Particle(this.origin.x, this.origin.y, baseColor));
    }
    // Trigger a small screen shake when an explosion happens
    triggerShake(10, 2);
  }

  // Update and display all particles in the system
  run() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.update();
      p.display();
      // Remove dead particles
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Check if all particles in this system are dead
  isDead() {
    return this.particles.length === 0;
  }
}

// -------- PowerUp Class --------
class PowerUp {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 1); // Slow downward drift
    this.size = 15;
    this.type = 'rapid_fire'; // Could be expanded later (e.g., 'shield')
    this.color = color(255, 255, 0); // Yellow
    this.pulseOffset = random(TWO_PI); // For unique pulsing per item
  }

  update() {
    this.pos.add(this.vel);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // Pulsing effect for size
    let pulse = sin(frameCount * 0.1 + this.pulseOffset) * 0.15 + 0.85; // Sin wave between ~0.85 and 1.0
    let currentSize = this.size * pulse;

    // Draw a star shape
    fill(this.color);
    noStroke();
    beginShape();
    for (let i = 0; i < 5; i++) {
      let angle = TWO_PI / 5 * i - HALF_PI; // Offset to point upwards
      let x = cos(angle) * currentSize;
      let y = sin(angle) * currentSize;
      vertex(x, y);
      angle += TWO_PI / 10;
      x = cos(angle) * currentSize * 0.5; // Inner point
      y = sin(angle) * currentSize * 0.5;
      vertex(x, y);
    }
    endShape(CLOSE);

    pop();
  }

  // Collision check based on distance (circle approximation)
  collidesWith(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    // Calculate other's radius based on its type
    let otherRadius = 0;
    if (other instanceof Projectile) {
        // Player projectiles are tall rectangles, use max dimension
         otherRadius = max(other.size.x, other.size.y) / 2;
    } else {
        // Assume simple size property for other types (like Player)
        otherRadius = (other.size || 0) / 2;
    }
    // PowerUp radius
    let powerUpRadius = this.size / 2;
    return d < powerUpRadius + otherRadius;
  }

  // Check if power-up is off the bottom of the screen
  isOffscreen() {
    return (this.pos.y > height + this.size / 2);
  }
}

// -------- Window Resize Handling --------
// Adjusts the canvas size when the browser window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Optional: Recalculate positions if needed (e.g., recenter player)
  // player.pos.set(width / 2, height - 50); // Example: Recenter player
}