// 3D Relativistic Gravity Simulator

// Main class for the simulation
class RelativisticGravitySimulator {
  constructor(containerId) {
    // Set up the scene

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedBody = null;
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragOffset = new THREE.Vector3();
    this.isDragging = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(containerId).appendChild(this.renderer.domElement);
    
    // Add orbit controls for user interaction
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 100, 100);
    this.controls.update();
    
    // Increase simulation space
    this.simulationSize = 1000;
    
    // Create a grid to represent spacetime
    this.createSpacetimeGrid();
    this.showGrid = true;
    
    // Bodies array (planets, stars, etc.)
    this.bodies = [];
    
    // Add some light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // Set up animation loop
    this.animate = this.animate.bind(this);
    this.animate();

    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  onMouseDown(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find intersections
    const intersects = this.raycaster.intersectObjects(
      this.bodies.filter(body => body.type !== 'photon').map(body => body.mesh)
    );
    
    if (intersects.length > 0) {
      // Disable orbit controls while dragging
      this.controls.enabled = false;
      
      // Store selected body
      this.selectedBody = this.bodies.find(body => body.mesh === intersects[0].object);
      
      // Calculate drag plane intersection
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
      
      // Calculate offset between intersection and object position
      this.dragOffset.subVectors(this.selectedBody.position, intersection);
      
      this.isDragging = true;
    }
  }
  
  onMouseMove(event) {
    if (!this.isDragging || !this.selectedBody) return;
    
    // Update mouse position
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Calculate drag plane intersection
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
    
    // Update selected body position with offset
    this.selectedBody.position.copy(intersection.add(this.dragOffset));
    this.selectedBody.mesh.position.copy(this.selectedBody.position);
    
    // Reset velocity when dragging
    this.selectedBody.velocity.set(0, 0, 0);
    
    // Update spacetime curvature
    this.updateSpacetimeCurvature();
  }
  
  onMouseUp() {
    // Re-enable orbit controls
    this.controls.enabled = true;
    this.isDragging = false;
    
    // Apply velocity from UI if available
    if (this.selectedBody) {
      // Get velocity settings from UI if we've added those controls
      const vx = parseFloat(document.getElementById('velocity-x').value || 0);
      const vz = parseFloat(document.getElementById('velocity-z').value || 0);
      this.selectedBody.velocity.set(vx, 0, vz);
    }
    
    this.selectedBody = null;
  }
  
