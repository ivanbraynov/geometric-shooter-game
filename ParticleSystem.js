// Manages a collection of particles for effects like explosions
class ParticleSystem {
  constructor(x, y, baseColor, shakeCallback) {
    this.origin = createVector(x, y);
    this.particles =[]; // Initialize particle array for this system
    let numParticles = floor(random(15, 30)); // Number of particles per explosion
    // Create the specified number of particles
    for (let i = 0; i < numParticles; i++) {
      this.particles.push(new Particle(this.origin.x, this.origin.y, baseColor));
    }
    // Trigger a small screen shake when an explosion happens, if callback provided
    if (typeof shakeCallback === 'function') {
        shakeCallback(10, 2);
    }
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