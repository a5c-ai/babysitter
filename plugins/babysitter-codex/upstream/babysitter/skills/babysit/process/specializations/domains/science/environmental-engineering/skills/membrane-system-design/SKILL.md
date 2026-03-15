---
name: membrane-system-design
description: Expert skill for membrane filtration and separation system design including process selection, flux calculations, fouling analysis, and concentrate management.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Water and Wastewater Treatment
backlog-id: SK-003
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Membrane System Design Skill

Membrane filtration and separation system design for water and wastewater treatment applications.

## Purpose

This skill provides comprehensive capabilities for designing membrane treatment systems, including process selection, flux and recovery calculations, fouling analysis, pretreatment requirements, and concentrate management planning.

## Capabilities

### Membrane Process Selection
- Microfiltration (MF) applications
- Ultrafiltration (UF) applications
- Nanofiltration (NF) applications
- Reverse Osmosis (RO) applications
- Process selection criteria and decision matrix
- Hybrid system configurations

### Flux and Recovery Rate Calculations
- Design flux determination
- Temperature correction factors
- Recovery rate optimization
- Concentration polarization effects
- Osmotic pressure calculations
- Permeate quality estimation

### Pretreatment Requirements Assessment
- Feed water characterization
- Silt Density Index (SDI) analysis
- Modified Fouling Index (MFI) calculation
- Pretreatment technology selection
- Chemical conditioning requirements

### Fouling Analysis and Mitigation
- Fouling mechanism identification
- Biofouling assessment
- Scaling potential analysis
- Colloidal fouling evaluation
- Organic fouling characterization
- Mitigation strategy development

### Concentrate Management Planning
- Concentrate characterization
- Disposal options evaluation
- Zero Liquid Discharge (ZLD) considerations
- Brine concentration technologies
- Regulatory compliance for disposal

### CIP System Design
- Clean-in-Place system configuration
- Chemical cleaning protocols
- Cleaning frequency optimization
- Chemical compatibility assessment
- Cleaning effectiveness monitoring

### Energy Recovery Device Selection
- Pressure exchanger sizing
- Turbocharger systems
- Energy recovery efficiency
- Economic analysis
- System integration

### Membrane Pilot Testing Protocols
- Pilot system design
- Test protocol development
- Data collection requirements
- Performance metrics
- Scale-up considerations

## Prerequisites

### Installation
```bash
pip install numpy scipy pandas matplotlib
```

### Optional Dependencies
```bash
# For optimization
pip install scipy pymoo

# For visualization
pip install plotly seaborn
```

## Usage Patterns

