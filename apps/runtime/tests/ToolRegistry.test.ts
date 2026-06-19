import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry, type M2ATool } from '../src/engine/tools/ToolRegistry.js';

function makeTool(name: string, overrides: Partial<M2ATool> = {}): M2ATool {
  return {
    name,
    description: `Tool: ${name}`,
    parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] },
    execute: async () => `${name}-result`,
    ...overrides,
  };
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('registers and retrieves a tool by name', () => {
    const tool = makeTool('test-tool');
    registry.registerTool(tool);

    const retrieved = registry.getTool('test-tool');
    expect(retrieved).toBe(tool);
    expect(retrieved!.name).toBe('test-tool');
  });

  it('returns undefined for unknown tools', () => {
    expect(registry.getTool('nonexistent')).toBeUndefined();
  });

  it('returns all registered tools', () => {
    const toolA = makeTool('tool-a');
    const toolB = makeTool('tool-b');
    registry.registerTool(toolA);
    registry.registerTool(toolB);

    const all = registry.getAllTools();
    expect(all).toHaveLength(2);
    expect(all).toContain(toolA);
    expect(all).toContain(toolB);
  });

  it('overwrites a tool when registering with the same name', () => {
    const tool1 = makeTool('duplicate', { description: 'first' });
    const tool2 = makeTool('duplicate', { description: 'second' });
    registry.registerTool(tool1);
    registry.registerTool(tool2);

    expect(registry.getTool('duplicate')).toBe(tool2);
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('returns tool definitions in the correct format', () => {
    const tool = makeTool('def-tool', {
      description: 'A definition tool',
      parameters: { type: 'object', properties: { x: { type: 'number' } }, required: ['x'] },
    });
    registry.registerTool(tool);

    const defs = registry.getToolDefinitions();
    expect(defs).toHaveLength(1);
    expect(defs[0]).toEqual({
      name: 'def-tool',
      description: 'A definition tool',
      parameters: { type: 'object', properties: { x: { type: 'number' } }, required: ['x'] },
    });
  });
});
