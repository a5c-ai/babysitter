#!/usr/bin/env python3
"""
Fix GCP icon shape names in gcp-icons.json based on validation results.

Usage:
    python fix-gcp-icons.py [--dry-run]

This script:
1. Applies high-confidence shape name fixes
2. Updates font colors from #999999 to #424242
3. Creates a backup of the original file
4. Reports all changes made
"""

import json
import sys
import shutil
from pathlib import Path
from datetime import datetime


# High confidence fixes: current_shape_name → correct_shape_name
SHAPE_FIXES = {
    'memorystore': 'cloud_memorystore',
    'filestore': 'cloud_filestore',
    'vision_api': 'cloud_vision_api',
    'natural_language_api': 'cloud_natural_language_api',
    'speech_to_text': 'cloud_speech_api',
    'pubsub': 'cloud_pubsub',
    'cloud_logging': 'logging',
    'cloud_trace': 'trace',
    'ai_platform': 'cloud_machine_learning',
    'apigee': 'apigee_api_platform',
    'api_gateway': 'gateway',
}

# Medium confidence - need investigation but applying reasonable defaults
MEDIUM_CONFIDENCE_FIXES = {
    'google_kubernetes_engine': 'container_engine',
    'vertexai': 'cloud_machine_learning',  # Fallback to generic ML icon
}

# Services that don't have exact matches - using generic icons
NO_MATCH_FIXES = {
    'workflows': 'cloud_scheduler',  # Similar concept - scheduled orchestration
    'eventarc': 'cloud_pubsub',  # Similar concept - event routing
}


def backup_file(file_path):
    """Create a backup of the original file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.parent / f"{file_path.stem}.backup_{timestamp}{file_path.suffix}"
    shutil.copy2(file_path, backup_path)
    return backup_path


def fix_shape_name(service, all_fixes):
    """Fix shape name if needed."""
    current_shape = service['drawio_shape']['shape_name']

    if current_shape in all_fixes:
        new_shape = all_fixes[current_shape]
        old_full_style = service['drawio_shape']['full_style']
        new_full_style = old_full_style.replace(
            f'shape=mxgraph.gcp2.{current_shape}',
            f'shape=mxgraph.gcp2.{new_shape}'
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


def fix_font_color(service):
    """Fix font color from #999999 to #424242."""
    old_style = service['drawio_shape']['full_style']

    if 'fontColor=#999999' in old_style:
        new_style = old_style.replace('fontColor=#999999', 'fontColor=#424242')
        service['drawio_shape']['full_style'] = new_style
        return True

    return False


def apply_fixes(gcp_icons, dry_run=False, include_medium=True, include_fallbacks=False):
    """Apply all fixes to the GCP icons data."""
    changes = {
        'shape_fixes': [],
        'font_color_fixes': [],
    }

    # Combine fixes based on flags
    all_fixes = SHAPE_FIXES.copy()
    if include_medium:
        all_fixes.update(MEDIUM_CONFIDENCE_FIXES)
    if include_fallbacks:
        all_fixes.update(NO_MATCH_FIXES)

    for service in gcp_icons['services']:
        # Fix shape name
        shape_change = fix_shape_name(service, all_fixes)
        if shape_change:
            changes['shape_fixes'].append(shape_change)

        # Fix font color
        if fix_font_color(service):
            changes['font_color_fixes'].append(service['service_name'])

    # Update metadata
    if not dry_run:
        gcp_icons['metadata']['last_updated'] = datetime.now().strftime('%Y-%m-%d')

    return changes


def print_report(changes, dry_run=False):
    """Print report of changes."""
    mode = "DRY RUN - " if dry_run else ""

    print("\n" + "="*70)
    print(f"{mode}GCP ICON FIX REPORT")
    print("="*70 + "\n")

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

    # Font color fixes
    if changes['font_color_fixes']:
        print(f"FONT COLOR FIXES ({len(changes['font_color_fixes'])})")
        print("-" * 70)
        print("  Updated fontColor from #999999 to #424242:")
        for service_name in changes['font_color_fixes']:
            print(f"    • {service_name}")
        print()

    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Shape names fixed: {len(changes['shape_fixes'])}")
    print(f"Font colors fixed: {len(changes['font_color_fixes'])}")
    print(f"Total changes: {len(changes['shape_fixes']) + len(changes['font_color_fixes'])}")
    print("="*70 + "\n")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Fix GCP icon issues in gcp-icons.json')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be changed without modifying files')
    parser.add_argument('--no-medium', action='store_true',
                       help='Skip medium-confidence fixes (GKE, Vertex AI)')
    parser.add_argument('--include-fallbacks', action='store_true',
                       help='Include fallback icons for services without exact matches (Workflows, Eventarc)')

    args = parser.parse_args()

    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    icons_file = project_root / 'assets' / 'gcp-icons.json'

    # Check file exists
    if not icons_file.exists():
        print(f"Error: {icons_file} not found", file=sys.stderr)
        sys.exit(1)

    # Load data
    with open(icons_file, 'r') as f:
        gcp_icons = json.load(f)

    print(f"Loaded {len(gcp_icons['services'])} services from gcp-icons.json")

    # Apply fixes
    changes = apply_fixes(
        gcp_icons,
        dry_run=args.dry_run,
        include_medium=not args.no_medium,
        include_fallbacks=args.include_fallbacks
    )

    # Print report
    print_report(changes, dry_run=args.dry_run)

    # Save changes
    if not args.dry_run:
        if changes['shape_fixes'] or changes['font_color_fixes']:
            # Create backup
            backup_path = backup_file(icons_file)
            print(f"✓ Backup created: {backup_path.name}\n")

            # Write updated file
            with open(icons_file, 'w') as f:
                json.dump(gcp_icons, f, indent=2)

            print(f"✓ Updated: {icons_file}")
            print("\nNext steps:")
            print("  1. Run validation: python scripts/validate-gcp-icons.py")
            print("  2. Test in DrawIO: Generate a diagram and open in DrawIO Desktop")
            print("  3. Verify all icons render correctly")
        else:
            print("No changes needed - file is already up to date!")
    else:
        print("Dry run complete. Run without --dry-run to apply changes.")

    print()


if __name__ == '__main__':
    main()