### Membrane System Sizing
```python
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class FeedWaterQuality:
    """Feed water quality parameters"""
    tds_mg_l: float
    temperature_c: float
    ph: float
    tss_mg_l: float
    toc_mg_l: float
    hardness_mg_l: float = 0  # as CaCO3
    silica_mg_l: float = 0
    sdi: float = 0  # Silt Density Index

@dataclass
class MembraneElement:
    """Membrane element specifications"""
    manufacturer: str
    model: str
    area_m2: float
    permeability_lmh_bar: float  # L/m2/hr/bar
    salt_rejection: float  # decimal
    max_recovery: float  # decimal
    min_concentrate_flow_m3_hr: float

class ROSystemDesign:
    """Reverse Osmosis system design"""

    def __init__(self, feed: FeedWaterQuality, element: MembraneElement):
        self.feed = feed
        self.element = element

    def osmotic_pressure(self, tds_mg_l: float) -> float:
        """Calculate osmotic pressure in bar"""
        # Simplified van't Hoff equation
        # pi = i * C * R * T
        # For typical water: pi (bar) ≈ 0.0385 * TDS (g/L)
        return 0.0385 * (tds_mg_l / 1000) * (273.15 + self.feed.temperature_c) / 298.15

    def temperature_correction_factor(self) -> float:
        """Temperature correction factor for flux"""
        # TCF = exp(2640 * (1/298 - 1/T))
        T_kelvin = 273.15 + self.feed.temperature_c
        return np.exp(2640 * (1/298.15 - 1/T_kelvin))

    def calculate_flux(self, feed_pressure_bar: float, recovery: float) -> float:
        """Calculate permeate flux in LMH"""
        # Average osmotic pressure (considering concentration polarization)
        avg_concentration_factor = 1 / (1 - recovery/2)
        avg_tds = self.feed.tds_mg_l * avg_concentration_factor
        pi_avg = self.osmotic_pressure(avg_tds)

        # Net driving pressure
        ndp = feed_pressure_bar - pi_avg - 1  # 1 bar backpressure

        # Flux with temperature correction
        tcf = self.temperature_correction_factor()
        flux = self.element.permeability_lmh_bar * ndp * tcf

        return flux

    def design_system(self, feed_flow_m3_hr: float, target_recovery: float,
                      feed_pressure_bar: float) -> Dict:
        """Design RO system for given requirements"""

        # Calculate flux
        flux = self.calculate_flux(feed_pressure_bar, target_recovery)

        # Permeate flow
        permeate_flow = feed_flow_m3_hr * target_recovery

        # Required membrane area
        required_area = (permeate_flow * 1000) / flux  # m2

        # Number of elements
        num_elements = np.ceil(required_area / self.element.area_m2)

        # Elements per vessel (typical 6-8)
        elements_per_vessel = 6
        num_vessels = np.ceil(num_elements / elements_per_vessel)
        actual_elements = num_vessels * elements_per_vessel

        # Concentrate flow and quality
        concentrate_flow = feed_flow_m3_hr * (1 - target_recovery)
        concentrate_tds = self.feed.tds_mg_l / (1 - target_recovery)

        # Permeate quality
        avg_passage = 1 - self.element.salt_rejection
        permeate_tds = self.feed.tds_mg_l * avg_passage * (1 + target_recovery)

        # Specific energy consumption estimate
        pump_efficiency = 0.80
        sec_kwh_m3 = (feed_pressure_bar * 100) / (36 * pump_efficiency * target_recovery)

        return {
            'design_flux_lmh': flux,
            'required_area_m2': required_area,
            'num_vessels': int(num_vessels),
            'elements_per_vessel': elements_per_vessel,
            'total_elements': int(actual_elements),
            'permeate_flow_m3_hr': permeate_flow,
            'concentrate_flow_m3_hr': concentrate_flow,
            'permeate_tds_mg_l': permeate_tds,
            'concentrate_tds_mg_l': concentrate_tds,
            'specific_energy_kwh_m3': sec_kwh_m3
        }

# Example usage
feed = FeedWaterQuality(
    tds_mg_l=2000,
    temperature_c=25,
    ph=7.5,
    tss_mg_l=5,
    toc_mg_l=3,
    sdi=3
)

element = MembraneElement(
    manufacturer='Example',
    model='BW30-400',
    area_m2=37.2,
    permeability_lmh_bar=3.5,
    salt_rejection=0.995,
    max_recovery=0.15,
    min_concentrate_flow_m3_hr=3.6
)

ro_system = ROSystemDesign(feed, element)
design = ro_system.design_system(
    feed_flow_m3_hr=100,
    target_recovery=0.75,
    feed_pressure_bar=15
)

print(f"Design flux: {design['design_flux_lmh']:.1f} LMH")
print(f"Number of vessels: {design['num_vessels']}")
print(f"Total elements: {design['total_elements']}")
print(f"Permeate TDS: {design['permeate_tds_mg_l']:.0f} mg/L")
print(f"Specific energy: {design['specific_energy_kwh_m3']:.2f} kWh/m3")
```

