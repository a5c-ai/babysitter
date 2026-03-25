---
name: motor-control
description: Motor control algorithms and driver implementation
category: Application-Specific
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Motor Control Skill

## Overview

This skill provides motor control algorithm implementation and driver development expertise for embedded systems controlling DC, BLDC, stepper, and AC induction motors.

## Capabilities

### PWM Generation
- Center-aligned PWM configuration
- Dead-time insertion
- Complementary output setup
- PWM frequency selection
- Duty cycle modulation
- SVPWM (Space Vector PWM)

### Control Algorithms
- FOC (Field-Oriented Control)
- Scalar V/f control
- Six-step commutation
- Sinusoidal commutation
- DTC (Direct Torque Control)
- Model predictive control

### Position/Speed Feedback
- Encoder interface (quadrature)
- Hall sensor configuration
- Resolver interface
- Sensorless algorithms
- Back-EMF zero-crossing
- Observer-based estimation

### Current Sensing
- Shunt resistor configuration
- Current amplifier setup
- ADC synchronization with PWM
- Oversampling strategies
- DC offset compensation
- Phase reconstruction

### Control Loops
- Current loop (torque control)
- Speed loop (velocity control)
- Position loop (servo control)
- Anti-windup strategies
- Feed-forward compensation
- Gain tuning methods

### Motor Identification
- Parameter measurement
- Auto-tuning procedures
- Resistance/inductance measurement
- Back-EMF constant
- Inertia estimation

### Protection Features
- Overcurrent protection
- Overvoltage protection
- Overtemperature monitoring
- Stall detection
- Safe torque off (STO)

## Target Processes

- `device-driver-development.js` - Motor driver implementation
- `real-time-architecture-design.js` - Real-time control design
- `isr-design.js` - Control loop ISR design

## Dependencies

- Motor control libraries (ST MC SDK, TI MotorWare)
- DSP libraries for fixed-point math
- Encoder/Hall sensor hardware

## Usage Context

This skill is invoked when tasks require:
- Motor driver development
- FOC algorithm implementation
- Position/speed control
- Motor parameter tuning
- Protection circuit design

## Motor Types Supported

| Type | Control Method | Feedback |
|------|---------------|----------|
| Brushed DC | PWM duty cycle | Encoder optional |
| BLDC | Six-step, FOC | Hall, encoder, sensorless |
| PMSM | FOC | Encoder, resolver, sensorless |
| Stepper | Step/direction, microstepping | Open-loop, encoder |
| AC Induction | V/f, FOC | Encoder, sensorless |

## FOC Implementation Example

```c
typedef struct {
    float i_alpha, i_beta;    // Clarke transform output
    float i_d, i_q;           // Park transform output
    float v_d, v_q;           // Voltage commands
    float v_alpha, v_beta;    // Inverse Park output
    float theta;              // Rotor angle
    float speed;              // Rotor speed
} foc_state_t;

void foc_current_loop(foc_state_t* state, float i_a, float i_b, float i_c) {
    // Clarke transform
    clarke_transform(i_a, i_b, i_c, &state->i_alpha, &state->i_beta);

    // Park transform
    park_transform(state->i_alpha, state->i_beta, state->theta,
                   &state->i_d, &state->i_q);

    // PI controllers
    state->v_d = pi_controller(&pid_d, state->i_d_ref - state->i_d);
    state->v_q = pi_controller(&pid_q, state->i_q_ref - state->i_q);

    // Inverse Park
    inv_park_transform(state->v_d, state->v_q, state->theta,
                       &state->v_alpha, &state->v_beta);

    // SVPWM
    svpwm_generate(state->v_alpha, state->v_beta, pwm_duties);
}
```

## Configuration

```yaml
motor_control:
  motor_type: bldc | pmsm | stepper | induction
  control_method: foc | six_step | vf | step_dir
  pwm_frequency: 20000  # Hz
  current_loop_rate: 20000  # Hz
  speed_loop_rate: 1000  # Hz
  feedback: encoder | hall | sensorless
```