  // Create a grid representing spacetime that can be deformed
  createSpacetimeGrid() {
    const size = this.simulationSize;
    const divisions = 150; // Increased for more detail across larger area
    
    // Create grid geometry - we'll use a plane with higher segment count for deformation
    this.gridGeometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
    this.gridGeometry.rotateX(-Math.PI / 2); // Make it horizontal
    
    // Store original positions for calculating deformation
    this.originalPositions = this.gridGeometry.attributes.position.array.slice();
    
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x666666,
      wireframe: true,
      transparent: false,
      opacity: 0.3
    });
    
    // Create grid mesh
    this.gridMesh = new THREE.Mesh(this.gridGeometry, gridMaterial);
    this.scene.add(this.gridMesh);
  }
  
  // Toggle grid visibility
  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.gridMesh.visible = this.showGrid;
  }
  
  // Add a massive body (planet, star, etc.)
  addBody(mass, radius, position, velocity, color, type = 'planet') {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    
    // Add glow effect for black holes
    let mesh = new THREE.Mesh(geometry, material);
    
    if (type === 'blackhole') {
      // Make black holes look special
      material.color = new THREE.Color(0x000000);
      
      // Add accretion disk
      const diskGeometry = new THREE.RingGeometry(radius * 1.5, radius * 3, 32);
      const diskMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const disk = new THREE.Mesh(diskGeometry, diskMaterial);
      disk.rotation.x = Math.PI / 2;
      mesh.add(disk);
      
      // Add event horizon glow
      const glowGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6600ff,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glow);
    }
    
    mesh.position.copy(position);
    
    const body = {
      mass,
      radius,
      position,
      velocity,
      mesh,
      type
    };
    
    this.bodies.push(body);
    this.scene.add(mesh);
    
    // Update spacetime curvature
    this.updateSpacetimeCurvature();
    
    return body;
  }
  
  // Add a test particle (low mass object for trajectory testing)
  addTestParticle(position, velocity, color = 0xffff00) {
    return this.addBody(0.001, 0.1, position, velocity, color, 'particle');
  }
  
  // Add a photon (light ray) to demonstrate light bending
  addPhoton(position, direction, color = 0xffffff) {
    // Create a small sphere for the photon
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color,
      emissive: color,
      emissiveIntensity: 2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Create trail geometry
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({ color });
    const trailPositions = new Float32Array(1000 * 3); // Allow for 1000 points in the trail
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setDrawRange(0, 0); // Start with empty trail
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    
    // Direction should be normalized
    direction.normalize();
    
    // Speed of light is 1 in our simulation
    const photon = {
      type: 'photon',
      position,
      direction,
      mesh,
      trail,
      trailLength: 0,
      maxTrailPoints: 1000
    };
    
    this.bodies.push(photon);
    this.scene.add(mesh);
    this.scene.add(trail);
    
    return photon;
  }

  // Update the spacetime curvature based on massive bodies
  updateSpacetimeCurvature() {
    // Reset grid to flat
    const positions = this.gridGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = this.originalPositions[i + 1]; // Reset y-coordinate (height)
    }
    
    // Apply deformation for each massive body
    this.bodies.forEach(body => {
      if (body.type === 'photon') return; // Skip photons
      
      // Apply GR curvature based on Schwarzschild metric approximation
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        
        // Calculate distance from this grid point to the massive body
        const dx = x - body.position.x;
        const dz = z - body.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Skip points that are within or very close to the body
        if (distance < body.radius * 1.5) {
          // Create a "hole" in the grid by lowering these points significantly
          // This prevents the grid from connecting to the objects
          positions[i + 1] = -10; // Move these points well below the grid
          continue;
        }
        
        // Calculate deformation using a simplified curvature formula
        // In actual GR, this would be derived from the Einstein field equations
        const deformation = -body.mass / Math.pow(distance + 5, 1.5); // +5 to avoid singularity at zero distance
        
        // Apply deformation (additive to allow multiple bodies to affect spacetime)
        positions[i + 1] += deformation;
      }
    });
    
    // Update the geometry
    this.gridGeometry.attributes.position.needsUpdate = true;
  }
  
  // Update physics using relativistic gravity
  updatePhysics(deltaTime) {
    // Calculate gravitational effects between bodies
    for (let i = 0; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i];
      
      // Special handling for photons
      if (bodyA.type === 'photon') {
        this.updatePhotonPath(bodyA, deltaTime);
        continue;
      }
      
      // Calculate forces on this body from all other bodies
      const acceleration = new THREE.Vector3(0, 0, 0);
      
      for (let j = 0; j < this.bodies.length; j++) {
        if (i === j) continue;
        
        const bodyB = this.bodies[j];
        if (bodyB.type === 'photon') continue; // Photons don't exert gravity in our simulation
        
        // Vector from bodyA to bodyB
        const direction = new THREE.Vector3()
          .subVectors(bodyB.position, bodyA.position);
        const distance = direction.length();
        
        // Skip if bodies are too close (would cause huge accelerations)
        if (distance < bodyA.radius + bodyB.radius) continue;
        
        // Normalize direction vector
        direction.normalize();
        
        // Calculate GR correction factor (simplified approximation)
        // In true GR, we would use the full geodesic equation
        const G = 0.1; // Use simulation-appropriate constant instead of real G
        const schwarzschildRadius = 2 * bodyB.mass * G / (9e1); // Adjust for simulation scale
        const correction = 1 + (3 * schwarzschildRadius) / (distance + 0.1);
        const forceMagnitude = G * bodyB.mass / (distance * distance) * correction;

        acceleration.add(direction.multiplyScalar(forceMagnitude));
      }
      
      // Update velocity and position
      bodyA.velocity.add(acceleration.multiplyScalar(deltaTime));
      bodyA.position.add(bodyA.velocity.clone().multiplyScalar(deltaTime));
      
      // Update mesh position
      bodyA.mesh.position.copy(bodyA.position);
    }
    
    // Update spacetime curvature after bodies have moved
    this.updateSpacetimeCurvature();
  }
  
  // Update photon path considering spacetime curvature
  updatePhotonPath(photon, deltaTime) {
    // In GR, photons follow geodesics (shortest paths) in curved spacetime
    // This is a simplified approximation
    
    // Calculate deflection from massive bodies
    const acceleration = new THREE.Vector3(0, 0, 0);
    
    this.bodies.forEach(body => {
      if (body.type === 'photon') return;
      
      // Vector from photon to body
      const direction = new THREE.Vector3()
        .subVectors(body.position, photon.position);
      const distance = direction.length();
      
      // Skip if too close
      if (distance < body.radius) return;
      
      // Calculate deflection angle (simplified GR approximation)
      // In real GR, this is derived from null geodesics in Schwarzschild metric
      const schwarzschildRadius = 2 * body.mass * 6.67430e-11 / (3e8 * 3e8);
      const deflectionFactor = 2 * schwarzschildRadius / (distance * distance);
      
      // Cross product gives direction of deflection (perpendicular to motion and direction to mass)
      const perpDirection = new THREE.Vector3()
        .crossVectors(photon.direction, direction.normalize())
        .normalize();
      
      // Combine with perpendicular component of direction to mass
      const deflection = perpDirection.multiplyScalar(deflectionFactor);
      acceleration.add(deflection);
    });
    
    // Update direction (normalize to keep speed of light constant)
    photon.direction.add(acceleration.multiplyScalar(deltaTime)).normalize();
    
    // Move photon
    photon.position.add(photon.direction.clone().multiplyScalar(deltaTime * 3)); // Light moves faster
    photon.mesh.position.copy(photon.position);
    
    // Update trail
    const trail = photon.trail;
    const positions = trail.geometry.attributes.position.array;
    
    if (photon.trailLength < photon.maxTrailPoints) {
      // Add new point to trail
      positions[photon.trailLength * 3] = photon.position.x;
      positions[photon.trailLength * 3 + 1] = photon.position.y;
      positions[photon.trailLength * 3 + 2] = photon.position.z;
      photon.trailLength++;
      trail.geometry.setDrawRange(0, photon.trailLength);
      trail.geometry.attributes.position.needsUpdate = true;
    } else {
      // Shift trail points and add new point at the end
      for (let i = 0; i < photon.maxTrailPoints - 1; i++) {
        positions[i * 3] = positions[(i + 1) * 3];
        positions[i * 3 + 1] = positions[(i + 1) * 3 + 1];
        positions[i * 3 + 2] = positions[(i + 1) * 3 + 2];
      }
      positions[(photon.maxTrailPoints - 1) * 3] = photon.position.x;
      positions[(photon.maxTrailPoints - 1) * 3 + 1] = photon.position.y;
      positions[(photon.maxTrailPoints - 1) * 3 + 2] = photon.position.z;
      trail.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  // Animation loop
  animate() {
    requestAnimationFrame(this.animate);
    
    // Calculate delta time
    const now = Date.now();
    if (!this.lastTime) this.lastTime = now;
    const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = now;
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  // Reset the simulation
  reset() {
    // Remove all bodies
    this.bodies.forEach(body => {
      this.scene.remove(body.mesh);
      if (body.trail) this.scene.remove(body.trail);
    });
    this.bodies = [];
    
    // Reset spacetime
    this.updateSpacetimeCurvature();
  }
  
  // Clear all photons from the simulation
  clearPhotons() {
    // Filter out and remove photons
    const photons = this.bodies.filter(body => body.type === 'photon');
    photons.forEach(photon => {
      this.scene.remove(photon.mesh);
      this.scene.remove(photon.trail);
    });
    
    // Keep only non-photon bodies
    this.bodies = this.bodies.filter(body => body.type !== 'photon');
  }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Create simulator
  const simulator = new RelativisticGravitySimulator('simulation-container');
  
  // Add a massive central body (like a star)
  const star = simulator.addBody(
    100,                                   // Mass
    2,                                     // Radius
    new THREE.Vector3(0, 0, 0),           // Position
    new THREE.Vector3(0, 0, 0),           // Velocity (stationary)
    0xffff00,                             // Color (yellow)
    'star'                                // Type
  );
  
  // Add a planet
  const planet = simulator.addBody(
    10,                                    // Mass
    0.5,                                   // Radius
    new THREE.Vector3(10, 0, 0),          // Position
    new THREE.Vector3(0, 0, 3),           // Velocity (for orbital motion)
    0x4488ff,                             // Color (blue)
    'planet'                              // Type
  );
  
  // Add some photons to demonstrate light bending
  simulator.addPhoton(
    new THREE.Vector3(-20, 0, 2),         // Starting position
    new THREE.Vector3(1, 0, 0)            // Direction (moving along x-axis)
  );
  
  simulator.addPhoton(
    new THREE.Vector3(-20, 0, 4),         // Starting position
    new THREE.Vector3(1, 0, 0)            // Direction (moving along x-axis)
  );
  
  // Connect UI components
  
  // Reset button
  document.getElementById('reset-button').addEventListener('click', () => {
    simulator.reset();
    
    // Re-add default bodies
    simulator.addBody(
      100,                                // Mass
      2,                                  // Radius
      new THREE.Vector3(0, 0, 0),        // Position
      new THREE.Vector3(0, 0, 0),        // Velocity
      0xffff00,                          // Color
      'star'                             // Type
    );
    
    simulator.addBody(
      10,                                 // Mass
      0.5,                                // Radius
      new THREE.Vector3(10, 0, 0),       // Position
      new THREE.Vector3(0, 0, 3),        // Velocity
      0x4488ff,                          // Color
      'planet'                           // Type
    );
  });
  
  // Toggle grid
  document.getElementById('toggle-grid').addEventListener('click', () => {
    simulator.toggleGrid();
  });
  
  // Add new object
  document.getElementById('add-object').addEventListener('click', () => {
    // Get values from inputs
    const type = document.getElementById('object-type').value;
    const mass = parseFloat(document.getElementById('object-mass').value);
    const radius = parseFloat(document.getElementById('object-radius').value);
    const color = parseInt(document.getElementById('object-color').value);
    
    // Calculate random position (away from center)
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 15; // Distance from center
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const position = new THREE.Vector3(x, 0, z);
    
    // Calculate velocity for a decent orbit
    const centerDirection = new THREE.Vector3(0, 0, 0).sub(position).normalize();
    const perpDirection = new THREE.Vector3(-centerDirection.z, 0, centerDirection.x);
    
    // Orbital velocity depends on distance and central mass
    const centralMass = simulator.bodies.find(b => b.position.x === 0 && b.position.z === 0)?.mass || 100;
    const orbitalSpeed = Math.sqrt(6.67430e-11 * centralMass / distance) * 50; // Scale factor for sim
    
    const velocity = perpDirection.multiplyScalar(orbitalSpeed);
    
    // Add the new object
    simulator.addBody(
      mass,
      radius,
      position,
      velocity,
      color,
      type
    );
  });
  
  // Update color preview when selection changes
  document.getElementById('object-color').addEventListener('change', (e) => {
    const colorValue = e.target.value;
    // Convert from hex number to CSS color
    const hexColor = '#' + colorValue.substring(2).padStart(6, '0');
    document.getElementById('color-preview').style.backgroundColor = hexColor;
  });
  
  // Initialize color preview
  const initialColorValue = document.getElementById('object-color').value;
  const initialHexColor = '#' + initialColorValue.substring(2).padStart(6, '0');
  document.getElementById('color-preview').style.backgroundColor = initialHexColor;
  
  // Add photon
  document.getElementById('add-photon').addEventListener('click', () => {
    // Add a photon from a random position at edge of simulation
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    const simHalfSize = simulator.simulationSize / 2;
    
    let position, direction;
    
    switch(side) {
      case 0: // top
        position = new THREE.Vector3(
          Math.random() * simulator.simulationSize - simHalfSize,
          0,
          -simHalfSize
        );
        direction = new THREE.Vector3(
          Math.random() * 2 - 1,
          0,
          1
        );
        break;
      case 1: // right
        position = new THREE.Vector3(
          simHalfSize,
          0,
          Math.random() * simulator.simulationSize - simHalfSize
        );
        direction = new THREE.Vector3(
          -1,
          0,
          Math.random() * 2 - 1
        );
        break;
      case 2: // bottom
        position = new THREE.Vector3(
          Math.random() * simulator.simulationSize - simHalfSize,
          0,
          simHalfSize
        );
        direction = new THREE.Vector3(
          Math.random() * 2 - 1,
          0,
          -1
        );
        break;
      case 3: // left
      default:
        position = new THREE.Vector3(
          -simHalfSize,
          0,
          Math.random() * simulator.simulationSize - simHalfSize
        );
        direction = new THREE.Vector3(
          1,
          0,
          Math.random() * 2 - 1
        );
        break;
    }
    
    // Normalize direction
    direction.normalize();
    
    // Add the photon
    simulator.addPhoton(position, direction);
  });
  
  // Clear photons
  document.getElementById('clear-photons').addEventListener('click', () => {
    simulator.clearPhotons();
  });
});