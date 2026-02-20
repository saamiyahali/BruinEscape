# Bruin Escape

UCLA CS 174A - Computer Graphics

## Overview

Bruin Escape is a 3rd-person 3D endless-runner platformer built with Three.js. Players control Joe Bruin as he races through the hallways of Boelter Hall, dodging obstacles floor by floor to reach his classroom on floor 8.

Inspired by **Run 3** and **Subway Surfers**.

## How to Run

```bash
npm install
npx vite
```

Then open `http://localhost:5173` in your browser.

## Project Structure

```
bruin-escape/
├── index.html
├── main.js                  # game loop + initialization
├── src/
│   ├── core/
│   │   ├── scene.js         # scene, renderer, resize handling
│   │   └── camera.js        # fixed 3rd-person camera
│   ├── player/
│   │   ├── joe.js           # player model + movement
│   │   └── input.js         # keyboard state
│   └── world/
│       ├── hallway.js       # hallway geometry + scrolling
│       └── bounds.js        # hallway boundary constraints
└── assets/
    ├── models/
    └── textures/
```
