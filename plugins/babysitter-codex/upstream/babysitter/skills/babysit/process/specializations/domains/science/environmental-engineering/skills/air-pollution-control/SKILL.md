---
name: air-pollution-control
description: Specialized skill for air pollution control equipment selection and design including scrubbers, baghouses, ESPs, oxidizers, and BACT/LAER determination.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Air Quality Management
backlog-id: SK-007
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Air Pollution Control Design Skill

Air pollution control equipment selection and design for industrial emission reduction.

## Purpose

This skill provides comprehensive capabilities for designing air pollution control systems, including technology selection, equipment sizing, efficiency calculations, and regulatory compliance demonstration (BACT/LAER/MACT).

## Capabilities

### Scrubber Design
- Wet scrubber technology selection
- Packed tower design and sizing
- Spray tower configuration
- Venturi scrubber design
- Pressure drop calculations
- Liquid-to-gas ratio optimization
- Chemical dosing requirements

### Baghouse and Fabric Filter Sizing
- Filter media selection
- Air-to-cloth ratio determination
- Compartmentalization design
- Pulse-jet vs reverse-air cleaning
- Pressure drop estimation
- Bag life prediction
- Hopper sizing

### Electrostatic Precipitator Design
- Collection efficiency calculation
- Specific Collection Area (SCA) determination
- Plate spacing and configuration
- Electrical field strength
- Rapping system design
- Resistivity considerations
- Power supply sizing

### Thermal and Catalytic Oxidizer Specification
- Destruction efficiency requirements
- Temperature and residence time
- Heat recovery options (regenerative, recuperative)
- Catalyst selection for catalytic oxidizers
- Auxiliary fuel requirements
- Turndown capabilities

### Carbon Adsorption System Design
- Activated carbon selection
- Adsorption capacity calculations
- Breakthrough time estimation
- Bed sizing
- Regeneration system design
- Carbon replacement frequency

### Control Efficiency Calculations
- Outlet emission rate determination
- Removal efficiency verification
- Stack testing correlation
- Continuous monitoring requirements

### Pressure Drop and Energy Analysis
- System pressure drop calculation
- Fan power requirements
- Operating cost estimation
- Energy optimization opportunities

### BACT/LAER/MACT Determination
- Control technology identification
- Cost-effectiveness analysis
- Technical feasibility evaluation
- Regulatory database research
- Top-down BACT analysis

## Prerequisites

### Installation
```bash
pip install numpy scipy pandas matplotlib
```

### Optional Dependencies
```bash
# For chemical property lookup
pip install chemicals thermo

# For visualization
pip install plotly
```

## Usage Patterns

