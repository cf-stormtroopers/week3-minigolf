import * as THREE from 'three';
import { Level } from './Level';
import { Level1 } from './Level1';
import { Level2 } from './Level2';

export interface GameState {
  currentLevel: number;
  strokeCount: number;
  totalStrokes: number;
  levelCompleted: boolean;
}

export class LevelManager {
  private scene: THREE.Scene;
  private levels: Map<number, Level>;
  private currentLevel: Level | null = null;
  private gameState: GameState;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.levels = new Map();
    
    // Initialize game state
    this.gameState = {
      currentLevel: 1,
      strokeCount: 0,
      totalStrokes: 0,
      levelCompleted: false
    };

    // Register available levels
    this.registerLevels();
  }

  private registerLevels(): void {
    console.log('🎮 Registering levels...');
    
    // Create level instances
    const level1 = new Level1(this.scene);
    const level2 = new Level2(this.scene);
    
    // Register them in the map
    this.levels.set(1, level1);
    this.levels.set(2, level2);
    
    console.log(`✅ Registered ${this.levels.size} levels`);
    
    // Log level details
    this.levels.forEach((level, levelNumber) => {
      console.log(`   Level ${levelNumber}: ${level.getName()} (Par ${level.getPar()})`);
    });
  }

  async loadLevel(levelNumber: number): Promise<boolean> {
    console.log(`\n🔄 Loading level ${levelNumber}...`);
    
    // Check if level exists
    if (!this.levels.has(levelNumber)) {
      console.error(`❌ Level ${levelNumber} not found!`);
      return false;
    }

    try {
      // Unload current level if one is loaded
      if (this.currentLevel && this.currentLevel.getIsLoaded()) {
        await this.unloadCurrentLevel();
      }

      // Get the new level
      const newLevel = this.levels.get(levelNumber)!;
      
      // Load the new level
      await newLevel.load();
      
      // Update current level and game state
      this.currentLevel = newLevel;
      this.gameState.currentLevel = levelNumber;
      this.gameState.strokeCount = 0;
      this.gameState.levelCompleted = false;
      
      console.log(`✅ Successfully loaded level ${levelNumber}`);
      this.logGameState();
      
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to load level ${levelNumber}:`, error);
      return false;
    }
  }

  async unloadCurrentLevel(): Promise<void> {
    if (this.currentLevel && this.currentLevel.getIsLoaded()) {
      console.log(`🔄 Unloading current level (${this.currentLevel.getLevelNumber()})...`);
      this.currentLevel.unload();
      console.log('✅ Current level unloaded');
    }
  }

  getCurrentLevel(): Level | null {
    return this.currentLevel;
  }

  getGameState(): GameState {
    return { ...this.gameState }; // Return a copy to prevent external modification
  }

  incrementStroke(): void {
    this.gameState.strokeCount++;
    this.gameState.totalStrokes++;
    console.log(`⛳ Stroke ${this.gameState.strokeCount} on Level ${this.gameState.currentLevel}`);
  }

  completeLevel(): void {
    if (this.currentLevel) {
      this.gameState.levelCompleted = true;
      const par = this.currentLevel.getPar();
      const strokes = this.gameState.strokeCount;
      
      console.log(`\n🎉 Level ${this.gameState.currentLevel} completed!`);
      console.log(`   Par: ${par}, Your score: ${strokes}`);
      
      if (strokes < par) {
        console.log('   🔥 Under par! Great shot!');
      } else if (strokes === par) {
        console.log('   👍 Right on par!');
      } else {
        console.log('   😅 Over par, but you made it!');
      }
    }
  }

  async nextLevel(): Promise<boolean> {
    const nextLevelNumber = this.gameState.currentLevel + 1;
    
    if (this.levels.has(nextLevelNumber)) {
      return await this.loadLevel(nextLevelNumber);
    } else {
      console.log('🏆 Congratulations! You\'ve completed all levels!');
      return false;
    }
  }

  async previousLevel(): Promise<boolean> {
    const prevLevelNumber = this.gameState.currentLevel - 1;
    
    if (this.levels.has(prevLevelNumber)) {
      return await this.loadLevel(prevLevelNumber);
    } else {
      console.log('⚠️ Already at the first level!');
      return false;
    }
  }

  getAvailableLevels(): number[] {
    return Array.from(this.levels.keys()).sort((a, b) => a - b);
  }

  private logGameState(): void {
    console.log('\n📊 Current Game State:');
    console.log(`   Level: ${this.gameState.currentLevel}`);
    console.log(`   Current level strokes: ${this.gameState.strokeCount}`);
    console.log(`   Total strokes: ${this.gameState.totalStrokes}`);
    console.log(`   Level completed: ${this.gameState.levelCompleted ? 'Yes' : 'No'}`);
    
    if (this.currentLevel) {
      console.log(`   Level name: ${this.currentLevel.getName()}`);
      console.log(`   Par: ${this.currentLevel.getPar()}`);
    }
  }

  // Method to reset the entire game
  async resetGame(): Promise<void> {
    console.log('🔄 Resetting game...');
    
    await this.unloadCurrentLevel();
    
    this.gameState = {
      currentLevel: 1,
      strokeCount: 0,
      totalStrokes: 0,
      levelCompleted: false
    };
    
    console.log('✅ Game reset complete');
  }
}