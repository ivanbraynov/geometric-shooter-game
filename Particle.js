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