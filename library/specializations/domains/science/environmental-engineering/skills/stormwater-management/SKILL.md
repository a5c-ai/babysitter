---
name: stormwater-management
description: Skill for integrated stormwater management and green infrastructure design with SWMM modeling, hydrologic analysis, BMP sizing, and MS4 permit compliance.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
category: Water and Wastewater Treatment
backlog-id: SK-004
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Stormwater Management Skill

Integrated stormwater management and green infrastructure design for sustainable urban drainage.

## Purpose

This skill provides comprehensive capabilities for stormwater management planning, including hydrologic analysis, green infrastructure design, BMP selection and sizing, SWMM modeling, and MS4 permit compliance analysis.

## Capabilities

### SWMM Modeling and Simulation
- EPA SWMM model setup and configuration
- Subcatchment delineation and parameterization
- Drainage network modeling
- Long-term continuous simulation
- Design storm analysis
- LID representation and modeling

### Hydrologic Analysis
- TR-55 methodology implementation
- Rational method calculations
- SCS Curve Number determination
- Time of concentration estimation
- Unit hydrograph development
- Rainfall-runoff modeling

### Green Infrastructure Sizing
- Bioretention facility design
- Permeable pavement sizing
- Rain garden design
- Green roof specifications
- Tree box filters
- Vegetated swales

### Detention/Retention Pond Design
- Storage volume calculations
- Stage-storage-discharge relationships
- Outlet structure design
- Emergency spillway sizing
- Sediment forebay design
- Maintenance access planning

### Water Quality BMP Selection
- Pollutant removal efficiency analysis
- BMP selection matrix
- Treatment train design
- Sizing for TSS removal
- Nutrient removal considerations
- Cost-effectiveness analysis

### Pollutant Load Modeling
- Event Mean Concentration (EMC) analysis
- Annual pollutant load estimation
- Source area contribution analysis
- Loading rate calculations
- Reduction target setting

### Low Impact Development Integration
- Site-level LID planning
- Watershed-scale LID analysis
- LID retrofit opportunities
- Performance monitoring design
- Adaptive management frameworks

### MS4 Permit Compliance Analysis
- NPDES requirements interpretation
- MCM implementation tracking
- TMDL compliance assessment
- Monitoring program design
- Annual report preparation

## Prerequisites

### Installation
```bash
pip install numpy scipy pandas matplotlib
```

### Optional Dependencies
```bash
# For SWMM integration
pip install swmm-api pyswmm

# For GIS analysis
pip install geopandas shapely

# For visualization
pip install plotly folium
```

## Usage Patterns

