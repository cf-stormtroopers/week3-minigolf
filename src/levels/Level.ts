import * as THREE from 'three';

export interface LevelConfig {
  levelNumber: number;
  par: number;
  name: string;
  description?: string;
}

export abstract class Level {
  protected scene: THREE.Scene;
  protected levelNumber: number;
  protected par: number;
  protected name: string;
  protected description: string;
  protected isLoaded: boolean = false;

  constructor(scene: THREE.Scene, config: LevelConfig) {
    this.scene = scene;
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
  abstract unload(): void;

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