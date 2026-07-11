import { useMediaQuery } from 'react-responsive';
import DesktopLayout from './pages/desktop/DesktopLayout';
import MobileLayout from './pages/mobile/MobileLayout';

function App() {
  const isDesktop = useMediaQuery({ minWidth: 768 });

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}

export default App;