// JSON Schema for plugin.json validation
// Manual validation implementation to avoid external dependencies

import type { Diagnostic } from './types.js';

export const A5C_PLUGIN_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://extension-mux.dev/schemas/plugin.json',
  title: 'Unified Plugin Format Manifest',
  type: 'object',
  required: ['name', 'version', 'description', 'author', 'license'],
  properties: {
    name: { type: 'string', pattern: '^[a-z0-9-]+$' },
    version: { type: 'string' },
    description: { type: 'string' },
    author: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      ],
    },
    license: { type: 'string' },
    repository: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        url: { type: 'string', format: 'uri' },
      },
    },
    homepage: { type: 'string', format: 'uri' },
    keywords: { type: 'array', items: { type: 'string' } },
    hooks: {
      type: 'object',
      additionalProperties: { type: ['string', 'boolean', 'null'] },
    },
    commands: {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'file'],
        properties: {
          name: { type: 'string' },
          file: { type: 'string' },
        },
      },
    },
    agents: {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    },
    contextFiles: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    extraFileSets: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    },
    harnessInstallSurfaceExportSets: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    targets: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          npmPackageName: { type: 'string' },
          type: { type: 'string', enum: ['typescript-build'] },
          skills: {
            oneOf: [
              { type: 'string', enum: ['derive-from-commands'] },
              { type: 'array' },
            ],
          },
          hooks: {
            type: 'object',
            additionalProperties: { type: ['string', 'null'] },
          },
          extraFileSets: {
            type: 'array',
            items: { type: 'string' },
          },
          extraFiles: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          templateVars: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          harnessInstallSurfaceExportSets: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: true,
      },
    },
    include: {
      type: 'array',
      items: { type: 'string' },
      description: 'Extra files to copy to output (glob patterns relative to source dir)',
    },
    hookConfig: {
      type: 'object',
      properties: {
        proxyAdapter: { type: 'boolean' },
        matchers: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
    sdk: { type: 'object' },
    hookFilePattern: { type: 'string' },
    postInstall: { type: 'string' },
    installSurface: { type: 'string' },
    installSurfaceExports: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function validate(data: unknown): { valid: boolean; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];

  if (!isObject(data)) {
    diagnostics.push({
      level: 'error',
      category: 'validation',
      message: 'Manifest must be a JSON object',
    });
    return { valid: false, diagnostics };
  }

  const manifest = data;

  // Required fields
  const required = ['name', 'version', 'description', 'author', 'license'];
  for (const field of required) {
    if (!(field in manifest)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: `Required field '${field}' is missing`,
      });
    }
  }

  // name: string matching pattern
  if ('name' in manifest) {
    if (!isString(manifest.name)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'name' must be a string",
      });
    } else if (!/^[a-z0-9-]+$/.test(manifest.name)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'name' must match pattern ^[a-z0-9-]+$",
      });
    }
  }

  // version, description, license: strings
  for (const field of ['version', 'description', 'license']) {
    if (field in manifest && !isString(manifest[field])) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: `Field '${field}' must be a string`,
      });
    }
  }

  // author: string or object with name
  if ('author' in manifest) {
    const author = manifest.author;
    if (!isString(author) && !isObject(author)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'author' must be a string or object",
      });
    } else if (isObject(author)) {
      if (!('name' in author) || !isString(author.name)) {
        diagnostics.push({
          level: 'error',
          category: 'validation',
          message: "Field 'author.name' is required and must be a string",
        });
      }
      if ('email' in author && !isString(author.email)) {
        diagnostics.push({
          level: 'error',
          category: 'validation',
          message: "Field 'author.email' must be a string",
        });
      }
    }
  }

  // repository: object with type and url
  if ('repository' in manifest) {
    if (!isObject(manifest.repository)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'repository' must be an object",
      });
    } else {
      const repo = manifest.repository;
      if ('type' in repo && !isString(repo.type)) {
        diagnostics.push({
          level: 'error',
          category: 'validation',
          message: "Field 'repository.type' must be a string",
        });
      }
      if ('url' in repo && !isString(repo.url)) {
        diagnostics.push({
          level: 'error',
          category: 'validation',
          message: "Field 'repository.url' must be a string",
        });
      }
    }
  }

  // hooks: object with string or null values
  if ('hooks' in manifest) {
    if (!isObject(manifest.hooks)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'hooks' must be an object",
      });
    } else {
      for (const [key, value] of Object.entries(manifest.hooks)) {
        if (!isString(value) && typeof value !== 'boolean' && value !== null) {
          diagnostics.push({
            level: 'error',
            category: 'validation',
            message: `Hook '${key}' must be a string, boolean, or null`,
          });
        }
      }
    }
  }

  // commands: string or array of strings
  if ('commands' in manifest) {
    const commands = manifest.commands;
    if (!isString(commands) && !isArray(commands)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'commands' must be a string or array",
      });
    } else if (isArray(commands)) {
      for (let i = 0; i < commands.length; i++) {
        if (!isString(commands[i])) {
          diagnostics.push({
            level: 'error',
            category: 'validation',
            message: `commands[${i}] must be a string`,
          });
        }
      }
    }
  }

  // skills: array of objects with name and file
  if ('skills' in manifest) {
    if (!isArray(manifest.skills)) {
      diagnostics.push({
        level: 'error',
        category: 'validation',
        message: "Field 'skills' must be an array",
      });
    } else {
      for (let i = 0; i < manifest.skills.length; i++) {
        const skill = manifest.skills[i];
        if (!isObject(skill)) {
          diagnostics.push({
            level: 'error',
            category: 'validation',
            message: `skills[${i}] must be an object`,
          });
        } else {
          if (!('name' in skill) || !isString(skill.name)) {
            diagnostics.push({
              level: 'error',
              category: 'validation',
              message: `skills[${i}].name is required and must be a string`,
            });
          }
          if (!('file' in skill) || !isString(skill.file)) {
            diagnostics.push({
              level: 'error',
              category: 'validation',
              message: `skills[${i}].file is required and must be a string`,
            });
          }
        }
      }
    }
  }

  // targets: object with per-target overrides
  if ('targets' in manifest && !isObject(manifest.targets)) {
    diagnostics.push({
      level: 'error',
      category: 'validation',
      message: "Field 'targets' must be an object",
    });
  }

  return {
    valid: diagnostics.filter((d) => d.level === 'error').length === 0,
    diagnostics,
  };
}
