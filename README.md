# 3D Relativistic Gravity Simulator

An interactive web-based simulation demonstrating Einstein's theory of general relativity and the effects of gravity on spacetime.

## Overview

This project visualizes how massive objects curve spacetime according to Einstein's theory of general relativity. Users can interact with the simulation by adding various celestial objects and observing how they affect spacetime geometry and the paths of light rays.

## Features

- **Interactive 3D Environment**: Navigate the simulation using orbit controls to view from any angle
- **Spacetime Visualization**: See how massive objects deform the fabric of spacetime
- **Light Ray Bending**: Observe how light rays bend around massive objects due to gravitational lensing
- **Dynamic Object Creation**: Drag and drop celestial objects into the simulation:
  - Stars (high mass)
  - Planets (medium mass)
  - Moons (low mass)
  - Black Holes (extreme mass with visual effects)
- **Physical Interactions**: Watch objects orbit and interact through relativistic gravity
- **Object Manipulation**: Select and modify objects, change their velocities

## Physics

The simulation implements a simplified version of general relativistic gravity using:
- Spacetime curvature based on mass distribution
- Approximation of the Schwarzschild metric for massive bodies
- Geodesic motion for photons (light rays)
- Relativistic corrections to Newtonian gravity for massive objects

## Technical Implementation

The project is built using:
- **Three.js**: For 3D rendering and scene management
- **JavaScript**: For physics calculations and user interaction
- **HTML/CSS**: For UI elements and styling

The simulation core consists of:
- A deformable grid representing spacetime
- Physical bodies with mass, velocity, and position
- Light ray trajectory calculations that follow curved spacetime

## How to Use

1. **Navigation**:
   - Rotate the view: Click and drag
   - Zoom: Scroll wheel
   - Pan: Right-click and drag

2. **Adding Objects**:
   - Drag celestial bodies from the bottom palette into the simulation
   - Objects will be placed where you drop them

3. **Manipulating Objects**:
   - Click on an object to select it
   - Use the control panel to adjust velocity
   - Drag selected objects to reposition them

4. **Light Rays**:
   - Click "Add Light Ray" to create a new photon path
   - Observe how light bends around massive objects
   - Use "Clear Light Rays" to remove all photons

5. **View Controls**:
   - Toggle the spacetime grid on/off
   - Reset the simulation to its initial state

## Getting Started

### Local Setup

1. Clone the repository:
   ```
   git clone https://github.com/GigabyteBlender/GravitySimulator.git
   ```

2. Navigate to the project directory:
   ```
   cd GravitySimulator
   ```

3. Start a local server:
   - Using Node.js (recommended):
     ```
     # Install http-server globally if you haven't already
     npm install -g http-server
     
     # Start the server
     http-server -o
     ```
     The `-o` flag automatically opens your browser to the served project.
     
   - Alternative using Python:
     ```
     # Python 3
     python -m http.server
     
     # Python 2
     python -m SimpleHTTPServer
     ```

4. Open your browser and navigate to `http://localhost:8000` (or the port shown in your terminal)


## Educational Value

This simulator is designed to help visualize and understand:
- How mass curves spacetime
- The principle of gravitational lensing
- Orbital mechanics in general relativity
- Black hole physics and event horizons
- The difference between Newtonian and Einsteinian gravity

## Project Structure

```
├── index.html          # Main HTML file and structure
├── simulator.js        # Core simulation logic and physics
├── styles.css          # Styling for UI elements
└── README.md           # This file
```

## Future Enhancements

- Time dilation visualization
- Frame dragging effects for rotating bodies
- More accurate relativistic calculations
- User-definable physical constants
- Saving and loading simulation states
- Mobile-friendly controls

## Acknowledgements

- Einstein's theory of general relativity
- Three.js for 3D visualization capabilities
- Scientific literature on numerical relativity