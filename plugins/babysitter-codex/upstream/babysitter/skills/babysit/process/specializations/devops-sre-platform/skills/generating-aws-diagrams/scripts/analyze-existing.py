#!/usr/bin/env python3
"""
DrawIO Diagram Analyzer

Extracts and reports all shapes, connections, and containers from a .drawio file.

Usage:
    python analyze-existing.py <file.drawio>
    python analyze-existing.py <file.drawio> --json
    python analyze-existing.py <file.drawio> --markdown

Output formats:
    Default: Human-readable summary
    --json: JSON output for programmatic use
    --markdown: Markdown report format
"""

import sys
import json
import xml.etree.ElementTree as ET
import re
from pathlib import Path
from collections import defaultdict


def parse_style(style_string: str) -> dict:
    """Parse semicolon-separated style string into dictionary."""
    if not style_string:
        return {}
    properties = {}
    for item in style_string.split(';'):
        if '=' in item:
            key, value = item.split('=', 1)
            properties[key.strip()] = value.strip()
    return properties


def extract_shape_type(style: dict) -> str:
    """Extract the shape type from parsed style."""
    shape = style.get('shape', '')
    if shape.startswith('mxgraph.gcp2.'):
        return shape.replace('mxgraph.gcp2.', 'GCP: ')
    if shape.startswith('mxgraph.'):
        return shape
    if style.get('container') == '1':
        return 'Container'
    return 'Shape'


def analyze_drawio(file_path: str) -> dict:
    """Analyze a DrawIO file and return structured data."""
    tree = ET.parse(file_path)
    root = tree.getroot()

    result = {
        'file': str(file_path),
        'diagrams': [],
        'summary': {
            'total_shapes': 0,
            'total_connections': 0,
            'total_containers': 0,
            'gcp_services': defaultdict(int),
            'container_types': []
        }
    }

    for diagram in root.findall('diagram'):
        diagram_data = {
            'name': diagram.get('name', 'Unnamed'),
            'id': diagram.get('id', ''),
            'shapes': [],
            'connections': [],
            'containers': [],
            'hierarchy': {}
        }

        graph_model = diagram.find('mxGraphModel')
        if graph_model is None:
            continue

        root_elem = graph_model.find('root')
        if root_elem is None:
            continue

        # Collect all cells
        cells = list(root_elem.findall('mxCell'))
        cell_map = {}

        for cell in cells:
            cell_id = cell.get('id')
            if cell_id in ('0', '1'):
                continue

            style = parse_style(cell.get('style', ''))
            value = cell.get('value', '') or ''
            # Clean HTML from value
            value = re.sub(r'<[^>]+>', '', value).strip()

            geo = cell.find('mxGeometry')
            geometry = {}
            if geo is not None:
                geometry = {
                    'x': float(geo.get('x', 0)),
                    'y': float(geo.get('y', 0)),
                    'width': float(geo.get('width', 0)),
                    'height': float(geo.get('height', 0))
                }

            cell_data = {
                'id': cell_id,
                'label': value,
                'parent': cell.get('parent', '1'),
                'style': style,
                'geometry': geometry,
                'type': extract_shape_type(style)
            }

            cell_map[cell_id] = cell_data

            # Categorize
            if cell.get('edge') == '1':
                conn = {
                    'id': cell_id,
                    'label': value,
                    'source': cell.get('source'),
                    'target': cell.get('target'),
                    'style_type': 'dashed' if style.get('dashed') == '1' else 'solid',
                    'bidirectional': 'startArrow' in style
                }
                diagram_data['connections'].append(conn)
                result['summary']['total_connections'] += 1

            elif cell.get('vertex') == '1':
                if style.get('container') == '1':
                    diagram_data['containers'].append(cell_data)
                    result['summary']['total_containers'] += 1
                    result['summary']['container_types'].append(value)
                else:
                    diagram_data['shapes'].append(cell_data)
                    result['summary']['total_shapes'] += 1

                    # Track GCP services
                    shape = style.get('shape', '')
                    if 'mxgraph.gcp2.' in shape:
                        service = shape.replace('mxgraph.gcp2.', '')
                        result['summary']['gcp_services'][service] += 1

        # Build hierarchy
        hierarchy = {'1': []}
        for cell_id, cell_data in cell_map.items():
            parent = cell_data['parent']
            if parent not in hierarchy:
                hierarchy[parent] = []
            hierarchy[parent].append(cell_id)
        diagram_data['hierarchy'] = hierarchy

        result['diagrams'].append(diagram_data)

    # Convert defaultdict for JSON serialization
    result['summary']['gcp_services'] = dict(result['summary']['gcp_services'])

    return result


