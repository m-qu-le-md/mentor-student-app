import { AppRouter } from './app/AppRouter';
import { AppErrorBoundary } from './app/AppErrorBoundary';

export default function App() {
  return <AppErrorBoundary><AppRouter /></AppErrorBoundary>;
}