### Scaling Potential Analysis
```python
class ScalingAnalysis:
    """Membrane scaling potential analysis"""

    # Solubility product constants at 25C
    Ksp = {
        'CaCO3': 3.3e-9,
        'CaSO4': 4.9e-5,
        'BaSO4': 1.1e-10,
        'SrSO4': 3.4e-7,
        'SiO2': 120  # mg/L saturation
    }

    def __init__(self, water_quality: Dict):
        self.wq = water_quality

    def langelier_saturation_index(self, temperature_c: float,
                                   tds_mg_l: float) -> float:
        """Calculate Langelier Saturation Index for CaCO3"""
        pH = self.wq.get('pH', 7.5)
        Ca = self.wq.get('Ca_mg_l', 100)
        alkalinity = self.wq.get('alkalinity_mg_l', 100)

        # pHs calculation (simplified)
        pCa = -np.log10(Ca / 40080)  # Convert to mol/L
        pAlk = -np.log10(alkalinity / 50040)

        # Temperature and TDS corrections
        A = (np.log10(tds_mg_l) - 1) / 10
        B = -13.12 * np.log10(temperature_c + 273) + 34.55
        C = np.log10(Ca / 40.08) - 0.4
        D = np.log10(alkalinity / 50.04)

        pHs = (9.3 + A + B) - C - D
        lsi = pH - pHs

        return lsi

    def stiff_davis_index(self, ionic_strength: float) -> float:
        """Calculate Stiff-Davis Stability Index for high TDS waters"""
        pH = self.wq.get('pH', 7.5)
        Ca = self.wq.get('Ca_mg_l', 100)
        alkalinity = self.wq.get('alkalinity_mg_l', 100)

        # Activity coefficient correction
        K = 2.22e-14  # CaCO3 equilibrium constant

        pCa = -np.log10(Ca / 40080 * 0.4)  # With activity correction
        pAlk = -np.log10(alkalinity / 50040 * 0.4)
        pK = -np.log10(K)

        pHs = pK + pCa + pAlk
        sdi = pH - pHs

        return sdi

    def calcium_sulfate_saturation(self, recovery: float) -> float:
        """Calculate CaSO4 saturation ratio at given recovery"""
        Ca = self.wq.get('Ca_mg_l', 100)
        SO4 = self.wq.get('SO4_mg_l', 200)

        # Concentration factor
        cf = 1 / (1 - recovery)

        # Ion product in concentrate
        Ca_conc = (Ca / 40080) * cf  # mol/L
        SO4_conc = (SO4 / 96060) * cf  # mol/L
        ip = Ca_conc * SO4_conc

        # Saturation ratio
        sr = ip / self.Ksp['CaSO4']

        return sr

    def silica_saturation(self, recovery: float, temperature_c: float) -> float:
        """Calculate silica saturation ratio"""
        SiO2 = self.wq.get('SiO2_mg_l', 20)

        # Concentration factor
        cf = 1 / (1 - recovery)
        SiO2_conc = SiO2 * cf

        # Temperature-dependent saturation (simplified)
        saturation_limit = self.Ksp['SiO2'] + (temperature_c - 25) * 2

        return SiO2_conc / saturation_limit

    def analyze_scaling_potential(self, recovery: float,
                                  temperature_c: float = 25) -> Dict:
        """Complete scaling potential analysis"""
        tds_concentrate = self.wq.get('tds_mg_l', 1000) / (1 - recovery)

        results = {
            'recovery': recovery,
            'concentration_factor': 1 / (1 - recovery),
            'concentrate_tds_mg_l': tds_concentrate,
            'lsi': self.langelier_saturation_index(temperature_c, tds_concentrate),
            'caso4_saturation': self.calcium_sulfate_saturation(recovery),
            'silica_saturation': self.silica_saturation(recovery, temperature_c)
        }

        # Risk assessment
        results['caco3_risk'] = 'HIGH' if results['lsi'] > 0.5 else \
                               'MODERATE' if results['lsi'] > 0 else 'LOW'
        results['caso4_risk'] = 'HIGH' if results['caso4_saturation'] > 0.8 else \
                               'MODERATE' if results['caso4_saturation'] > 0.5 else 'LOW'
        results['silica_risk'] = 'HIGH' if results['silica_saturation'] > 0.8 else \
                                'MODERATE' if results['silica_saturation'] > 0.5 else 'LOW'

        return results

# Example usage
water_quality = {
    'pH': 7.8,
    'tds_mg_l': 2000,
    'Ca_mg_l': 150,
    'SO4_mg_l': 300,
    'alkalinity_mg_l': 180,
    'SiO2_mg_l': 25
}

scaling = ScalingAnalysis(water_quality)
results = scaling.analyze_scaling_potential(recovery=0.75, temperature_c=25)

print(f"Concentration factor: {results['concentration_factor']:.2f}x")
print(f"LSI: {results['lsi']:.2f} - CaCO3 risk: {results['caco3_risk']}")
print(f"CaSO4 saturation: {results['caso4_saturation']:.2f} - Risk: {results['caso4_risk']}")
print(f"Silica saturation: {results['silica_saturation']:.2f} - Risk: {results['silica_risk']}")
```

