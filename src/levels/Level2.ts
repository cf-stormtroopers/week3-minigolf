import * as THREE from 'three';
import { Level, LevelConfig } from './Level';

export class Level2 extends Level {
  private startPosition: THREE.Vector3;
  private goalPosition: THREE.Vector3;

  constructor(scene: THREE.Scene) {
    const config: LevelConfig = {
      levelNumber: 2,
      par: 4,
      name: "The Bend",
      description: "Navigate around a simple obstacle to reach the hole"
    };
    
    super(scene, config);
    
    // Define positions for this level - more challenging layout
    this.startPosition = new THREE.Vector3(-4, 0.5, 4);
    this.goalPosition = new THREE.Vector3(4, 0, -4);
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
    const checkeredTexture = this.createCheckeredTexture();
    
    // Create L-shape using two rectangles that DON'T overlap
    // Vertical part of L (left side): 6 wide x 8 long (shorter to avoid overlap)
    const verticalTexture = checkeredTexture.clone();
    verticalTexture.repeat.set(1.5, 2); // Nice big squares
    const verticalMaterial = new THREE.MeshLambertMaterial({ map: verticalTexture });
    const verticalGeometry = new THREE.PlaneGeometry(6, 8);
    const verticalPart = new THREE.Mesh(verticalGeometry, verticalMaterial);
    verticalPart.rotation.x = -Math.PI / 2;
    verticalPart.position.set(-3, 0, -2); // Moved up to avoid overlap
    verticalPart.name = 'level2-course-vertical';
    this.scene.add(verticalPart);

    // Horizontal part of L (bottom): 12 wide x 6 long
    const horizontalTexture = checkeredTexture.clone();
    horizontalTexture.repeat.set(3, 1.5); // Nice big squares
    const horizontalMaterial = new THREE.MeshLambertMaterial({ map: horizontalTexture });
    const horizontalGeometry = new THREE.PlaneGeometry(12, 6);
    const horizontalPart = new THREE.Mesh(horizontalGeometry, horizontalMaterial);
    horizontalPart.rotation.x = -Math.PI / 2;
    horizontalPart.position.set(0, 0, 3); // Bottom side
    horizontalPart.name = 'level2-course-horizontal';
    this.scene.add(horizontalPart);

    console.log('✅ Clean L-shaped course created without overlaps');
  }

  private createLShapedBorders(): void {
    const frameHeight = 0.6;
    const frameThickness = 0.6;
    const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

    // Course layout: 
    // Vertical section: 6x8 at x=-3, z=-2 (extends from x=-6 to x=0, z=-6 to z=2)
    // Horizontal section: 12x6 at x=0, z=3 (extends from x=-6 to x=6, z=0 to z=6)

    // Vertical section borders
    // Left border
    const vLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 8 + frameThickness * 2),
      woodMaterial
    );
    vLeft.position.set(-6 - frameThickness / 2, frameHeight / 2, -2);
    vLeft.name = 'level2-border-v-left';
    this.scene.add(vLeft);

    // Top border
    const vTop = new THREE.Mesh(
      new THREE.BoxGeometry(6 + frameThickness * 2, frameHeight, frameThickness),
      woodMaterial
    );
    vTop.position.set(-3, frameHeight / 2, -6 - frameThickness / 2);
    vTop.name = 'level2-border-v-top';
    this.scene.add(vTop);

    // Right border (full height)
    const vRight = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 8 + frameThickness * 2),
      woodMaterial
    );
    vRight.position.set(0 - frameThickness / 2, frameHeight / 2, -2);
    vRight.name = 'level2-border-v-right';
    this.scene.add(vRight);

    // Horizontal section borders
    // Right border
    const hRight = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 6 + frameThickness * 2),
      woodMaterial
    );
    hRight.position.set(6 + frameThickness / 2, frameHeight / 2, 3);
    hRight.name = 'level2-border-h-right';
    this.scene.add(hRight);

    // Bottom border
    const hBottom = new THREE.Mesh(
      new THREE.BoxGeometry(12 + frameThickness * 2, frameHeight, frameThickness),
      woodMaterial
    );
    hBottom.position.set(0, frameHeight / 2, 6 + frameThickness / 2);
    hBottom.name = 'level2-border-h-bottom';
    this.scene.add(hBottom);

    // Top border (connects to vertical section)
    const hTop = new THREE.Mesh(
      new THREE.BoxGeometry(12 + frameThickness * 2, frameHeight, frameThickness),
      woodMaterial
    );
    hTop.position.set(0, frameHeight / 2, 0 - frameThickness / 2);
    hTop.name = 'level2-border-h-top';
    this.scene.add(hTop);

    // Left border (connects to vertical section)
    const hLeft = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, 6 + frameThickness * 2),
      woodMaterial
    );
    hLeft.position.set(-6 - frameThickness / 2, frameHeight / 2, 3);
    hLeft.name = 'level2-border-h-left';
    this.scene.add(hLeft);

    // Bottom border of vertical section (connects to horizontal)
    const vBottom = new THREE.Mesh(
      new THREE.BoxGeometry(6 + frameThickness * 2, frameHeight, frameThickness),
      woodMaterial
    );
    vBottom.position.set(-3, frameHeight / 2, 2 + frameThickness / 2);
    vBottom.name = 'level2-border-v-bottom';
    this.scene.add(vBottom);

    console.log('✅ Fixed L-shaped borders for non-overlapping course');
  }

  async load(): Promise<void> {
    console.log(`Loading ${this.name} (Level ${this.levelNumber})`);
    console.log(`Description: ${this.description}`);
    console.log(`Par: ${this.par}`);
    
    try {
      // Simulate some loading time
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Create L-shaped course
      this.createLShapedCourse();

      // Create borders
      this.createLShapedBorders();

      // Add simple obstacle
      const obstacle = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.8, 1),
        new THREE.MeshLambertMaterial({ color: 0x8b4513 })
      );
      obstacle.position.set(-1, 0.4, 1);
      obstacle.name = 'level2-obstacle';
      this.scene.add(obstacle);

      // Add simple hole
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8),
        new THREE.MeshLambertMaterial({ color: 0x000000 })
      );
      hole.position.copy(this.goalPosition);
      hole.position.y = -0.05;
      hole.name = 'level2-hole';
      this.scene.add(hole);

      this.setLoaded(true);
      console.log(`✅ Level 2 loaded successfully!`);
      
    } catch (error) {
      console.error('Failed to load Level 2:', error);
      throw error;
    }
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
    return distance < 0.3;
  }
}