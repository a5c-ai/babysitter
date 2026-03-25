---
name: thermal-analysis
description: Electronic system thermal modeling and analysis skill for junction temperature calculation, heat sink selection, thermal resistance networks, and safe operating area verification.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Thermal Management
backlog-id: SK-025
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Thermal Analysis Skill

Electronic system thermal modeling and analysis for reliable component operation.

## Purpose

This skill provides comprehensive capabilities for thermal analysis of electronic systems, from component-level junction temperature calculations to system-level thermal management design. It supports heat sink selection, thermal interface material evaluation, and safe operating area verification.

## Capabilities

### Junction-to-Ambient Thermal Resistance
- Thermal resistance network modeling
- Junction-to-case (theta_jc) calculations
- Case-to-sink (theta_cs) with TIM analysis
- Sink-to-ambient (theta_sa) characterization
- Total thermal path analysis

### Heat Sink Selection and Optimization
- Natural convection heat sink sizing
- Forced convection performance estimation
- Fin optimization for given constraints
- Heat sink comparison and selection
- Custom heat sink specification
- Mounting and interface considerations

### Forced Convection Analysis
- Fan airflow requirements calculation
- Pressure drop through enclosures
- Flow impedance matching
- Thermal resistance vs airflow curves
- Fan operating point determination

### PCB Thermal Analysis
- Copper spreading resistance calculation
- Via thermal conductivity
- Multi-layer board thermal modeling
- Hot spot identification
- Thermal relief pad analysis

### Thermal Interface Material Selection
- TIM thermal conductivity requirements
- Contact resistance estimation
- Phase change vs thermal grease vs gap pads
- Bond line thickness effects
- Long-term reliability considerations

### Transient Thermal Analysis
- Thermal time constant determination
- Pulse power handling
- Foster and Cauer RC network models
- Transient thermal impedance curves
- Peak temperature prediction

### Safe Operating Area Verification
- SOA curve interpretation
- DC and pulsed operation limits
- Secondary breakdown considerations
- Thermal runaway detection
- Derating for reliability

### Derating Curve Application
- Temperature-based power derating
- Maximum junction temperature limits
- Reliability vs performance tradeoffs
- Component-specific derating guidelines

### CFD Simulation Setup Guidance
- Boundary condition definition
- Mesh requirements for electronics
- Turbulence model selection
- Radiation modeling considerations
- Results validation approaches

## Prerequisites

### Installation
```bash
pip install numpy scipy matplotlib pandas
```

### Optional Dependencies
```bash
# For advanced thermal modeling
pip install CoolProp  # Fluid properties

# For optimization
pip install scipy

# For visualization
pip install plotly
```

## Usage Patterns

### Thermal Resistance Network Analysis
```python
import numpy as np
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ThermalComponent:
    """Represents a thermal resistance element"""
    name: str
    theta: float  # Thermal resistance (C/W)
    power: float = 0.0  # Power dissipation (W)

class ThermalNetwork:
    """1D thermal resistance network for electronics"""

    def __init__(self):
        self.components: List[ThermalComponent] = []
        self.ambient_temp = 25.0  # Celsius

    def add_resistance(self, name: str, theta: float, power: float = 0.0):
        self.components.append(ThermalComponent(name, theta, power))

    def calculate_temperatures(self, total_power: float) -> dict:
        """Calculate temperature at each node"""
        temperatures = {'ambient': self.ambient_temp}
        current_temp = self.ambient_temp

        # Work from ambient back to junction
        for comp in reversed(self.components):
            delta_t = total_power * comp.theta
            current_temp += delta_t
            temperatures[comp.name] = current_temp

        return temperatures

    def total_thermal_resistance(self) -> float:
        return sum(c.theta for c in self.components)

    def max_power_for_tj(self, tj_max: float) -> float:
        """Calculate max power for given junction temperature"""
        theta_ja = self.total_thermal_resistance()
        return (tj_max - self.ambient_temp) / theta_ja

# Example: MOSFET thermal analysis
network = ThermalNetwork()
network.ambient_temp = 40.0  # Elevated ambient

# Add thermal path components
network.add_resistance('theta_jc', 0.5)   # Junction to case
network.add_resistance('theta_cs', 0.2)   # Case to sink (TIM)
network.add_resistance('theta_sa', 2.0)   # Sink to ambient

# Calculate temperatures
power = 50.0  # Watts
temps = network.calculate_temperatures(power)
print(f"Junction temperature: {temps['theta_jc']:.1f}C")
print(f"Case temperature: {temps['theta_cs']:.1f}C")
print(f"Sink temperature: {temps['theta_sa']:.1f}C")

# Maximum power calculation
tj_max = 150.0  # Maximum junction temp from datasheet
max_power = network.max_power_for_tj(tj_max)
print(f"Maximum power at Tambient={network.ambient_temp}C: {max_power:.1f}W")
```

