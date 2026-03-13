---
name: unity-urp
description: Universal Render Pipeline configuration skill for Unity, including custom shaders, lighting setup, post-processing effects, and render feature development.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity URP Skill

Comprehensive Universal Render Pipeline configuration and customization for Unity projects.

## Overview

This skill provides capabilities for configuring and extending Unity's Universal Render Pipeline, including shader development, lighting configuration, post-processing setup, and custom render feature implementation.

## Capabilities

### Pipeline Configuration
- Configure URP Asset settings for quality tiers
- Set up renderer features and passes
- Configure global rendering settings
- Manage pipeline asset variants

### Shader Development
- Create URP-compatible shaders using Shader Graph
- Write custom HLSL shaders for URP
- Implement shader variants and keywords
- Optimize shaders for target platforms

### Lighting Setup
- Configure real-time and baked lighting
- Set up reflection probes and light probes
- Implement screen space ambient occlusion
- Configure shadows and cascades

### Post-Processing
- Set up post-processing volume profiles
- Configure bloom, color grading, vignette
- Implement custom post-processing effects
- Manage volume blending and priorities

### Render Features
- Create custom render features
- Implement scriptable render passes
- Handle render targets and buffers
- Integrate with existing pipeline

## Prerequisites

- Unity 2021.3+ with URP package
- URP package installed via Package Manager
- Basic understanding of rendering concepts

## Usage Patterns

### Creating a URP Shader Graph

```
1. Create new Shader Graph (Create > Shader Graph > URP > Lit Shader Graph)
2. Configure surface options (opaque/transparent)
3. Add nodes for desired effect
4. Connect to master stack outputs
5. Save and apply to material
```

### Custom Render Feature

```csharp
public class OutlineRenderFeature : ScriptableRendererFeature
{
    [System.Serializable]
    public class Settings
    {
        public RenderPassEvent renderPassEvent = RenderPassEvent.AfterRenderingOpaques;
        public Material outlineMaterial;
    }

    public Settings settings = new Settings();
    private OutlineRenderPass renderPass;

    public override void Create()
    {
        renderPass = new OutlineRenderPass(settings);
    }

    public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
    {
        renderer.EnqueuePass(renderPass);
    }
}
```

## Integration with Babysitter SDK

```javascript
const urpSetupTask = defineTask({
  name: 'urp-configuration',
  description: 'Configure URP settings',

  inputs: {
    qualityTier: { type: 'string', required: true },
    features: { type: 'array', required: true }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Configure URP pipeline',
      skill: {
        name: 'unity-urp',
        context: {
          operation: 'configure_pipeline',
          qualityTier: inputs.qualityTier,
          features: inputs.features
        }
      }
    };
  }
});
```

## Best Practices

1. Create quality tier variants for different platforms
2. Use Shader Graph for maintainable shaders
3. Profile render passes for performance
4. Use SRP Batcher compatible shaders
5. Minimize overdraw and fill rate

## References

- [URP Documentation](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest)
- [Shader Graph Manual](https://docs.unity3d.com/Packages/com.unity.shadergraph@latest)
