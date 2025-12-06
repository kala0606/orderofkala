// Simplified clock visualization for the main page
// Based on the Timelines sketch

const rand_seed = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
var tempHash = "0x" + rand_seed(64);

tokenData = {
  hash: tempHash,
  tokenId: "123000456",
};

let hash = tokenData.hash;
let seed = parseInt(tokenData.hash.slice(0, 16), 16);

class Random {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substr(0, 8), 16);
      let b = parseInt(uint128Hex.substr(8, 8), 16);
      let c = parseInt(uint128Hex.substr(16, 8), 16);
      let d = parseInt(uint128Hex.substr(24, 8), 16);
      return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };
    this.prngA = new sfc32(tokenData.hash.substr(2, 32));
    this.prngB = new sfc32(tokenData.hash.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }
  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }
  random_bool(p) {
    return this.random_dec() < p;
  }
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}

let R = new Random(seed);

var rows = [];
let bcol, scol;
let lastMinute = -1;
let lastSecond = -1;

let hours;
let minutes;
let seconds;

let r1, r2;
let hr;

// p5.js instance mode setup
new p5((p) => {
  let canvasWidth, canvasHeight;
  
  p.setup = function() {
    // Get the container size
    let container = document.getElementById('clock-canvas');
    canvasWidth = container.offsetWidth;
    canvasHeight = container.offsetHeight;
    
    let canvas = p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);
    canvas.parent('clock-canvas');
    
    p.rectMode(p.CENTER);

    r1 = R.random_num(0.1, 4);
    r2 = R.random_num(1, 8);

    hours = p.hour();
    minutes = p.minute();
    seconds = p.second();
    
    setHour();
    setMinute();
  };

  p.draw = function() {
    p.frameRate(60);
    p.smooth();

    p.noStroke();
    
    p.scale(0.8);
    p.translate(-canvasWidth/2, -canvasHeight/2);

    hours = p.hour();
    minutes = p.minute();
    seconds = p.second();

    p.clear();

    // Flash effect at the top of each hour
    if (minutes === 0 && seconds % 2 == 0) {
      p.fill(scol);
      p.noStroke();
      for (let j = 0; j < hr; j++) {
        p.rect(canvasWidth/2, j * canvasHeight/hr + canvasHeight/hr/2, canvasWidth, canvasHeight/hr - 15);
      }
    }

    // Animate rows
    for (let j = 0; j < hr; j++) {
      rows[j].anim();
    }

    // Check for hour change
    if (minutes === 0 && minutes !== lastMinute) {
      console.log("New hour!");
      setHour();
      lastMinute = 0;
    } else if (minutes !== lastMinute) {
      lastMinute = minutes;
    }

    // Check for minute change
    if (seconds === 0 && seconds !== lastSecond) {
      setMinute();
      lastSecond = 0;
    } else if (seconds !== lastSecond) {
      lastSecond = seconds;
    }
  };

  function setHour() {
    let clockContainer = document.getElementById('clock-canvas');
    
    if (hours > 12) {
      hr = hours - 12;
      bcol = p.color(255);
      scol = p.color(0);
      // Set background to white with opacity
      if (clockContainer) {
        clockContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }
    } else if (hours == 12) {
      hr = hours;
      bcol = p.color(255);
      scol = p.color(0);
      // Set background to white with opacity
      if (clockContainer) {
        clockContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }
    } else if (hours == 0) {
      hr = 12;
      bcol = p.color(0);
      scol = p.color(255);
      // Set background to black with opacity
      if (clockContainer) {
        clockContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      }
    } else {
      hr = hours;
      bcol = p.color(0);
      scol = p.color(255);
      // Set background to black with opacity
      if (clockContainer) {
        clockContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      }
    }

    rows = [];
    for (let j = 0; j < hr; j++) {
      rows.push(new Row(j, canvasWidth, canvasHeight, p));
    }
  }

  function setMinute() {
    for (let row of rows) {
      if (minutes != 0) {
        row.addmin();
      }
    }
  }

  // Handle window resize
  p.windowResized = function() {
    let container = document.getElementById('clock-canvas');
    canvasWidth = container.offsetWidth;
    canvasHeight = container.offsetHeight;
    p.resizeCanvas(canvasWidth, canvasHeight);
    
    // Update rows with new dimensions
    for (let row of rows) {
      row.width = canvasWidth;
      row.height = canvasHeight;
    }
  };
});