### CIP Protocol Development
```python
class CIPProtocol:
    """Clean-in-Place protocol development"""

    def __init__(self, membrane_type: str = 'polyamide'):
        self.membrane_type = membrane_type

        # Chemical compatibility
        self.ph_limits = {
            'polyamide': (2, 11),
            'cellulose_acetate': (4, 7),
            'polysulfone': (1, 13)
        }

        self.temperature_limit = {
            'polyamide': 45,
            'cellulose_acetate': 35,
            'polysulfone': 50
        }

    def recommend_cleaning_chemicals(self, fouling_type: str) -> List[Dict]:
        """Recommend cleaning chemicals based on fouling type"""
        recommendations = {
            'biofouling': [
                {'chemical': 'NaOH', 'concentration': '0.1%', 'ph': 12, 'temperature_c': 35},
                {'chemical': 'Biocide', 'concentration': 'Per manufacturer', 'ph': 7, 'temperature_c': 25}
            ],
            'organic': [
                {'chemical': 'NaOH', 'concentration': '0.1%', 'ph': 12, 'temperature_c': 35},
                {'chemical': 'Surfactant', 'concentration': '0.1%', 'ph': 10, 'temperature_c': 30}
            ],
            'colloidal': [
                {'chemical': 'NaOH', 'concentration': '0.1%', 'ph': 11, 'temperature_c': 30},
                {'chemical': 'EDTA', 'concentration': '1%', 'ph': 10, 'temperature_c': 30}
            ],
            'scale_calcium': [
                {'chemical': 'HCl', 'concentration': '0.2%', 'ph': 2, 'temperature_c': 25},
                {'chemical': 'Citric acid', 'concentration': '2%', 'ph': 3, 'temperature_c': 30}
            ],
            'scale_silica': [
                {'chemical': 'NaOH', 'concentration': '0.1%', 'ph': 11, 'temperature_c': 35}
            ]
        }

        return recommendations.get(fouling_type, [])

    def generate_cip_procedure(self, fouling_types: List[str],
                              system_volume_m3: float) -> Dict:
        """Generate complete CIP procedure"""
        ph_min, ph_max = self.ph_limits.get(self.membrane_type, (2, 12))
        temp_max = self.temperature_limit.get(self.membrane_type, 40)

        procedure = {
            'membrane_type': self.membrane_type,
            'ph_operating_range': f'{ph_min} - {ph_max}',
            'max_temperature_c': temp_max,
            'system_volume_m3': system_volume_m3,
            'steps': []
        }

        # Initial flush
        procedure['steps'].append({
            'step': 1,
            'action': 'Low pressure flush',
            'duration_min': 10,
            'flow_rate': 'High',
            'description': 'Flush with permeate water to remove loose deposits'
        })

        # Cleaning steps based on fouling types
        step_num = 2
        for fouling in fouling_types:
            chemicals = self.recommend_cleaning_chemicals(fouling)
            for chem in chemicals:
                if chem['temperature_c'] <= temp_max and ph_min <= chem['ph'] <= ph_max:
                    procedure['steps'].append({
                        'step': step_num,
                        'action': f'Chemical clean - {chem["chemical"]}',
                        'concentration': chem['concentration'],
                        'ph': chem['ph'],
                        'temperature_c': chem['temperature_c'],
                        'duration_min': 30,
                        'recirculation_time_min': 60,
                        'soak_time_min': 30,
                        'description': f'Target: {fouling} fouling removal'
                    })
                    step_num += 1

        # Final flush
        procedure['steps'].append({
            'step': step_num,
            'action': 'Final flush',
            'duration_min': 20,
            'description': 'Flush until pH and conductivity match feed water'
        })

        return procedure

# Example usage
cip = CIPProtocol(membrane_type='polyamide')
procedure = cip.generate_cip_procedure(
    fouling_types=['biofouling', 'scale_calcium'],
    system_volume_m3=5
)

print("CIP Procedure:")
for step in procedure['steps']:
    print(f"  Step {step['step']}: {step['action']}")
```

## Usage Guidelines

### When to Use This Skill
- Membrane system design and specification
- Pilot testing protocol development
- Fouling diagnosis and mitigation
- System optimization and troubleshooting
- Pretreatment system design

### Best Practices
1. **Characterize feed water thoroughly** before design
2. **Use pilot testing** for critical applications
3. **Design for maintainability** including CIP access
4. **Monitor membrane performance** trends regularly
5. **Maintain chemical dosing records** for troubleshooting
6. **Plan for concentrate management** early in design

### Process Integration
- WW-003: Membrane Treatment System Design (all phases)
- WW-005: Water Reuse System Implementation (membrane phases)

## Dependencies

- numpy: Numerical calculations
- scipy: Optimization routines

## References

- AWWA M46 "Reverse Osmosis and Nanofiltration"
- Dow Water & Process Solutions Technical Manual
- Hydranautics Technical Application Bulletins
