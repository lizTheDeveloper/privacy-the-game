import { describe, it, expect } from 'vitest';
import {
  eventHasOnlyThirdPartyFrames,
  frameIsOpaqueOrForeign,
} from '../src/utils/errorNoise.js';

const PAGE = 'https://play.multiversegames.ai';

const ev = (...frameNamesPerException) => ({
  exception: {
    values: frameNamesPerException.map((frames) => ({
      type: 'Error',
      value: 'boom',
      stacktrace: { frames: frames.map((filename) => ({ filename })) },
    })),
  },
});

describe('frameIsOpaqueOrForeign', () => {
  it('keeps same-origin and studio-CDN http frames', () => {
    expect(frameIsOpaqueOrForeign('https://play.multiversegames.ai/src/app.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('https://cdn.multiversegames.ai/lib/x.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('https://analytics.multiversestudios.xyz/u.js', PAGE)).toBe(false);
  });
  it('keeps scheme-less / build-tool frames (our bundles)', () => {
    expect(frameIsOpaqueOrForeign('/src/utils/errors.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('webpack://reclaim-city/src/app.js', PAGE)).toBe(false);
  });
  it('drops opaque extension frames', () => {
    expect(frameIsOpaqueOrForeign('webkit-masked-url://hidden/', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('about:srcdoc', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign(undefined, PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('user-script:42', PAGE)).toBe(true);
  });
  it('drops extension and foreign-origin frames', () => {
    expect(frameIsOpaqueOrForeign('chrome-extension://abcdef/content.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('moz-extension://abcdef/content.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('safari-web-extension://abcdef/script.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('https://evil.example/inject.js', PAGE)).toBe(true);
  });
  it('attributes blob: URLs via their embedded origin', () => {
    expect(frameIsOpaqueOrForeign('blob:' + PAGE + '/uuid', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('blob:https://evil.example/uuid', PAGE)).toBe(true);
  });
});

describe('eventHasOnlyThirdPartyFrames', () => {
  it('(a) keeps an event with our own bundled frame', () => {
    expect(eventHasOnlyThirdPartyFrames(ev([`${PAGE}/src/app.js`]), PAGE)).toBe(false);
  });
  it('(b) drops an event whose only frame is webkit-masked-url://hidden/', () => {
    expect(eventHasOnlyThirdPartyFrames(ev(['webkit-masked-url://hidden/']), PAGE)).toBe(true);
  });
  it('(c) keeps a mixed event (ours + third-party)', () => {
    expect(
      eventHasOnlyThirdPartyFrames(
        ev([`${PAGE}/src/app.js`, 'chrome-extension://abcdef/content.js']),
        PAGE,
      ),
    ).toBe(false);
    expect(
      eventHasOnlyThirdPartyFrames(
        ev(['https://evil.example/x.js'], [`${PAGE}/src/main.js`]),
        PAGE,
      ),
    ).toBe(false);
  });
  it('drops all-extension stacks even across multiple exception values', () => {
    expect(
      eventHasOnlyThirdPartyFrames(
        ev(['webkit-masked-url://hidden/'], ['about:blank', 'safari-web-extension://a/b.js']),
        PAGE,
      ),
    ).toBe(true);
  });
  it('is conservative: keeps events with no frames to attribute', () => {
    expect(eventHasOnlyThirdPartyFrames({ message: 'hi' }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [] } }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [{ type: 'Error' }] } }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [{ stacktrace: { frames: [] } }] } }, PAGE)).toBe(false);
  });
  it('prefers abs_path over filename when present', () => {
    const event = {
      exception: {
        values: [
          { stacktrace: { frames: [{ filename: 'eval at <anonymous>', abs_path: `${PAGE}/src/app.js` }] } },
        ],
      },
    };
    expect(eventHasOnlyThirdPartyFrames(event, PAGE)).toBe(false);
  });
});
