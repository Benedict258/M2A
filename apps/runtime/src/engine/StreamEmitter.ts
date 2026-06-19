import { Response } from 'express';

export interface ExecutionEvent {
  nodeId: string;
  stage: 'started' | 'recalling_memory' | 'agent_running' | 'saving_artifacts' | 'completed' | 'failed';
  timestamp: number;
  message?: string;
}

/**
 * Facilitates streaming real-time status feedback updates directly into browser
 * active event streams to paint step-by-step visual highlights in the IDE.
 */
export class StreamEmitter {
  private clientResponse?: Response;

  constructor(res?: Response) {
    this.clientResponse = res;
    if (res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }
  }

  /**
   * Pushes events through connection.
   */
  emit(event: ExecutionEvent) {
    console.log(`[SSE Update] Node: ${event.nodeId} - Stage: ${event.stage}`);
    if (this.clientResponse) {
      this.clientResponse.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  }

  /**
   * Safely terminates SSE channel.
   */
  end() {
    if (this.clientResponse) {
      this.clientResponse.end();
    }
  }
}
