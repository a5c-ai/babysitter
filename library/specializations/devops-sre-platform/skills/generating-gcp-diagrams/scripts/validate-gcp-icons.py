#!/usr/bin/env python3
"""
Validate GCP icons in gcp-icons.json against available shapes from gcp2.xml.

Usage:
    python validate-gcp-icons.py [--fix]

This script:
1. Reads available shape names from .archive/gcp2-available-shapes.txt
2. Compares against shapes used in assets/gcp-icons.json
3. Reports valid, invalid, and suggested fixes
4. Optionally updates gcp-icons.json with fixes
"""

import json
import sys
import os
from pathlib import Path
from difflib import get_close_matches


def title_to_snake_case(title):
    """Convert 'Cloud Run' to 'cloud_run'."""
    return title.lower().replace(' ', '_').replace('-', '_')


def snake_to_title_case(snake):
    """Convert 'cloud_run' to 'Cloud Run'."""
    return ' '.join(word.capitalize() for word in snake.replace('_', ' ').split())


def load_available_shapes(shapes_file):
    """Load available shape names from text file."""
    with open(shapes_file, 'r') as f:
        # Filter out empty lines
        shapes = [line.strip() for line in f if line.strip()]
    return shapes


def load_gcp_icons(icons_file):
    """Load GCP icons from JSON file."""
    with open(icons_file, 'r') as f:
        return json.load(f)


def validate_icons(available_shapes, gcp_icons):
    """
    Validate each icon in gcp-icons.json.

    Returns dict with validation results:
    {
        'valid': [...],
        'invalid': [...],
        'suggestions': {...}
    }
    """
    # Create lookup: snake_case -> Title Case
    shape_lookup = {title_to_snake_case(shape): shape for shape in available_shapes}

    results = {
        'valid': [],
        'invalid': [],
        'suggestions': {},
        'case_mismatches': []
    }

    for service in gcp_icons['services']:
        shape_name = service['drawio_shape']['shape_name']
        service_name = service['service_name']
        service_id = service['service_id']

        # Check if shape exists (exact match in snake_case)
        if shape_name in shape_lookup:
            results['valid'].append({
                'service_name': service_name,
                'service_id': service_id,
                'shape_name': shape_name,
                'actual_shape': shape_lookup[shape_name]
            })
        else:
            # Try to find close matches
            title_version = snake_to_title_case(shape_name)

            # Check if the title case version exists exactly
            if title_version in available_shapes:
                results['case_mismatches'].append({
                    'service_name': service_name,
                    'service_id': service_id,
                    'used_shape': shape_name,
                    'correct_shape': title_version,
                    'note': 'Exact match exists in title case'
                })
            else:
                # Find close matches
                close_matches = get_close_matches(
                    title_version,
                    available_shapes,
                    n=3,
                    cutoff=0.6
                )

                results['invalid'].append({
                    'service_name': service_name,
                    'service_id': service_id,
                    'shape_name': shape_name,
                    'title_version': title_version
                })

                if close_matches:
                    results['suggestions'][service_id] = close_matches

    return results


def print_report(results):
    """Print validation report."""
    print("\n" + "="*70)
    print("GCP ICON VALIDATION REPORT")
    print("="*70 + "\n")

    # Valid icons
    print(f"✅ VALID ICONS ({len(results['valid'])})")
    print("-" * 70)
    for item in results['valid']:
        print(f"  ✓ {item['service_name']}")
        print(f"    Shape: {item['shape_name']} → {item['actual_shape']}")

    # Case mismatches (exist but wrong format)
    if results['case_mismatches']:
        print(f"\n⚠️  CASE MISMATCHES ({len(results['case_mismatches'])})")
        print("-" * 70)
        for item in results['case_mismatches']:
            print(f"  ! {item['service_name']}")
            print(f"    Used: {item['used_shape']}")
            print(f"    Actual: {item['correct_shape']}")

    # Invalid icons
    if results['invalid']:
        print(f"\n❌ INVALID/MISSING ICONS ({len(results['invalid'])})")
        print("-" * 70)
        for item in results['invalid']:
            print(f"  ✗ {item['service_name']}")
            print(f"    Looking for: {item['title_version']}")

            service_id = item['service_id']
            if service_id in results['suggestions']:
                print(f"    Suggestions:")
                for suggestion in results['suggestions'][service_id]:
                    snake = title_to_snake_case(suggestion)
                    print(f"      - {suggestion} (use: {snake})")

    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Total services: {len(results['valid']) + len(results['invalid']) + len(results['case_mismatches'])}")
    print(f"Valid: {len(results['valid'])}")
    print(f"Case mismatches: {len(results['case_mismatches'])}")
    print(f"Invalid/Missing: {len(results['invalid'])}")

    success_rate = (len(results['valid']) /
                   (len(results['valid']) + len(results['invalid']) + len(results['case_mismatches']))) * 100
    print(f"Success rate: {success_rate:.1f}%")
    print("="*70 + "\n")


def main():
    # Determine base directory (project root)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    shapes_file = project_root / '.archive' / 'gcp2-available-shapes.txt'
    icons_file = project_root / 'assets' / 'gcp-icons.json'

    # Check files exist
    if not shapes_file.exists():
        print(f"Error: {shapes_file} not found", file=sys.stderr)
        print("Run: python scripts/extract-shape-names.py gcp2.xml --output .archive/gcp2-available-shapes.txt")
        sys.exit(1)

    if not icons_file.exists():
        print(f"Error: {icons_file} not found", file=sys.stderr)
        sys.exit(1)

    # Load data
    available_shapes = load_available_shapes(shapes_file)
    gcp_icons = load_gcp_icons(icons_file)

    print(f"Loaded {len(available_shapes)} available shapes from gcp2.xml")
    print(f"Loaded {len(gcp_icons['services'])} services from gcp-icons.json")

    # Validate
    results = validate_icons(available_shapes, gcp_icons)

    # Print report
    print_report(results)

    # Exit with error if there are issues
    if results['invalid'] or results['case_mismatches']:
        sys.exit(1)
    else:
        print("✅ All icons are valid!")
        sys.exit(0)


if __name__ == '__main__':
    main()
