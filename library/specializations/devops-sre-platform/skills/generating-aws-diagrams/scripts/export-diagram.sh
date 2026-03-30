#!/bin/bash
#
# Export DrawIO diagram to PNG/PDF/SVG
#
# Usage:
#   ./export-diagram.sh <input.drawio> [format] [output]
#
# Arguments:
#   input.drawio  - The DrawIO file to export
#   format        - Export format: png, pdf, svg (default: png)
#   output        - Output file path (default: input filename with new extension)
#
# Requirements:
#   - DrawIO Desktop installed
#   - macOS: brew install drawio
#   - Or download from https://www.drawio.com/
#
# Examples:
#   ./export-diagram.sh diagram.drawio
#   ./export-diagram.sh diagram.drawio pdf
#   ./export-diagram.sh diagram.drawio png output.png

set -e

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./export-diagram.sh <input.drawio> [format] [output]"
    echo ""
    echo "Formats: png, pdf, svg"
    echo ""
    echo "Requirements:"
    echo "  macOS: brew install drawio"
    echo "  Or download from https://www.drawio.com/"
    exit 1
fi

INPUT_FILE="$1"
FORMAT="${2:-png}"
OUTPUT_FILE="$3"

# Validate input file
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 2
fi

# Generate output filename if not provided
if [ -z "$OUTPUT_FILE" ]; then
    BASENAME=$(basename "$INPUT_FILE" .drawio)
    DIRNAME=$(dirname "$INPUT_FILE")
    OUTPUT_FILE="${DIRNAME}/${BASENAME}.${FORMAT}"
fi

# Find DrawIO executable
DRAWIO_CMD=""

# macOS paths
if [ -x "/Applications/draw.io.app/Contents/MacOS/draw.io" ]; then
    DRAWIO_CMD="/Applications/draw.io.app/Contents/MacOS/draw.io"
elif command -v drawio &> /dev/null; then
    DRAWIO_CMD="drawio"
elif command -v /opt/homebrew/bin/drawio &> /dev/null; then
    DRAWIO_CMD="/opt/homebrew/bin/drawio"
fi

# Linux paths
if [ -z "$DRAWIO_CMD" ]; then
    if command -v drawio &> /dev/null; then
        DRAWIO_CMD="drawio"
    elif [ -x "/usr/bin/drawio" ]; then
        DRAWIO_CMD="/usr/bin/drawio"
    fi
fi

if [ -z "$DRAWIO_CMD" ]; then
    echo "Error: DrawIO Desktop not found"
    echo ""
    echo "Install DrawIO Desktop:"
    echo "  macOS: brew install drawio"
    echo "  Linux: sudo snap install drawio"
    echo "  Or download from https://www.drawio.com/"
    exit 3
fi

echo "Exporting: $INPUT_FILE"
echo "Format: $FORMAT"
echo "Output: $OUTPUT_FILE"
echo ""

# Export the diagram
"$DRAWIO_CMD" --export --format "$FORMAT" --output "$OUTPUT_FILE" "$INPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
    echo "Success: $OUTPUT_FILE"

    # Show file size
    if [ "$(uname)" = "Darwin" ]; then
        SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
    else
        SIZE=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
    fi
    echo "Size: $SIZE bytes"
else
    echo "Error: Export failed"
    exit 1
fi
