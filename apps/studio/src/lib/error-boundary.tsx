import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-danger/20 bg-danger/5 p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-danger" />
            <p className="text-sm text-danger">{this.state.error?.message || 'Something went wrong'}</p>
            <button onClick={() => this.setState({ hasError: false })} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