### Heat Sink Selection
```python
import numpy as np

class HeatSinkCalculator:
    """Heat sink thermal calculations"""

    @staticmethod
    def natural_convection_theta(length_mm: float, width_mm: float,
                                  height_mm: float, num_fins: int,
                                  fin_thickness_mm: float = 1.5) -> float:
        """Estimate thermal resistance for extruded aluminum heat sink
        using natural convection correlation"""

        # Convert to meters
        L = length_mm / 1000
        W = width_mm / 1000
        H = height_mm / 1000
        t_fin = fin_thickness_mm / 1000

        # Base area
        A_base = L * W

        # Fin spacing
        s = (W - num_fins * t_fin) / (num_fins - 1) if num_fins > 1 else W

        # Fin surface area (both sides)
        A_fins = 2 * num_fins * L * H

        # Total surface area
        A_total = A_base + A_fins

        # Natural convection coefficient estimate (typical for vertical fins)
        h = 10  # W/(m^2*K) typical for natural convection

        # Fin efficiency (simplified)
        k_al = 200  # W/(m*K) for aluminum
        m = np.sqrt(2 * h / (k_al * t_fin))
        eta_fin = np.tanh(m * H) / (m * H)

        # Effective area
        A_eff = A_base + eta_fin * A_fins

        # Thermal resistance
        theta_sa = 1 / (h * A_eff)

        return theta_sa

    @staticmethod
    def forced_convection_theta(theta_natural: float, velocity_m_s: float) -> float:
        """Estimate forced convection thermal resistance
        based on natural convection value and air velocity"""

        # Empirical correlation: forced convection much better than natural
        # Typical improvement factor
        velocity_factor = np.sqrt(velocity_m_s / 0.25)  # Normalized to typical natural
        improvement = min(velocity_factor * 3, 10)  # Cap at 10x improvement

        return theta_natural / improvement

# Example: Select heat sink for 75W dissipation
calculator = HeatSinkCalculator()

# Heat sink candidates
candidates = [
    {'name': 'Small', 'L': 50, 'W': 50, 'H': 25, 'fins': 10},
    {'name': 'Medium', 'L': 75, 'W': 75, 'H': 35, 'fins': 15},
    {'name': 'Large', 'L': 100, 'W': 100, 'H': 50, 'fins': 20},
]

power = 75  # Watts
tj_max = 125
ta = 40
theta_jc = 0.3
theta_cs = 0.15

required_theta_sa = (tj_max - ta) / power - theta_jc - theta_cs
print(f"Required theta_sa: {required_theta_sa:.2f} C/W")

print("\nHeat sink comparison (natural convection):")
for hs in candidates:
    theta = calculator.natural_convection_theta(
        hs['L'], hs['W'], hs['H'], hs['fins']
    )
    tj = ta + power * (theta_jc + theta_cs + theta)
    status = "OK" if tj <= tj_max else "FAIL"
    print(f"{hs['name']}: theta_sa={theta:.2f} C/W, Tj={tj:.1f}C [{status}]")
```

