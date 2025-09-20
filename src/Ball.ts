import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Ball {
  private mesh!: THREE.Mesh;
  private body!: CANNON.Body;
  private scene: THREE.Scene;
  private world: CANNON.World;
  private isMoving: boolean = false;
  private moveThreshold: number = 0.1; // Minimum velocity to consider ball as moving
  private raycaster: THREE.Raycaster;
  private holePosition: THREE.Vector3 | null = null;
  private holeRadius: number = 0.4;
  private groundLevel: number = 0; // Track the normal ground level
  private hasCompletedHole: boolean = false;
  private strokeCount: number = 0;
  private onNextLevelCallback?: () => void;

  constructor(scene: THREE.Scene, world: CANNON.World, position: THREE.Vector3) {
    this.scene = scene;
    this.world = world;
    this.raycaster = new THREE.Raycaster();
    
    this.createBall(position);
    this.setupPhysics(position);
  } 

  private createBall(position: THREE.Vector3): void {
    // Create visual ball
    const ballRadius = 0.3;
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 12);
    const ballMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    
    this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
    this.mesh.position.copy(position);
    this.mesh.castShadow = true;
    this.mesh.name = 'golf-ball';
    
    this.scene.add(this.mesh);
    console.log('✅ Golf ball visual created');
  }

  private setupPhysics(position: THREE.Vector3): void {
    // Create physics body
    const ballShape = new CANNON.Sphere(0.3); // Match the visual ball radius
    this.body = new CANNON.Body({ 
      mass: 0.045, // Standard golf ball mass in kg
      shape: ballShape,
      material: new CANNON.Material({
        friction: 0.4,
        restitution: 0.8 // Higher bounce factor for realistic wall bounces
      })
    });
    
    // Add damping to make the ball slow down naturally
    this.body.linearDamping = 0.4;  // Reduces linear velocity over time
    this.body.angularDamping = 0.4; // Reduces rotational velocity over time
    
    this.body.position.set(position.x, position.y, position.z);
    this.world.addBody(this.body);
    
    console.log('✅ Golf ball physics created');
  }

  public setHolePosition(position: THREE.Vector3, radius: number = 0.4): void {
    this.holePosition = position.clone();
    this.holeRadius = radius;
  }

  public setNextLevelCallback(callback: () => void): void {
    this.onNextLevelCallback = callback;
  }

  public hit(direction: THREE.Vector3, power: number): void {
    if (this.isMoving || this.hasCompletedHole) {
      console.log('Ball is still moving or hole is completed, wait for it to stop');
      return;
    }

    // Increment stroke count
    this.strokeCount++;
    console.log(`🏌️ Stroke ${this.strokeCount}`);

    // Apply force to the ball
    const force = direction.normalize().multiplyScalar(power);
    this.body.velocity.set(force.x, 0, force.z);
    
    // Add slight upward velocity for realistic trajectory
    this.body.velocity.y = power * 0.1;
    
    console.log(`⛳ Ball hit with power ${power}, direction:`, direction);
    this.isMoving = true;
  }

  public update(): void {
    // Skip updates if hole is already completed
    if (this.hasCompletedHole) {
      return;
    }
    
    const ballPosition = this.getPosition();
    
    // Check if ball has fallen below ground level
    if (ballPosition.y < this.groundLevel - 0.1) {
      this.completeHole();
      return;
    }
    
    // Check if ball is over the hole
    let isOverHole = false;
    if (this.holePosition) {
      const holeDistance = Math.sqrt(
        Math.pow(ballPosition.x - this.holePosition.x, 2) + 
        Math.pow(ballPosition.z - this.holePosition.z, 2)
      );
      isOverHole = holeDistance < this.holeRadius;
    }
    
    // Use raycaster to check if there's visual ground below (for hole detection)
    this.raycaster.set(ballPosition, new THREE.Vector3(0, -1, 0));
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    const groundIntersects = intersects.filter(intersect => 
      intersect.object !== this.mesh && 
      intersect.object.name.includes('course') && // Only check course geometry
      intersect.distance < 0.5
    );
    
    // If ball is over hole (no visual ground below) AND over the hole position
    if (isOverHole && groundIntersects.length === 0) {
      console.log('🕳️ Ball is over the hole - letting it fall!');
      // Disable collision with ground temporarily by moving the body downward
      this.body.position.y -= 0.3; // Push it through the ground plane more dramatically
    }
    
    // Apply friction to reduce velocity over time
    const frictionForce = 0.995;
    this.body.velocity.x *= frictionForce;
    this.body.velocity.z *= frictionForce;
    
    // Check if ball has very little velocity and stop it completely
    const velocity = this.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    
    if (speed < 0.05) {
      this.body.velocity.set(0, this.body.velocity.y, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
    
    // Update visual position from physics
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
    
    if (speed < this.moveThreshold && this.isMoving) {
      this.isMoving = false;
      console.log('🛑 Ball has stopped moving');
    }
  }

  private completeHole(): void {
    if (this.hasCompletedHole) return;
    
    this.hasCompletedHole = true;
    this.isMoving = false;
    
    // Stop all ball movement
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    
    console.log('🏌️ Hole completed!');
    
    // Create a completion message overlay
    this.showCompletionMessage();
  }

  private showCompletionMessage(): void {
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.fontFamily = 'Arial, sans-serif';
    
    // Create message content
    const messageDiv = document.createElement('div');
    messageDiv.style.backgroundColor = 'white';
    messageDiv.style.padding = '40px';
    messageDiv.style.borderRadius = '20px';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    
    const title = document.createElement('h1');
    title.textContent = '🏌️ Hole Completed! ⛳';
    title.style.color = '#2e7d32';
    title.style.marginBottom = '20px';
    title.style.fontSize = '2.5em';
    
    const strokeInfo = document.createElement('div');
    strokeInfo.style.backgroundColor = '#f0f8ff';
    strokeInfo.style.padding = '15px';
    strokeInfo.style.borderRadius = '10px';
    strokeInfo.style.marginBottom = '20px';
    strokeInfo.style.border = '2px solid #4caf50';
    
    const strokeTitle = document.createElement('h2');
    strokeTitle.textContent = `Strokes: ${this.strokeCount}`;
    strokeTitle.style.color = '#1976d2';
    strokeTitle.style.margin = '0 0 10px 0';
    strokeTitle.style.fontSize = '1.8em';
    
    const strokeText = document.createElement('p');
    const par = 3; // You can make this dynamic later
    let performance = '';
    if (this.strokeCount === 1) {
      performance = '🔥 Hole-in-One! Amazing!';
      strokeText.style.color = '#ff6f00';
    } else if (this.strokeCount <= par - 2) {
      performance = '🦅 Eagle! Fantastic!';
      strokeText.style.color = '#388e3c';
    } else if (this.strokeCount === par - 1) {
      performance = '🐦 Birdie! Great shot!';
      strokeText.style.color = '#689f38';
    } else if (this.strokeCount === par) {
      performance = '✅ Par! Nice work!';
      strokeText.style.color = '#4caf50';
    } else if (this.strokeCount === par + 1) {
      performance = '⚡ Bogey. Keep practicing!';
      strokeText.style.color = '#ff9800';
    } else {
      performance = '💪 Keep trying! You\'ll get it!';
      strokeText.style.color = '#f44336';
    }
    
    strokeText.textContent = performance;
    strokeText.style.fontSize = '1.1em';
    strokeText.style.margin = '0';
    strokeText.style.fontWeight = 'bold';
    
    strokeInfo.appendChild(strokeTitle);
    strokeInfo.appendChild(strokeText);
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Great shot! The ball fell into the hole.';
    subtitle.style.color = '#666';
    subtitle.style.fontSize = '1.2em';
    subtitle.style.marginBottom = '30px';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.justifyContent = 'center';
    
    // Retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry';
    retryButton.style.backgroundColor = '#ff9800';
    retryButton.style.color = 'white';
    retryButton.style.border = 'none';
    retryButton.style.padding = '15px 30px';
    retryButton.style.fontSize = '1.1em';
    retryButton.style.borderRadius = '8px';
    retryButton.style.cursor = 'pointer';
    retryButton.style.transition = 'background-color 0.3s';
    
    retryButton.onmouseover = () => retryButton.style.backgroundColor = '#f57c00';
    retryButton.onmouseout = () => retryButton.style.backgroundColor = '#ff9800';
    retryButton.onclick = () => {
      overlay.remove();
      // Reset the ball position and state
      this.resetBall();
    };
    
    // Next Level button
    const nextLevelButton = document.createElement('button');
    nextLevelButton.textContent = 'Next Level';
    nextLevelButton.style.backgroundColor = '#4caf50';
    nextLevelButton.style.color = 'white';
    nextLevelButton.style.border = 'none';
    nextLevelButton.style.padding = '15px 30px';
    nextLevelButton.style.fontSize = '1.1em';
    nextLevelButton.style.borderRadius = '8px';
    nextLevelButton.style.cursor = 'pointer';
    nextLevelButton.style.transition = 'background-color 0.3s';
    
    nextLevelButton.onmouseover = () => nextLevelButton.style.backgroundColor = '#45a049';
    nextLevelButton.onmouseout = () => nextLevelButton.style.backgroundColor = '#4caf50';
    nextLevelButton.onclick = () => {
      overlay.remove();
      // Go to next level
      this.goToNextLevel();
    };
    
    buttonContainer.appendChild(retryButton);
    buttonContainer.appendChild(nextLevelButton);
    
    messageDiv.appendChild(title);
    messageDiv.appendChild(strokeInfo);
    messageDiv.appendChild(subtitle);
    messageDiv.appendChild(buttonContainer);
    overlay.appendChild(messageDiv);
    document.body.appendChild(overlay);
  }

  private resetBall(): void {
    this.hasCompletedHole = false;
    this.isMoving = false;
    this.strokeCount = 0; // Reset stroke count for new attempt
    
    // Reset to starting position
    const startPos = new THREE.Vector3(0, 0.5, 5); // Default start position
    this.setPosition(startPos);
    
    console.log('🔄 Ball reset to starting position - Strokes reset to 0');
  }

  private goToNextLevel(): void {
    if (this.onNextLevelCallback) {
      this.onNextLevelCallback();
    } else {
      console.log('🚀 Next level functionality not implemented yet');
      // Fallback to retry for now
      this.resetBall();
    }
  }

  public getPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }

  public setPosition(position: THREE.Vector3): void {
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.mesh.position.copy(position);
    this.isMoving = false;
  }

  public isInMotion(): boolean {
    return this.isMoving;
  }

  public isHoleCompleted(): boolean {
    return this.hasCompletedHole;
  }

  public getStrokeCount(): number {
    return this.strokeCount;
  }

  public isFallingIntoHole(): boolean {
    return false; // Not used in simple approach
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getBody(): CANNON.Body {
    return this.body;
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.world.removeBody(this.body);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}