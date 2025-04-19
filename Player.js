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
    // Adjust fire rate if power-up is active
    let currentFireRate = this.powerUpActive && this.powerUpType === POWERUP_TYPES.RAPID_FIRE
                          ? this.fireRateCooldown * GAME_SETTINGS.RAPID_FIRE_MULTIPLIER
                          : this.fireRateCooldown;

    if (currentTime > this.lastShotTime + currentFireRate) {
      if (this.powerUpActive && this.powerUpType === POWERUP_TYPES.RAPID_FIRE) {
        // Rapid Fire: Shoot 3 projectiles in a spread
        let spreadAngle = GAME_SETTINGS.RAPID_FIRE_SPREAD_ANGLE;
        // Center shot
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player'));
        // Left shot
        let leftVel = p5.Vector.fromAngle(-HALF_PI - spreadAngle, 10);
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player', leftVel));
        // Right shot
        let rightVel = p5.Vector.fromAngle(-HALF_PI + spreadAngle, 10);
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size * 0.8, 'player', rightVel));
        // console.log("Rapid fire shot!"); // Keep or remove debug log?
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
    // Use duration from settings if not provided (or validate provided duration)
    let duration = durationSeconds || GAME_SETTINGS.POWERUP_DURATION_S;
    console.log(`Player activated ${type} power-up for ${duration} seconds`);
    this.powerUpActive = true;
    this.powerUpType = type;
    // Calculate timer based on target FPS
    this.powerUpTimer = duration * GAME_SETTINGS.FPS;
  }
} 