### Baghouse Design
```python
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class GasStreamData:
    """Gas stream characteristics"""
    flow_rate_acfm: float
    temperature_f: float
    moisture_pct: float
    particulate_loading_gr_acf: float
    particle_size_micron: float
    gas_composition: Dict[str, float] = None

@dataclass
class BaghouseDesign:
    """Baghouse design parameters"""
    filter_media: str
    bag_diameter_in: float
    bag_length_ft: float
    air_to_cloth_ratio: float
    cleaning_type: str  # 'pulse_jet', 'reverse_air', 'shaker'

class BaghouseCalculator:
    """Pulse-jet baghouse sizing calculations"""

    # Recommended air-to-cloth ratios (acfm/ft2) by application
    AC_RATIOS = {
        'cement': {'gross': 4.0, 'net': 3.5},
        'coal': {'gross': 6.0, 'net': 5.0},
        'foundry': {'gross': 4.5, 'net': 3.5},
        'steel': {'gross': 5.0, 'net': 4.0},
        'chemical': {'gross': 5.5, 'net': 4.5},
        'pharmaceutical': {'gross': 3.5, 'net': 3.0},
        'general': {'gross': 5.0, 'net': 4.0}
    }

    # Filter media properties
    MEDIA_PROPERTIES = {
        'polyester': {'max_temp_f': 275, 'cost_factor': 1.0, 'acid_resist': 'good'},
        'polypropylene': {'max_temp_f': 200, 'cost_factor': 0.9, 'acid_resist': 'excellent'},
        'nomex': {'max_temp_f': 400, 'cost_factor': 3.0, 'acid_resist': 'good'},
        'fiberglass': {'max_temp_f': 500, 'cost_factor': 2.5, 'acid_resist': 'excellent'},
        'ptfe': {'max_temp_f': 500, 'cost_factor': 8.0, 'acid_resist': 'excellent'},
        'p84': {'max_temp_f': 500, 'cost_factor': 5.0, 'acid_resist': 'good'}
    }

    def select_filter_media(self, gas: GasStreamData) -> str:
        """Select appropriate filter media based on gas conditions"""
        temp = gas.temperature_f

        suitable = []
        for media, props in self.MEDIA_PROPERTIES.items():
            if props['max_temp_f'] >= temp:
                suitable.append((media, props))

        # Return lowest cost suitable media
        suitable.sort(key=lambda x: x[1]['cost_factor'])
        return suitable[0][0] if suitable else 'ptfe'

    def calculate_filter_area(self, gas: GasStreamData,
                              application: str = 'general',
                              use_net_ratio: bool = True) -> Dict:
        """Calculate required filter area"""
        ratios = self.AC_RATIOS.get(application, self.AC_RATIOS['general'])
        ac_ratio = ratios['net'] if use_net_ratio else ratios['gross']

        filter_area = gas.flow_rate_acfm / ac_ratio

        return {
            'gas_flow_acfm': gas.flow_rate_acfm,
            'air_to_cloth_ratio': ac_ratio,
            'filter_area_sqft': filter_area
        }

    def size_baghouse(self, gas: GasStreamData,
                      bag_diameter_in: float = 6.0,
                      bag_length_ft: float = 10.0,
                      application: str = 'general') -> Dict:
        """Size complete baghouse system"""

        # Filter media selection
        media = self.select_filter_media(gas)

        # Calculate filter area
        area_calc = self.calculate_filter_area(gas, application)
        required_area = area_calc['filter_area_sqft']

        # Bag area calculation
        bag_area = np.pi * (bag_diameter_in / 12) * bag_length_ft  # sq ft per bag

        # Number of bags
        num_bags = np.ceil(required_area / bag_area)

        # Compartments (typically 8-16 bags per row, 2-4 rows per compartment)
        bags_per_compartment = 32  # typical
        num_compartments = np.ceil(num_bags / bags_per_compartment)

        # Pressure drop estimate (typical for pulse-jet)
        dp_filter = 2.5  # inches w.c. for clean filter
        dp_tubesheet = 0.5
        dp_inlet_outlet = 1.0
        total_dp = dp_filter + dp_tubesheet + dp_inlet_outlet

        # Hopper sizing (4:1 turndown, 8-hour storage)
        dust_rate_lb_hr = gas.particulate_loading_gr_acf * gas.flow_rate_acfm * 60 / 7000
        hopper_volume = dust_rate_lb_hr * 8 / 50  # 50 lb/cf bulk density

        return {
            'filter_media': media,
            'required_filter_area_sqft': required_area,
            'bag_diameter_in': bag_diameter_in,
            'bag_length_ft': bag_length_ft,
            'area_per_bag_sqft': bag_area,
            'total_bags': int(num_bags),
            'num_compartments': int(num_compartments),
            'air_to_cloth_gross': gas.flow_rate_acfm / (num_bags * bag_area),
            'pressure_drop_in_wc': total_dp,
            'dust_rate_lb_hr': dust_rate_lb_hr,
            'hopper_volume_cf': hopper_volume,
            'max_temp_f': self.MEDIA_PROPERTIES[media]['max_temp_f']
        }

# Example usage
gas = GasStreamData(
    flow_rate_acfm=50000,
    temperature_f=350,
    moisture_pct=8,
    particulate_loading_gr_acf=2.0,
    particle_size_micron=5
)

calculator = BaghouseCalculator()
design = calculator.size_baghouse(gas, application='cement')

print(f"Filter media: {design['filter_media']}")
print(f"Total bags: {design['total_bags']}")
print(f"Compartments: {design['num_compartments']}")
print(f"A/C ratio: {design['air_to_cloth_gross']:.2f} acfm/sqft")
print(f"Pressure drop: {design['pressure_drop_in_wc']:.1f} in w.c.")
```

