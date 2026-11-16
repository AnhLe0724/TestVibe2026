import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  onResetSeed: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info);
  }

  private handleReset = (): void => {
    this.props.onResetSeed();
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="error-boundary" role="alert">
          <h1>Đã xảy ra lỗi ngoài ý muốn</h1>
          <p>Ứng dụng gặp sự cố hiển thị. Bạn có thể nạp lại dữ liệu mẫu để tiếp tục sử dụng.</p>
          <div className="error-boundary-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleReset}>
              Nạp dữ liệu mẫu
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
