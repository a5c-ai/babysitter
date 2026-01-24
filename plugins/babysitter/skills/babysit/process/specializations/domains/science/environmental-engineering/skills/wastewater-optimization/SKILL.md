---
name: wastewater-optimization
description: Specialized skill for biological and physical-chemical wastewater treatment process optimization with activated sludge modeling, nutrient removal, aeration efficiency, and energy minimization.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Water and Wastewater Treatment
backlog-id: SK-002
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Wastewater Treatment Optimization Skill

Biological and physical-chemical wastewater treatment process optimization for municipal and industrial applications.

## Purpose

This skill provides comprehensive capabilities for optimizing wastewater treatment processes, including activated sludge modeling, nutrient removal optimization, aeration efficiency analysis, and energy consumption minimization.

## Capabilities

### Activated Sludge Process Modeling
- ASM1, ASM2d, ASM3 model implementation
- Stoichiometric and kinetic parameter estimation
- Model calibration with plant data
- Steady-state and dynamic simulation
- Sensitivity analysis for key parameters

### BioWin and GPS-X Integration
- Model input file generation
- Simulation scenario configuration
- Results parsing and analysis
- Automated optimization runs
- Comparative scenario analysis

### Nutrient Removal Optimization
- Biological Nutrient Removal (BNR) process design
- Enhanced Biological Phosphorus Removal (EBPR) optimization
- Nitrification/denitrification kinetics
- Carbon source requirements
- Recycle ratio optimization

### Aeration Efficiency Analysis
- Oxygen transfer efficiency (OTE) calculation
- Alpha and beta factor determination
- Diffuser performance assessment
- Blower energy optimization
- DO control strategy evaluation

### Sludge Age and F/M Ratio Optimization
- Solids Retention Time (SRT) optimization
- Food-to-Microorganism (F/M) ratio analysis
- MLSS concentration control
- Sludge yield prediction
- WAS flow optimization

### Energy Consumption Minimization
- Energy audit methodology
- Aeration energy optimization
- Pumping efficiency analysis
- Process control optimization
- Energy benchmarking

### Chemical Dosing Optimization
- Coagulant dose optimization
- Polymer selection and dosing
- pH adjustment requirements
- Phosphorus precipitation
- Chemical cost minimization

### Secondary Clarifier Modeling
- Settling velocity analysis
- Solids flux theory application
- State point analysis
- Clarifier capacity evaluation
- Return sludge optimization

## Prerequisites

### Installation
```bash
pip install numpy scipy pandas matplotlib
```

### Optional Dependencies
```bash
# For process simulation
pip install python-control

# For optimization
pip install scipy pymoo

# For data visualization
pip install plotly seaborn
```

## Usage Patterns

### Activated Sludge Mass Balance
```python
import numpy as np
from dataclasses import dataclass
from typing import Dict, Optional

@dataclass
class WastewaterCharacteristics:
    """Influent wastewater characteristics"""
    flow_mgd: float  # Million gallons per day
    bod5_mg_l: float  # 5-day BOD
    tss_mg_l: float  # Total suspended solids
    tkn_mg_l: float  # Total Kjeldahl Nitrogen
    tp_mg_l: float  # Total phosphorus
    temperature_c: float = 20.0

@dataclass
class ActivatedSludgeParameters:
    """Kinetic and stoichiometric parameters"""
    Y: float = 0.6  # Yield coefficient (g VSS/g BOD)
    kd: float = 0.06  # Endogenous decay rate (1/day)
    mu_max: float = 6.0  # Maximum specific growth rate (1/day)
    Ks: float = 60.0  # Half-saturation constant (mg/L BOD)
    theta_Y: float = 1.0  # Temperature coefficient for Y
    theta_kd: float = 1.04  # Temperature coefficient for kd

class ActivatedSludgeModel:
    """Simplified activated sludge process model"""

    def __init__(self, influent: WastewaterCharacteristics,
                 params: ActivatedSludgeParameters):
        self.influent = influent
        self.params = params

    def calculate_srt_for_effluent(self, target_bod_eff: float) -> float:
        """Calculate required SRT for target effluent BOD"""
        S = target_bod_eff
        S0 = self.influent.bod5_mg_l
        Y = self.params.Y
        kd = self.params.kd
        mu_max = self.params.mu_max
        Ks = self.params.Ks

        # Specific growth rate at effluent concentration
        mu = mu_max * S / (Ks + S)

        # Minimum SRT (washout)
        srt_min = 1 / (mu - kd)

        return srt_min * 1.5  # Safety factor

    def calculate_oxygen_requirement(self, srt_days: float, target_bod_eff: float) -> Dict:
        """Calculate oxygen requirements"""
        Q = self.influent.flow_mgd * 3.785  # Convert to m3/day * 1000 L/m3
        S0 = self.influent.bod5_mg_l
        S = target_bod_eff
        Y = self.params.Y
        kd = self.params.kd

        # BOD removal
        bod_removed = (S0 - S) * Q / 1000  # kg/day

        # Biomass production
        Px = Y * bod_removed / (1 + kd * srt_days)

        # Oxygen for BOD oxidation
        O2_bod = bod_removed - 1.42 * Px

        # Oxygen for endogenous respiration
        O2_endo = 1.42 * kd * Px * srt_days

        return {
            'bod_removed_kg_day': bod_removed,
            'biomass_produced_kg_day': Px,
            'O2_for_bod_kg_day': O2_bod,
            'O2_for_endogenous_kg_day': O2_endo,
            'total_O2_kg_day': O2_bod + O2_endo
        }

    def calculate_aeration_basin_volume(self, srt_days: float,
                                        mlss_mg_l: float) -> float:
        """Calculate required aeration basin volume"""
        Q = self.influent.flow_mgd * 3785.41  # m3/day
        S0 = self.influent.bod5_mg_l
        S = 10  # Target effluent BOD
        Y = self.params.Y
        kd = self.params.kd

        # Calculate biomass
        Px = Y * (S0 - S) / (1 + kd * srt_days)  # mg VSS/L influent

        # Assume VSS/TSS ratio
        vss_tss_ratio = 0.8
        mlvss = mlss_mg_l * vss_tss_ratio

        # Volume calculation
        volume_m3 = (Q * Px * srt_days) / mlvss

        return volume_m3

# Example usage
influent = WastewaterCharacteristics(
    flow_mgd=10.0,
    bod5_mg_l=200,
    tss_mg_l=220,
    tkn_mg_l=40,
    tp_mg_l=8,
    temperature_c=18
)

params = ActivatedSludgeParameters()
model = ActivatedSludgeModel(influent, params)

srt = model.calculate_srt_for_effluent(target_bod_eff=10)
print(f"Required SRT: {srt:.1f} days")

o2_req = model.calculate_oxygen_requirement(srt, target_bod_eff=10)
print(f"Oxygen requirement: {o2_req['total_O2_kg_day']:.0f} kg/day")

volume = model.calculate_aeration_basin_volume(srt, mlss_mg_l=3000)
print(f"Aeration basin volume: {volume:.0f} m3")
```