### Rational Method Calculations
```python
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Tuple

@dataclass
class CatchmentData:
    """Catchment characteristics"""
    area_acres: float
    runoff_coefficient: float
    time_of_concentration_min: float
    description: str = ""

class RationalMethod:
    """Rational method for peak runoff calculation"""

    def __init__(self):
        # IDF curve coefficients (example for generic location)
        # Q = C * I * A, where I from IDF: I = a / (Tc + b)^c
        self.idf_coefficients = {
            2: {'a': 100, 'b': 10, 'c': 0.8},
            5: {'a': 120, 'b': 10, 'c': 0.8},
            10: {'a': 140, 'b': 10, 'c': 0.8},
            25: {'a': 160, 'b': 10, 'c': 0.8},
            50: {'a': 180, 'b': 10, 'c': 0.8},
            100: {'a': 200, 'b': 10, 'c': 0.8}
        }

    def rainfall_intensity(self, tc_min: float, return_period: int) -> float:
        """Calculate rainfall intensity from IDF curve (in/hr)"""
        coef = self.idf_coefficients.get(return_period, self.idf_coefficients[10])
        intensity = coef['a'] / (tc_min + coef['b']) ** coef['c']
        return intensity

    def peak_runoff(self, catchment: CatchmentData, return_period: int) -> float:
        """Calculate peak runoff using Rational Method (cfs)"""
        C = catchment.runoff_coefficient
        I = self.rainfall_intensity(catchment.time_of_concentration_min, return_period)
        A = catchment.area_acres

        Q = C * I * A  # cfs
        return Q

    def composite_runoff_coefficient(self, subareas: List[Tuple[float, float]]) -> float:
        """Calculate composite C for mixed land uses
        subareas: list of (area, C) tuples
        """
        total_area = sum(a for a, c in subareas)
        weighted_c = sum(a * c for a, c in subareas) / total_area
        return weighted_c

    @staticmethod
    def time_of_concentration_kirpich(length_ft: float, slope_pct: float) -> float:
        """Kirpich equation for Tc (minutes)"""
        tc = 0.0078 * (length_ft ** 0.77) * (slope_pct ** -0.385)
        return tc

# Example runoff coefficients
RUNOFF_COEFFICIENTS = {
    'commercial': 0.85,
    'industrial': 0.75,
    'residential_high_density': 0.65,
    'residential_medium_density': 0.45,
    'residential_low_density': 0.35,
    'parks': 0.20,
    'forest': 0.15,
    'impervious': 0.95,
    'lawn_steep': 0.30,
    'lawn_flat': 0.20
}

# Example usage
rational = RationalMethod()

# Calculate composite C for mixed use area
subareas = [
    (5.0, RUNOFF_COEFFICIENTS['commercial']),
    (10.0, RUNOFF_COEFFICIENTS['residential_medium_density']),
    (3.0, RUNOFF_COEFFICIENTS['parks'])
]
composite_c = rational.composite_runoff_coefficient(subareas)

catchment = CatchmentData(
    area_acres=18.0,
    runoff_coefficient=composite_c,
    time_of_concentration_min=15.0,
    description="Mixed use development"
)

for rp in [2, 10, 25, 100]:
    Q = rational.peak_runoff(catchment, rp)
    print(f"{rp}-year storm: Q = {Q:.1f} cfs")
```

### SCS Curve Number Method
```python
class SCSMethod:
    """SCS Curve Number method for runoff calculation"""

    def __init__(self, curve_number: float):
        self.cn = curve_number
        self.S = (1000 / curve_number) - 10  # Potential retention (inches)
        self.Ia = 0.2 * self.S  # Initial abstraction

    def runoff_depth(self, rainfall_inches: float) -> float:
        """Calculate runoff depth (inches)"""
        P = rainfall_inches
        if P <= self.Ia:
            return 0.0

        Q = (P - self.Ia) ** 2 / (P - self.Ia + self.S)
        return Q

    def runoff_volume(self, rainfall_inches: float, area_acres: float) -> float:
        """Calculate runoff volume (acre-feet)"""
        Q_inches = self.runoff_depth(rainfall_inches)
        volume_ac_ft = Q_inches / 12 * area_acres
        return volume_ac_ft

    @staticmethod
    def composite_cn(subareas: List[Tuple[float, float]]) -> float:
        """Calculate area-weighted composite CN
        subareas: list of (area, CN) tuples
        """
        total_area = sum(a for a, cn in subareas)
        weighted_cn = sum(a * cn for a, cn in subareas) / total_area
        return weighted_cn

    @staticmethod
    def adjust_cn_for_amc(cn_ii: float, condition: str) -> float:
        """Adjust CN for antecedent moisture condition
        condition: 'dry' (AMC-I), 'normal' (AMC-II), or 'wet' (AMC-III)
        """
        if condition == 'dry':
            cn = cn_ii / (2.281 - 0.01281 * cn_ii)
        elif condition == 'wet':
            cn = cn_ii / (0.427 + 0.00573 * cn_ii)
        else:
            cn = cn_ii
        return cn

# Standard curve numbers (AMC-II, Hydrologic Soil Group B)
CURVE_NUMBERS = {
    'impervious': 98,
    'commercial': 92,
    'industrial': 88,
    'residential_1_8_acre': 85,
    'residential_1_4_acre': 80,
    'residential_1_2_acre': 75,
    'residential_1_acre': 68,
    'open_space_good': 61,
    'open_space_fair': 69,
    'forest_good': 55,
    'pasture_good': 61
}

# Example usage
# Pre-development condition
pre_cn = SCSMethod.composite_cn([
    (20, CURVE_NUMBERS['forest_good']),
    (80, CURVE_NUMBERS['pasture_good'])
])
pre_scs = SCSMethod(pre_cn)

# Post-development condition
post_cn = SCSMethod.composite_cn([
    (30, CURVE_NUMBERS['impervious']),
    (40, CURVE_NUMBERS['residential_1_4_acre']),
    (30, CURVE_NUMBERS['open_space_good'])
])
post_scs = SCSMethod(post_cn)

rainfall = 3.5  # inches (design storm)
pre_runoff = pre_scs.runoff_volume(rainfall, area_acres=100)
post_runoff = post_scs.runoff_volume(rainfall, area_acres=100)

print(f"Pre-development CN: {pre_cn:.0f}")
print(f"Post-development CN: {post_cn:.0f}")
print(f"Pre-development runoff: {pre_runoff:.2f} acre-feet")
print(f"Post-development runoff: {post_runoff:.2f} acre-feet")
print(f"Required detention: {post_runoff - pre_runoff:.2f} acre-feet")
```

