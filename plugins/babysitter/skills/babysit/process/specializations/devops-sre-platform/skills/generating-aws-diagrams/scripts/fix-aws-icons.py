#!/usr/bin/env python3
"""
Fix AWS icon shape names in aws-icons.json based on validation results.

Usage:
    python fix-aws-icons.py [--dry-run]

This script:
1. Applies known shape name fixes for aws-icons.json
2. Creates a backup of the original file
3. Reports all changes made

Run validate-aws-icons.py first to identify which shapes need fixing.
"""

import json
import sys
import shutil
from pathlib import Path
from datetime import datetime


# High confidence fixes: current_shape_name → correct_shape_name
# Populate this dict after running validate-aws-icons.py against the actual stencil
SHAPE_FIXES = {
    # Example: 'wrong_name': 'correct_name',
}

# Medium confidence - reasonable mappings for renamed/aliased shapes
MEDIUM_CONFIDENCE_FIXES = {
    # Example: 'old_name': 'new_equivalent',
}

# Fallback icons for services without exact matches
NO_MATCH_FIXES = {
    # Example: 'missing_service': 'generic_alternative',
}


def backup_file(file_path):
    """Create a backup of the original file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.parent / f"{file_path.stem}.backup_{timestamp}{file_path.suffix}"
    shutil.copy2(file_path, backup_path)
    return backup_path


def fix_shape_name(service, all_fixes):
    """Fix shape name if a known fix exists."""
    current_shape = service['drawio_shape']['shape_name']

    if current_shape in all_fixes:
        new_shape = all_fixes[current_shape]
        old_full_style = service['drawio_shape']['full_style']

        # Handle both prIcon= and resIcon= patterns
        new_full_style = old_full_style.replace(
            f'mxgraph.aws4.{current_shape}',
            f'mxgraph.aws4.{new_shape}'
        )

        service['drawio_shape']['shape_name'] = new_shape
        service['drawio_shape']['full_style'] = new_full_style

        return {
            'service_name': service['service_name'],
            'old_shape': current_shape,
            'new_shape': new_shape,
            'confidence': 'high' if current_shape in SHAPE_FIXES else
                         'medium' if current_shape in MEDIUM_CONFIDENCE_FIXES else 'low'
        }

    return None


def fix_fill_color(service, category_colors):
    """Fix fillColor if it doesn't match the expected category color."""
    category = service.get('category', '')
    expected_color = category_colors.get(category)
    if not expected_color:
        return False

    old_style = service['drawio_shape']['full_style']
    # Extract current fillColor
    for part in old_style.split(';'):
        if part.startswith('fillColor='):
            current_color = part.split('=', 1)[1]
            if current_color != expected_color:
                new_style = old_style.replace(
                    f'fillColor={current_color}',
                    f'fillColor={expected_color}'
                )
                service['drawio_shape']['full_style'] = new_style
                return True
    return False


def apply_fixes(aws_icons, dry_run=False, include_medium=True, include_fallbacks=False):
    """Apply all fixes to the AWS icons data."""
    changes = {
        'shape_fixes': [],
        'fill_color_fixes': [],
    }

    # Combine fixes based on flags
    all_fixes = SHAPE_FIXES.copy()
    if include_medium:
        all_fixes.update(MEDIUM_CONFIDENCE_FIXES)
    if include_fallbacks:
        all_fixes.update(NO_MATCH_FIXES)

    # Category color map
    category_colors = {}
    for cat_id, cat_info in aws_icons.get('categories', {}).items():
        if isinstance(cat_info, dict) and 'color' in cat_info:
            category_colors[cat_id] = cat_info['color']

    for service in aws_icons['services']:
        # Fix shape name
        shape_change = fix_shape_name(service, all_fixes)
        if shape_change:
            changes['shape_fixes'].append(shape_change)

        # Fix fill color
        if fix_fill_color(service, category_colors):
            changes['fill_color_fixes'].append(service['service_name'])

    # Update metadata
    if not dry_run:
        aws_icons['metadata']['last_updated'] = datetime.now().strftime('%Y-%m-%d')

    return changes


def print_report(changes, dry_run=False):
    """Print report of changes."""
    mode = "DRY RUN - " if dry_run else ""

    print("\n" + "=" * 70)
    print(f"{mode}AWS ICON FIX REPORT")
    print("=" * 70 + "\n")

    # Shape name fixes
    if changes['shape_fixes']:
        print(f"SHAPE NAME FIXES ({len(changes['shape_fixes'])})")
        print("-" * 70)
        for fix in changes['shape_fixes']:
            confidence_icon = "✓" if fix['confidence'] == 'high' else "?" if fix['confidence'] == 'medium' else "⚠"
            print(f"  {confidence_icon} {fix['service_name']}")
            print(f"    {fix['old_shape']} → {fix['new_shape']}")
            if fix['confidence'] != 'high':
                print(f"    Confidence: {fix['confidence']}")
        print()

    # Fill color fixes
    if changes['fill_color_fixes']:
        print(f"FILL COLOR FIXES ({len(changes['fill_color_fixes'])})")
        print("-" * 70)
        for service_name in changes['fill_color_fixes']:
            print(f"    • {service_name}")
        print()

    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Shape names fixed: {len(changes['shape_fixes'])}")
    print(f"Fill colors fixed: {len(changes['fill_color_fixes'])}")
    print(f"Total changes: {len(changes['shape_fixes']) + len(changes['fill_color_fixes'])}")
    print("=" * 70 + "\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Fix AWS icon issues in aws-icons.json')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be changed without modifying files')
    parser.add_argument('--no-medium', action='store_true',
                       help='Skip medium-confidence fixes')
    parser.add_argument('--include-fallbacks', action='store_true',
                       help='Include fallback icons for services without exact matches')

    args = parser.parse_args()

    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    icons_file = project_root / 'assets' / 'aws-icons.json'

    if not icons_file.exists():
        print(f"Error: {icons_file} not found", file=sys.stderr)
        sys.exit(1)

    # Load data
    with open(icons_file, 'r') as f:
        aws_icons = json.load(f)

    print(f"Loaded {len(aws_icons['services'])} services from aws-icons.json")

    # Apply fixes
    changes = apply_fixes(
        aws_icons,
        dry_run=args.dry_run,
        include_medium=not args.no_medium,
        include_fallbacks=args.include_fallbacks
    )

    # Print report
    print_report(changes, dry_run=args.dry_run)

    # Save changes
    if not args.dry_run:
        if changes['shape_fixes'] or changes['fill_color_fixes']:
            backup_path = backup_file(icons_file)
            print(f"✓ Backup created: {backup_path.name}\n")

            with open(icons_file, 'w') as f:
                json.dump(aws_icons, f, indent=2)

            print(f"✓ Updated: {icons_file}")
            print("\nNext steps:")
            print("  1. Run validation: python scripts/validate-aws-icons.py")
            print("  2. Test in DrawIO: Generate a diagram and open in DrawIO Desktop")
            print("  3. Verify all icons render correctly")
        else:
            print("No changes needed - file is already up to date!")
    else:
        print("Dry run complete. Run without --dry-run to apply changes.")

    print()


if __name__ == '__main__':
    main()
