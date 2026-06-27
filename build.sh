#!/bin/bash
set -e

echo "Checking for wasm32-unknown-unknown target..."
rustup target add wasm32-unknown-unknown

echo "Building WASM module..."
wasm-pack build --target web --out-dir web/pkg

echo "Build complete. Run 'cd web && npm install && npm run dev' to start."
