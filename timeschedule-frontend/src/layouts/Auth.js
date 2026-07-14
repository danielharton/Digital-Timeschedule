import React, { useEffect } from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import routes from "./../routes.js";

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { apiCheckLogin } from "../api/auth.js";


const Auth = (props) => {
  const navigate = useNavigate(); 

  useEffect(() => {
    apiCheckLogin(
      () => { },
      () => navigate('/dashboard')
    )
  }, [navigate])

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={prop.path} element={prop.component} key={key} exact />
        );
      } else {
        return null;
      }
    });
  };

  React.useEffect(() => {
    document.body.classList.add("bg-gray-300");
    return () => {
      document.body.classList.remove("bg-gray-300");
    };
  }, []);

  return (
    <>
      <div className="font-sans w-full h-[100dvh] flex items-center justify-center">
        <Card className="w-[500px] max-w-[350px] sm:max-w-[500px] h-fit">
          <CardContent>
            <Routes>
              {getRoutes(routes)}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </CardContent>
        </Card>
      </div>
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

export default Auth;