### Wet Scrubber Design
```python
class WetScrubberDesign:
    """Wet scrubber design calculations"""

    def packed_tower_sizing(self, gas_flow_acfm: float,
                           pollutant: str,
                           inlet_conc_ppm: float,
                           outlet_conc_ppm: float,
                           scrubbing_liquid: str = 'water') -> Dict:
        """Size packed tower for gas absorption"""

        # Removal efficiency
        efficiency = (inlet_conc_ppm - outlet_conc_ppm) / inlet_conc_ppm

        # Gas velocity (typical range 3-6 ft/s for packed towers)
        gas_velocity_fps = 4.5

        # Cross-sectional area
        area_sqft = (gas_flow_acfm / 60) / gas_velocity_fps

        # Diameter
        diameter_ft = np.sqrt(4 * area_sqft / np.pi)

        # Height based on NTU (simplified)
        ntu = -np.log(1 - efficiency)  # Number of transfer units
        htu = 2.5  # Height of transfer unit (ft) - typical for 2" packing
        packing_height = ntu * htu

        # L/G ratio (liquid to gas)
        lg_ratio = 10  # gpm per 1000 acfm typical

        # Liquid flow rate
        liquid_flow_gpm = gas_flow_acfm * lg_ratio / 1000

        # Pressure drop (1-2 in w.c. per ft of packing typical)
        pressure_drop = packing_height * 1.5

        return {
            'diameter_ft': diameter_ft,
            'packing_height_ft': packing_height,
            'total_height_ft': packing_height * 1.5,  # Add for internals
            'cross_section_sqft': area_sqft,
            'gas_velocity_fps': gas_velocity_fps,
            'liquid_flow_gpm': liquid_flow_gpm,
            'lg_ratio_gpm_per_kacfm': lg_ratio,
            'pressure_drop_in_wc': pressure_drop,
            'removal_efficiency_pct': efficiency * 100,
            'ntu': ntu
        }

    def venturi_scrubber_sizing(self, gas_flow_acfm: float,
                                particulate_loading_gr_acf: float,
                                target_efficiency_pct: float) -> Dict:
        """Size venturi scrubber for particulate removal"""

        # Pressure drop vs efficiency correlation (Johnstone equation)
        # Efficiency increases with pressure drop
        # For 99% efficiency, typically need 30-50 in w.c.

        if target_efficiency_pct >= 99:
            pressure_drop = 50
        elif target_efficiency_pct >= 95:
            pressure_drop = 30
        elif target_efficiency_pct >= 90:
            pressure_drop = 20
        else:
            pressure_drop = 10

        # L/G ratio (higher for higher efficiency)
        lg_ratio = 8 + (target_efficiency_pct - 90) * 0.2

        # Throat velocity (typically 12,000-24,000 fpm)
        throat_velocity = 15000  # fpm

        # Throat area
        throat_area = gas_flow_acfm / throat_velocity

        # Liquid flow
        liquid_flow = gas_flow_acfm * lg_ratio / 1000

        return {
            'throat_area_sqft': throat_area,
            'throat_velocity_fpm': throat_velocity,
            'pressure_drop_in_wc': pressure_drop,
            'liquid_flow_gpm': liquid_flow,
            'lg_ratio': lg_ratio,
            'expected_efficiency_pct': target_efficiency_pct
        }

# Example usage
scrubber = WetScrubberDesign()

# Packed tower for SO2 removal
packed = scrubber.packed_tower_sizing(
    gas_flow_acfm=30000,
    pollutant='SO2',
    inlet_conc_ppm=1000,
    outlet_conc_ppm=50
)
print(f"Packed tower diameter: {packed['diameter_ft']:.1f} ft")
print(f"Packing height: {packed['packing_height_ft']:.1f} ft")
print(f"Removal efficiency: {packed['removal_efficiency_pct']:.1f}%")

# Venturi for particulates
venturi = scrubber.venturi_scrubber_sizing(
    gas_flow_acfm=30000,
    particulate_loading_gr_acf=5.0,
    target_efficiency_pct=95
)
print(f"\nVenturi pressure drop: {venturi['pressure_drop_in_wc']} in w.c.")
print(f"Liquid flow: {venturi['liquid_flow_gpm']:.0f} gpm")
```