### Aeration Efficiency Optimization
```python
import numpy as np

class AerationAnalysis:
    """Aeration system efficiency analysis"""

    def __init__(self, basin_depth_m: float, diffuser_type: str = 'fine_bubble'):
        self.basin_depth = basin_depth_m
        self.diffuser_type = diffuser_type

        # Standard oxygen transfer efficiencies
        self.sote_per_m = {
            'fine_bubble': 0.06,  # 6% per meter depth
            'coarse_bubble': 0.02,  # 2% per meter depth
            'surface_aerator': 0.015  # per meter equivalent
        }

    def calculate_sote(self) -> float:
        """Calculate Standard Oxygen Transfer Efficiency"""
        base_sote = self.sote_per_m.get(self.diffuser_type, 0.04)
        return base_sote * self.basin_depth

    def calculate_aote(self, temperature_c: float, do_mg_l: float,
                       alpha: float = 0.5, beta: float = 0.95,
                       altitude_m: float = 0) -> float:
        """Calculate Actual Oxygen Transfer Efficiency"""
        # Saturation DO at standard conditions
        Cs_20 = 9.09  # mg/L at 20C, sea level

        # Temperature correction for DO saturation
        Cs_T = 14.62 - 0.3898 * temperature_c + 0.006969 * temperature_c**2

        # Altitude correction
        P_ratio = np.exp(-altitude_m / 8500)

        # Theta factor for temperature
        theta = 1.024

        # Calculate AOTE
        sote = self.calculate_sote()
        aote = sote * alpha * ((beta * Cs_T * P_ratio - do_mg_l) / Cs_20) * \
               theta ** (temperature_c - 20)

        return aote

    def calculate_air_flow(self, o2_required_kg_hr: float,
                           aote: float) -> float:
        """Calculate required air flow rate"""
        # Air is ~23% oxygen by mass
        # Standard air density ~1.2 kg/m3
        o2_fraction = 0.23
        air_density = 1.2  # kg/m3

        # O2 in air = 1.2 * 0.23 = 0.276 kg O2/m3 air
        o2_per_m3_air = air_density * o2_fraction

        # Air flow required
        air_flow_m3_hr = o2_required_kg_hr / (o2_per_m3_air * aote)

        return air_flow_m3_hr

    def calculate_blower_power(self, air_flow_m3_hr: float,
                               inlet_pressure_kpa: float = 101.325,
                               discharge_pressure_kpa: float = 150,
                               efficiency: float = 0.70) -> float:
        """Calculate blower power requirement"""
        # Adiabatic compression
        gamma = 1.4  # Air specific heat ratio

        # Pressure ratio
        p_ratio = discharge_pressure_kpa / inlet_pressure_kpa

        # Convert to m3/s
        Q = air_flow_m3_hr / 3600

        # Adiabatic head calculation
        head_kj_kg = (gamma / (gamma - 1)) * (inlet_pressure_kpa / 1.2) * \
                     ((p_ratio ** ((gamma - 1) / gamma)) - 1)

        # Power in kW
        power_kw = (Q * 1.2 * head_kj_kg) / efficiency

        return power_kw

# Example usage
aeration = AerationAnalysis(basin_depth_m=5.0, diffuser_type='fine_bubble')

sote = aeration.calculate_sote()
print(f"SOTE: {sote*100:.1f}%")

aote = aeration.calculate_aote(temperature_c=18, do_mg_l=2.0, alpha=0.5)
print(f"AOTE: {aote*100:.1f}%")

air_flow = aeration.calculate_air_flow(o2_required_kg_hr=500, aote=aote)
print(f"Air flow required: {air_flow:.0f} m3/hr")

power = aeration.calculate_blower_power(air_flow_m3_hr=air_flow)
print(f"Blower power: {power:.0f} kW")
```