### Bioretention Sizing
```python
class BioretentionDesign:
    """Bioretention facility design"""

    def __init__(self, infiltration_rate_in_hr: float = 1.0):
        self.infiltration_rate = infiltration_rate_in_hr

    def size_for_water_quality(self, drainage_area_sf: float,
                                impervious_fraction: float,
                                design_rainfall_in: float = 1.0) -> Dict:
        """Size bioretention for water quality treatment"""
        # Calculate water quality volume (WQv)
        # Using simplified volumetric approach
        Rv = 0.05 + 0.009 * (impervious_fraction * 100)  # Runoff coefficient
        wqv_cf = Rv * design_rainfall_in / 12 * drainage_area_sf

        # Bioretention area sizing
        # Based on 6" ponding depth and filter media depth
        ponding_depth_ft = 0.5  # 6 inches
        drain_time_hr = 24  # Maximum drain time

        # Area based on infiltration during storm
        storm_duration_hr = 2  # Assume 2-hour storm
        infiltrated_depth = self.infiltration_rate * storm_duration_hr / 12  # feet

        # Minimum surface area
        min_area_sf = wqv_cf / (ponding_depth_ft + infiltrated_depth)

        # Typical sizing: 5-10% of impervious area
        recommended_area_sf = drainage_area_sf * impervious_fraction * 0.05

        return {
            'water_quality_volume_cf': wqv_cf,
            'minimum_surface_area_sf': min_area_sf,
            'recommended_area_sf': max(min_area_sf, recommended_area_sf),
            'ponding_depth_in': 6,
            'filter_media_depth_in': 24,
            'drain_time_hr': ponding_depth_ft * 12 / self.infiltration_rate
        }

    def design_details(self, surface_area_sf: float) -> Dict:
        """Generate design details for bioretention"""
        return {
            'surface_area_sf': surface_area_sf,
            'filter_media': {
                'depth_in': 24,
                'composition': '50% sand, 30% comite, 20% mulch (top)',
                'permeability_in_hr': self.infiltration_rate
            },
            'underdrain': {
                'diameter_in': 4,
                'material': 'Perforated PVC',
                'slope_pct': 0.5,
                'gravel_depth_in': 12
            },
            'overflow': {
                'type': 'Standpipe or weir',
                'elevation': '6 inches above media surface'
            },
            'plants': {
                'density': '1 per 3 sq ft',
                'recommended': ['Switchgrass', 'Black-eyed Susan', 'Sedges']
            },
            'maintenance': {
                'mulch_replacement': 'Annual',
                'vegetation_maintenance': 'Biannual',
                'sediment_removal': 'As needed, typically 5-year'
            }
        }

# Example usage
bio = BioretentionDesign(infiltration_rate_in_hr=1.5)

sizing = bio.size_for_water_quality(
    drainage_area_sf=43560,  # 1 acre
    impervious_fraction=0.6,
    design_rainfall_in=1.0
)

print(f"Water quality volume: {sizing['water_quality_volume_cf']:.0f} cf")
print(f"Recommended area: {sizing['recommended_area_sf']:.0f} sf")
print(f"Drain time: {sizing['drain_time_hr']:.1f} hours")

details = bio.design_details(sizing['recommended_area_sf'])
print(f"\nFilter media depth: {details['filter_media']['depth_in']} inches")
```

