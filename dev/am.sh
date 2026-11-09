#!/bin/bash
# Runs an AnimateMate command (from manifest.json) inside the open Sketch app.
# Usage: dev/am.sh <command-identifier>    e.g. dev/am.sh createAnimation
DEV="$(cd "$(dirname "$0")" && pwd)"
"/Applications/Sketch.app/Contents/MacOS/sketchtool" run "$DEV/../AnimateMate.sketchplugin" "$1" \
  --without-activating=YES --timeout=60 2>&1 | grep -v -e '^$'
echo "[am.sh $1 exit=${PIPESTATUS[0]}]"