### Transient Thermal Analysis
```python
import numpy as np
import matplotlib.pyplot as plt

class TransientThermal:
    """Transient thermal analysis using Foster RC network"""

    def __init__(self, tau_values: List[float], r_values: List[float]):
        """
        Initialize with Foster network parameters
        tau_values: Time constants in seconds
        r_values: Thermal resistance contributions in C/W
        """
        self.tau = np.array(tau_values)
        self.r = np.array(r_values)

    def thermal_impedance(self, time: float) -> float:
        """Calculate Zth(t) at given time"""
        zth = np.sum(self.r * (1 - np.exp(-time / self.tau)))
        return zth

    def temperature_rise(self, power: float, time: float) -> float:
        """Calculate temperature rise for constant power"""
        return power * self.thermal_impedance(time)

    def pulsed_power_analysis(self, power: float, t_on: float, t_off: float,
                              num_pulses: int) -> np.ndarray:
        """Analyze temperature for pulsed power"""
        dt = min(t_on, t_off) / 100
        total_time = num_pulses * (t_on + t_off)
        time = np.arange(0, total_time, dt)

        temp_rise = np.zeros_like(time)

        for i, t in enumerate(time):
            # Superposition of pulse responses
            for pulse in range(num_pulses):
                pulse_start = pulse * (t_on + t_off)
                pulse_end = pulse_start + t_on

                if t > pulse_start:
                    # Add heating from pulse start
                    temp_rise[i] += power * self.thermal_impedance(t - pulse_start)
                if t > pulse_end:
                    # Subtract cooling from pulse end
                    temp_rise[i] -= power * self.thermal_impedance(t - pulse_end)

        return time, temp_rise

# Example: MOSFET transient thermal analysis
# Foster network parameters from datasheet
tau = [0.001, 0.01, 0.1, 1.0]  # seconds
r = [0.05, 0.1, 0.15, 0.2]    # C/W

thermal = TransientThermal(tau, r)

# Single pulse analysis
pulse_power = 100  # Watts
pulse_duration = 0.05  # 50ms

temp_rise = thermal.temperature_rise(pulse_power, pulse_duration)
print(f"Temperature rise for {pulse_power}W, {pulse_duration*1000}ms pulse: {temp_rise:.1f}C")

# Steady state
temp_steady = thermal.temperature_rise(pulse_power, 10.0)
print(f"Steady state temperature rise: {temp_steady:.1f}C")
```

### Safe Operating Area Check
```python
class SOAChecker:
    """Safe Operating Area verification"""

    def __init__(self, vds_max: float, id_max: float, pd_max: float,
                 tj_max: float, theta_jc: float):
        self.vds_max = vds_max
        self.id_max = id_max
        self.pd_max = pd_max
        self.tj_max = tj_max
        self.theta_jc = theta_jc

    def check_dc_operation(self, vds: float, id: float, tc: float) -> dict:
        """Check if operating point is within DC SOA"""
        power = vds * id
        tj = tc + power * self.theta_jc

        checks = {
            'vds_ok': vds <= self.vds_max,
            'id_ok': id <= self.id_max,
            'power_ok': power <= self.pd_max,
            'tj_ok': tj <= self.tj_max,
        }

        checks['all_ok'] = all(checks.values())
        checks['power'] = power
        checks['tj'] = tj

        return checks

    def max_current_at_voltage(self, vds: float, tc: float) -> float:
        """Calculate maximum current at given voltage and case temp"""
        # Power limit based on Tj
        max_power_thermal = (self.tj_max - tc) / self.theta_jc
        max_power = min(max_power_thermal, self.pd_max)

        # Current limited by power
        id_power = max_power / vds if vds > 0 else self.id_max

        # Take most restrictive limit
        return min(id_power, self.id_max)

# Example: MOSFET SOA check
soa = SOAChecker(
    vds_max=100,  # V
    id_max=50,    # A
    pd_max=200,   # W
    tj_max=150,   # C
    theta_jc=0.5  # C/W
)

# Check operating point
result = soa.check_dc_operation(vds=40, id=4, tc=80)
print(f"Operating point check: {result}")

# Generate SOA curve
vds_points = np.logspace(0, 2, 50)  # 1V to 100V
id_curve = [soa.max_current_at_voltage(v, 80) for v in vds_points]
print(f"Max current at Vds=40V, Tc=80C: {soa.max_current_at_voltage(40, 80):.1f}A")
```

## Usage Guidelines

### When to Use This Skill
- Component thermal verification during design
- Heat sink selection and specification
- Thermal interface material selection
- PCB thermal management design
- Failure analysis of overheated components

### Best Practices
1. **Use manufacturer thermal data** when available
2. **Add margin** to thermal calculations (typically 10-20%)
3. **Consider worst-case ambient** temperature
4. **Account for aging** of TIMs and fans
5. **Verify calculations** with thermal measurements
6. **Document thermal assumptions** in design reviews

### Process Integration
- ee-switching-power-supply-design (thermal management)
- ee-motor-drive-design (power stage thermal)
- ee-hardware-validation (thermal characterization)
- ee-dfm-review (thermal design review)

## Dependencies

- numpy: Numerical calculations
- scipy: Optimization for heat sink selection
- matplotlib: Thermal visualization

## References

- Ellison, G. "Thermal Computations for Electronics"
- Sergent & Krum, "Thermal Management Handbook"
- Application Notes from Infineon, ON Semi, TI
