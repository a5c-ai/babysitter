#!/usr/bin/env python3
"""
DrawIO XML Validator

Validates .drawio files for structural correctness before opening in DrawIO Desktop.

Usage:
    python validate-drawio.py <file.drawio>
    python validate-drawio.py <file.drawio> --verbose

Exit codes:
    0 - Valid
    1 - Invalid (errors found)
    2 - File not found or read error
"""

import sys
import xml.etree.ElementTree as ET
from pathlib import Path


class DrawIOValidator:
    def __init__(self, verbose=False):
        self.verbose = verbose
        self.errors = []
        self.warnings = []

    def log(self, msg):
        if self.verbose:
            print(f"  [INFO] {msg}")

    def error(self, msg):
        self.errors.append(msg)
        print(f"  [ERROR] {msg}")

    def warn(self, msg):
        self.warnings.append(msg)
        if self.verbose:
            print(f"  [WARN] {msg}")

    def validate(self, file_path: str) -> bool:
        """Validate a DrawIO file. Returns True if valid."""
        path = Path(file_path)

        if not path.exists():
            self.error(f"File not found: {file_path}")
            return False

        if not path.suffix.lower() == '.drawio':
            self.warn(f"File extension is not .drawio: {path.suffix}")

        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
        except ET.ParseError as e:
            self.error(f"XML parse error: {e}")
            return False
        except Exception as e:
            self.error(f"Failed to read file: {e}")
            return False

        # Validate structure
        self._validate_root(root)
        self._validate_diagram(root)
        self._validate_cells(root)
        self._validate_connections(root)

        return len(self.errors) == 0

    def _validate_root(self, root):
        """Check mxfile root element."""
        if root.tag != 'mxfile':
            self.error(f"Root element must be 'mxfile', found '{root.tag}'")
            return

        self.log("Root element is mxfile")

        if 'host' not in root.attrib:
            self.warn("Missing 'host' attribute in mxfile")

    def _validate_diagram(self, root):
        """Check diagram element structure."""
        diagrams = root.findall('diagram')

        if not diagrams:
            self.error("No <diagram> element found")
            return

        self.log(f"Found {len(diagrams)} diagram(s)")

        for i, diagram in enumerate(diagrams):
            name = diagram.get('name', f'Diagram-{i}')

            graph_model = diagram.find('mxGraphModel')
            if graph_model is None:
                self.error(f"Diagram '{name}' missing <mxGraphModel>")
                continue

            root_elem = graph_model.find('root')
            if root_elem is None:
                self.error(f"Diagram '{name}' missing <root> element")

    def _validate_cells(self, root):
        """Validate mxCell elements."""
        cells = list(root.iter('mxCell'))

        if not cells:
            self.error("No mxCell elements found")
            return

        self.log(f"Found {len(cells)} mxCell elements")

        # Check for required root cells
        cell_ids = {cell.get('id') for cell in cells}

        if '0' not in cell_ids:
            self.error("Missing required mxCell with id='0' (root cell)")

        if '1' not in cell_ids:
            self.error("Missing required mxCell with id='1' (default parent)")

        # Validate parent references
        for cell in cells:
            cell_id = cell.get('id')
            parent = cell.get('parent')

            if parent and parent not in cell_ids:
                self.error(f"Cell '{cell_id}' references non-existent parent '{parent}'")

            # Check vertices have geometry
            if cell.get('vertex') == '1':
                geo = cell.find('mxGeometry')
                if geo is None:
                    self.warn(f"Vertex cell '{cell_id}' missing mxGeometry")
                elif geo.get('width') is None or geo.get('height') is None:
                    self.warn(f"Vertex cell '{cell_id}' missing width/height")

    def _validate_connections(self, root):
        """Validate edge connections."""
        cells = list(root.iter('mxCell'))
        cell_ids = {cell.get('id') for cell in cells}

        edges = [c for c in cells if c.get('edge') == '1']
        self.log(f"Found {len(edges)} edge connections")

        for edge in edges:
            edge_id = edge.get('id')
            source = edge.get('source')
            target = edge.get('target')

            if source and source not in cell_ids:
                self.error(f"Edge '{edge_id}' references non-existent source '{source}'")

            if target and target not in cell_ids:
                self.error(f"Edge '{edge_id}' references non-existent target '{target}'")

    def summary(self) -> str:
        """Return validation summary."""
        if not self.errors and not self.warnings:
            return "Valid - No issues found"

        parts = []
        if self.errors:
            parts.append(f"{len(self.errors)} error(s)")
        if self.warnings:
            parts.append(f"{len(self.warnings)} warning(s)")

        status = "Invalid" if self.errors else "Valid with warnings"
        return f"{status} - {', '.join(parts)}"


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate-drawio.py <file.drawio> [--verbose]")
        sys.exit(2)

    file_path = sys.argv[1]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv

    print(f"Validating: {file_path}")
    print("-" * 50)

    validator = DrawIOValidator(verbose=verbose)
    is_valid = validator.validate(file_path)

    print("-" * 50)
    print(f"Result: {validator.summary()}")

    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
