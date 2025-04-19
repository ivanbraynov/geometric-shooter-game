class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height); // Start stars anywhere on screen initially
    this.size = random(0.5, 3);
    // Parallax: Smaller/distant stars move slower, larger/closer stars move faster
    this.speed = map(this.size, 0.5, 3, 0.5, 2.5); // Adjust speed range for desired effect
    this.colorVal = random(150, 255); // Base brightness
    // Map speed/size to opacity (faster/bigger = more opaque, but generally fainter than planets)
    this.opacity = map(this.speed, 0.5, 2.5, 50, 200); 
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
    // Apply opacity to the fill color
    fill(this.colorVal, this.opacity);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
    // point(this.x, this.y); // Alternative: Use point() for potentially better performance with many stars
  }
} 