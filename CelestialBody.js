class CelestialBody {
  constructor(yPosition = null) {
    this.type = random(1) < 0.3 ? "sun" : "planet"; // 30% chance of sun
    this.size = this.type === "sun" ? random(80, 150) : random(40, 100);

    // Calculate speed based on size (MUCH slower than before)
    const baseSpeed = this.type === "sun" 
                      ? map(this.size, 80, 150, 0.01, 0.05) 
                      : map(this.size, 40, 100, 0.03, 0.08);
    this.speed = baseSpeed;

    // Calculate opacity based on size (MUCH dimmer/more transparent than before)
    this.opacity = map(this.size, 40, 150, 20, 80); // Max opacity significantly reduced

    // Set initial position
    // If yPosition is null, place it randomly above the screen, otherwise use the provided yPosition.
    const initialY = yPosition === null ? random(-this.size * 2, -this.size * 0.5) : yPosition;
    this.pos = createVector(random(width), initialY);

    // Generate colors with opacity applied
    if (this.type === "sun") {
      this.baseColor = color(255, random(150, 255), 0, this.opacity); // Shades of orange/yellow
      this.atmosphereColor = color(255, 100, 0, this.opacity * 0.5); // Fainter orange
    } else {
      // Planet colors
      let r = random(50, 200);
      let g = random(50, 200);
      let b = random(100, 255);
      this.baseColor = color(r, g, b, this.opacity);
      this.atmosphereColor = color(r * 0.7, g * 0.7, b * 0.7, this.opacity * 0.5); // Dimmer version for atmosphere
    }
  }

  resetPosition() {
    // Reset position to be just above the screen
    this.pos.x = random(width);
    this.pos.y = random(-this.size * 2, -this.size * 0.5);
    // Recalculate properties that might depend on position or need refreshing (optional)
    // For now, just resetting position seems sufficient.
  }

  update() {
    this.pos.y += this.speed;
    if (this.pos.y > height + this.size * 1.5) {
      this.resetPosition();
    }
  }

  display() {
    // Draw atmosphere (larger, fainter circle behind)
    fill(this.atmosphereColor);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size * 1.2, this.size * 1.2);

    // Draw main body
    fill(this.baseColor);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    // Optional: Add details like rings or craters for planets if desired
  }
} 