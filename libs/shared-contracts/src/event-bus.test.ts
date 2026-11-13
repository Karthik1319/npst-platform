import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './event-bus';

describe('createEventBus', () => {
  it('delivers an event to a listener', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    bus.on('demo:message', handler);

    bus.emit('demo:message', { from: 'test', text: 'hello' });

    expect(handler).toHaveBeenCalledWith({ from: 'test', text: 'hello' });
  });

  it('stops delivering after unsubscribe', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on('demo:message', handler);

    unsubscribe();
    bus.emit('demo:message', { from: 'test', text: 'ignored' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('works between two separate bus copies on the same window', () => {
    const busInAppA = createEventBus();
    const busInAppB = createEventBus();
    const handler = vi.fn();
    busInAppB.on('demo:message', handler);

    busInAppA.emit('demo:message', { from: 'A', text: 'hi B' });

    expect(handler).toHaveBeenCalledWith({ from: 'A', text: 'hi B' });
  });

  it('puts events on window with the npst: prefix', () => {
    const bus = createEventBus();
    const raw = vi.fn();
    window.addEventListener('npst:demo:message', raw);

    bus.emit('demo:message', { from: 'test', text: 'raw' });

    expect(raw).toHaveBeenCalledTimes(1);
    window.removeEventListener('npst:demo:message', raw);
  });
});
