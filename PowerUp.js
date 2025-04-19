class PowerUp {
  constructor(x, y, type = POWERUP_TYPES.RAPID_FIRE) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 1); // Slow downward drift
    this.size = 15;
    this.type = type; // Set type based on argument
    this.pulseOffset = random(TWO_PI); // For unique pulsing per item

    // Set color based on type (can be moved to display if needed)
    switch(this.type) {
      case POWERUP_TYPES.EXTRA_LIFE:
        this.color = color(0, 255, 0); // Green
        break;
      case POWERUP_TYPES.NUKE:
        this.color = color(255, 0, 0); // Red
        break;
      case POWERUP_TYPES.RAPID_FIRE:
      default:
        this.color = color(255, 255, 0); // Yellow
        break;
    }
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