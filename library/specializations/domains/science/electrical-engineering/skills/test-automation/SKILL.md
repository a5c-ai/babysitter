---
name: test-automation
description: Automated test equipment control and data acquisition skill for hardware validation, with VISA/SCPI instrument communication, test sequence scripting, and measurement uncertainty analysis.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Testing
backlog-id: SK-018
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Test Equipment Automation Skill

Automated test equipment control and data acquisition for hardware validation and characterization.

## Purpose

This skill provides comprehensive capabilities for automating electronic test equipment, enabling consistent and repeatable hardware validation workflows. It supports instrument communication, automated test sequences, data logging, and analysis.

## Capabilities

### Instrument Communication
- VISA/SCPI instrument communication protocols
- Support for GPIB, USB-TMC, LAN/VXI-11, and serial interfaces
- Instrument discovery and resource management
- Error handling and timeout management
- Connection pooling for multi-instrument setups

### Oscilloscope Automation
- Keysight, Tektronix, Rohde & Schwarz oscilloscope control
- Channel configuration and coupling
- Trigger setup (edge, pulse, pattern, serial)
- Waveform acquisition and transfer
- Measurement extraction (rise time, frequency, duty cycle)
- Screenshot capture and documentation

### Spectrum Analyzer Control
- Frequency span and center frequency configuration
- Resolution and video bandwidth settings
- Marker operations and peak search
- Trace capture and data export
- Limit line testing and pass/fail determination
- EMC pre-compliance measurements

### Power Supply and Electronic Load Control
- Output voltage and current programming
- Protection limit configuration
- Sequencing and timing control
- Load transient generation
- Efficiency measurement automation

### DMM and SMU Automation
- DC/AC voltage and current measurements
- Resistance and continuity testing
- Source-measure unit (SMU) operations
- IV curve characterization
- Temperature coefficient measurements

### Data Logging and Analysis
- Real-time data acquisition
- Statistical analysis (mean, std, min, max)
- Data logging to CSV, JSON, HDF5
- Time-series trending
- Alarm and limit monitoring

### Test Sequence Scripting
- Sequential and parallel test execution
- Conditional branching based on results
- Loop and iteration support
- Test fixture abstraction
- Parameterized test cases

### Measurement Uncertainty Analysis
- Type A (statistical) uncertainty evaluation
- Type B (systematic) uncertainty estimation
- Combined uncertainty calculation
- Coverage factor and confidence intervals
- GUM-compliant uncertainty budgets

### Report Generation
- Automated test report creation
- Pass/fail summary tables
- Measurement data visualization
- Traceability documentation
- Export to PDF, HTML, Excel formats

## Prerequisites

### Installation
```bash
pip install pyvisa pyvisa-py numpy pandas matplotlib
```

### Optional Dependencies
```bash
# For HDF5 data storage
pip install h5py tables

# For advanced analysis
pip install scipy uncertainties

# For report generation
pip install jinja2 weasyprint
```

## Usage Patterns

### Basic Instrument Communication
```python
import pyvisa

# Initialize resource manager
rm = pyvisa.ResourceManager()

# List available instruments
print(rm.list_resources())

# Connect to oscilloscope
scope = rm.open_resource('TCPIP::192.168.1.100::INSTR')
scope.timeout = 5000  # 5 second timeout

# Query identification
idn = scope.query('*IDN?')
print(f"Connected to: {idn}")

# Configure and measure
scope.write(':CHANnel1:DISPlay ON')
scope.write(':CHANnel1:SCALe 1.0')  # 1V/div
scope.write(':TIMebase:SCALe 0.001')  # 1ms/div
scope.write(':TRIGger:EDGE:SOURce CHANnel1')
scope.write(':TRIGger:EDGE:LEVel 0.5')

# Read measurement
vpp = float(scope.query(':MEASure:VPP? CHANnel1'))
freq = float(scope.query(':MEASure:FREQuency? CHANnel1'))

print(f"Vpp: {vpp:.3f} V, Frequency: {freq:.2f} Hz")

scope.close()
```

