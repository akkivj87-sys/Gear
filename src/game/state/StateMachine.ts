/**
 * Player State Machine for Rooftop Parkour: Apex Flow.
 * Manages player states, valid transitions, entry/exit callbacks, and animation triggers.
 */

export type MovementState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'SPRINT'
  | 'JUMP'
  | 'DOUBLE_JUMP'
  | 'FALL'
  | 'SLIDE'
  | 'WALL_RUN'
  | 'VAULT'
  | 'MANTLE'
  | 'ROLL'
  | 'GRAPPLE';

export interface StateTransitionListener {
  (from: MovementState, to: MovementState): void;
}

export class StateMachine {
  private currentState: MovementState = 'IDLE';
  private previousState: MovementState = 'IDLE';
  private stateTimer: number = 0;
  private listeners: StateTransitionListener[] = [];

  constructor() {}

  public get current(): MovementState {
    return this.currentState;
  }

  public get previous(): MovementState {
    return this.previousState;
  }

  public get timeInState(): number {
    return this.stateTimer;
  }

  public addListener(cb: StateTransitionListener): void {
    this.listeners.push(cb);
  }

  public removeListener(cb: StateTransitionListener): void {
    this.listeners = this.listeners.filter((l) => l !== cb);
  }

  public update(deltaTime: number): void {
    this.stateTimer += deltaTime;
  }

  public changeState(nextState: MovementState): boolean {
    if (this.currentState === nextState) return false;

    // Transition guards if needed
    const from = this.currentState;
    this.previousState = from;
    this.currentState = nextState;
    this.stateTimer = 0;

    for (const listener of this.listeners) {
      listener(from, nextState);
    }

    return true;
  }

  public isAirborne(): boolean {
    return (
      this.currentState === 'JUMP' ||
      this.currentState === 'DOUBLE_JUMP' ||
      this.currentState === 'FALL' ||
      this.currentState === 'GRAPPLE'
    );
  }

  public isGroundedState(): boolean {
    return (
      this.currentState === 'IDLE' ||
      this.currentState === 'WALK' ||
      this.currentState === 'RUN' ||
      this.currentState === 'SPRINT' ||
      this.currentState === 'SLIDE' ||
      this.currentState === 'ROLL'
    );
  }
}
