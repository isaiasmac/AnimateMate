# Development tools

`AMTestHarness.sketchplugin` is a small helper plugin for testing AnimateMate inside the
running Sketch app from the terminal. It is **not** part of AnimateMate and is not installed
with it.

It only works on a document that has a page called **AnimateMate Test**. `setup` creates a
new document with that page, so your own files are never touched.

## Requirements

- Sketch running, with `AnimateMate.sketchplugin` installed (symlinked) in the Plugins folder.
- `gifsicle` for GIF export: `brew install gifsicle`.

## Usage

```bash
dev/h.sh setup        # new document with artboard "AM Test", Box A and Box B
dev/h.sh animateA     # writes a known 2-keyframe animation (frames 0-10) into Box A
dev/h.sh exportTest   # runs AnimateMate's export without dialogs
dev/h.sh demo         # builds the README demo scene (artboard "AM Demo", frames 0-58)
dev/h.sh inspect      # prints the current page's layer tree
```

Each command prints its JSON result (also saved to `dev/.harness-out.json`).

`exportTest` reads its options from `dev/.harness-in.json`, for example:

```json
{ "scale": 2, "gif": 1, "png": 1, "name": "AM Test", "delay": 3, "loop": 0 }
```

Files go to `dev/.export-out/` unless `"output"` is set.

The README's `docs/images/demo.gif` is `demo` exported with
`{"scale": 2, "gif": 1, "png": 0, "delay": 4, "loop": 0, "optimize": 3}`.

Other commands: `probe` (checks the Sketch APIs AnimateMate relies on), `selectA`,
`selectNone`, `mutate`, `setupGroup`, `mutateC`.

`dev/am.sh <command>` runs an AnimateMate command (e.g. `createAnimation`) in Sketch. Commands
that open a dialog do not show it when run this way (Sketch 2026.3.1): test those from
**Plugins > AnimateMate** in Sketch instead.

If Sketch reopens in Safe Mode after a crash, plugins are disabled until Sketch is restarted.
