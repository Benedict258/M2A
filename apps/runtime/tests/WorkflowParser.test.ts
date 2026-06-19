import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowParser } from '../src/engine/WorkflowParser.js';
import type { AgentRunner } from '../src/engine/AgentRunner.js';
import type { WorkflowDefinition } from '@m2a/sdk';

const mockRunStep = vi.fn();
const mockAgentRunner = { runStep: mockRunStep } as unknown as AgentRunner;
const defaultUserContext = { userId: 'user1', delegateKey: 'dk1', accountId: 'acct1' };

function agentNode(id: string, deps?: string[]) {
  return {
    id,
    type: 'agent' as const,
    label: id,
    position: { x: 0, y: 0 },
    dependencies: deps,
    role: 'You are a helpful assistant.',
    model: 'gemini-1.5-flash',
    tools: [],
    memory_tier: { read: [], write: [] },
  };
}

function nonAgentNode(id: string, type: 'input' | 'output', deps?: string[]) {
  return type === 'input'
    ? { id, type: 'input' as const, label: id, position: { x: 0, y: 0 }, dependencies: deps, schema: { value: 'string' as const } }
    : { id, type: 'output' as const, label: id, position: { x: 0, y: 0 }, dependencies: deps };
}

describe('WorkflowParser', () => {
  let parser: WorkflowParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new WorkflowParser(mockAgentRunner);
  });

  it('executes a simple linear workflow and passes outputs between nodes', async () => {
    mockRunStep
      .mockResolvedValueOnce('output-a')
      .mockResolvedValueOnce('output-b')
      .mockResolvedValueOnce('output-c');

    const workflow: WorkflowDefinition = {
      id: 'test-linear',
      name: 'Linear Workflow',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        agentNode('node-a'),
        agentNode('node-b', ['node-a']),
        agentNode('node-c', ['node-b']),
      ],
      edges: [],
    };

    const result = await parser.execute(workflow, 'initial input', defaultUserContext);

    expect(result.status).toBe('completed');
    expect(result.outputs['node-a']).toBe('output-a');
    expect(result.outputs['node-b']).toBe('output-b');
    expect(result.outputs['node-c']).toBe('output-c');
    expect(mockRunStep).toHaveBeenCalledTimes(3);
    expect(mockRunStep.mock.calls[0][0].id).toBe('node-a');
    expect(mockRunStep.mock.calls[1][0].id).toBe('node-b');
    expect(mockRunStep.mock.calls[2][0].id).toBe('node-c');
  });

  it('throws a deadlock error on circular dependencies', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-deadlock',
      name: 'Circular Workflow',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        agentNode('node-a', ['node-b']),
        agentNode('node-b', ['node-a']),
      ],
      edges: [],
    };

    await expect(parser.execute(workflow, 'hello', defaultUserContext)).rejects.toThrow(/Deadlock detected/);
  });

  it('executes independent nodes in parallel', async () => {
    let parallelWindow = false;
    let aInParallel = false;
    let bInParallel = false;

    mockRunStep.mockImplementation(async (node: { id: string }) => {
      if (node.id === 'node-a') {
        parallelWindow = true;
        await new Promise(r => setTimeout(r, 30));
        aInParallel = parallelWindow;
        parallelWindow = false;
        return 'a-result';
      }
      if (node.id === 'node-b') {
        await new Promise(r => setTimeout(r, 10));
        bInParallel = parallelWindow;
        return 'b-result';
      }
      if (node.id === 'node-c') {
        return `c: ${node.id}`;
      }
      return '';
    });

    const workflow: WorkflowDefinition = {
      id: 'test-parallel',
      name: 'Parallel Workflow',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        agentNode('node-a'),
        agentNode('node-b'),
        agentNode('node-c', ['node-a', 'node-b']),
      ],
      edges: [],
    };

    const result = await parser.execute(workflow, 'hello', defaultUserContext);

    expect(result.status).toBe('completed');
    expect(aInParallel).toBe(true);
    expect(bInParallel).toBe(true);
    expect(mockRunStep).toHaveBeenCalledTimes(3);
  });

  it('retries a failing node 3 times and continues workflow', async () => {
    mockRunStep
      .mockResolvedValueOnce('ok')
      .mockRejectedValue(new Error('Node failure'));

    const workflow: WorkflowDefinition = {
      id: 'test-retry',
      name: 'Retry Workflow',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        agentNode('node-good'),
        agentNode('node-bad'),
      ],
      edges: [],
    };

    const result = await parser.execute(workflow, 'hello', defaultUserContext);

    expect(result.status).toBe('completed');
    expect(mockRunStep).toHaveBeenCalledTimes(4); // node-good once, node-bad 3 times
    expect(result.outputs['node-good']).toBe('ok');
  });

  it('recovers from a transient failure on retry', async () => {
    let flakyCalls = 0;
    mockRunStep.mockImplementation(async (node: { id: string }) => {
      if (node.id === 'node-flaky') {
        flakyCalls++;
        if (flakyCalls < 2) throw new Error('Transient error');
        return 'flaky-success';
      }
      return 'ok';
    });

    const workflow: WorkflowDefinition = {
      id: 'test-flaky',
      name: 'Flaky Workflow',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        agentNode('node-flaky'),
        agentNode('node-after', ['node-flaky']),
      ],
      edges: [],
    };

    const result = await parser.execute(workflow, 'hello', defaultUserContext);

    expect(result.status).toBe('completed');
    expect(result.outputs['node-flaky']).toBe('flaky-success');
    expect(result.outputs['node-after']).toBe('ok');
    expect(flakyCalls).toBe(2);
  });

  it('skips non-agent nodes without calling the runner', async () => {
    mockRunStep.mockResolvedValue('should-not-be-called');

    const workflow: WorkflowDefinition = {
      id: 'test-nonagent',
      name: 'Non-Agent Nodes',
      version: '1.0.0',
      namespace_prefix: 'test',
      nodes: [
        nonAgentNode('input-node', 'input'),
        agentNode('agent-node', ['input-node']),
        nonAgentNode('output-node', 'output', ['agent-node']),
      ],
      edges: [],
    };

    const result = await parser.execute(workflow, 'start', defaultUserContext);

    expect(result.status).toBe('completed');
    expect(mockRunStep).toHaveBeenCalledTimes(1);
    expect(mockRunStep).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'agent-node' }),
      expect.any(String),
      expect.any(Object),
    );
  });
});
