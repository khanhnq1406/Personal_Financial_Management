/**
 * Callback registry for storing non-serializable functions outside of Redux state.
 * Used by modals that need to execute callbacks (like confirm dialogs).
 * @deprecated Use ConfirmationAction instead for async operations with loading states
 */

type Callback = () => void;

let callbackIdCounter = 0;
const callbacks = new Map<number, Callback>();

/**
 * Register a callback and return its ID.
 * The ID can be stored in Redux state (serializable).
 * @deprecated Use ConfirmationAction instead
 */
export function registerCallback(callback: Callback): number {
  const id = ++callbackIdCounter;
  callbacks.set(id, callback);
  return id;
}

/**
 * Execute a callback by its ID and remove it from the registry.
 * @deprecated Use ConfirmationAction instead
 */
export function executeCallback(id: number): void {
  const callback = callbacks.get(id);
  if (callback) {
    callback();
    callbacks.delete(id);
  }
}

/**
 * Remove a callback from the registry without executing it.
 * @deprecated Use ConfirmationAction instead
 */
export function unregisterCallback(id: number): void {
  callbacks.delete(id);
}