def format_markdown(data: dict) -> str:
    """Format analysis as Markdown report."""
    lines = []
    lines.append(f"# DrawIO Analysis Report\n")
    lines.append(f"**File:** `{data['file']}`\n")

    # Summary
    s = data['summary']
    lines.append("## Summary\n")
    lines.append(f"- **Total Shapes:** {s['total_shapes']}")
    lines.append(f"- **Total Connections:** {s['total_connections']}")
    lines.append(f"- **Total Containers:** {s['total_containers']}")
    lines.append("")

    # GCP Services
    if s['gcp_services']:
        lines.append("## GCP Services Found\n")
        lines.append("| Service | Count |")
        lines.append("|---------|-------|")
        for service, count in sorted(s['gcp_services'].items()):
            lines.append(f"| {service} | {count} |")
        lines.append("")

    # Per-diagram details
    for diagram in data['diagrams']:
        lines.append(f"## Diagram: {diagram['name']}\n")

        # Shapes
        if diagram['shapes']:
            lines.append("### Shapes\n")
            lines.append("| ID | Label | Type | Position |")
            lines.append("|----|-------|------|----------|")
            for shape in diagram['shapes']:
                geo = shape['geometry']
                pos = f"({geo.get('x', 0):.0f}, {geo.get('y', 0):.0f})"
                lines.append(f"| {shape['id'][:8]}... | {shape['label'][:30]} | {shape['type']} | {pos} |")
            lines.append("")

        # Containers
        if diagram['containers']:
            lines.append("### Containers\n")
            lines.append("| ID | Label | Size |")
            lines.append("|----|-------|------|")
            for cont in diagram['containers']:
                geo = cont['geometry']
                size = f"{geo.get('width', 0):.0f}x{geo.get('height', 0):.0f}"
                lines.append(f"| {cont['id'][:8]}... | {cont['label'][:30]} | {size} |")
            lines.append("")

        # Connections
        if diagram['connections']:
            lines.append("### Connections\n")
            lines.append("| Source | Target | Label | Type |")
            lines.append("|--------|--------|-------|------|")
            for conn in diagram['connections']:
                src = conn['source'][:8] + '...' if conn['source'] else 'N/A'
                tgt = conn['target'][:8] + '...' if conn['target'] else 'N/A'
                ctype = 'bidirectional' if conn['bidirectional'] else conn['style_type']
                lines.append(f"| {src} | {tgt} | {conn['label'][:20]} | {ctype} |")
            lines.append("")

    return '\n'.join(lines)


def format_text(data: dict) -> str:
    """Format analysis as plain text summary."""
    lines = []
    lines.append(f"DrawIO Analysis: {data['file']}")
    lines.append("=" * 50)

    s = data['summary']
    lines.append(f"\nSummary:")
    lines.append(f"  Shapes: {s['total_shapes']}")
    lines.append(f"  Connections: {s['total_connections']}")
    lines.append(f"  Containers: {s['total_containers']}")

    if s['gcp_services']:
        lines.append(f"\nGCP Services ({len(s['gcp_services'])} types):")
        for service, count in sorted(s['gcp_services'].items()):
            lines.append(f"  - {service}: {count}")

    for diagram in data['diagrams']:
        lines.append(f"\nDiagram: {diagram['name']}")
        lines.append("-" * 30)

        if diagram['containers']:
            lines.append(f"  Containers: {len(diagram['containers'])}")
            for c in diagram['containers'][:5]:
                lines.append(f"    - {c['label']}")

        if diagram['shapes']:
            lines.append(f"  Shapes: {len(diagram['shapes'])}")
            for s in diagram['shapes'][:10]:
                lines.append(f"    - {s['label']} ({s['type']})")
            if len(diagram['shapes']) > 10:
                lines.append(f"    ... and {len(diagram['shapes']) - 10} more")

        if diagram['connections']:
            lines.append(f"  Connections: {len(diagram['connections'])}")

    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze-existing.py <file.drawio> [--json|--markdown]")
        sys.exit(2)

    file_path = sys.argv[1]
    output_format = 'text'

    if '--json' in sys.argv:
        output_format = 'json'
    elif '--markdown' in sys.argv or '--md' in sys.argv:
        output_format = 'markdown'

    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(2)

    try:
        data = analyze_drawio(file_path)
    except ET.ParseError as e:
        print(f"Error: Invalid XML - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    if output_format == 'json':
        print(json.dumps(data, indent=2))
    elif output_format == 'markdown':
        print(format_markdown(data))
    else:
        print(format_text(data))


if __name__ == '__main__':
    main()
