import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './index.css';
import { BottomNav, Loader } from './components';
import { useTelegram } from './hooks/useTelegram';
import { useAppDispatch, useAppSelector } from './store';
import { loginWithTelegram, setTelegramUser, setAuthenticating } from './store/slices/authSlice';
import { selectCar, clearSelectedCar } from './store/slices/carsSlice';
import { setActiveTab, setTelegramReady } from './store/slices/uiSlice';
import type { Car } from './types';

// Direct imports for pages (no lazy loading for pages)
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { RentalPage } from './pages/RentalPage';
import { VerificationPage } from './pages/VerificationPage';

// DEV MODE: Set to true to bypass Telegram and use mock data
const DEV_MODE = true;

// Inner component that uses router hooks
function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, user: tgUser } = useTelegram();

  // Redux state
  const { isAuthenticating } = useAppSelector((state) => state.auth);
  const { selectedCar } = useAppSelector((state) => state.cars);
  const { isTelegramReady } = useAppSelector((state) => state.ui);

  // Sync activeTab with current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') {
      dispatch(setActiveTab('home'));
    } else if (path === '/history') {
      dispatch(setActiveTab('history'));
    } else if (path === '/profile') {
      dispatch(setActiveTab('profile'));
    }
  }, [location.pathname, dispatch]);

  // Get active tab from route
  const getActiveTab = (): 'home' | 'history' | 'profile' => {
    const path = location.pathname;
    if (path === '/history') return 'history';
    if (path === '/profile' || path === '/verification') return 'profile';
    return 'home';
  };

  // Initialize Telegram and authenticate
  useEffect(() => {
    // DEV MODE: Skip Telegram check
    if (DEV_MODE) {
      dispatch(setTelegramReady(true));
      dispatch(setTelegramUser({
        id: 123456789,
        firstName: 'Тест',
        lastName: 'Пользователь',
        username: 'testuser',
      }));
      dispatch(setAuthenticating(false));
      return;
    }

    if (!isReady) return;

    dispatch(setTelegramReady(true));

    // Set Telegram user data
    if (tgUser) {
      dispatch(setTelegramUser(tgUser));
    }

    // Authenticate with backend
    const authenticate = async () => {
      try {
        await dispatch(loginWithTelegram()).unwrap();
      } catch (err) {
        console.error('Authentication failed:', err);
      } finally {
        dispatch(setAuthenticating(false));
      }
    };

    authenticate();
  }, [isReady, tgUser, dispatch]);

  // Handle car selection
  const handleSelectCar = (car: Car) => {
    dispatch(selectCar(car));
    navigate('/rental');
  };

  // Handle navigation
  const handleNavigate = (tab: 'home' | 'history' | 'profile') => {
    dispatch(clearSelectedCar());
    switch (tab) {
      case 'home':
        navigate('/');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  // Handle rental success
  const handleRentalSuccess = () => {
    dispatch(clearSelectedCar());
    navigate('/history');
  };

  // Handle close rental/verification
  const handleClose = () => {
    dispatch(clearSelectedCar());
    navigate(-1);
  };

  // Handle navigation to verification
  const handleNavigateToVerification = () => {
    navigate('/verification');
  };

  // Handle verification success
  const handleVerificationSuccess = () => {
    navigate('/profile');
  };

  // Loading state (skip in DEV_MODE)
  if (!DEV_MODE && (!isTelegramReady || isAuthenticating)) {
    return <Loader fullScreen text="Загрузка..." />;
  }

  // Check if current route should show bottom nav
  const showBottomNav = ['/', '/home', '/history', '/profile'].includes(location.pathname);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--tg-theme-bg-color)]">
      {/* DEV MODE indicator */}
      {DEV_MODE && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-xs text-center py-1 z-50">
          🔧 DEV MODE — Telegram отключён
        </div>
      )}

      <div className={DEV_MODE ? 'h-full pt-6' : 'h-full'}>
        {showBottomNav ? (
          <>
            <main className="h-[calc(100%-3.5rem)] overflow-hidden">
              <Routes>
                <Route path="/" element={<HomePage onSelectCar={handleSelectCar} />} />
                <Route path="/home" element={<HomePage onSelectCar={handleSelectCar} />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage onNavigateToVerification={handleNavigateToVerification} />} />
              </Routes>
            </main>
            <BottomNav activeTab={getActiveTab()} onNavigate={handleNavigate} />
          </>
        ) : (
          <Routes>
            <Route
              path="/rental"
              element={
                selectedCar ? (
                  <RentalPage
                    car={selectedCar}
                    onClose={handleClose}
                    onSuccess={handleRentalSuccess}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/verification"
              element={
                <VerificationPage
                  onClose={handleClose}
                  onSuccess={handleVerificationSuccess}
                />
              }
            />
          </Routes>
        )}
      </div>
    </div>
  );
}

// Main App with Router wrapper
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
