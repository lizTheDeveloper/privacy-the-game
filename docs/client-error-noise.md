# Client-side third-party frame guard (MUL-13)

Extension / content-blocker scripts injected into our pages throw errors that
land in GlitchTip looking like our crashes — `webkit-masked-url://hidden/`
(iOS content blockers), `chrome-extension://…`, `Can't find variable:
__gCrWeb`, `contentScriptData.init_ts`, `Invalid call to
runtime.sendMessage(). Tab not found.`, `Response was undefined`, bare
`Script error.` Closing each filing with the `noise` label only suppresses one
fingerprint in one repo, so we filter the whole class client-side instead.

## Rule

`beforeSend` (`src/utils/errors.js` + `src/utils/errorNoise.js`) drops an event
iff **every** frame of **every** exception has a filename that is:

- opaque: `webkit-masked-url://…`, `about:…`, `data:…`, missing/empty filename,
  `user-script:…`, or
- hosted outside the page origin and outside studio domains
  (`*.multiversegames.ai`, `*.multiversestudios.xyz`, `*.themultiverse.school`):
  `chrome-extension://`, `moz-extension://`, `safari-web-extension://`,
  `chrome://`, foreign http(s) origins, and `blob:` URLs whose embedded origin
  is foreign.

Kept (never dropped by this guard): any event with at least one same-origin or
studio-host frame, events with no stacktrace or no frames (conservative),
relative / build-tool paths (`webpack://…`), and `blob:` from our own origin.
Network-layer noise rules (server-side tier-2/tier-3 suppression and each app's
message filters) are unchanged and complementary.

## Tests

```
npm test            # full suite
npx vitest run tests/errorNoise.test.js
```

Fixtures cover the three cases triage needs to trust the filter:
our own frame → kept; only `webkit-masked-url://hidden/` → dropped;
mixed ours + third-party → kept.
