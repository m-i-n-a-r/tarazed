// Config content (json): this configuration is applied to the particles
// Refer to https://github.com/VincentGarreau/particles.js/ to customize this file
// Background color and other properties are in tarazed.css

particlesJS('particlesjsrockets',
  
{
  "particles": {
    "number": {
      // Avoid high values, they cause lags
      "value": 8, 
      "density": {
        "enable": true,
        "value_area": 1500
      }
    },
    "shape": {
      "type": ["image"],
      // Use a png icon for this
      "image": { 
        "src": "assets/rocket.png",
        "width": 380,
        "height": 500
      }
    },
    "size": {
      "value": 25,
      "random": false,
      "anim": {
        "enable": false,
        "speed": 80,
        "size_min": 10,
        "sync": false
      }
    },
    "line_linked": {
      "enable": false,
      "distance": 150,
      "color": "#ffffff",
      "opacity": 0.5,
      "width": 1.5
    },
    "move": {
      "enable": true,
      "speed": 3,
      "direction": "top",
      "random": false,
      "straight": true,
      "out_mode": "out",
      "attract": {
        "enable": false,
        "rotateX": 600,
        "rotateY": 1200
      }
    }
  },
  "interactivity": {
    "detect_on": "window",
    "events": {
      "onhover": {
        "enable": true,
        "mode": "repulse"
      },
      "onclick": {
        // Avoid "push": if the user repeatedly clicks, the frame rate starts dropping
        "enable": true,
        "mode": "bubble"
      },
      "resize": true
    },
    "modes": {
      "grab": {
        "distance": 250,
        "line_linked": {
          "opacity": 1
        }
      },
      "bubble": {
        "distance": 300,
        "size": 20,
        "duration": 0.5,
        "opacity": 6,
        "speed": 6
      },
      "repulse": {
        "distance": 50,
        "duration": .5
      },
      "push": {
        "particles_nb": 4
      },
      "remove": {
        "particles_nb": 2
      }
    }
  },
  "retina_detect": true,
}

);