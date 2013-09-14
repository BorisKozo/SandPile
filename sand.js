window.onload = function () {
  //Particles class
  var Particles = function () {
    this.data = {};
    this.tempParticles = [];
    this._isDirty = false;
  }

  Particles.encodeId = function (x, y) {
    return x.toString() + "|" + y.toString();
  }

  Particles.prototype.setParticle = function (particle) {
    this.data[Particles.encodeId(particle.x, particle.y)] = particle;
    this._isDirty = true;
  }

  Particles.prototype.getParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    var result = this.data[id];
    if (result) {
      return result;
    }

    return null;
  }

  Particles.prototype.deleteParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    this.data[id] = null;
    this._isDirty = true;
  }

  Particles.prototype.getAllParticles = function () {
    var particleId;
    var count = 0;

    if (!this._isDirty) {
      return this.tempParticles;
    }

    for (particleId in this.data) {
      if (this.data.hasOwnProperty(particleId) && this.data[particleId] !== null) {
        this.tempParticles[count] = this.data[particleId];
        count++;
      }
    }
    this.tempParticles.length = count;
    return this.tempParticles;
  }


  var surface = document.getElementById('screen').getContext('2d');
  var fpsLabel = document.getElementById('fps-label');
  var particleCounterLabel = document.getElementById('particle-counter-label');
  var fps = 0;
  var particles = new Particles();

  var floor = { y: 300 };

  function getPutPixelFunction(context, r, g, b, a) {
    var id = context.createImageData(1, 1);   // only do this once per page
    var d = id.data;                        // only do this once per page
    d[0] = r;
    d[1] = g;
    d[2] = b;
    d[3] = a;
    return function (x, y) {
      context.putImageData(id, x, y);
    }
  }

  var putGreenPixel = getPutPixelFunction(surface, 0, 255, 0, 255);

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
    draw: function (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(0, floor.y + 2);
      ctx.lineTo(ctx.canvas.width, floor.y + 2);
      ctx.stroke();
      var particlesData = particles.getAllParticles();
      for (var i = particlesData.length - 1; i >= 0; i--) {
        putGreenPixel(particlesData[i].x, particlesData[i].y);
      }

      fpsLabel.innerText = fps;
      particleCounterLabel.innerText = particlesData.length;


    },
    update: function (delta) {
      fps = Math.round((1 / delta)*1000);
      generateParticle();

      var particle, left, right;
      var particlesData = particles.getAllParticles();
      for (var i = particlesData.length - 1; i >= 0; i--) {
        particle = particlesData[i];
        if (particle.y == floor.y) {
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
              }
            }
          }
        } else {
          particle.y += 1;
        }

        particles.setParticle(particle);
      }
    }
  };

  function beginLoop() {
    var frameId = 0;
    var lastFrame = Date.now();

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