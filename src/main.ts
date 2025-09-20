import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LevelManager } from './levels/LevelManager';
import { Ball } from './Ball';
import { BallControls } from './BallControls';

class MinigolfGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private levelManager: LevelManager;
  private world: CANNON.World;
  private ball: Ball | null = null;
  private ballControls: BallControls | null = null;

  constructor() {
    console.log('🎮 Initializing Minigolf Game...');
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Initialize physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0), // Earth gravity
    });
    
    // Initialize level manager with physics world
    this.levelManager = new LevelManager(this.scene, this.world);
    
    this.setupRenderer();
    this.setupLighting();
    this.setupCamera();
    this.setupControls();
    this.setupEventListeners();
    
    console.log('✅ Game initialization complete');
  }

  private setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB); // Sky blue background
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add renderer to DOM
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
  }

  private setupLighting(): void {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light for shadows and definition
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  private setupCamera(): void {
    // Position camera to get a good overview of the course
    this.camera.position.set(8, 12, 8);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(): void {
    // Initialize OrbitControls for mouse camera movement
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Configure controls
    this.controls.enableDamping = true; // Smooth camera movements
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    
    // Set constraints
    this.controls.minDistance = 3;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
    
    // Set target to center of the course
    this.controls.target.set(0, 0, 0);
    
    console.log('🎮 Camera controls initialized');
    console.log('   🖱️  Left click + drag: Rotate camera');
    console.log('   🖱️  Right click + drag: Pan camera');
    console.log('   🖱️  Scroll wheel: Zoom in/out');
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add keyboard controls for testing
    window.addEventListener('keydown', (event) => {
      this.handleKeyPress(event);
    });
  }

  private async handleKeyPress(event: KeyboardEvent): Promise<void> {
    switch (event.key) {
      case '1':
        console.log('\n🎯 Loading Level 1...');
        await this.levelManager.loadLevel(1);
        this.createBall(); // Reposition ball to new level's start
        break;
      case '2':
        console.log('\n🎯 Loading Level 2...');
        await this.levelManager.loadLevel(2);
        this.createBall(); // Reposition ball to new level's start
        break;
      case 'n':
      case 'N':
        console.log('\n➡️ Loading next level...');
        this.levelManager.nextLevel();
        break;
      case 'p':
      case 'P':
        console.log('\n⬅️ Loading previous level...');
        this.levelManager.previousLevel();
        break;
      case 'r':
      case 'R':
        console.log('\n🔄 Resetting game...');
        this.levelManager.resetGame();
        break;
      case 'i':
      case 'I':
        this.logGameInfo();
        break;
      case 'c':
      case 'C':
        this.resetCameraPosition();
        break;
    }
  }

  private resetCameraPosition(): void {
    console.log('📹 Resetting camera position...');
    this.camera.position.set(8, 12, 8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private logGameInfo(): void {
    console.log('\n📝 Game Information:');
    console.log('Available controls:');
    console.log('  1 - Load Level 1');
    console.log('  2 - Load Level 2');
    console.log('  N - Next Level');
    console.log('  P - Previous Level');
    console.log('  R - Reset Game');
    console.log('  C - Reset Camera');
    console.log('  I - Show this info');
    console.log('\nCamera controls:');
    console.log('  Left click + drag - Rotate camera');
    console.log('  Right click + drag - Pan camera');
    console.log('  Scroll wheel - Zoom in/out');
    
    const gameState = this.levelManager.getGameState();
    console.log('\nCurrent state:', gameState);
    
    const availableLevels = this.levelManager.getAvailableLevels();
    console.log('Available levels:', availableLevels);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    // Update physics world
    this.world.step(1/60); // 60 FPS
    
    // Update ball physics if ball exists
    if (this.ball) {
      this.ball.update();
      
      // Check if level is completed
      const ballPosition = this.ball.getPosition();
      const currentLevel = this.levelManager.getCurrentLevel();
      if (currentLevel && currentLevel.isGoalReached(ballPosition)) {
        // Trigger level completion
        this.levelManager.completeLevel();
      }
      
      // Make camera orbit around the ball by updating the target
      this.controls.target.copy(ballPosition);
    }
    
    // Update controls for smooth camera movement
    this.controls.update();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  async start(): Promise<void> {
    console.log('\n🚀 Starting Minigolf Game!');
    
    // Show initial instructions
    this.logGameInfo();
    
    // Load the first level
    console.log('\n🎯 Loading initial level...');
    await this.levelManager.loadLevel(1);
    
    // Create the golf ball
    this.createBall();
    
    // Start the render loop
    this.animate();
    
    console.log('\n✅ Game started! Click and drag to aim and shoot the ball.');
    console.log('🖱️  Use your mouse to look around the course!');
  }

  private createBall(): void {
    if (this.ball) {
      this.ball.dispose();
      this.ballControls?.dispose();
    }

    const currentLevel = this.levelManager.getCurrentLevel();
    if (currentLevel) {
      const startPos = currentLevel.getStartPosition();
      const goalPos = currentLevel.getGoalPosition();
      
      this.ball = new Ball(this.scene, this.world, startPos);
      
      // Set the hole position for collision detection
      this.ball.setHolePosition(goalPos, 0.4);
      
      // Set up next level callback
      this.ball.setNextLevelCallback(() => {
        this.goToNextLevel();
      });
      
      this.ballControls = new BallControls(
        this.camera, 
        this.renderer.domElement, 
        this.ball, 
        this.scene,
        () => { this.controls.enabled = false; }, // Disable camera on aiming start
        () => { this.controls.enabled = true; }   // Re-enable camera on aiming end
      );
      console.log('⛳ Golf ball created at starting position with hole at:', goalPos);
    }
  }

  private async goToNextLevel(): Promise<void> {
    // Try to load next level
    const success = await this.levelManager.nextLevel();
    if (success) {
      console.log('🚀 Moving to next level');
      this.createBall(); // Create ball at new level's start position
    } else {
      console.log('🎉 All levels completed! Congratulations!');
      // For now, restart from level 1
      await this.levelManager.loadLevel(1);
      this.createBall();
    }
  }
}

// Initialize and start the game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const game = new MinigolfGame();
  await game.start();
});

// Also export for module usage
export { MinigolfGame };