---
name: godot-shaders
description: Godot shading language skill for visual shaders, custom rendering, and material effects.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Godot Shaders Skill

Shader development for Godot Engine.

## Overview

This skill provides capabilities for creating shaders using Godot's shading language and visual shader system.

## Capabilities

### Shader Types
- Spatial shaders (3D)
- Canvas Item shaders (2D)
- Particles shaders
- Sky shaders

### Visual Shaders
- Node-based authoring
- Custom nodes
- Shader presets
- Export to code

### Shader Language
- GLSL-like syntax
- Built-in functions
- Uniforms and varyings
- Render modes

### Effects
- Post-processing
- Material effects
- Screen-space effects
- Procedural textures

## Prerequisites

- Godot 4.0+
- Shader knowledge

## Usage Patterns

### Spatial Shader

```glsl
shader_type spatial;

uniform vec4 albedo_color : source_color = vec4(1.0);
uniform float metallic : hint_range(0, 1) = 0.0;
uniform float roughness : hint_range(0, 1) = 0.5;

void fragment() {
    ALBEDO = albedo_color.rgb;
    METALLIC = metallic;
    ROUGHNESS = roughness;
}
```

### Canvas Item Shader

```glsl
shader_type canvas_item;

uniform float outline_width = 2.0;
uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);

void fragment() {
    vec4 color = texture(TEXTURE, UV);
    // Outline logic
    COLOR = color;
}
```

## Best Practices

1. Use visual shaders for prototyping
2. Optimize texture samples
3. Handle precision carefully
4. Profile shader complexity
5. Test on target hardware

## References

- [Godot Shaders](https://docs.godotengine.org/en/stable/tutorials/shaders/)
