// Flocking
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/124-flocking-boids.html
// https://youtu.be/mhjuuHl6qHM

class Row {
    constructor(j) {
      // this.minutes = minute()
      this.flock = [];
      this.j = j;
      // this.minutes = minute();
      // for(let j = 0; j <= hour(); j++){
        this.setup();
        
    }

    setup(){
      this.flock = [];
      for (let i = 0; i < minutes; i++) {
        this.flock.push(new Boid(this.j));
      // }
  
      // startHour = hour();
      }
    }

    addmin(){
      // if(minute!=0){
      this.flock.push(new Boid(this.j));
      // }
    }
  
    anim() {
      for (let boid of this.flock) {
        boid.edges();
        // boid.flock(this.flock);
        // if(int(frameCount)%60<40 && int(frameCount)%60>30){
          boid.flock(this.flock);
          boid.update();
          // boid.velo = averageAmplitude;
        // }
        boid.show();
      }  
    }
  
 
  
    update() {

      
     
    }
  
    // show() {
    //   strokeWeight(0);
    //   stroke(255);
    //   push()
    //   translate(this.position.x, this.position.y)
    // //   rotate(sin(frameCount/200)/10)
    //   rect(0, 0, 1, 100);
    //   pop()
    // }
  }
  