### Pollutant Load Analysis
```python
class PollutantLoading:
    """Stormwater pollutant load estimation"""

    # Event Mean Concentrations (mg/L) by land use
    EMC = {
        'residential': {'TSS': 101, 'TP': 0.38, 'TN': 2.5, 'Zn': 0.14},
        'commercial': {'TSS': 69, 'TP': 0.22, 'TN': 2.2, 'Zn': 0.22},
        'industrial': {'TSS': 85, 'TP': 0.26, 'TN': 2.0, 'Zn': 0.32},
        'highway': {'TSS': 142, 'TP': 0.34, 'TN': 3.2, 'Zn': 0.35},
        'open_space': {'TSS': 40, 'TP': 0.10, 'TN': 1.0, 'Zn': 0.05}
    }

    # BMP removal efficiencies (%)
    BMP_REMOVAL = {
        'bioretention': {'TSS': 85, 'TP': 60, 'TN': 50, 'Zn': 80},
        'wet_pond': {'TSS': 80, 'TP': 50, 'TN': 30, 'Zn': 60},
        'dry_pond': {'TSS': 60, 'TP': 20, 'TN': 15, 'Zn': 30},
        'grass_swale': {'TSS': 70, 'TP': 25, 'TN': 20, 'Zn': 40},
        'perm_pavement': {'TSS': 85, 'TP': 60, 'TN': 50, 'Zn': 70},
        'sand_filter': {'TSS': 85, 'TP': 50, 'TN': 35, 'Zn': 80}
    }

    def annual_load(self, area_acres: float, land_use: str,
                    annual_runoff_in: float, pollutant: str) -> float:
        """Calculate annual pollutant load (lbs/year)"""
        emc = self.EMC.get(land_use, self.EMC['residential']).get(pollutant, 0)

        # Load = EMC * Volume
        # Volume (L) = runoff (in) * area (acres) * 43560 sf/ac * 0.0254 m/in * 1000 L/m3
        volume_l = annual_runoff_in * 0.0254 * area_acres * 43560 * 0.0929 * 1000

        # Load in mg, convert to lbs
        load_mg = emc * volume_l
        load_lbs = load_mg / 453592

        return load_lbs

    def load_reduction(self, load_lbs: float, bmp_type: str,
                       pollutant: str) -> Dict:
        """Calculate load reduction from BMP"""
        efficiency = self.BMP_REMOVAL.get(bmp_type, {}).get(pollutant, 0) / 100
        removed = load_lbs * efficiency
        remaining = load_lbs - removed

        return {
            'initial_load_lbs': load_lbs,
            'removal_efficiency_pct': efficiency * 100,
            'load_removed_lbs': removed,
            'remaining_load_lbs': remaining
        }

# Example usage
loading = PollutantLoading()

# Calculate loads for a 50-acre commercial development
area = 50  # acres
annual_runoff = 30  # inches
land_use = 'commercial'

for pollutant in ['TSS', 'TP', 'TN']:
    load = loading.annual_load(area, land_use, annual_runoff, pollutant)
    reduction = loading.load_reduction(load, 'bioretention', pollutant)
    print(f"{pollutant}: {load:.1f} lbs/yr -> {reduction['remaining_load_lbs']:.1f} lbs/yr "
          f"({reduction['removal_efficiency_pct']:.0f}% removal)")
```

## Usage Guidelines

### When to Use This Skill
- Stormwater management plan development
- Green infrastructure design
- BMP selection and sizing
- MS4 permit compliance analysis
- Watershed planning and TMDL implementation

### Best Practices
1. **Match design storm** to local requirements
2. **Consider treatment train approaches** for multiple benefits
3. **Plan for maintenance access** in design
4. **Verify infiltration rates** with field testing
5. **Include pre-treatment** for high pollutant areas
6. **Monitor performance** for adaptive management

### Process Integration
- WW-004: Stormwater Management Planning (all phases)

## Dependencies

- numpy, scipy: Numerical calculations
- pandas: Data analysis
- pyswmm: SWMM model interaction (optional)

## References

- EPA SWMM Reference Manual
- ASCE Manual of Practice No. 77
- State-specific stormwater design manuals
- NCHRP Report 565 BMP Selection
