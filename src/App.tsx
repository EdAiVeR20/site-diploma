import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { Loader, SideDrawer, TelegramGate } from "./components";
import { useTelegram } from "./hooks/useTelegram";
import { useGeolocation } from "./hooks/useGeolocation";
import { useAppDispatch, useAppSelector } from "./store";
import {
  setTelegramUser,
  setAuthenticating,
  loginSuccess,
  loginFailure,
  setPhoneNumber,
} from "./store/slices/authSlice";
import { clearSelectedCar } from "./store/slices/carsSlice";
import { setActiveTab, setTelegramReady } from "./store/slices/uiSlice";
import { APP_CONFIG } from "./config";
import { useLogin } from "./hooks/queries/useAuth";

// Lazy-loaded pages
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const RentalPage = lazy(() =>
  import("./pages/RentalPage").then((m) => ({ default: m.RentalPage })),
);
const VerificationPage = lazy(() =>
  import("./pages/VerificationPage").then((m) => ({
    default: m.VerificationPage,
  })),
);

const { DEV_MODE } = APP_CONFIG;

function AppContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, user: tgUser, initData, requestContact } = useTelegram();

  // BUG-6: Wait for Telegram SDK to initialize (up to 3 seconds)
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  useEffect(() => {
    if (DEV_MODE || initData) return; // No wait needed
    const timer = setTimeout(() => setSdkTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [initData]);

  // BUG-7: Only request geolocation when inside Telegram (or DEV_MODE)
  useGeolocation(DEV_MODE || !!initData);

  const { mutateAsync: loginTelegram } = useLogin();

  // Redux state
  const { isAuthenticating } = useAppSelector((state) => state.auth);
  const { selectedCar } = useAppSelector((state) => state.cars);
  const { isTelegramReady } = useAppSelector((state) => state.ui);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync activeTab with current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path === "/home") {
      dispatch(setActiveTab("home"));
    } else if (path === "/history") {
      dispatch(setActiveTab("history"));
    } else if (path === "/profile") {
      dispatch(setActiveTab("profile"));
    }
  }, [location.pathname, dispatch]);

  // Initialize Telegram and authenticate
  useEffect(() => {
    if (DEV_MODE) {
      dispatch(setTelegramReady(true));
      dispatch(
        setTelegramUser({
          id: 123456789,
          firstName: "Тест",
          lastName: "",
          username: "testuser",
        }),
      );
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
        const response = await loginTelegram({
          user: tgUser || undefined,
          initData,
        });
        dispatch(loginSuccess(response));

        // Request phone number if not already shared
        // Запрашиваем только если: номер не вернулся от 1С И пользователь ещё не делился в этой сессии
        const alreadyShared = sessionStorage.getItem("phone_shared");
        if (!response.phoneNumber && !alreadyShared) {
          try {
            await requestContact();
            // Phone is sent to bot via webhook → 1C saves it
            // We mark it as 'shared' locally so we don't ask again this session
            dispatch(setPhoneNumber("shared"));
            sessionStorage.setItem("phone_shared", "true");
          } catch {
            // User declined — that's ok, they can share later from Profile
          }
        }
      } catch (err) {
        if (DEV_MODE) console.error("Authentication failed:", err);
        dispatch(
          loginFailure(
            err instanceof Error ? err.message : "Ошибка авторизации",
          ),
        );
      } finally {
        dispatch(setAuthenticating(false));
      }
    };

    authenticate();
  }, [isReady, tgUser, initData, dispatch, loginTelegram, requestContact]);

  const handleDrawerNavigate = useCallback(
    (page: "history" | "profile") => {
      dispatch(clearSelectedCar());
      navigate(`/${page}`);
    },
    [dispatch, navigate],
  );

  const handleRentalSuccess = useCallback(() => {
    dispatch(clearSelectedCar());
    navigate("/history");
  }, [dispatch, navigate]);

  const handleClose = useCallback(() => {
    dispatch(clearSelectedCar());
    navigate("/");
  }, [dispatch, navigate]);

  const handleNavigateToVerification = useCallback(() => {
    navigate("/verification");
  }, [navigate]);

  const handleVerificationSuccess = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  const handleOpenDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // BUG-6: Show loader while waiting for SDK, then TelegramGate after timeout
  // BUG-7: TelegramGate renders BEFORE geolocation hook, so no location requests
  if (!DEV_MODE && !initData) {
    if (!sdkTimedOut) {
      return <Loader fullScreen text="Подключение к Telegram..." />;
    }
    return <TelegramGate />;
  }

  // Loading state
  if (!DEV_MODE && (!isTelegramReady || isAuthenticating)) {
    return <Loader fullScreen text="Загрузка..." />;
  }

  // Determine if we're on the main map view
  const isMainView = ["/", "/home"].includes(location.pathname);
  const isSubPage = ["/history", "/profile"].includes(location.pathname);
  const isFullPage = ["/rental", "/verification"].includes(location.pathname);

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
        onClose={handleCloseDrawer}
        onNavigate={handleDrawerNavigate}
      />

      <div className={DEV_MODE ? "h-full pt-6" : "h-full"}>
        <Suspense fallback={<Loader fullScreen text="Загрузка..." />}>
          {/* Main Map View — ALWAYS MOUNTED, hidden via CSS to prevent re-init */}
          <div
            style={{ display: isMainView ? "block" : "none" }}
            className="h-full"
          >
            <HomePage onOpenDrawer={handleOpenDrawer} isActive={isMainView} />
          </div>

          {/* Sub Pages (History, Profile) */}
          {isSubPage && (
            <div className="h-full flex flex-col animate-slide-up">
              {/* Back button header */}
              <div className="flex items-center gap-4 p-4 bg-[var(--tg-theme-bg-color)] border-b border-[var(--tg-theme-hint-color)]/10">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center active:scale-95 transition-transform"
                >
                  <svg
                    className="w-5 h-5 text-[var(--tg-theme-text-color)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
                  {location.pathname === "/history"
                    ? "История поездок"
                    : "Профиль"}
                </h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/history" element={<HistoryPage />} />
                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        onNavigateToVerification={handleNavigateToVerification}
                      />
                    }
                  />
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
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        containerClassName="!p-4"
        containerStyle={{ pointerEvents: "none", zIndex: 9999 }}
        toastOptions={{
          duration: 4000,
        }}
      />
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
