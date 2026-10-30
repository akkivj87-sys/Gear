/**
 * Unified Input Manager supporting Keyboard, Mouse with Pointer Lock,
 * Gamepad API (standard mapping), and Mobile Touch / Virtual Joystick.
 */

export interface InputState {
  forward: number; // -1 to 1
  right: number; // -1 to 1
  isSprinting: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  slidePressed: boolean;
  slideHeld: boolean;
  rollPressed: boolean;
  grapplePressed: boolean;
  grappleHeld: boolean;
  wallrunHeld: boolean;
  viewTogglePressed: boolean;
  respawnPressed: boolean;
  pausePressed: boolean;
  lookDeltaX: number;
  lookDeltaY: number;
}

export class InputManager {
  private state: InputState = {
    forward: 0,
    right: 0,
    isSprinting: false,
    jumpPressed: false,
    jumpHeld: false,
    slidePressed: false,
    slideHeld: false,
    rollPressed: false,
    grapplePressed: false,
    grappleHeld: false,
    wallrunHeld: false,
    viewTogglePressed: false,
    respawnPressed: false,
    pausePressed: false,
    lookDeltaX: 0,
    lookDeltaY: 0,
  };

  private keys: Record<string, boolean> = {};
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;
  private domElement: HTMLElement | null = null;

  // Touch & Virtual Joystick inputs
  private touchMoveVector: { x: number; y: number } = { x: 0, y: 0 };
  private touchLookVector: { x: number; y: number } = { x: 0, y: 0 };
  private touchActionFlags: {
    jump: boolean;
    slide: boolean;
    roll: boolean;
    grapple: boolean;
    wallrun: boolean;
  } = {
    jump: false,
    slide: false,
    roll: false,
    grapple: false,
    wallrun: false,
  };

  // Touch look drag tracker
  private touchLookOrigin: { x: number; y: number } | null = null;
  private touchLookId: number | null = null;

  // Gamepad state tracker
  private previousGamepadButtons: boolean[] = [];

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public attach(domElement: HTMLElement): void {
    this.domElement = domElement;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    domElement.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', this.handleTouchEnd);
    domElement.addEventListener('touchcancel', this.handleTouchEnd);
  }

