import * as THREE from 'three';
import { Ball } from './Ball';

export class BallControls {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private ball: Ball;
  private scene: THREE.Scene;
  
  private isAiming: boolean = false;
  private aimStartPosition: THREE.Vector2 = new THREE.Vector2();
  private aimEndPosition: THREE.Vector2 = new THREE.Vector2();
  private aimLine: THREE.Line | null = null;
  private powerIndicator: THREE.Mesh | null = null;
  
  private maxPower: number = 15;
  private minPower: number = 1;

  // Callbacks for aiming events
  private onAimingStart?: () => void;
  private onAimingEnd?: () => void;

  constructor(camera: THREE.Camera, domElement: HTMLElement, ball: Ball, scene: THREE.Scene, onAimingStart?: () => void, onAimingEnd?: () => void) {
    this.camera = camera;
    this.domElement = domElement;
    this.ball = ball;
    this.scene = scene;
    this.onAimingStart = onAimingStart;
    this.onAimingEnd = onAimingEnd;
    
    this.setupEventListeners();
    this.createAimingIndicators();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Prevent context menu on right click
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private createAimingIndicators(): void {
    // Create aim line
    const aimGeometry = new THREE.BufferGeometry();
    const aimMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff0000, 
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    
    this.aimLine = new THREE.Line(aimGeometry, aimMaterial);
    this.aimLine.visible = false;
    this.scene.add(this.aimLine);
    
    // Create power indicator (arrow head)
    const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    
    this.powerIndicator = new THREE.Mesh(arrowGeometry, arrowMaterial);
    this.powerIndicator.visible = false;
    this.scene.add(this.powerIndicator);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || this.ball.isInMotion()) return; // Only left click and ball must be stationary
    
    this.isAiming = true;
    this.aimStartPosition.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    // Disable camera controls while aiming
    if (this.onAimingStart) {
      this.onAimingStart();
    }
    
    console.log('🎯 Started aiming');
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isAiming) return;
    
    this.aimEndPosition.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    this.updateAimingVisuals();
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.isAiming || event.button !== 0) return;
    
    this.isAiming = false;
    this.hideAimingVisuals();
    
    // Re-enable camera controls
    if (this.onAimingEnd) {
      this.onAimingEnd();
    }
    
    // Calculate direction and power
    const { direction, power } = this.calculateShotParameters();
    
    if (power > 0.1) { // Minimum power threshold
      this.ball.hit(direction, power);
      console.log(`⛳ Shot fired! Power: ${power.toFixed(2)}, Direction: (${direction.x.toFixed(2)}, ${direction.z.toFixed(2)})`);
    }
  }

  private updateAimingVisuals(): void {
    const ballPosition = this.ball.getPosition();
    const { direction, power } = this.calculateShotParameters();
    
    if (power < 0.1) {
      this.hideAimingVisuals();
      return;
    }
    
    // Update aim line
    const lineLength = Math.min(power / this.maxPower * 3, 3); // Max 3 units long
    const lineEnd = ballPosition.clone().add(direction.clone().multiplyScalar(lineLength));
    
    const positions = new Float32Array([
      ballPosition.x, ballPosition.y + 0.05, ballPosition.z,
      lineEnd.x, lineEnd.y + 0.05, lineEnd.z
    ]);
    
    this.aimLine!.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.aimLine!.visible = true;
    
    // Update power indicator (arrow)
    this.powerIndicator!.position.copy(lineEnd);
    this.powerIndicator!.position.y += 0.1;
    this.powerIndicator!.lookAt(ballPosition);
    this.powerIndicator!.rotateX(Math.PI / 2); // Point the cone forward
    
    // Scale arrow based on power
    const scale = Math.min(power / this.maxPower * 2 + 0.5, 2);
    this.powerIndicator!.scale.setScalar(scale);
    this.powerIndicator!.visible = true;
  }

  private calculateShotParameters(): { direction: THREE.Vector3, power: number } {
    // Convert screen coordinates to world coordinates
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.aimStartPosition, this.camera);
    raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    const startWorld = raycaster.ray.direction.clone();
    
    raycaster.setFromCamera(this.aimEndPosition, this.camera);
    raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    const endWorld = raycaster.ray.direction.clone();
    
    // Calculate direction (reversed because we're pulling back to aim forward)
    const direction = startWorld.sub(endWorld).normalize();
    direction.y = 0; // Keep it horizontal
    
    // Calculate power based on mouse drag distance
    const dragDistance = this.aimStartPosition.distanceTo(this.aimEndPosition);
    const power = Math.min(dragDistance * this.maxPower * 2, this.maxPower);
    
    return { direction, power };
  }

  private hideAimingVisuals(): void {
    if (this.aimLine) this.aimLine.visible = false;
    if (this.powerIndicator) this.powerIndicator.visible = false;
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.removeEventListener('contextmenu', (e) => e.preventDefault());
    
    if (this.aimLine) {
      this.scene.remove(this.aimLine);
      this.aimLine.geometry.dispose();
      (this.aimLine.material as THREE.Material).dispose();
    }
    
    if (this.powerIndicator) {
      this.scene.remove(this.powerIndicator);
      this.powerIndicator.geometry.dispose();
      (this.powerIndicator.material as THREE.Material).dispose();
    }
  }
}
