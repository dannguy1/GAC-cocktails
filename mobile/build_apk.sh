#!/bin/bash
# Build APK for GAC Bartender mobile app
# Usage: ./build_apk.sh [debug|release]
# Follows the same pattern as GAC-Concierge/mobile/build_apk.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODE=${1:-release}

export ANDROID_HOME=${ANDROID_HOME:-/home/danlnguyen/android-sdk}
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

# Auto-detect Java
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    fi
fi

cd "$SCRIPT_DIR"

echo "=== GAC Bartender APK Build ($MODE) ==="
echo ""

echo "[1/4] Building mobile cocktail data..."
cd "$SCRIPT_DIR/.."
node scripts/build-mobile-data.js
cd "$SCRIPT_DIR"

echo "[2/4] Installing dependencies..."
npm install

echo "[3/4] Running expo prebuild..."
npx expo prebuild --platform android --clean

echo "[4/4] Building APK ($MODE)..."
cd android
if [ "$MODE" = "debug" ]; then
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
else
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
fi

if [ -f "$APK_PATH" ]; then
    SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✓ APK built successfully!"
    echo "  Path: $SCRIPT_DIR/android/$APK_PATH"
    echo "  Size: $SIZE"
else
    echo "✗ APK not found at expected path"
    exit 1
fi
