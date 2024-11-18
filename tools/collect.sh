#!/usr/bin/env bash
NAME=$(basename "$(dirname "$1")")
echo "$NAME"
mkdir -p collection
cp "$1" "collection/$NAME.json"
