const { EventEmitter } = require('events');

/**
 * Lightweight in-process domain event bus.
 * Services publish domain events; listeners (activity/notifications) react.
 * Keeps workflow actions decoupled (per PRD section 16).
 */
class DomainEventBus extends EventEmitter {
  /**
   * Awaitable emit: resolves after all listeners finish their async work.
   * Services use this so side-effects (activity history, notifications)
   * complete before the request returns — keeps tests deterministic and
   * avoids unhandled rejections / DB ops racing past connection teardown.
   * Listener failures are isolated so one broken listener cannot break a workflow.
   * @param {string} event
   * @param {*} payload
   * @returns {Promise<void>}
   */
  async emitAsync(event, payload) {
    const handlers = this.listeners(event);
    await Promise.all(
      handlers.map((handler) =>
        Promise.resolve()
          .then(() => handler(payload))
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(`[events] listener error for "${event}"`, err);
          })
      )
    );
  }
}

const bus = new DomainEventBus();
bus.setMaxListeners(50);

module.exports = bus;
