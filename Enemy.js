class Enemy {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // Should be one of ENEMY_TYPES

    // Type-specific properties
    switch (this.type) {
      case ENEMY_TYPES.DRONE:
        this.size = 25;
        this.color = color(150, 150, 150); // Grey
        this.health = 1;
        this.speed = random(1, 2.5);
        this.vel = createVector(0, this.speed);
        this.fireRate = 2500; // ms
        this.scoreValue = 10;
        this.movementPattern = 'linear';
        break;
      case ENEMY_TYPES.SCOUT:
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
      case ENEMY_TYPES.HEAVY:
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

    // Firing Logic - Determine if ready to fire
    let currentTime = millis();
    let wantsToShoot = false;
    if (currentTime > this.lastShotTime + this.fireRate) {
      // Only decide to shoot if on screen (or just entering)
      if (this.pos.y > -this.size / 2) {
          wantsToShoot = true;
          this.lastShotTime = currentTime;
      }
    }
    return wantsToShoot; // Return intent to shoot
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill(this.color);
    stroke(255); // White outline for visibility
    strokeWeight(1.5);

    // Draw based on type
    switch (this.type) {
      case ENEMY_TYPES.DRONE: // Drone (Square with inset)
        rect(0, 0, this.size, this.size, 3); // Slightly rounded corners
        fill(red(this.color)*0.5, green(this.color)*0.5, blue(this.color)*0.5, 180); // Darker inset
        noStroke();
        rect(0, 0, this.size * 0.6, this.size * 0.6, 2);
        break;
      case ENEMY_TYPES.SCOUT: // Scout (Pointy Triangle)
        triangle(0, -this.size / 1.5, -this.size / 2, this.size / 2, this.size / 2, this.size / 2);
        fill(255, 255, 0); // Yellow detail/cockpit
        noStroke();
        ellipse(0, this.size * 0.1, this.size * 0.3, this.size * 0.3);
        break;
      case ENEMY_TYPES.HEAVY: // Heavy (Bulky Rectangle with 'cannons')
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

  shoot(playerRef) {
    // Create a projectile originating from the enemy's position
    let proj = new Projectile(this.pos.x, this.pos.y + this.size / 2, 'enemy');

    // Type specific firing modifications
    if (this.type === ENEMY_TYPES.SCOUT) { // Scout aims slightly towards player
        // Calculate angle from enemy to player using playerRef
        let aimAngle = atan2(playerRef.pos.y - this.pos.y, playerRef.pos.x - this.pos.x);
        // Add some slight inaccuracy
        aimAngle += random(-0.15, 0.15); // Radians
        // Set projectile velocity based on angle and a fixed speed
        proj.vel = p5.Vector.fromAngle(aimAngle, 4); // Aimed, speed 4
    } else if (this.type === ENEMY_TYPES.HEAVY) { // Heavy shoots faster projectile straight down
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