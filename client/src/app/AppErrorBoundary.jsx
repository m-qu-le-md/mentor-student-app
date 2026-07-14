import { Component } from 'react';

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('Project 001 route error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="page"><section className="status-panel"><div><h2>Màn hình này gặp lỗi</h2><p>Dữ liệu của bạn không bị thay đổi. Hãy tải lại ứng dụng để thử lại.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại StudyMed</button></div></section></main>;
  }
}
