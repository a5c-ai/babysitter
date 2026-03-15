#!/bin/bash
#
# Open a DrawIO file in DrawIO Desktop application
#
# Usage:
#   ./open-diagram.sh <file.drawio>
#
# Requirements:
#   - DrawIO Desktop installed
#   - macOS: brew install drawio
#   - Or download from https://www.drawio.com/

set -e

if [ -z "$1" ]; then
    echo "Usage: ./open-diagram.sh <file.drawio>"
    echo ""
    echo "Opens the specified .drawio file in DrawIO Desktop"
    exit 1
fi

INPUT_FILE="$1"

# Validate input file
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: File not found: $INPUT_FILE"
    exit 2
fi

# Get absolute path
if [ "$(uname)" = "Darwin" ]; then
    ABS_PATH=$(cd "$(dirname "$INPUT_FILE")" && pwd)/$(basename "$INPUT_FILE")
else
    ABS_PATH=$(realpath "$INPUT_FILE")
fi

echo "Opening: $ABS_PATH"

# Platform-specific open commands
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    if [ -d "/Applications/draw.io.app" ]; then
        open -a "draw.io" "$ABS_PATH"
    elif command -v drawio &> /dev/null; then
        drawio "$ABS_PATH" &
    else
        echo "Error: DrawIO Desktop not found"
        echo "Install with: brew install drawio"
        exit 3
    fi
elif [ "$(uname)" = "Linux" ]; then
    # Linux
    if command -v drawio &> /dev/null; then
        drawio "$ABS_PATH" &
    elif [ -x "/usr/bin/drawio" ]; then
        /usr/bin/drawio "$ABS_PATH" &
    else
        echo "Error: DrawIO Desktop not found"
        echo "Install with: sudo snap install drawio"
        exit 3
    fi
else
    # Windows (Git Bash / WSL)
    if command -v drawio.exe &> /dev/null; then
        drawio.exe "$ABS_PATH" &
    else
        echo "Error: DrawIO Desktop not found"
        echo "Download from: https://www.drawio.com/"
        exit 3
    fi
fi

echo "DrawIO Desktop launched"
