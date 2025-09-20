import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface LevelConfig {
  levelNumber: number;
  par: number;
  name: string;
  description?: string;
}

export abstract class Level {
  protected scene: THREE.Scene;
  protected world: CANNON.World;
  protected levelNumber: number;
  protected par: number;
  protected name: string;
  protected description: string;
  protected isLoaded: boolean = false;
  protected physicsObjects: CANNON.Body[] = [];

  constructor(scene: THREE.Scene, world: CANNON.World, config: LevelConfig) {
    this.scene = scene;
    this.world = world;
    this.levelNumber = config.levelNumber;
    this.par = config.par;
    this.name = config.name;
    this.description = config.description || '';
  }

  /**
   * Load the level assets and initialize the level
   */
  abstract load(): Promise<void>;

  /**
   * Clean up level resources when switching levels
   */
  unload(): void {
    // Remove physics objects
    this.physicsObjects.forEach(body => {
      this.world.removeBody(body);
    });
    this.physicsObjects = [];
    this.setLoaded(false);
  }

  /**
   * Get the starting position for the golf ball
   */
  abstract getStartPosition(): THREE.Vector3;

  /**
   * Get the goal position (hole location)
   */
  abstract getGoalPosition(): THREE.Vector3;

  /**
   * Check if the ball has reached the goal
   */
  abstract isGoalReached(ballPosition: THREE.Vector3): boolean;

  /**
   * Add physics collision surfaces for the level
   */
  protected addPhysicsBody(body: CANNON.Body): void {
    this.world.addBody(body);
    this.physicsObjects.push(body);
  }

  /**
   * Create physics collision surface for a mesh
   */
  protected createCollisionSurface(mesh: THREE.Mesh): CANNON.Body {
    // Create a static physics body for collision
    const body = new CANNON.Body({ 
      mass: 0, // mass 0 = static
      material: new CANNON.Material({
        friction: 0.4,
        restitution: 0.8 // Match ball's restitution for proper bouncing
      })
    });
    
    // Create box shape based on mesh geometry
    if (mesh.geometry instanceof THREE.BoxGeometry) {
      const box = mesh.geometry.parameters;
      const shape = new CANNON.Box(new CANNON.Vec3(box.width/2, box.height/2, box.depth/2));
      body.addShape(shape);
    } else {
      // Default to box shape for other geometries
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
      body.addShape(shape);
    }
    
    body.position.copy(mesh.position as any);
    body.quaternion.copy(mesh.quaternion as any);
    
    return body;
  }

  // Getter methods
  getLevelNumber(): number {
    return this.levelNumber;
  }

  getPar(): number {
    return this.par;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  protected setLoaded(loaded: boolean): void {
    this.isLoaded = loaded;
  }
}