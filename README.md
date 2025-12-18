# ✨ Particle Simulation Camera

A 3D particle system that uses your webcam to drive real-time particle effects. Built from a single Gemini prompt.

![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/Canvas-E34F26?style=flat-square&logo=html5&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC_Camera-333333?style=flat-square&logo=webrtc&logoColor=white)

---

## The experiment

Saw people on Twitter/X building impressive web apps with a single AI prompt. Had to try it.

Gave **Gemini 3 Pro** one prompt asking for an interactive particle system with webcam integration, shape templates (logo, heart, saturn, flower, buddha, fireworks), and physics-based motion. Got back ~1200 lines of working JavaScript in one shot.

The `gemini-3-pro-code.html` file is the raw output — kept it in the repo as a reference for what single-prompt generation looks like.

## What it does

- Particles arrange into predefined 3D shapes
- Your webcam feed drives motion detection
- Spring physics for smooth transitions between shapes
- Canvas-based 3D rendering (perspective projection, no Three.js)
- Color picker and template switcher

## Run it

```bash
open index.html
# or
python3 -m http.server 8000
```

Camera access needs HTTPS or localhost.