  public detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    if (this.domElement) {
      this.domElement.removeEventListener('touchstart', this.handleTouchStart);
      this.domElement.removeEventListener('touchmove', this.handleTouchMove);
      this.domElement.removeEventListener('touchend', this.handleTouchEnd);
      this.domElement.removeEventListener('touchcancel', this.handleTouchEnd);
    }
  }

  public requestPointerLock(): void {
    if (this.domElement && !this.isPointerLocked) {
      try {
        this.domElement.requestPointerLock?.();
      } catch {
        // Pointer lock rejected or not supported
      }
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  public getPointerLock(): boolean {
    return this.isPointerLocked;
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys[e.code] = true;

    if (e.code === 'Space' && !e.repeat) {
      this.state.jumpPressed = true;
    }
    if ((e.code === 'KeyC' || e.code === 'ControlLeft') && !e.repeat) {
      this.state.slidePressed = true;
      this.state.rollPressed = true;
    }
    if (e.code === 'KeyE' && !e.repeat) {
      this.state.grapplePressed = true;
    }
    if (e.code === 'KeyV' && !e.repeat) {
      this.state.viewTogglePressed = true;
    }
    if (e.code === 'KeyR' && !e.repeat) {
      this.state.respawnPressed = true;
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
      this.state.pausePressed = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  // --- TOUCH CAMERA LOOK (Right half of the screen) ---

  private handleTouchStart(e: TouchEvent): void {
    if (!this.domElement) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // If touch starts on the right side of the screen, use for camera look
      if (touch.clientX > window.innerWidth * 0.45 && this.touchLookId === null) {
        this.touchLookId = touch.identifier;
        this.touchLookOrigin = { x: touch.clientX, y: touch.clientY };
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.touchLookOrigin || this.touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchLookId) {
        const dx = touch.clientX - this.touchLookOrigin.x;
        const dy = touch.clientY - this.touchLookOrigin.y;
        this.touchLookVector.x += dx * 1.5;
        this.touchLookVector.y += dy * 1.5;
        this.touchLookOrigin = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchLookId) {
        this.touchLookId = null;
        this.touchLookOrigin = null;
        break;
      }
    }
  }

  // --- MOBILE UI BRIDGE ---

  public setVirtualJoystick(x: number, y: number): void {
    this.touchMoveVector.x = Math.max(-1, Math.min(1, x));
    this.touchMoveVector.y = Math.max(-1, Math.min(1, y));
  }

  public triggerAction(action: 'jump' | 'slide' | 'roll' | 'grapple' | 'wallrun', active: boolean = true): void {
    this.touchActionFlags[action] = active;
    if (active) {
      if (action === 'jump') this.state.jumpPressed = true;
      if (action === 'slide') this.state.slidePressed = true;
      if (action === 'roll') this.state.rollPressed = true;
      if (action === 'grapple') this.state.grapplePressed = true;
    }
  }

  // --- GAMEPAD API POLLING ---

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return;

    const gp = gamepads[0] || gamepads[1];
    if (!gp || !gp.connected) return;

    // Left Stick Movement (with deadzone)
    const deadzone = 0.18;
    const axisX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
    const axisY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;

    if (Math.abs(axisX) > 0 || Math.abs(axisY) > 0) {
      this.state.right = axisX;
      this.state.forward = -axisY;
    }

    // Right Stick Camera Look
    const lookX = Math.abs(gp.axes[2]) > deadzone ? gp.axes[2] : 0;
    const lookY = Math.abs(gp.axes[3]) > deadzone ? gp.axes[3] : 0;
    this.mouseDeltaX += lookX * 18.0;
    this.mouseDeltaY += lookY * 14.0;

    // Buttons
    const isDown = (idx: number) => gp.buttons[idx]?.pressed || gp.buttons[idx]?.value > 0.5;
    const justPressed = (idx: number) => isDown(idx) && !this.previousGamepadButtons[idx];

    if (justPressed(0)) this.state.jumpPressed = true; // A/Cross
    if (isDown(0)) this.state.jumpHeld = true;

    if (justPressed(1)) {
      this.state.slidePressed = true;
      this.state.rollPressed = true;
    }
    if (isDown(1)) this.state.slideHeld = true;

    if (justPressed(2)) this.state.grapplePressed = true; // X/Square
    if (justPressed(3)) this.state.viewTogglePressed = true; // Y/Triangle
    if (isDown(4) || isDown(7)) this.state.isSprinting = true; // L1 or R2 sprint
    if (justPressed(9)) this.state.pausePressed = true; // Start

    // Store button states for next edge detection
    this.previousGamepadButtons = gp.buttons.map((b) => b.pressed || b.value > 0.5);
  }

  /**
   * Called once at the beginning of each frame tick.
   * Compiles and consumes single-frame trigger flags.
   */
  public update(): InputState {
    this.pollGamepad();

    // Keyboard Forward/Backward
    let kf = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) kf += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) kf -= 1;

    // Keyboard Left/Right
    let kr = 0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kr += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kr -= 1;

    // Merge Keyboard and Touch Joystick
    this.state.forward = Math.max(-1, Math.min(1, kf + this.touchMoveVector.y));
    this.state.right = Math.max(-1, Math.min(1, kr + this.touchMoveVector.x));

    // Continuous buttons
    this.state.isSprinting =
      this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.state.isSprinting;
    this.state.jumpHeld = this.keys['Space'] || this.touchActionFlags.jump || this.state.jumpHeld;
    this.state.slideHeld =
      this.keys['KeyC'] ||
      this.keys['ControlLeft'] ||
      this.touchActionFlags.slide ||
      this.state.slideHeld;
    this.state.grappleHeld =
      this.keys['KeyE'] || this.touchActionFlags.grapple || this.state.grappleHeld;
    this.state.wallrunHeld =
      this.keys['ShiftLeft'] || this.touchActionFlags.wallrun || this.state.wallrunHeld;

    // Camera delta
    this.state.lookDeltaX = this.mouseDeltaX + this.touchLookVector.x;
    this.state.lookDeltaY = this.mouseDeltaY + this.touchLookVector.y;

    // Return current state snapshot
    const current = { ...this.state };

    // Reset single-frame triggers & look deltas for next tick
    this.state.jumpPressed = false;
    this.state.slidePressed = false;
    this.state.rollPressed = false;
    this.state.grapplePressed = false;
    this.state.viewTogglePressed = false;
    this.state.respawnPressed = false;
    this.state.pausePressed = false;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.touchLookVector.x = 0;
    this.touchLookVector.y = 0;

    return current;
  }
}
