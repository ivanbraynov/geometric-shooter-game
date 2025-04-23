// Boss.js
// Boss enemy for special boss fights
class Boss {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 120;
    this.color = color(255, 80, 0); // Orange-red
    this.health = BOSS_SETTINGS.HEALTH;
    this.maxHealth = BOSS_SETTINGS.HEALTH;
    this.phase = 1;
    this.lastShotTime = millis();
    this.fireRate = 700; // ms, can change per phase
    this.scoreValue = 500;
    this.vel = createVector(0, 1.2); // Slow downward
    this.entered = false;
    this.horizVel = random([3, -3]); // Horizontal speed, random initial direction
    this.moveCooldown = 0; // For random jumps
    this.invulnerableTimer = BOSS_SETTINGS.INVULNERABLE_TIME; // Frames of invulnerability after entry
  }

  update() {
    // Move boss onto screen, then start horizontal movement
    if (!this.entered) {
      this.pos.y += this.vel.y;
      if (this.pos.y > BOSS_SETTINGS.ENTRY_Y) {
        this.entered = true;
        this.vel.y = 0;
        this.invulnerableTimer = BOSS_SETTINGS.INVULNERABLE_TIME; // Reset on entry
      }
    } else {
      // Horizontal bouncing movement
      this.pos.x += this.horizVel;
      // Bounce off screen edges
      if (this.pos.x < this.size / 2) {
        this.pos.x = this.size / 2;
        this.horizVel *= -1;
      } else if (this.pos.x > width - this.size / 2) {
        this.pos.x = width - this.size / 2;
        this.horizVel *= -1;
      }
      // Optional: Occasionally jump to a random X position
      if (this.moveCooldown <= 0 && random() < 0.01) {
        this.targetX = random(this.size / 2, width - this.size / 2);
        this.moveCooldown = 60; // frames
      }
      if (this.moveCooldown > 0 && this.targetX !== undefined) {
        this.pos.x += (this.targetX - this.pos.x) * 0.08;
        this.moveCooldown--;
        if (abs(this.targetX - this.pos.x) < 5) {
          this.moveCooldown = 0;
        }
      }
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer--;
      }
    }
    // Firing logic
    let currentTime = millis();
    let wantsToShoot = false;
    if (this.entered && this.invulnerableTimer <= 0 && currentTime > this.lastShotTime + this.fireRate) {
      wantsToShoot = true;
      this.lastShotTime = currentTime;
    }
    return wantsToShoot;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    // Draw a large hexagon as the boss body
    let r = this.size / 2;
    fill(this.color);
    stroke(255, 200, 0);
    strokeWeight(4);
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = PI / 3 * i - PI / 6;
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    // Draw two angular 'eyes'
    fill(255, 255, 0, 220);
    noStroke();
    let eyeOffsetY = -r * 0.2;
    let eyeOffsetX = r * 0.35;
    let eyeW = r * 0.22;
    let eyeH = r * 0.18;
    rect(-eyeOffsetX, eyeOffsetY, eyeW, eyeH, 3);
    rect(eyeOffsetX, eyeOffsetY, eyeW, eyeH, 3);
    // Draw a glowing core
    fill(255, 80, 0, 120);
    ellipse(0, r * 0.25, r * 0.5, r * 0.5);
    // Draw invulnerability overlay if active
    if (this.invulnerableTimer > 0) {
      fill(255, 255, 255, 80);
      ellipse(0, 0, this.size * 1.25, this.size * 1.25);
    }
    pop();
  }

  shoot(playerRef) {
    // Boss fires a spread of projectiles aimed at the player
    let shots = 9; // Increased from 5 to 9 for more projectiles
    let spread = PI / 2; // Slightly wider spread
    // Calculate base angle towards player
    let dx = playerRef.pos.x - this.pos.x;
    let dy = playerRef.pos.y - this.pos.y;
    let baseAngle = atan2(dy, dx);
    for (let i = 0; i < shots; i++) {
      let angle = baseAngle - spread / 2 + (spread / (shots - 1)) * i;
      let vel = p5.Vector.fromAngle(angle, 7);
      let proj = new Projectile(this.pos.x, this.pos.y + this.size * 0.3, 'enemy', vel);
      enemyProjectiles.push(proj);
    }
  }

  hit() {
    if (this.invulnerableTimer > 0) return false; // Ignore hits while invulnerable
    this.health--;
    return this.health <= 0;
  }

  isOffscreen() {
    return (this.pos.y > height + this.size / 2);
  }
}
