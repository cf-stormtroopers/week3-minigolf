import * as THREE from 'three';
import { Level, LevelConfig } from './Level';

export class Level1 extends Level {
  private startPosition: THREE.Vector3;
  private goalPosition: THREE.Vector3;

  constructor(scene: THREE.Scene) {
    const config: LevelConfig = {
      levelNumber: 1,
      par: 3,
      name: "Easy Start",
      description: "A simple straight shot to get you warmed up"
    };
    
    super(scene, config);
    
    // Define positions for this level
    this.startPosition = new THREE.Vector3(0, 0.5, 5);
    this.goalPosition = new THREE.Vector3(0, 0, -5);
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
    texture.repeat.set(4, 6); // Repeat pattern across the course
    
    return texture;
  }

  private createCourseWithHole(): THREE.Mesh {
    // Simple approach: Create a RingGeometry (donut shape) instead of complex CSG
    const innerRadius = 0.4; // Hole radius
    const outerRadius = 20; // Course radius (should cover 10x15 area)
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
    course.name = 'level1-course';
    
    console.log('✅ Course with hole created successfully');
    return course;
  }

  private createWoodenFrame(): void {
    // Course dimensions: 10 wide x 15 long
    const courseWidth = 10;
    const courseLength = 15;
    const frameHeight = 0.6; // Height of the wooden frame
    const frameThickness = 0.6; // Thickness of the frame

    // Create wooden material
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Saddle brown

    // Create the four frame pieces (walls)
    
    // Front wall (closer to camera, along width)
    const frontWallGeometry = new THREE.BoxGeometry(courseWidth + frameThickness * 2, frameHeight, frameThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, woodMaterial);
    frontWall.position.set(0, frameHeight / 2, courseLength / 2 + frameThickness / 2);
    frontWall.name = 'level1-frame-front';
    this.scene.add(frontWall);

    // Back wall (farther from camera, along width)
    const backWallGeometry = new THREE.BoxGeometry(courseWidth + frameThickness * 2, frameHeight, frameThickness);
    const backWall = new THREE.Mesh(backWallGeometry, woodMaterial);
    backWall.position.set(0, frameHeight / 2, -courseLength / 2 - frameThickness / 2);
    backWall.name = 'level1-frame-back';
    this.scene.add(backWall);

    // Left wall (along length)
    const leftWallGeometry = new THREE.BoxGeometry(frameThickness, frameHeight, courseLength);
    const leftWall = new THREE.Mesh(leftWallGeometry, woodMaterial);
    leftWall.position.set(-courseWidth / 2 - frameThickness / 2, frameHeight / 2, 0);
    leftWall.name = 'level1-frame-left';
    this.scene.add(leftWall);

    // Right wall (along length)
    const rightWallGeometry = new THREE.BoxGeometry(frameThickness, frameHeight, courseLength);
    const rightWall = new THREE.Mesh(rightWallGeometry, woodMaterial);
    rightWall.position.set(courseWidth / 2 + frameThickness / 2, frameHeight / 2, 0);
    rightWall.name = 'level1-frame-right';
    this.scene.add(rightWall);

    console.log('✅ Wooden frame added to Level 1');
  }

  private createGolfHole(): void {
    const holeRadius = 0.4; // Made larger for better visibility
    const holeDepth = 0.5;
    
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
    holeWall.name = 'level1-hole-wall';
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
    holeRing.name = 'level1-hole-ring';
    this.scene.add(holeRing);

    // Create dark bottom of the hole - larger and more visible
    const holeBottomGeometry = new THREE.CircleGeometry(holeRadius * 0.9, 16);
    const holeBottomMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // Pure black for contrast
    const holeBottom = new THREE.Mesh(holeBottomGeometry, holeBottomMaterial);
    holeBottom.position.copy(this.goalPosition);
    holeBottom.position.y = -holeDepth + 0.01; // At the bottom of the hole
    holeBottom.rotation.x = -Math.PI / 2; // Rotate to lie flat
    holeBottom.name = 'level1-hole-bottom';
    this.scene.add(holeBottom);

    // Create flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark gray pole
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.copy(this.goalPosition);
    pole.position.x += holeRadius + 0.1; // Position slightly outside the hole
    pole.position.y = 1; // Half the pole height above ground
    pole.name = 'level1-flag-pole';
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
    flag.name = 'level1-flag';
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
    context.fillText('1', 64, 80);
    
    const flagTexture = new THREE.CanvasTexture(canvas);
    const flagNumberMaterial = new THREE.MeshLambertMaterial({ 
      map: flagTexture,
      side: THREE.DoubleSide 
    });
    flag.material = flagNumberMaterial;

    console.log('✅ Golf hole with flag added to Level 1');
  }

  async load(): Promise<void> {
    console.log(`Loading ${this.name} (Level ${this.levelNumber})`);
    console.log(`Description: ${this.description}`);
    console.log(`Par: ${this.par}`);
    
    try {
      // Simulate some loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create course with hole using CSG subtraction
      const course = this.createCourseWithHole();
      this.scene.add(course);

      // Create proper golf hole with flag
      this.createGolfHole();

      // Add wooden frame/border around the field
      this.createWoodenFrame();

      this.setLoaded(true);
      console.log(`✅ Level 1 loaded successfully!`);
      
    } catch (error) {
      console.error('Failed to load Level 1:', error);
      throw error;
    }
  }

  unload(): void {
    console.log(`Unloading ${this.name}`);
    
    // Remove level-specific objects from the scene
    const objectsToRemove = this.scene.children.filter(child => 
      child.name && child.name.startsWith('level1-')
    );
    
    objectsToRemove.forEach(obj => {
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
    console.log('✅ Level 1 unloaded');
  }

  getStartPosition(): THREE.Vector3 {
    return this.startPosition.clone();
  }

  getGoalPosition(): THREE.Vector3 {
    return this.goalPosition.clone();
  }

  isGoalReached(ballPosition: THREE.Vector3): boolean {
    const distance = ballPosition.distanceTo(this.goalPosition);
    return distance < 0.4; // Ball needs to be within 0.4 units of the hole
  }
}