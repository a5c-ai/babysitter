---
name: reliability-analysis
description: Component and system reliability prediction and analysis skill with MTBF/MTTF calculations, failure rate databases, FMEA/FMECA support, fault tree analysis, and accelerated life testing data analysis.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Testing and Validation
backlog-id: SK-020
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Reliability Analysis Skill

Component and system reliability prediction and analysis for electronic hardware.

## Purpose

This skill provides comprehensive capabilities for predicting and analyzing the reliability of electronic components and systems. It supports industry-standard reliability methodologies, failure rate calculations, and life testing data analysis.

## Capabilities

### MTBF/MTTF Calculations
- Mean Time Between Failures (MTBF) for repairable systems
- Mean Time To Failure (MTTF) for non-repairable components
- Series and parallel system reliability modeling
- Redundancy calculations (active, standby, k-out-of-n)
- Mission reliability vs operational availability

### Failure Rate Databases
- MIL-HDBK-217F failure rate predictions
- Telcordia SR-332 methodology
- FIDES reliability methodology
- IEC 62380 electronic component reliability
- Custom component database management

### Derating Analysis
- Component stress ratio calculations
- Temperature derating curves
- Voltage and power derating
- Derating guideline compliance (NAVSEA, JPL, ESA)
- Stress analysis documentation

### FMEA/FMECA Support
- Failure Mode and Effects Analysis facilitation
- Criticality analysis (CA) calculations
- Risk Priority Number (RPN) computation
- Severity, occurrence, detection ratings
- FMEA worksheet generation
- Action tracking and verification

### Reliability Block Diagram Analysis
- RBD construction and visualization
- Series, parallel, and complex configurations
- Active and standby redundancy modeling
- Common cause failure analysis
- System reliability calculation

### Fault Tree Analysis (FTA)
- Fault tree construction (AND, OR, k-of-n gates)
- Minimal cut set identification
- Top event probability calculation
- Importance measures (Birnbaum, Fussell-Vesely)
- Common cause failure modeling

### Accelerated Life Testing Data Analysis
- Arrhenius model for temperature acceleration
- Eyring model for multi-stress acceleration
- Inverse power law for voltage/mechanical stress
- Acceleration factor calculation
- Life projection to use conditions

### Weibull Distribution Fitting
- Two-parameter and three-parameter Weibull
- Maximum Likelihood Estimation (MLE)
- Probability plotting
- Goodness-of-fit testing
- Confidence interval estimation
- B-life calculations (B1, B10, B50)

### Thermal Derating Curves
- Junction temperature estimation
- Thermal resistance modeling
- Safe operating area verification
- Thermal runaway analysis
- Heatsink selection guidance

## Prerequisites

### Installation
```bash
pip install numpy scipy pandas matplotlib reliability weibull
```

### Optional Dependencies
```bash
# For advanced reliability modeling
pip install surpyval lifelines

# For report generation
pip install jinja2 openpyxl
```

## Usage Patterns

### MTBF Calculation with MIL-HDBK-217
```python
import numpy as np

class MIL217Calculator:
    """MIL-HDBK-217F failure rate calculator"""

    # Base failure rates (per 10^6 hours) - simplified examples
    BASE_RATES = {
        'resistor_film': 0.0037,
        'capacitor_ceramic': 0.012,
        'capacitor_electrolytic': 0.12,
        'diode_general': 0.024,
        'transistor_bipolar': 0.074,
        'ic_digital': 0.16,
        'ic_linear': 0.21,
        'inductor': 0.0017,
        'connector_pin': 0.00066,
        'pcb_layer': 0.00042,
    }

    # Temperature factors (simplified)
    @staticmethod
    def temp_factor(temp_c: float, component_type: str) -> float:
        if 'capacitor_electrolytic' in component_type:
            return np.exp((temp_c - 25) / 15)
        return np.exp((temp_c - 25) / 20)

    # Environment factors
    ENV_FACTORS = {
        'ground_benign': 1.0,
        'ground_fixed': 2.0,
        'ground_mobile': 5.0,
        'airborne_inhabited': 4.0,
        'airborne_uninhabited': 8.0,
        'space_flight': 0.5,
    }

    def calculate_component_fr(self, component_type: str, temp_c: float,
                                environment: str, quantity: int = 1) -> float:
        """Calculate failure rate for component type"""
        base_rate = self.BASE_RATES.get(component_type, 0.1)
        temp_factor = self.temp_factor(temp_c, component_type)
        env_factor = self.ENV_FACTORS.get(environment, 2.0)

        return base_rate * temp_factor * env_factor * quantity

    def calculate_system_mtbf(self, components: list) -> dict:
        """Calculate system MTBF from component list"""
        total_fr = sum(c['failure_rate'] for c in components)
        mtbf = 1e6 / total_fr  # Hours

        return {
            'total_failure_rate': total_fr,
            'mtbf_hours': mtbf,
            'mtbf_years': mtbf / 8760,
            'components': components
        }

# Example usage
calc = MIL217Calculator()
components = [
    {'type': 'resistor_film', 'qty': 100, 'temp': 55},
    {'type': 'capacitor_ceramic', 'qty': 50, 'temp': 55},
    {'type': 'ic_digital', 'qty': 10, 'temp': 65},
]

for comp in components:
    comp['failure_rate'] = calc.calculate_component_fr(
        comp['type'], comp['temp'], 'ground_fixed', comp['qty']
    )

result = calc.calculate_system_mtbf(components)
print(f"System MTBF: {result['mtbf_hours']:.0f} hours ({result['mtbf_years']:.1f} years)")
```

