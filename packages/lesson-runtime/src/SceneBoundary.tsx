import { Component, type ReactNode } from 'react';

// Custom content failures must not destroy the Player or its audio clock.
// The host changes this boundary's key to reset it on scene/recovery changes.
export class SceneBoundary extends Component<
  {
    children: ReactNode;
    onError: (error: Error) => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
