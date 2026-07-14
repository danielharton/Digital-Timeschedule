import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Box, Card, CssBaseline } from '@mui/material';
import { ToastContainer } from "react-toastify";
import routes from "./../routes.js";
import { apiCheckLogin } from "../api/auth.js";
import { NEEDS_UPDATE_STRING } from "../utils/utilFunctions.js";
import { apiGetUserRights } from "../api/rights.js";
import LoadingBar from "react-top-loading-bar";
import { apiSetLanguagePreference } from "../api/timetable.js";
import { setLocalizationState } from "../utils/localization.js";

const Dashboard = () => {
  const navigate = useNavigate(); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const rights = []
  const [userRights, setUserRights] = useState([])

  const [progress, setProgress] = useState(0)
  const languageBootstrapStartedRef = useRef(false);

  const getBrowserLanguageMode = useCallback(() => {
    const prefs = (
      navigator.languages?.length ? [...navigator.languages] : [navigator.language || "en"]
    ).map((tag) => (tag || "").toLowerCase());

    const englishIndex = prefs.findIndex((tag) => tag.startsWith("en"));
    const romanianIndex = prefs.findIndex((tag) => tag.startsWith("ro"));

    if (englishIndex >= 0 && romanianIndex >= 0) {
      return englishIndex < romanianIndex ? "en" : "ro";
    }
    if (englishIndex >= 0) return "en";
    if (romanianIndex >= 0) return "ro";
    return "en";
  }, []);

  const autoSetLanguageFromBrowser = useCallback(async () => {
    if (languageBootstrapStartedRef.current) return;
    languageBootstrapStartedRef.current = true;
    try {
      const mode = getBrowserLanguageMode();
      await apiSetLanguagePreference({ mode });
      setLocalizationState({ mode, customPack: null });
      window.location.reload();
    } catch (err) {
      languageBootstrapStartedRef.current = false;
      console.warn("Language bootstrap failed:", err);
    }
  }, [getBrowserLanguageMode]);

  useEffect(() => {
    apiGetUserRights((userRights) => {
      if (userRights) {
        setUserRights(userRights)
      }
    })
  }, [])

  const navigateToAuth = useCallback(() => {
    navigate('/auth')
  }, [navigate]);

  const checkLogin = useCallback(async () => {
    await apiCheckLogin(navigateToAuth, (response) => {
      setUser(response);
      const roles = response?.data?.roles || [];
      const isAdmin = roles.some((r) => r.name === "admin");
      if (!isAdmin && response?.data?.language_preference?.language_mode === "custom") {
        setLocalizationState({ mode: "en", customPack: null });
      }
      if (response?.data?.language_setup_required) {
        autoSetLanguageFromBrowser();
      }
    })
  }, [navigateToAuth, autoSetLanguageFromBrowser]);

  const updateData = useCallback(async (needsUpdate) => {
    if (needsUpdate) {
      if (needsUpdate === NEEDS_UPDATE_STRING.user) {
        checkLogin()
        apiGetUserRights(setUserRights)
      }
    } else {
      await checkLogin()
      apiGetUserRights(setUserRights)
    }
  }, [checkLogin]);

  useEffect(() => {
    document.body.classList.add("bg-gray-300");
    updateData();
    if (window.innerWidth >= 900) {
      setSidebarOpen(true);
    }

    
    const loadingHandler = (event) => {
      setProgress(event.detail.progress)
    };
    window.addEventListener('loadingProgress', loadingHandler);

    return () => {
      window.removeEventListener('loadingProgress', loadingHandler);
      document.body.classList.remove("bg-gray-300");
    };
  }, [updateData])

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/dashboard") {
        const Component = prop.component;
        return (
          <Route key={`route_${prop.id}`} path={prop.path} element={
            <Component
              user={user}
              updateData={updateData}
              rights={rights}
              userRights={userRights}
            />
          } exact />
        );
      } else {
        return null;
      }
    });
  };

  return (
    <>
      <LoadingBar
        color='#0d47a1'
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
          user={user}
          userRights={userRights}
          rights={rights}
        />

        {}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.grey',
            py: 3,
            px: { xs: 2, sm: 3, md: 5, lg: 6 },
            ml: 0, 
            mt: 8 
          }}
        >
          <Navbar user={user} onMenuClick={handleMenuClick} userRights={userRights} />
          <Box className="pb-6" sx={{ minWidth: 0 }}>
            <Card
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                px: { xs: 2.5, sm: 4, md: 5 },
                boxSizing: 'border-box',
                overflow: 'visible'
              }}
            >
              <Routes>
                {getRoutes(routes)}
                <Route path="*" element={<Navigate to="/dashboard/index" replace />} />
              </Routes>
            </Card>
          </Box>
        </Box>
      </Box>

      <ToastContainer
        position="top-right"
        autoClose={5000} 
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

    </>
  );
};

export default Dashboard;