### Weibull Analysis
```python
from reliability.Fitters import Fit_Weibull_2P
from reliability.Probability_plotting import Weibull_probability_plot
import matplotlib.pyplot as plt

# Life test data (hours to failure)
failures = [1200, 1500, 1800, 2100, 2400, 2800, 3200, 3800, 4500, 5500]
censored = [6000, 6000, 6000]  # Units still running at test end

# Fit Weibull distribution
fit = Fit_Weibull_2P(
    failures=failures,
    right_censored=censored,
    show_probability_plot=False
)

print(f"Beta (shape): {fit.beta:.3f}")
print(f"Eta (scale): {fit.eta:.1f} hours")
print(f"B10 Life: {fit.distribution.quantile(0.1):.1f} hours")
print(f"B50 Life: {fit.distribution.quantile(0.5):.1f} hours")
print(f"Mean Life: {fit.distribution.mean:.1f} hours")

# Reliability at specific time
time = 2000  # hours
R_2000 = fit.distribution.SF(time)
print(f"Reliability at {time} hours: {R_2000:.4f} ({R_2000*100:.2f}%)")
```

### Fault Tree Analysis
```python
from typing import List, Dict

class FaultTreeNode:
    def __init__(self, name: str, gate_type: str = None, probability: float = None):
        self.name = name
        self.gate_type = gate_type  # 'AND', 'OR', 'VOTE'
        self.probability = probability  # For basic events
        self.children: List['FaultTreeNode'] = []
        self.k = None  # For k-out-of-n voting gates

    def add_child(self, child: 'FaultTreeNode'):
        self.children.append(child)

    def calculate_probability(self) -> float:
        if self.probability is not None:
            return self.probability

        child_probs = [c.calculate_probability() for c in self.children]

        if self.gate_type == 'AND':
            result = 1.0
            for p in child_probs:
                result *= p
            return result

        elif self.gate_type == 'OR':
            result = 1.0
            for p in child_probs:
                result *= (1 - p)
            return 1 - result

        elif self.gate_type == 'VOTE':
            # k-out-of-n gate
            from itertools import combinations
            from functools import reduce
            import operator

            n = len(child_probs)
            k = self.k
            prob = 0

            for i in range(k, n + 1):
                for combo in combinations(range(n), i):
                    term = 1.0
                    for j in range(n):
                        if j in combo:
                            term *= child_probs[j]
                        else:
                            term *= (1 - child_probs[j])
                    prob += term
            return prob

# Example: Power supply failure fault tree
top = FaultTreeNode("Power Supply Fails", "OR")

primary_fails = FaultTreeNode("Primary Supply Fails", "AND")
primary_fails.add_child(FaultTreeNode("AC Power Loss", probability=0.01))
primary_fails.add_child(FaultTreeNode("UPS Fails", probability=0.001))

backup_fails = FaultTreeNode("Backup Supply Fails", probability=0.005)

top.add_child(primary_fails)
top.add_child(backup_fails)

system_probability = top.calculate_probability()
print(f"Top event probability: {system_probability:.6f}")
```

### Accelerated Life Test Analysis
```python
import numpy as np
from scipy.optimize import curve_fit

class ArrheniusModel:
    """Arrhenius acceleration model for temperature stress"""

    def __init__(self):
        self.activation_energy = None  # eV
        self.k_boltzmann = 8.617e-5  # eV/K

    def acceleration_factor(self, temp_test: float, temp_use: float,
                           activation_energy: float) -> float:
        """Calculate acceleration factor between test and use conditions"""
        temp_test_k = temp_test + 273.15
        temp_use_k = temp_use + 273.15

        af = np.exp((activation_energy / self.k_boltzmann) *
                    (1/temp_use_k - 1/temp_test_k))
        return af

    def estimate_activation_energy(self, temps: List[float],
                                   failure_rates: List[float]) -> float:
        """Estimate activation energy from multi-temperature test data"""
        temps_k = [t + 273.15 for t in temps]
        inv_temps = [1/t for t in temps_k]
        ln_rates = [np.log(r) for r in failure_rates]

        # Linear regression: ln(rate) = A + Ea/(k*T)
        slope, intercept = np.polyfit(inv_temps, ln_rates, 1)
        self.activation_energy = slope * self.k_boltzmann
        return self.activation_energy

# Example usage
model = ArrheniusModel()

# Multi-temperature test results
test_temps = [85, 105, 125]  # Celsius
failure_rates = [0.001, 0.005, 0.02]  # failures per 1000 hours

ea = model.estimate_activation_energy(test_temps, failure_rates)
print(f"Estimated activation energy: {ea:.2f} eV")

# Project to use conditions
af = model.acceleration_factor(125, 55, ea)
use_life = 2000 * af  # If 2000 hours at 125C
print(f"Acceleration factor: {af:.1f}x")
print(f"Projected life at 55C: {use_life:.0f} hours")
```

## Usage Guidelines

### When to Use This Skill
- New product reliability predictions
- Design for reliability (DfR) activities
- Warranty cost projections
- FMEA and FMECA development
- Life test planning and analysis
- Field failure analysis support

### Best Practices
1. **Use appropriate failure rate models** for the application environment
2. **Consider temperature derating** for all components
3. **Document all assumptions** in reliability predictions
4. **Validate predictions** with field data when available
5. **Update failure rates** based on actual performance
6. **Include manufacturing defects** in early-life reliability models

### Process Integration
- ee-environmental-testing (life test analysis)
- ee-hardware-validation (reliability verification)
- ee-dfm-review (reliability design reviews)

## Dependencies

- reliability: Python reliability engineering library
- scipy: Statistical analysis
- numpy: Numerical computations

## References

- MIL-HDBK-217F Reliability Prediction
- FIDES Reliability Methodology Guide
- IEEE 1413 Methodology for Reliability Prediction
- SAE JA1000 Reliability Program Standard