### BACT Analysis
```python
class BACTAnalysis:
    """Best Available Control Technology analysis"""

    # Control technology database (simplified)
    CONTROL_TECHNOLOGIES = {
        'PM': [
            {'name': 'Baghouse', 'efficiency': 99.9, 'cost_per_ton': 500},
            {'name': 'ESP', 'efficiency': 99.5, 'cost_per_ton': 400},
            {'name': 'Cyclone', 'efficiency': 90, 'cost_per_ton': 100},
            {'name': 'Wet Scrubber', 'efficiency': 95, 'cost_per_ton': 600}
        ],
        'SO2': [
            {'name': 'Wet FGD', 'efficiency': 98, 'cost_per_ton': 800},
            {'name': 'Dry FGD', 'efficiency': 95, 'cost_per_ton': 600},
            {'name': 'SDA', 'efficiency': 92, 'cost_per_ton': 500}
        ],
        'NOx': [
            {'name': 'SCR', 'efficiency': 90, 'cost_per_ton': 2000},
            {'name': 'SNCR', 'efficiency': 60, 'cost_per_ton': 500},
            {'name': 'Low-NOx Burner', 'efficiency': 50, 'cost_per_ton': 200}
        ],
        'VOC': [
            {'name': 'RTO', 'efficiency': 99, 'cost_per_ton': 3000},
            {'name': 'Catalytic Oxidizer', 'efficiency': 98, 'cost_per_ton': 2500},
            {'name': 'Carbon Adsorption', 'efficiency': 95, 'cost_per_ton': 1500},
            {'name': 'Condenser', 'efficiency': 85, 'cost_per_ton': 800}
        ]
    }

    def top_down_bact(self, pollutant: str, uncontrolled_tpy: float,
                      cost_threshold: float = 15000) -> List[Dict]:
        """Perform top-down BACT analysis

        Args:
            pollutant: Pollutant type (PM, SO2, NOx, VOC)
            uncontrolled_tpy: Uncontrolled emissions (tons per year)
            cost_threshold: Maximum acceptable cost ($/ton removed)
        """
        technologies = self.CONTROL_TECHNOLOGIES.get(pollutant, [])

        # Sort by efficiency (highest first) - top-down approach
        technologies = sorted(technologies, key=lambda x: x['efficiency'], reverse=True)

        results = []
        for tech in technologies:
            tons_removed = uncontrolled_tpy * tech['efficiency'] / 100
            controlled_emissions = uncontrolled_tpy - tons_removed
            annual_cost = tech['cost_per_ton'] * tons_removed
            cost_effectiveness = tech['cost_per_ton']

            is_feasible = cost_effectiveness <= cost_threshold

            results.append({
                'technology': tech['name'],
                'efficiency_pct': tech['efficiency'],
                'controlled_emissions_tpy': controlled_emissions,
                'tons_removed_tpy': tons_removed,
                'annual_cost': annual_cost,
                'cost_effectiveness': cost_effectiveness,
                'is_cost_effective': is_feasible,
                'bact_candidate': is_feasible
            })

            if is_feasible:
                break  # First cost-effective option is BACT

        return results

    def generate_bact_report(self, pollutant: str,
                             uncontrolled_tpy: float) -> str:
        """Generate BACT determination report"""
        analysis = self.top_down_bact(pollutant, uncontrolled_tpy)

        report = f"""
BACT DETERMINATION - {pollutant}
================================
Uncontrolled Emissions: {uncontrolled_tpy:.1f} tpy

TOP-DOWN ANALYSIS:

"""
        for i, tech in enumerate(analysis, 1):
            status = "BACT SELECTED" if tech['bact_candidate'] else \
                     "Eliminated - Cost" if not tech['is_cost_effective'] else "Evaluated"

            report += f"""
Step {i}: {tech['technology']}
  Control Efficiency: {tech['efficiency_pct']}%
  Controlled Emissions: {tech['controlled_emissions_tpy']:.2f} tpy
  Cost Effectiveness: ${tech['cost_effectiveness']:,.0f}/ton
  Status: {status}
"""

        # Find BACT
        bact = next((t for t in analysis if t['bact_candidate']), None)
        if bact:
            report += f"""
BACT DETERMINATION:
  Selected Technology: {bact['technology']}
  Emission Limit: {bact['controlled_emissions_tpy']:.2f} tpy
  Control Efficiency: {bact['efficiency_pct']}%
"""

        return report

# Example usage
bact = BACTAnalysis()

report = bact.generate_bact_report('NOx', uncontrolled_tpy=100)
print(report)

# VOC BACT
voc_analysis = bact.top_down_bact('VOC', uncontrolled_tpy=50)
for tech in voc_analysis:
    print(f"{tech['technology']}: {tech['efficiency_pct']}% - "
          f"${tech['cost_effectiveness']}/ton - "
          f"{'BACT' if tech['bact_candidate'] else 'Eliminated'}")
```

## Usage Guidelines

### When to Use This Skill
- Air pollution control system design
- Permit application preparation
- BACT/LAER/MACT determinations
- Control equipment optimization
- Emission reduction projects

### Best Practices
1. **Characterize emissions thoroughly** before design
2. **Consider multiple control options** for BACT
3. **Account for variable operating conditions** in sizing
4. **Include maintenance access** in design
5. **Design for turndown** when loads vary
6. **Plan for monitoring** to verify performance

### Process Integration
- AQ-002: Air Pollution Control System Design (all phases)
- AQ-001: Air Permit Application Development (BACT determination)

## Dependencies

- numpy: Numerical calculations
- scipy: Engineering correlations

## References

- EPA Air Pollution Control Technology Fact Sheets
- OAQPS Control Cost Manual
- EPA RACT/BACT/LAER Clearinghouse
