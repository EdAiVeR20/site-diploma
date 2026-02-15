import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './index.css';
import { Loader, SideDrawer } from './components';
import { useTelegram } from './hooks/useTelegram';
import { useAppDispatch, useAppSelector } from './store';
import { loginWithTelegram, setTelegramUser, setAuthenticating } from './store/slices/authSlice';
import { selectCar, clearSelectedCar } from './store/slices/carsSlice';
import { setActiveTab, setTelegramReady } from './store/slices/uiSlice';
import type { Car } from './types';

// Pages
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { RentalPage } from './pages/RentalPage';
import { VerificationPage } from './pages/VerificationPage';

// DEV MODE: Set to true to bypass Telegram and use mock data
const DEV_MODE = false;

function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, user: tgUser } = useTelegram();

  // Redux state
  const { isAuthenticating } = useAppSelector((state) => state.auth);
  const { selectedCar } = useAppSelector((state) => state.cars);
  const { isTelegramReady } = useAppSelector((state) => state.ui);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Initialize Telegram and authenticate
  useEffect(() => {
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

    if (tgUser) {
      dispatch(setTelegramUser(tgUser));
    }

    const authenticate = async () => {
      try {
        await dispatch(loginWithTelegram({ telegramUser: tgUser || undefined })).unwrap();
      } catch (err) {
        console.error('Authentication failed:', err);
      } finally {
        dispatch(setAuthenticating(false));
      }
    };

    authenticate();
  }, [isReady, tgUser, dispatch]);

  // Handle car selection (from carousel double-tap)
  const handleSelectCar = (car: Car) => {
    dispatch(selectCar(car));
    navigate('/rental');
  };

  // Handle drawer navigation
  const handleDrawerNavigate = (page: 'history' | 'profile') => {
    dispatch(clearSelectedCar());
    switch (page) {
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

  // Handle close (back navigation)
  const handleClose = () => {
    dispatch(clearSelectedCar());
    navigate('/');
  };

  // Handle navigation to verification
  const handleNavigateToVerification = () => {
    navigate('/verification');
  };

  // Handle verification success
  const handleVerificationSuccess = () => {
    navigate('/profile');
  };

  // Loading state
  if (!DEV_MODE && (!isTelegramReady || isAuthenticating)) {
    return <Loader fullScreen text="Загрузка..." />;
  }

  // Determine if we're on the main map view
  const isMainView = ['/', '/home'].includes(location.pathname);
  const isSubPage = ['/history', '/profile'].includes(location.pathname);
  const isFullPage = ['/rental', '/verification'].includes(location.pathname);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--tg-theme-bg-color)]">
      {/* DEV MODE indicator */}
      {DEV_MODE && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-xs text-center py-1 z-[100]">
          🔧 DEV MODE — Telegram отключён
        </div>
      )}

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={handleDrawerNavigate}
      />

      <div className={DEV_MODE ? 'h-full pt-6' : 'h-full'}>
        {/* Main Map View */}
        {isMainView && (
          <HomePage
            onSelectCar={handleSelectCar}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {/* Sub Pages (History, Profile) */}
        {isSubPage && (
          <div className="h-full flex flex-col">
            {/* Back button header */}
            <div className="flex items-center gap-4 p-4 bg-[var(--tg-theme-bg-color)] border-b border-[var(--tg-theme-hint-color)]/10">
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[var(--tg-theme-text-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
                {location.pathname === '/history' ? 'История поездок' : 'Профиль'}
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage onNavigateToVerification={handleNavigateToVerification} />} />
              </Routes>
            </div>
          </div>
        )}

        {/* Full Page Routes (Rental, Verification) */}
        {isFullPage && (
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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
