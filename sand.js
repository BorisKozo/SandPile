window.onload = function () {

  var surface = document.getElementById('screen').getContext('2d');
  var sand = [];

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

  function generateSandParticle() {
    sand.push({ x: 200, y: 10 });
  }

  var currentScreen = {
    draw: function (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(0, floor.y+1);
      ctx.lineTo(ctx.canvas.width, floor.y+1);
      ctx.stroke();

      for (var i = sand.length - 1; i >= 0; i--) {
        putGreenPixel(sand[i].x, sand[i].y);
      }

    },
    update: function () {
      if (random(0, 50) < 1) {
        generateSandParticle();
      }

      var p;
      for (var i = sand.length - 1; i >= 0; i--) {
        p = sand[i];

        p.x += 0;
        p.y += 1;


        // hit the floor (or interact with other particles)
        // this logic is very dependent on the nature of the interaction
        if (p.y == floor.y) {
          p.y = floor.y-1;
        }

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