### Nutrient Removal Analysis
```python
class NutrientRemoval:
    """Nutrient removal process analysis"""

    def __init__(self):
        self.nitrification_rate_20c = 0.08  # g N/(g VSS*day) at 20C
        self.denitrification_rate_20c = 0.1  # g N/(g VSS*day) at 20C

    def calculate_nitrification_srt(self, temperature_c: float,
                                    safety_factor: float = 2.0) -> float:
        """Calculate minimum SRT for nitrification"""
        # Nitrifier parameters
        mu_max_20 = 0.8  # 1/day at 20C
        kd_n = 0.04  # 1/day
        theta = 1.07

        # Temperature correction
        mu_max = mu_max_20 * theta ** (temperature_c - 20)

        # Minimum SRT
        srt_min = 1 / (mu_max - kd_n)

        return srt_min * safety_factor

    def calculate_carbon_for_denitrification(self, no3_to_remove_mg_l: float,
                                             flow_mgd: float,
                                             carbon_source: str = 'methanol') -> Dict:
        """Calculate external carbon requirement for denitrification"""
        # Carbon requirements (g COD/g N removed)
        carbon_ratios = {
            'methanol': 3.0,
            'ethanol': 4.0,
            'acetic_acid': 3.5,
            'raw_wastewater': 4.5
        }

        ratio = carbon_ratios.get(carbon_source, 4.0)

        # Convert flow
        flow_m3_day = flow_mgd * 3785.41

        # N mass to remove
        n_mass_kg_day = no3_to_remove_mg_l * flow_m3_day / 1000

        # COD required
        cod_kg_day = n_mass_kg_day * ratio

        return {
            'nitrate_removed_kg_day': n_mass_kg_day,
            'cod_required_kg_day': cod_kg_day,
            'carbon_source': carbon_source,
            'ratio_used': ratio
        }

    def calculate_ebpr_capacity(self, vfa_mg_l: float, flow_mgd: float) -> Dict:
        """Estimate EBPR phosphorus removal capacity"""
        # VFA uptake ratio: ~10-15 mg VFA-COD per mg P removed
        vfa_p_ratio = 12  # mg VFA-COD / mg P

        # Convert flow
        flow_m3_day = flow_mgd * 3785.41

        # VFA mass available
        vfa_mass_kg_day = vfa_mg_l * flow_m3_day / 1000

        # P removal potential
        p_removal_kg_day = vfa_mass_kg_day / (vfa_p_ratio / 1000)

        return {
            'vfa_available_kg_day': vfa_mass_kg_day,
            'p_removal_potential_kg_day': p_removal_kg_day,
            'p_removal_concentration_mg_l': (p_removal_kg_day * 1000) / flow_m3_day
        }

# Example usage
nutrient = NutrientRemoval()

srt = nutrient.calculate_nitrification_srt(temperature_c=15)
print(f"Minimum SRT for nitrification at 15C: {srt:.1f} days")

carbon = nutrient.calculate_carbon_for_denitrification(
    no3_to_remove_mg_l=20,
    flow_mgd=10,
    carbon_source='methanol'
)
print(f"Methanol COD required: {carbon['cod_required_kg_day']:.0f} kg/day")

ebpr = nutrient.calculate_ebpr_capacity(vfa_mg_l=50, flow_mgd=10)
print(f"EBPR P removal potential: {ebpr['p_removal_concentration_mg_l']:.1f} mg/L")
```

## Usage Guidelines

### When to Use This Skill
- Wastewater treatment process design and optimization
- Energy efficiency improvement projects
- Nutrient removal system upgrades
- Process troubleshooting and capacity analysis
- Chemical dosing optimization

### Best Practices
1. **Calibrate models** with plant-specific data
2. **Consider seasonal variations** in temperature and loading
3. **Account for diurnal variations** in flow and load
4. **Verify model predictions** with plant performance data
5. **Include safety factors** for critical processes like nitrification
6. **Optimize holistically** considering interactions between processes

### Process Integration
- WW-002: Wastewater Process Optimization (all phases)
- WW-001: Water Treatment Plant Design (optimization phases)

## Dependencies

- numpy: Numerical calculations
- scipy: Optimization routines
- pandas: Data analysis

## References

- Metcalf & Eddy, "Wastewater Engineering: Treatment and Resource Recovery"
- Water Environment Federation, "Nutrient Removal" (MOP 34)
- Henze et al., "Activated Sludge Models ASM1, ASM2, ASM2d and ASM3"
