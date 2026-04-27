const listeners = new Map();

const emitter = {
  on(eventName, handler) {
    const handlers = listeners.get(eventName) || new Set();
    handlers.add(handler);
    listeners.set(eventName, handlers);

    return () => emitter.off(eventName, handler);
  },

  off(eventName, handler) {
    const handlers = listeners.get(eventName);
    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      listeners.delete(eventName);
    }
  },

  emit(eventName, payload) {
    const handlers = listeners.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      handler(payload);
    }
  },
};

export default emitter;
