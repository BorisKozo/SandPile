window.onload = function () {
  //Particles class
  var Particles = function () {

    this.size = 0;

    this.allParticles = {};
    this.tempParticles = [];
    this.isDirty = false;

    this.activeParticles = {};
    this.tempActiveParticles = [];

    this.toDelete = [];
    this.toSet = [];
  }

  Particles.encodeId = function (x, y) {
    return x.toString() + "|" + y.toString();
  }

  Particles.prototype.getParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    var result = this.allParticles[id];
    if (result) {
      return result;
    }
    return null;
  }

  Particles.prototype.setParticle = function (particle) {
    var id = Particles.encodeId(particle.x, particle.y);
    this.allParticles[id] = particle;
    this.activeParticles[id] = particle;
    this.toSet.push({ x: particle.x, y: particle.y });
    this.size += 1;
    this.isDirty = true;
  }

  Particles.prototype.deleteParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    var particle = this.allParticles[id];
    this.allParticles[id] = null;
    if (this.activeParticles[id]) {
      this.activeParticles[id] = null;
    }
    this.toDelete.push({ x: particle.x, y: particle.y });
    this.size -= 1;
    this.isDirty = true;
  }

  Particles.prototype.activate = function (particle) {
    var id = Particles.encodeId(particle.x, particle.y);
    if (!this.activeParticles[id]) {
      this.activeParticles[id] = particle;
    }
  }

  Particles.prototype.deactivate = function (particle) {
    var id = Particles.encodeId(particle.x, particle.y);
    if (this.activeParticles[id]) {
      this.activeParticles[id] = null;
    }
  }


  Particles.prototype.getAllParticles = function () {
    var particleId;
    var count = 0;

    if (!this.isDirty) {
      return this.tempParticles;
    }

    for (particleId in this.allParticles) {
      if (this.allParticles.hasOwnProperty(particleId) && this.allParticles[particleId] !== null) {
        this.tempParticles[count] = this.allParticles[particleId];
        count++;
      }
    }
    this.tempParticles.length = count;
    return this.tempParticles;
  }

  Particles.prototype.getActiveParticles = function () {
    var particleId;
    var count = 0;


    for (particleId in this.activeParticles) {
      if (this.activeParticles.hasOwnProperty(particleId) && this.activeParticles[particleId] !== null) {
        this.tempActiveParticles[count] = this.activeParticles[particleId];
        count++;
      }
    }
    this.tempActiveParticles.length = count;
    return this.tempActiveParticles;
  }

  Particles.prototype.reset = function () {
    this.toDelete.length = 0;
    this.toSet.length = 0;
  }

  var surface = document.getElementById('screen').getContext('2d');
  var fpsLabel = document.getElementById('fps-label');
  var particleCounterLabel = document.getElementById('particle-counter-label');
  var activeParticleCounterLabel = document.getElementById('active-particle-counter-label'); 
  var fps = 0;
  var activeParticleCount = 0;
  var particles = new Particles();

  var floor = { y: 300 };

  var putGreenPixel = function (context, x, y) {
    context.fillStyle = "#0F0";
    context.fillRect(x, y, 1, 1);
  }

  var putBlackPixel = function (context, x, y) {
    context.fillStyle = "#000";
    context.fillRect(x, y, 1, 1);
  }

  function random(min, max) {
    var range = max - min;
    return (Math.random() * range) + min;
  }

  function generateParticle() {
    particles.setParticle({ x: 200, y: 10 });
  }


  /// returns 1 or -1 at random
  function randomDirection() {
    if (random(0, 1) > 0.5) {
      return 1;
    }
    return -1;
  }

  /// returns true if the position (x,y) is free of particles
  function isFree(x, y, particles) {
    return particles.getParticle(x,y) === null;
  }

  /// Returns true if there is another particle below the given particle
  function hasParticleBelow(particle, particles) {
    return !isFree(particle.x, particle.y + 1, particles);
  }

  var currentScreen = {
    drawStage : function(ctx){
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(0, floor.y + 2);
      ctx.lineTo(ctx.canvas.width, floor.y + 2);
      ctx.stroke();
    },

    draw: function (ctx) {
      var i;
      
      for (i = particles.toDelete.length - 1; i >= 0; i--) {
        putBlackPixel(ctx, particles.toDelete[i].x, particles.toDelete[i].y);
      }

      for (i = particles.toSet.length - 1; i >= 0; i--) {
        putGreenPixel(ctx, particles.toSet[i].x, particles.toSet[i].y);
      }

      particles.reset();


      fpsLabel.innerText = fps;
      particleCounterLabel.innerText = particles.size;
      activeParticleCounterLabel.innerText = activeParticleCount;
      if (fps < 55) {
        console.log(particles.size);
      }

    },
    update: function (delta) {
      fps = Math.round((1 / delta)*1000);
      generateParticle();

      var particle, left, right;
      var particlesData = particles.getActiveParticles();
      for (var i = particlesData.length - 1; i >= 0; i--) {
        particle = particlesData[i];
        if (particle.y == floor.y) {
          particles.deactivate(particle);
          continue;
        }
        particles.deleteParticle(particle.x, particle.y);
        if (hasParticleBelow(particle, particles)) {
          left = isFree(particle.x - 1, particle.y + 1, particles);
          right = isFree(particle.x + 1, particle.y + 1, particles);

          if (left && right) {
            particle.y += 1;
            particle.x += randomDirection();
          } else {
            if (left) {
              particle.y += 1;
              particle.x -= 1;
            }
            else {
              if (right) {
                particle.y += 1;
                particle.x += 1;
              } else {
                particles.setParticle(particle);
                particles.deactivate(particle);
                continue;
              }
            }
          }
        } else {
          particle.y += 1;
        }

        particles.setParticle(particle);
      }

      activeParticleCount = particlesData.length;
    }
  };

  function beginLoop() {
    var frameId = 0;
    var lastFrame = Date.now();
    currentScreen.drawStage(surface);

    function loop() {
      var thisFrame = Date.now();

      var elapsed = thisFrame - lastFrame;

      frameId = window.requestAnimationFrame(loop);

      currentScreen.update(elapsed);
      currentScreen.draw(surface);

      lastFrame = thisFrame;
    }

    loop();
  }

  beginLoop();
}