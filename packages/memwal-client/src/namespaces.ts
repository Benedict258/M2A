export interface UserContext {
  userId: string;
  runId?: string;
}

/**
 * Standardized namespace builders.
 * Never build namespace strings ad-hoc. Always go through here.
 */
export const ns = {
  pool: (domain: string) => `pool::${domain}`,

  private: (userId: string, path: string) => `private::${userId}::${path}`,

  session: (userId: string, runId: string) => `private::${userId}::session::${runId}`,

  workspace: (teamId: string, project: string) => `workspace::${teamId}::${project}`,

  /**
   * Resolves a dynamic namespace template based on the user's current context.
   */
  resolve: (namespaceStr: string, ctx: UserContext) => {
    // Basic template resolution
    return namespaceStr
      .replace('{userId}', ctx.userId)
      .replace('{runId}', ctx.runId || 'default_run');
  }
};
