#!/usr/bin/env python3
"""
Extract shape names from DrawIO stencil XML files.

Usage:
    python extract-shape-names.py <xml_file> [--output <output_file>]

Example:
    python extract-shape-names.py gcp2.xml --output gcp2-shapes.txt
    python extract-shape-names.py gcp2.xml
"""

import xml.etree.ElementTree as ET
import argparse
import sys


def extract_shape_names(xml_file):
    """
    Parse DrawIO stencil XML and extract all shape names.

    Args:
        xml_file: Path to the XML stencil file

    Returns:
        List of shape names (strings)
    """
    try:
        tree = ET.parse(xml_file)
        root = tree.getroot()

        shapes = []
        for shape in root.findall('.//shape'):
            name = shape.get('name')
            if name:
                shapes.append(name)

        return shapes

    except ET.ParseError as e:
        print(f"Error parsing XML: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"File not found: {xml_file}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Extract shape names from DrawIO stencil XML files'
    )
    parser.add_argument('xml_file', help='Path to the XML stencil file')
    parser.add_argument('--output', '-o', help='Output file (default: stdout)')
    parser.add_argument('--sort', '-s', action='store_true',
                       help='Sort shape names alphabetically')
    parser.add_argument('--count', '-c', action='store_true',
                       help='Show count of shapes found')

    args = parser.parse_args()

    # Extract shape names
    shapes = extract_shape_names(args.xml_file)

    # Sort if requested
    if args.sort:
        shapes.sort()

    # Prepare output
    output_lines = shapes

    # Write to file or stdout
    if args.output:
        with open(args.output, 'w') as f:
            for shape in output_lines:
                f.write(f"{shape}\n")
        print(f"✓ Extracted {len(shapes)} shape names to {args.output}",
              file=sys.stderr)
    else:
        for shape in output_lines:
            print(shape)

        if args.count:
            print(f"\nTotal: {len(shapes)} shapes", file=sys.stderr)


if __name__ == '__main__':
    main()
