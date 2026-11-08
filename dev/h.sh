#!/bin/bash
# Runs an AMTestHarness command and prints its JSON result.
# Usage: dev/h.sh <command>    (setup, inspect, probe, selectA, animateA, exportTest, ...)
DEV="$(cd "$(dirname "$0")" && pwd)"
SKETCHTOOL=/Applications/Sketch.app/Contents/MacOS/sketchtool
rm -f "$DEV/.harness-out.json"
"$SKETCHTOOL" run "$DEV/AMTestHarness.sketchplugin" "$1" --without-activating=YES --timeout=60 2>&1 | grep -v -e '^$'
if [ -f "$DEV/.harness-out.json" ]; then
  cat "$DEV/.harness-out.json"; echo
else
  echo "no output (command failed before writing a result)" >&2
  exit 1
fi
