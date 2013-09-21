Drawing a pile of sand - The road to 10K particles at 60 FPS using JavaScript.
==============================================================================

A few months ago I saw an [excellent post](http://html5hub.com/build-a-javascript-particle-system/) by Jarrod Overson
(@jsoverson) about particle systems in JavaScript. Jarrod implemented a very cool demo of this system
[on his website](http://jarrodoverson.com/static/demos/particleSystem/).
This post and demo reminded me that I always wanted to implement a sand game in JavaScript (e.g. [this sand game in flash](http://www.kongregate.com/games/ajs11893/falling-sands))
but never got past the first hurdle of running the game at constant 60FPS. 
So I set a simpler goal: Draw a pile of sand with at least 10K particles. 
My only constraint was that the implementation would have to keep track of all the particles so that I could extend it to the full game when the time comes. 
My journey began with a Twitter query to which Christopher Bennage (@benagge) [provided this demo project](http://jsbin.com/uhUFAtE/2). 
This was not exactly what I wanted to do (I blame my poor communication skills for that) but it gave me an excellent starting point to get my project going.

I stripped the example from everything I didn't need and the reuslt was this: [http://jsfiddle.net/zbzzn/AFCdy/1/]
I added an invisible particle emitter at (200,10). 
This emitter emits particles at random intervals and they fall down and create a pile of green sand on the floor. Well... Not exactly... I had a bug with the green color of the particles and it seems that they don't form a pile but instead fall into the same pixel.
This is to be expected because there isn't any interaction between the particles and they simply ignore each other and fall all the way to the floor.

So I added some interaction between the particles (http://jsfiddle.net/zbzzn/AFCdy/3/). If the particle has another particle exactly below it, it will not fall into that particle and remain on top. The code looks something like this, where _particle_ is the tested particle and _particles_ is an array of all the particles on screen:
```js
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
```

And now I had a pile of green sand! Well... There was a problem again... The sand still wasn't green and instead of a pile I got a pilar. 
So I could rename this article to "Drawing a pilar of sand" and be done with it but where would be the fun with that. 
The problem is clearly that once a particle lands on top of some other particle it should fall over to the side. 
I won't go into the physics of that but if you are intereseted you can read about [unstable equilibrium](http://en.wikipedia.org/wiki/Mechanical_equilibrium). 
I added a simple logic to handle this case: If there is a vacant space to the bottom left or the bottom right of the particle, fill that vacant place (at random if both sides are vacant). 
The full code can be found in this revision - [http://jsfiddle.net/zbzzn/AFCdy/4/]
Now the update function looks like this:
```js
    update: function (delta) {
      fps = Math.round((1 / delta)*1000);
      generateParticle();

      var particle, left, right;
      for (var i = particles.length - 1; i >= 0; i--) {
        particle = particles[i];
        if (particle.y == floor.y) {
          continue;
        }
        if (hasParticleBelow(particle, particles)) {
          left = isFree(particle.x - 1, particle.y + 1, particles);
          right = isFree(particle.x + 1, particle.y + 1, particles);
          if (left && right) {
            particle.y += 1;
            particle.x += randomDirection(); // returns 1 or -1 at random
            continue;
          }
          if (left) {
            particle.y += 1;
            particle.x -= 1;
            continue;
          }
          if (right) {
            particle.y += 1;
            particle.x += 1;
            continue;
          }
          continue;
        }
        particle.y += 1;
      }
    }
  };
```


When the particle falls on top of another particle it will move left or right based on the vacancy in that direction. 
Some other changes in this version are:

* Finally got the green color working - Looks like the _ImageData_ structure saves the color values in the 0-255 scale and not in the 0-1 scale as I initially thought.

* A particle is generated at every frame (i.e. every call to update function).
 
* I added some elements to track the FPS and the total number of particles on screen.

The example works great. A green pile of sand is generated. There is just one problem... Performance!
If I would ever make this example into a game I would need to run the update-draw loop in 60FPS which means 16ms per iteration
of the loop. The current code runs smoothly to about 1K particles and then slows down to 30 and then 10 and later 1 FPS. I used
the Chrome Dev Tools Frames profiler to visualize this issue.

![update-draw loop consuming more and more time](/images/1k.png "Chrome Dev Tools breakdown of the frames time consumption")

** Basic changes

I started by applying two basic changes. The first change was in the _update_ function. I noticed that there is a double for
loop that iterated over the entire array of particles and checks the interaction between each two. Clearly the lookup of a
particle can be much faster if the array is replaced with a [hash table](http://en.wikipedia.org/wiki/Hash_table). 
I replaced the _particles_ array with a simple data structure that uses a JavaScript Object as a hash table.

```js
  var Particles = function () {
    this.data = {}; // The hash table for the particles
    this.tempParticles = []; // an array which stores an array of all the particles
    this._isDirty = false; // when true, the tempParticles array needs to be reconstructed
  }

  // Converts (x,y) coordinate to a unique string
  Particles.encodeId = function (x, y) {  return x.toString() + "|" + y.toString();  }

  // Adds a particle to the hash table (not called "add" because the particle may overwrite another particle)
  Particles.prototype.setParticle = function (particle) {
    this.data[Particles.encodeId(particle.x, particle.y)] = particle;
    this._isDirty = true;
  }

  // Returns a particle at the (x,y) coordinate or null if there isn't such a particle.
  Particles.prototype.getParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    var result = this.data[id];
    if (result) { return result;}
    return null;
  }

  // Deletes a particle from an (x,y) coordinate
  Particles.prototype.deleteParticle = function (x, y) {
    var id = Particles.encodeId(x, y);
    this.data[id] = null;
    this._isDirty = true;
  }

 // Returns an array of all the particles stored in the hash-table
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
```

This very simple data structure wraps around JavaScript objects and provides a simple CRUD API for particles. 
Instead of searching for a particle in an array I can now directly retrieve it by calling _getParticle_. 
The _update_ function is updated to use this new data structure and looks like this:
```js
      var particlesData = particles.getAllParticles();
      for (var i = particlesData.length - 1; i >= 0; i--) {
        particle = particlesData[i];
        if (particle.y == floor.y) continue;
        
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
```
A nice side effect of using this method is that I now have two buffers for particles, one for reading and one for writing. 
This is important because I want the state of the next frame to be changed based on the state of the current frame and not
depend on the order in which the particles are processed. You can witness this side effect by the lack of jittering in the
stream of sand coming out of the emitter which was caused by the processing order of the particles.

![Jittering stops when using two buffers](/images/jitter.png "Jittering stops when using two buffers")

The second improvement is in the _draw_ function. Initially I used _context.createImageData_ to create an image of a single green
(at least eventually it was green) pixel and then drawing it for each particle. This method was suggested in [this SO answer](http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas)
which is somewhat old and not true anymore. Changing the drawing method to a simple 1x1 filled rectangle did the trick.

```js
  var putGreenPixel = function (context, x, y) {
    context.fillStyle = "#0F0";
    context.fillRect(x, y, 1, 1);
  }
```

After these two improvements I could get 60 FPS with about 4.5K particles on the screen.

** 
 


Note: I am ignoring the memory consumption of my code for brevity of this text. I should be using object pools and other measures 
to decrease the memory pressure and GC calls.


  http://jsfiddle.net/zbzzn/AFCdy/6/