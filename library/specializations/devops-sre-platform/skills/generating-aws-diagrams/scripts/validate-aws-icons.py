#!/usr/bin/env python3
"""
Validate AWS icons in aws-icons.json against available shapes from aws4 stencil library.

Usage:
    python validate-aws-icons.py

This script:
1. Reads available shape names from .archive/aws4-available-shapes.txt
2. Compares against shapes used in assets/aws-icons.json
3. Reports valid, invalid, and suggested fixes

If the shapes file doesn't exist yet, run:
    python scripts/extract-shape-names.py <path-to-aws4.xml> --output .archive/aws4-available-shapes.txt
"""

import json
import sys
from pathlib import Path
from difflib import get_close_matches


def load_available_shapes(shapes_file):
    """Load available shape names from text file."""
    with open(shapes_file, 'r') as f:
        shapes = [line.strip() for line in f if line.strip()]
    return shapes


def load_aws_icons(icons_file):
    """Load AWS icons from JSON file."""
    with open(icons_file, 'r') as f:
        return json.load(f)


def extract_shape_name(full_style):
    """Extract the resIcon shape name from a full style string."""
    for part in full_style.split(';'):
        part = part.strip()
        if part.startswith('resIcon='):
            val = part.split('=', 1)[1]
            return val.replace('mxgraph.aws4.', '')
    return None


def validate_icons(available_shapes, aws_icons):
    """
    Validate each icon in aws-icons.json against available shapes.

    Returns dict with validation results.
    """
    # Build a set of available shape names (lowercase for comparison)
    shape_set = set(available_shapes)
    shape_set_lower = {s.lower(): s for s in available_shapes}

    results = {
        'valid': [],
        'invalid': [],
        'suggestions': {},
        'case_mismatches': []
    }

    for service in aws_icons['services']:
        shape_name = service['drawio_shape']['shape_name']
        service_name = service['service_name']
        service_id = service['service_id']

        # Normalize: JSON uses underscores, stencil uses spaces
        normalized_name = shape_name.replace('_', ' ')

        # Check exact match (comparing normalized name against stencil names)
        if normalized_name in shape_set:
            results['valid'].append({
                'service_name': service_name,
                'service_id': service_id,
                'shape_name': shape_name
            })
        elif normalized_name.lower() in shape_set_lower:
            # Case mismatch
            results['case_mismatches'].append({
                'service_name': service_name,
                'service_id': service_id,
                'used_shape': shape_name,
                'correct_shape': shape_set_lower[normalized_name.lower()]
            })
        else:
            # Find close matches
            close_matches = get_close_matches(
                normalized_name,
                available_shapes,
                n=3,
                cutoff=0.6
            )

            results['invalid'].append({
                'service_name': service_name,
                'service_id': service_id,
                'shape_name': shape_name
            })

            if close_matches:
                results['suggestions'][service_id] = close_matches

    return results


def print_report(results):
    """Print validation report."""
    print("\n" + "=" * 70)
    print("AWS ICON VALIDATION REPORT")
    print("=" * 70 + "\n")

    # Valid icons
    print(f"✅ VALID ICONS ({len(results['valid'])})")
    print("-" * 70)
    for item in results['valid']:
        print(f"  ✓ {item['service_name']} → {item['shape_name']}")

    # Case mismatches
    if results['case_mismatches']:
        print(f"\n⚠️  CASE MISMATCHES ({len(results['case_mismatches'])})")
        print("-" * 70)
        for item in results['case_mismatches']:
            print(f"  ! {item['service_name']}")
            print(f"    Used: {item['used_shape']}")
            print(f"    Correct: {item['correct_shape']}")

    # Invalid icons
    if results['invalid']:
        print(f"\n❌ INVALID/MISSING ICONS ({len(results['invalid'])})")
        print("-" * 70)
        for item in results['invalid']:
            print(f"  ✗ {item['service_name']} → {item['shape_name']}")

            service_id = item['service_id']
            if service_id in results['suggestions']:
                print(f"    Suggestions:")
                for suggestion in results['suggestions'][service_id]:
                    print(f"      - {suggestion}")

    # Summary
    total = len(results['valid']) + len(results['invalid']) + len(results['case_mismatches'])
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total services: {total}")
    print(f"Valid: {len(results['valid'])}")
    print(f"Case mismatches: {len(results['case_mismatches'])}")
    print(f"Invalid/Missing: {len(results['invalid'])}")

    if total > 0:
        success_rate = (len(results['valid']) / total) * 100
        print(f"Success rate: {success_rate:.1f}%")
    print("=" * 70 + "\n")


def main():
    script_dir = Path(__file__).parent
    skill_root = script_dir.parent

    # Look for shapes file in multiple locations
    shapes_candidates = [
        skill_root / '.archive' / 'aws4-available-shapes.txt',           # Inside skill
        skill_root.parent.parent.parent / '.archive' / 'aws4-available-shapes.txt',  # Project root .archive/
    ]

    shapes_file = None
    for candidate in shapes_candidates:
        if candidate.exists():
            shapes_file = candidate
            break

    icons_file = skill_root / 'assets' / 'aws-icons.json'

    if shapes_file is None:
        print("Error: aws4-available-shapes.txt not found", file=sys.stderr)
        print("Searched:")
        for c in shapes_candidates:
            print(f"  - {c}")
        print("\nRun: python scripts/extract-shape-names.py <aws4.xml> --output .archive/aws4-available-shapes.txt")
        sys.exit(1)

    if not icons_file.exists():
        print(f"Error: {icons_file} not found", file=sys.stderr)
        sys.exit(1)

    # Load data
    available_shapes = load_available_shapes(shapes_file)
    aws_icons = load_aws_icons(icons_file)

    print(f"Loaded {len(available_shapes)} available shapes from aws4 stencil")
    print(f"Loaded {len(aws_icons['services'])} services from aws-icons.json")

    # Validate
    results = validate_icons(available_shapes, aws_icons)

    # Print report
    print_report(results)

    # Exit with error if there are issues
    if results['invalid'] or results['case_mismatches']:
        sys.exit(1)
    else:
        print("✅ All AWS icons are valid!")
        sys.exit(0)


if __name__ == '__main__':
    main()
