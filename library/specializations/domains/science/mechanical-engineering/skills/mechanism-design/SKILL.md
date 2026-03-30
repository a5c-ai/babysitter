---
name: mechanism-design
description: Skill for mechanism kinematics, dynamics, and motion analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: mechanical-systems
  priority: medium
  phase: 8
  tools-libraries:
    - MSC ADAMS
    - RecurDyn
    - SolidWorks Motion
    - MATLAB
---

# Mechanism Design Skill

## Purpose

The Mechanism Design skill provides capabilities for mechanism kinematics, dynamics, and motion analysis, enabling systematic design and optimization of mechanical motion systems.

## Capabilities

- Linkage synthesis and analysis
- Cam profile design
- Gear train design and analysis
- Kinematic simulation
- Dynamic force analysis
- Motion optimization
- ADAMS/RecurDyn integration
- Mechanism specification documentation

## Usage Guidelines

### Kinematic Analysis

#### Degrees of Freedom

```
Gruebler's Equation (planar):
DOF = 3(n-1) - 2j1 - j2

Where:
n = number of links (including ground)
j1 = number of full joints (pin, slider)
j2 = number of half joints (cam, gear)

DOF = 1: Constrained mechanism
DOF = 0: Structure
DOF < 0: Over-constrained
```

#### Common Mechanisms

| Mechanism | Links | Joints | DOF | Application |
|-----------|-------|--------|-----|-------------|
| Four-bar | 4 | 4 pins | 1 | Motion generation |
| Slider-crank | 4 | 3 pins + 1 slider | 1 | Reciprocating motion |
| Scotch yoke | 4 | 2 pins + 2 sliders | 1 | Exact sinusoidal |
| Quick return | 4 | 3 pins + 1 slider | 1 | Unequal stroke times |
| Geneva | 2 | Cam joint | Intermittent | Indexing |

### Linkage Design

#### Four-Bar Linkage Types

```
Grashof criterion:
s + l <= p + q

Where:
s = shortest link
l = longest link
p, q = intermediate links

If satisfied: At least one link can rotate fully

Types:
- Crank-rocker: Shortest link is crank
- Double-crank: Shortest link is ground
- Double-rocker: No full rotation
```

#### Position Analysis

```
Loop closure equation:
r2*e^(i*theta2) + r3*e^(i*theta3) - r4*e^(i*theta4) - r1 = 0

Solve for theta3, theta4 given theta2 (input)

Velocity:
omega3 = omega2 * r2 * sin(theta4-theta2) / (r3 * sin(theta4-theta3))
```

#### Transmission Angle

```
mu = angle between coupler and output link

Ideal: mu = 90 degrees
Acceptable: 40 < mu < 140 degrees
Poor: mu < 30 or mu > 150 degrees
```

### Cam Design

#### Cam Profile Types

| Type | Motion | Application |
|------|--------|-------------|
| Plate cam | Translating or oscillating follower | High speed |
| Cylindrical cam | Oscillating follower | Indexing |
| Face cam | Translating follower | Compact |
| Globoidal cam | Oscillating follower | High accuracy |

#### Motion Profiles

```
Common profiles:

1. Parabolic (constant acceleration)
   s = (1/2) * a * t^2 for first half
   Good: Simple, smooth
   Bad: Infinite jerk at transition

2. Simple harmonic
   s = (h/2) * (1 - cos(pi*t/T))
   Good: Zero velocity at ends
   Bad: Finite acceleration at ends

3. Cycloidal
   s = h * (t/T - sin(2*pi*t/T)/(2*pi))
   Good: Zero acceleration at ends
   Bad: Higher peak acceleration

4. Modified trapezoid
   Combines constant acceleration with transitions
   Good: Low peak acceleration
   Bad: More complex
```

#### Pressure Angle

```
tan(alpha) = (dy/dtheta) / (rb + y)

Where:
alpha = pressure angle
dy/dtheta = slope of displacement curve
rb = base circle radius
y = follower displacement

Limit: alpha < 30 degrees (typically)
```

### Gear Train Design

#### Gear Types

| Type | Application | Efficiency |
|------|-------------|------------|
| Spur | Parallel shafts | 98-99% |
| Helical | Parallel shafts, quieter | 97-99% |
| Bevel | Intersecting shafts | 97-98% |
| Worm | High ratio, non-reversing | 50-90% |
| Planetary | Compact, high ratio | 97-98% |

#### Gear Ratios

```
Simple gear train:
i = N2/N1 = omega1/omega2

Compound gear train:
i_total = product of individual ratios

Planetary gear train:
i = 1 + Nring/Nsun (sun fixed)
i = 1/(1 + Nsun/Nring) (ring fixed)
```

#### Gear Geometry

```
Module: m = d/N
Pitch: p = pi * m
Addendum: a = m
Dedendum: b = 1.25 * m
Center distance: C = m * (N1 + N2) / 2

Contact ratio:
CR = (Arc of action) / (Circular pitch)
Minimum CR > 1.2 recommended
```

### Dynamic Analysis

#### Force Analysis

```
Newton-Euler method:
Sum F = m * a_g (for each link)
Sum M_g = I_g * alpha (about mass center)

D'Alembert approach:
Add inertia forces: -m*a, -I*alpha
Solve as static equilibrium
```

#### Shaking Forces and Moments

```
Shaking force = -Sum(m_i * a_i)
Shaking moment = -Sum(I_i * alpha_i + r_i x m_i * a_i)

Balancing strategies:
1. Add counterweights
2. Optimize mass distribution
3. Use multiple cylinders (phase)
```

## Process Integration

- Cross-cutting for mechanical system design processes

## Input Schema

```json
{
  "mechanism_type": "linkage|cam|gear|custom",
  "motion_requirements": {
    "input_motion": "rotation|translation",
    "output_motion": "rotation|translation",
    "motion_profile": "string or array",
    "speed": "number (RPM or m/s)"
  },
  "constraints": {
    "space_envelope": "object",
    "force_requirements": "number",
    "accuracy": "number"
  },
  "operating_conditions": {
    "load": "number",
    "speed_range": "array [min, max]",
    "duty_cycle": "string"
  }
}
```

## Output Schema

```json
{
  "mechanism_design": {
    "type": "string",
    "configuration": "object",
    "link_dimensions": "array"
  },
  "kinematic_results": {
    "position_analysis": "array or function",
    "velocity_analysis": "array or function",
    "acceleration_analysis": "array or function",
    "transmission_angle": "number"
  },
  "dynamic_results": {
    "forces": "array",
    "torques": "array",
    "shaking_forces": "object"
  },
  "performance_metrics": {
    "pressure_angle": "number (cams)",
    "contact_ratio": "number (gears)",
    "efficiency": "number"
  },
  "design_documentation": "reference"
}
```

## Best Practices

1. Start with kinematic requirements
2. Check Grashof criterion for linkages
3. Limit pressure angles in cams
4. Verify adequate contact ratio for gears
5. Analyze dynamics at operating speed
6. Consider balancing for high-speed mechanisms

## Integration Points

- Connects with CAD Modeling for geometry
- Feeds into FEA Structural for stress analysis
- Supports Test Planning for validation
- Integrates with Vibration Analysis for dynamics