### Automated Test Sequence
```python
from dataclasses import dataclass
from typing import List, Dict, Any
import time

@dataclass
class TestResult:
    name: str
    passed: bool
    value: float
    unit: str
    limit_low: float
    limit_high: float

class TestSequence:
    def __init__(self, instruments: Dict[str, Any]):
        self.instruments = instruments
        self.results: List[TestResult] = []

    def run_test(self, name: str, measure_func, limit_low: float,
                 limit_high: float, unit: str) -> TestResult:
        value = measure_func()
        passed = limit_low <= value <= limit_high
        result = TestResult(name, passed, value, unit, limit_low, limit_high)
        self.results.append(result)
        return result

    def generate_report(self) -> Dict:
        return {
            'total_tests': len(self.results),
            'passed': sum(1 for r in self.results if r.passed),
            'failed': sum(1 for r in self.results if not r.passed),
            'results': [vars(r) for r in self.results]
        }

# Example usage
def measure_output_voltage():
    return float(dmm.query(':MEASure:VOLTage:DC?'))

sequence = TestSequence({'dmm': dmm, 'psu': psu})
sequence.run_test('Output Voltage', measure_output_voltage, 4.9, 5.1, 'V')
```

### Measurement Uncertainty Analysis
```python
from uncertainties import ufloat
import numpy as np

class UncertaintyAnalysis:
    def __init__(self):
        self.measurements = []
        self.instrument_uncertainty = 0.0

    def add_measurement(self, value: float):
        self.measurements.append(value)

    def set_instrument_uncertainty(self, uncertainty: float):
        """Set Type B uncertainty from instrument specifications"""
        self.instrument_uncertainty = uncertainty

    def calculate_combined_uncertainty(self, coverage_factor: float = 2.0):
        # Type A uncertainty (statistical)
        n = len(self.measurements)
        mean = np.mean(self.measurements)
        std = np.std(self.measurements, ddof=1)
        type_a = std / np.sqrt(n)

        # Type B uncertainty
        type_b = self.instrument_uncertainty / np.sqrt(3)  # Rectangular distribution

        # Combined standard uncertainty
        combined = np.sqrt(type_a**2 + type_b**2)

        # Expanded uncertainty
        expanded = coverage_factor * combined

        return {
            'mean': mean,
            'type_a_uncertainty': type_a,
            'type_b_uncertainty': type_b,
            'combined_uncertainty': combined,
            'expanded_uncertainty': expanded,
            'coverage_factor': coverage_factor
        }

# Usage
analysis = UncertaintyAnalysis()
for _ in range(10):
    analysis.add_measurement(float(dmm.query(':MEASure:VOLTage:DC?')))
analysis.set_instrument_uncertainty(0.001)  # 1mV from spec sheet
result = analysis.calculate_combined_uncertainty()
print(f"Voltage: {result['mean']:.4f} +/- {result['expanded_uncertainty']:.4f} V (k=2)")
```

## Usage Guidelines

### When to Use This Skill
- Automated hardware validation and characterization
- Production test development
- Design verification testing
- Environmental testing with data acquisition
- EMC pre-compliance measurements

### Best Practices
1. **Always verify instrument connections** before starting test sequences
2. **Use appropriate timeouts** for slow measurements
3. **Implement proper error handling** for instrument communication failures
4. **Document measurement conditions** (temperature, humidity, setup)
5. **Include calibration verification** in test procedures
6. **Use statistical analysis** for production testing decisions

### Process Integration
- ee-hardware-validation (all phases)
- ee-environmental-testing (data acquisition)
- ee-emc-design-testing (pre-compliance measurements)

## Dependencies

- PyVISA and PyVISA-py for instrument communication
- NI VISA or Keysight IO Libraries for driver support
- Instrument-specific drivers as needed

## References

- [PyVISA Documentation](https://pyvisa.readthedocs.io/)
- [SCPI Standard Reference](https://www.ivifoundation.org/scpi/)
- [GUM Uncertainty Guide](https://www.bipm.org/en/publications/guides/gum.html)
