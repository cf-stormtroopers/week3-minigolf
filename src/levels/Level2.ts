import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Level, LevelConfig } from './Level';

export class Level2 extends Level {
  private startPosition: THREE.Vector3;
  private goalPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, world: CANNON.World) {
    const config: LevelConfig = {
      levelNumber: 2,
      par: 4,
      name: "The Bend",
      description: "Navigate the L-shaped course with a banked turn"
    };
    
    super(scene, world, config);
    
    // Define positions for this level - L-shaped layout
    // Start position: top of the vertical leg (far from goal)
    this.startPosition = new THREE.Vector3(-3, 0.5, 4);
    // Goal position: bottom right of horizontal leg (far from start)
    this.goalPosition = new THREE.Vector3(3, 0, -3);
  }

  private createCheckeredTexture(): THREE.Texture {
    // Create a canvas for the checkered pattern
    const canvas = document.createElement('canvas');
    const size = 512; // Texture resolution
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d')!;
    const checkSize = size / 8; // 8x8 checkerboard for bigger squares
    
    // Define the two lime green colors
    const darkGreen = '#32cd32';  // Lime green (darker shade)
    const lightGreen = '#90ee90'; // Light lime green
    
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        // Alternate colors in checkerboard pattern
        const isEvenCheck = (x + y) % 2 === 0;
        context.fillStyle = isEvenCheck ? darkGreen : lightGreen;
        context.fillRect(x * checkSize, y * checkSize, checkSize, checkSize);
      }
    }
    
    // Create Three.js texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }

  private createLShapedCourse(): void {
    console.log('🚨 DEBUG: Creating L-shaped course for Level 2!');
    
    // Use RingGeometry like Level 1 to create actual hole - ball can fall through center
    const innerRadius = 0.4; // Hole radius (same as Level 1)
    const outerRadius = 20; // Course radius (should cover entire L area)
    const thetaSegments = 64; // Smooth circle
    
    console.log('Creating course with hole using RingGeometry...');
    
    // Create ring geometry (this IS a real hole - ball can fall through center)
    const courseGeometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
    
    // Create material and mesh
    const checkeredTexture = this.createCheckeredTexture();
    const courseMaterial = new THREE.MeshLambertMaterial({ map: checkeredTexture });
    const course = new THREE.Mesh(courseGeometry, courseMaterial);
    course.rotation.x = -Math.PI / 2;
    course.position.copy(this.goalPosition);
    course.position.y = 0; // Place on ground level
    course.name = 'level2-course';
    this.scene.add(course);

    console.log('✅ Course with hole created successfully');
  }

  private createBankedTurn(): void {
    // 6. Diagonal element: (-3, -5) to (-5, -3) - the actual corner of the L!
    
    const frameHeight = 0.6;
    const frameThickness = 0.6;
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    
    // Calculate diagonal length from (-3, -5) to (-5, -3)
    // Length = sqrt(((-5) - (-3))^2 + ((-3) - (-5))^2) = sqrt(4 + 4) = 2√2 ≈ 2.83
    const diagonalLength = Math.sqrt(8); // 2√2
    
    const diagonalBorder = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, diagonalLength),
      woodMaterial
    );
    
    // Position at the center of the diagonal: midpoint of (-3, -5) and (-5, -3)
    // Midpoint = ((-3 + -5)/2, (-5 + -3)/2) = (-4, -4)
    diagonalBorder.position.set(-4, frameHeight/2, -4);
    
    // Rotate to align with the diagonal from (-3, -5) to (-5, -3)
    // The vector is (-2, 2), which makes a 135° angle (or -45° from positive Z)
    diagonalBorder.rotation.y = -Math.PI / 4; // -45° rotation
    
    diagonalBorder.name = 'level2-diagonal-border';
    this.scene.add(diagonalBorder);
    
    // Add physics collision for the diagonal border
    const diagonalBody = this.createCollisionSurface(diagonalBorder);
    diagonalBody.material = new CANNON.Material({
      friction: 0.4,
      restitution: 0.8 // Good bounce for 45° shots
    });
    this.addPhysicsBody(diagonalBody);
    
    console.log('✅ Diagonal border positioned at actual L corner: (-3,-5) to (-5,-3)');
  }

  private createLShapedBorders(): void {
    const frameHeight = 0.6;
    const frameThickness = 0.6;
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    const borders: THREE.Mesh[] = [];

    // Following the exact 7-segment L-shape path:
    // 1. Top border: (-5, 5) to (0, 5)
    const topBorder = new THREE.Mesh(
      new THREE.BoxGeometry(5, frameHeight, frameThickness),
      woodMaterial
    );
    topBorder.position.set(-2.5, frameHeight/2, 5 + frameThickness/2); // Center at x=-2.5, z=5
    topBorder.name = 'level2-border-top';
    borders.push(topBorder);

    // 2. Inner vertical border: (0, 5) to (0, 0)
    const innerVerticalBorder = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 5),
      woodMaterial
    );
    innerVerticalBorder.position.set(0 + frameThickness/2, frameHeight/2, 2.5); // Center at x=0, z=2.5
    innerVerticalBorder.name = 'level2-border-inner-vertical';
    borders.push(innerVerticalBorder);

    // 3. Inner horizontal border: (0, 0) to (5, 0)
    const innerHorizontalBorder = new THREE.Mesh(
      new THREE.BoxGeometry(5, frameHeight, frameThickness),
      woodMaterial
    );
    innerHorizontalBorder.position.set(2.5, frameHeight/2, 0 - frameThickness/2); // Center at x=2.5, z=0
    innerHorizontalBorder.name = 'level2-border-inner-horizontal';
    borders.push(innerHorizontalBorder);

    // 4. Right border: (5, 0) to (5, -5)
    const rightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 5),
      woodMaterial
    );
    rightBorder.position.set(5 + frameThickness/2, frameHeight/2, -2.5); // Center at x=5, z=-2.5
    rightBorder.name = 'level2-border-right';
    borders.push(rightBorder);

    // 5. Bottom border: (5, -5) to (-3, -5)
    const bottomBorder = new THREE.Mesh(
      new THREE.BoxGeometry(8, frameHeight, frameThickness),
      woodMaterial
    );
    bottomBorder.position.set(1, frameHeight/2, -5 - frameThickness/2); // Center at x=1, z=-5
    bottomBorder.name = 'level2-border-bottom';
    borders.push(bottomBorder);

    // 7. Left border: (-5, -3) to (-5, 5)
    const leftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 8),
      woodMaterial
    );
    leftBorder.position.set(-5 - frameThickness/2, frameHeight/2, 1); // Center at x=-5, z=1
    leftBorder.name = 'level2-border-left';
    borders.push(leftBorder);

    // Add all borders to scene and create physics
    borders.forEach(border => {
      this.scene.add(border);
      const borderBody = this.createCollisionSurface(border);
      this.addPhysicsBody(borderBody);
    });

    console.log('✅ L-shaped borders created with exact 7-segment path');
  }

  async load(): Promise<void> {
    console.log('🚨 DEBUG: LEVEL 2 LOAD METHOD CALLED!');
    console.log(`Loading ${this.name} (Level ${this.levelNumber})`);
    console.log(`Description: ${this.description}`);
    console.log(`Par: ${this.par}`);
    console.log(`Start position: ${this.startPosition.x}, ${this.startPosition.y}, ${this.startPosition.z}`);
    console.log(`Goal position: ${this.goalPosition.x}, ${this.goalPosition.y}, ${this.goalPosition.z}`);
    
    try {
      // Simulate some loading time
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Create L-shaped course
      this.createLShapedCourse();

      // Create borders
      this.createLShapedBorders();

      // Create diagonal border at corner
      this.createBankedTurn();

      // Create golf hole
      this.createGolfHole();

      // Add physics collision for the course surface
      this.createCoursePhysics();

      this.setLoaded(true);
      console.log(`✅ Level 2 loaded successfully!`);
      
    } catch (error) {
      console.error('Failed to load Level 2:', error);
      throw error;
    }
  }

  private createGolfHole(): void {
    const holeRadius = 0.4; // Same as Level 1
    const holeDepth = 0.5;  // Same as Level 1
    
    console.log(`Creating hole at position: ${this.goalPosition.x}, ${this.goalPosition.y}, ${this.goalPosition.z}`);
    
    // Create a white cylindrical wall for the hole sides
    const holeWallGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16, 1, true);
    const holeWallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, // White walls
      side: THREE.DoubleSide 
    });
    const holeWall = new THREE.Mesh(holeWallGeometry, holeWallMaterial);
    holeWall.position.copy(this.goalPosition);
    holeWall.position.y = -holeDepth / 2; // Center the cylinder so top is at ground level
    holeWall.name = 'level2-hole-wall';
    this.scene.add(holeWall);

    // Create a much more visible white ring at ground level
    const holeRingGeometry = new THREE.RingGeometry(holeRadius, holeRadius + 0.1, 16);
    const holeRingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide 
    });
    const holeRing = new THREE.Mesh(holeRingGeometry, holeRingMaterial);
    holeRing.position.copy(this.goalPosition);
    holeRing.position.y = 0.02; // Slightly above ground level
    holeRing.rotation.x = -Math.PI / 2; // Rotate to lie flat
    holeRing.name = 'level2-hole-ring';
    this.scene.add(holeRing);

    // Create dark bottom of the hole - larger and more visible
    const holeBottomGeometry = new THREE.CircleGeometry(holeRadius * 0.9, 16);
    const holeBottomMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Pure black for contrast
    const holeBottom = new THREE.Mesh(holeBottomGeometry, holeBottomMaterial);
    holeBottom.position.copy(this.goalPosition);
    holeBottom.position.y = -holeDepth + 0.01; // At the bottom of the hole
    holeBottom.rotation.x = -Math.PI / 2; // Rotate to lie flat
    holeBottom.name = 'level2-hole-bottom';
    this.scene.add(holeBottom);

    // Create flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark gray pole
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.copy(this.goalPosition);
    pole.position.x += holeRadius + 0.1; // Position slightly outside the hole
    pole.position.y = 1; // Half the pole height above ground
    pole.name = 'level2-flag-pole';
    this.scene.add(pole);

    // Create flag
    const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
    const flagMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff0000, // Red flag
      side: THREE.DoubleSide 
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.copy(pole.position);
    flag.position.x += 0.2; // Offset from pole
    flag.position.y += 0.5; // Position in upper part of pole
    flag.name = 'level2-flag';
    this.scene.add(flag);

    // Add flag number
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = '#ffffff';
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.fillText('2', 64, 80);
    
    const flagTexture = new THREE.CanvasTexture(canvas);
    const flagNumberMaterial = new THREE.MeshLambertMaterial({ 
      map: flagTexture,
      side: THREE.DoubleSide 
    });
    flag.material = flagNumberMaterial;

    console.log('✅ Golf hole with flag 2 added to Level 2 (copied from Level 1)');
  }

  unload(): void {
    console.log(`Unloading ${this.name}`);
    
    // Remove level-specific objects from the scene
    const objectsToRemove = this.scene.children.filter((child: THREE.Object3D) => 
      child.name && child.name.startsWith('level2-')
    );
    
    objectsToRemove.forEach((obj: THREE.Object3D) => {
      this.scene.remove(obj);
      // Dispose of geometry and materials to free memory
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    });
    
    this.setLoaded(false);
    console.log('✅ Level 2 unloaded');
  }

  getStartPosition(): THREE.Vector3 {
    return this.startPosition.clone();
  }

  getGoalPosition(): THREE.Vector3 {
    return this.goalPosition.clone();
  }

  isGoalReached(ballPosition: THREE.Vector3): boolean {
    const distance = ballPosition.distanceTo(this.goalPosition);
    const isReached = distance < 0.4;
    if (isReached) {
      console.log('🚨 DEBUG: Goal reached! Ball distance to goal:', distance);
    }
    return isReached; // Same as Level 1
  }

  private createCoursePhysics(): void {
    // Create ground collision plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 }); // Static body
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    groundBody.position.set(0, 0, 0);
    
    // Add surface friction
    groundBody.material = new CANNON.Material({
      friction: 0.4,
      restitution: 0.3
    });
    
    this.addPhysicsBody(groundBody);
    console.log('✅ Course physics (ground plane) added to Level 2');
  }
}