window.onload = function () {

  var surface = document.getElementById('screen').getContext('2d');
  var particles = [];

  var gravity = { x: 0, y: 0.1 };
  var bounciness = 0.3;
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

  var putGreenPixel = getPutPixelFunction(surface, 0, 1, 0, 1);

  function random(min, max) {
    var range = max - min;
    return (Math.random() * range) + min;
  }

  function generateParticle() {
    particles.push({ x: 200, y: 10 });
  }


  /// Returns true if there is another particle below the given particle
  function hasParticleBelow(particle, particles) {
    var i;
    for (var i = particles.length - 1; i >= 0; i--) {
      if (particles[i].x === particle.x && particles[i].y === (particle.y + 1)) {
        return true;
      }
    }

    return false;
  }

  var currentScreen = {
    draw: function (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(0, floor.y+2);
      ctx.lineTo(ctx.canvas.width, floor.y+2);
      ctx.stroke();

      for (var i = particles.length - 1; i >= 0; i--) {
        putGreenPixel(particles[i].x, particles[i].y);
      }

    },
    update: function () {
      if (random(0, 10) < 1) {
        generateParticle();
      }

      var particle;
      for (var i = particles.length - 1; i >= 0; i--) {
        particle = particles[i];
        if (particle.y == floor.y) {
          continue;
        }
        if (hasParticleBelow(particle, particles)) {
          continue;
        }
        particle.y += 1;
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