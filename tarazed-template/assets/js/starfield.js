// Config content (json): this configuration is applied to the particles
// Refer to https://github.com/VincentGarreau/particles.js/ to customize this file
// Background color and other properties are in tarazed.css

selColors = ["#7da1e8", "#999999", "#ff0ff0"]; // "#ffcc00" for yellow stars

particlesJS('particlesjsstarfield',
  
{
  "particles": {
    "number": {
      // Avoid high values, they cause lags
      "value": 340, 
      "density": {
        "enable": false,
        "value_area": 600
      }
    },
    "color": {
      "value": selColors
    },
    "shape": {
      "type": ["circle"],
      "stroke": {
        "width": 1,
        "color": "#bbbbbb"
      },
    },
    "opacity": {
      "value": 0.8,
      "random": false,
      "anim": {
        "enable": true,
        "speed": 1,
        "opacity_min": 0.2,
        "sync": false
      }
    },
    "size": {
      "value": 1,
      "random": false,
      "anim": {
        "enable": true,
        "speed": 1,
        "size_min": 0.5,
        "sync": false
      }
    },
    "line_linked": {
      "enable": false,
      "distance": 150,
      "color": selColors[0],
      "opacity": 0.5,
      "width": 1.5
    },
    "move": {
      "enable": true,
      "speed": 0.5,
      "direction": "random",
      "random": true,
      "straight": false,
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
        "enable": false,
        "mode": "null"
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
        "size": 1.5,
        "duration": 0.2,
        "opacity": 0.7,
        "speed": 60
      },
      "repulse": {
        "distance": 250
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