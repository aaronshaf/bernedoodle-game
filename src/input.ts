export class InputManager {
  private gamepads: (Gamepad | null)[] = [null, null];

  constructor() {
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  private onGamepadConnected = (e: GamepadEvent) => {
    console.log('Gamepad connected:', e.gamepad.id);
    const emptySlot = this.gamepads.findIndex(g => g === null);
    if (emptySlot !== -1) {
      this.gamepads[emptySlot] = e.gamepad;
    }
  };

  private onGamepadDisconnected = (e: GamepadEvent) => {
    console.log('Gamepad disconnected:', e.gamepad.id);
    const index = this.gamepads.findIndex(g => g?.index === e.gamepad.index);
    if (index !== -1) {
      this.gamepads[index] = null;
    }
  };

  getGamepads(): (Gamepad | null)[] {
    const connectedGamepads = navigator.getGamepads();
    
    for (let i = 0; i < this.gamepads.length; i++) {
      if (this.gamepads[i]) {
        const currentGamepad = connectedGamepads[this.gamepads[i]!.index];
        if (currentGamepad) {
          this.gamepads[i] = currentGamepad;
        }
      }
    }
    
    return this.gamepads;
  }
}