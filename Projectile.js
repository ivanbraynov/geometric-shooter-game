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
    // Other object's radius needs to be determined carefully
    let otherRadius = 0;
     if (other instanceof Enemy) {
        otherRadius = other.size / 2;
     } else if (other instanceof Player) {
         otherRadius = other.size / 2;
     } else if (other instanceof PowerUp) { // Added check for PowerUp
         otherRadius = other.size / 2;
     } else {
         otherRadius = (other.size || 0) / 2; // Fallback
     }
    return d < collisionRadius + otherRadius;
  }
} 