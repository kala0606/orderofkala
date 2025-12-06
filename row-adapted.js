// Adapted Row class for main page integration

class Row {
  constructor(j, width, height, p5Instance) {
    this.flock = [];
    this.j = j;
    this.width = width;
    this.height = height;
    this.p = p5Instance;
    this.setup();
  }

  setup() {
    this.flock = [];
    for (let i = 0; i < minutes; i++) {
      this.flock.push(new Boid(this.j, this.width, this.height, this.p));
    }
  }

  addmin() {
    this.flock.push(new Boid(this.j, this.width, this.height, this.p));
  }

  anim() {
    for (let boid of this.flock) {
      boid.edges();
      boid.flock(this.flock);
      boid.update();
      boid.show();
    }
  }

  update() {
    // Reserved for future use
  }
}

