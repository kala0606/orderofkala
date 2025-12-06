// Adapted Boid class for main page integration

class Boid {
  constructor(j, width, height, p5Instance) {
    this.p = p5Instance;
    this.width = width;
    this.height = height;
    this.DIM = Math.min(width, height);
    this.M = this.DIM / 1000;
    
    this.position = this.p.createVector(this.p.random(width), 175);
    this.velocity = this.p.createVector(1, 0);
    this.ran_velocity = this.p.createVector(1, 0);
    this.velocity.setMag(this.p.random(-1 * this.M, 1 * this.M));
    this.acceleration = this.p.createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 1 * this.M;
    this.j = j;

    this.rs = R.random_num(0, 1);
    this.rsv = R.random_num(1, 2);
    this.rsvb = R.random_num(10, 100);
  }

  edges() {
    if (this.position.x > this.width - 20 * this.M) {
      this.position.x = 0 + 20 * this.M;
    } else if (this.position.x <= 0 + 20 * this.M) {
      this.position.x = this.width - 20 * this.M;
    }
    if (this.position.y > this.DIM - 20 * this.M) {
      this.position.y = 0;
    } else if (this.position.y < 0 + 20 * this.M) {
      this.position.y = this.height - 20 * this.M;
    }
  }

  flock(boids) {
    // Flocking behavior disabled for cleaner visuals
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
  }

  show() {
    if (this.rs <= 0.9) var fsw = this.rsv;
    else var fsw = this.rsvb;

    this.p.noStroke();
    this.p.fill(scol);
    this.p.push();
    this.p.translate(this.position.x, this.j * (this.height / hr) + this.height / hr / 2);
    var r = this.p.map(
      this.p.noise(this.position.x / (30 * this.M), this.position.y / (30 * this.M), seconds / 100),
      0, 1, -this.p.PI / 30, this.p.PI / 30
    );
    this.p.rotate(r);

    this.p.rect(
      0, 0,
      3 * this.M + this.p.noise(this.j / (100 * this.M) + this.position.x / (100 * this.M)) * fsw * this.M,
      this.height / hr - 15 * this.M
    );
    this.p.pop();
  }
}

