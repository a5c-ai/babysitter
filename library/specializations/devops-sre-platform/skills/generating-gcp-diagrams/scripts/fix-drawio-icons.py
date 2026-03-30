#!/usr/bin/env python3
"""
Fix icon shape names in existing DrawIO files.

Usage:
    python fix-drawio-icons.py [--dry-run] [file1.drawio file2.drawio ...]

If no files specified, fixes all .drawio files in output/ and assets/examples/
"""

import sys
import argparse
import glob
from pathlib import Path
import shutil
from datetime import datetime


# Shape name fixes (old → new)
SHAPE_FIXES = {
    'mxgraph.gcp2.pubsub': 'mxgraph.gcp2.cloud_pubsub',
    'mxgraph.gcp2.memorystore': 'mxgraph.gcp2.cloud_memorystore',
    'mxgraph.gcp2.filestore': 'mxgraph.gcp2.cloud_filestore',
    'mxgraph.gcp2.vertexai': 'mxgraph.gcp2.cloud_machine_learning',
    'mxgraph.gcp2.ai_platform': 'mxgraph.gcp2.cloud_machine_learning',
    'mxgraph.gcp2.vision_api': 'mxgraph.gcp2.cloud_vision_api',
    'mxgraph.gcp2.natural_language_api': 'mxgraph.gcp2.cloud_natural_language_api',
    'mxgraph.gcp2.speech_to_text': 'mxgraph.gcp2.cloud_speech_api',
    'mxgraph.gcp2.cloud_logging': 'mxgraph.gcp2.logging',
    'mxgraph.gcp2.cloud_trace': 'mxgraph.gcp2.trace',
    'mxgraph.gcp2.apigee"': 'mxgraph.gcp2.apigee_api_platform"',  # Note the quote
    'mxgraph.gcp2.api_gateway': 'mxgraph.gcp2.gateway',
    'mxgraph.gcp2.google_kubernetes_engine': 'mxgraph.gcp2.container_engine',
}


def backup_file(file_path):
    """Create a backup of the file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.parent / f"{file_path.stem}.backup_{timestamp}{file_path.suffix}"
    shutil.copy2(file_path, backup_path)
    return backup_path


def fix_drawio_file(file_path, dry_run=False):
    """Fix icon references in a single DrawIO file."""
    file_path = Path(file_path)

    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes_made = []

    # Apply fixes
    for old_shape, new_shape in SHAPE_FIXES.items():
        if old_shape in content:
            count = content.count(old_shape)
            content = content.replace(old_shape, new_shape)
            changes_made.append((old_shape, new_shape, count))

    # If changes were made
    if content != original_content:
        if not dry_run:
            # Create backup
            backup_path = backup_file(file_path)

            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return {
                'file': file_path.name,
                'changes': changes_made,
                'backup': backup_path.name
            }
        else:
            return {
                'file': file_path.name,
                'changes': changes_made,
                'backup': None
            }

    return None


def main():
    parser = argparse.ArgumentParser(description='Fix icon references in DrawIO files')
    parser.add_argument('files', nargs='*', help='DrawIO files to fix (default: all in output/ and assets/examples/)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without modifying files')

    args = parser.parse_args()

    # Determine which files to process
    if args.files:
        files_to_fix = [Path(f) for f in args.files]
    else:
        # Find all .drawio files in output/ and assets/examples/
        script_dir = Path(__file__).parent
        project_root = script_dir.parent

        files_to_fix = []
        files_to_fix.extend(project_root.glob('output/*.drawio'))
        files_to_fix.extend(project_root.glob('assets/examples/*.drawio'))

    if not files_to_fix:
        print("No DrawIO files found to fix.")
        return

    print(f"\n{'DRY RUN - ' if args.dry_run else ''}Processing {len(files_to_fix)} DrawIO files...\n")

    results = []
    for file_path in files_to_fix:
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            continue

        result = fix_drawio_file(file_path, dry_run=args.dry_run)
        if result:
            results.append(result)

    # Print report
    if results:
        print("="*70)
        print(f"{'DRY RUN - ' if args.dry_run else ''}DRAWIO ICON FIX REPORT")
        print("="*70 + "\n")

        for result in results:
            print(f"📄 {result['file']}")
            if result['backup']:
                print(f"   Backup: {result['backup']}")

            for old_shape, new_shape, count in result['changes']:
                # Clean up the shape names for display
                old_display = old_shape.replace('mxgraph.gcp2.', '').replace('"', '')
                new_display = new_shape.replace('mxgraph.gcp2.', '').replace('"', '')
                print(f"   ✓ {old_display} → {new_display} ({count} occurrence{'s' if count > 1 else ''})")
            print()

        print("="*70)
        print(f"Fixed {len(results)} file{'s' if len(results) > 1 else ''}")
        print("="*70 + "\n")

        if args.dry_run:
            print("Dry run complete. Run without --dry-run to apply changes.")
    else:
        print("✅ All files are already up to date!")

    print()


if __name__ == '__main__':
    main()
