#!/usr/bin/env bash
DIRNAME=$(dirname "$1")
NAME=$(basename "$DIRNAME")
echo "$NAME"
mkdir -p collection
cp "$1" "collection/$NAME.json"

TINY_MP3=$DIRNAME/tiny.mp3
if [ -f TINY_MP3 ]; then
  cp "$TINY_MP3" "collection/$NAME.mp3"
fi
