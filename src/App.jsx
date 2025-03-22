import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import './App.css';
import Login from "./components/setup/Login";
import Entry from "./components/setup/Entry";
import Signup from "./components/setup/Signup";
import ChatList from "./components/chat/ChatList";
import SignIn from "./components/setup/SignIn";
import Notification from "./components/notification/Notificiation";
import { useEffect } from "react";
import { useAuthStore } from "./components/zustland/userStore";
import UserSettings from "./components/chat/UserSettings";
import UserInfo from "./components/chat/UserInfo";

const RootLayout = () => {
  return (
    <>
      <Notification />
      <Outlet />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const { users, loading } = useAuthStore();
  
  if (loading) return <div>Loading...</div>;
  
  if (!users) return <Navigate to="/login" replace />;
  
  return children;
};

const AuthRoute = ({ children }) => {
  const { users, loading } = useAuthStore();
  
  if (loading) return <div>Loading...</div>;
  
  return !users ? children : <Navigate to="/chatlist" replace />;
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/entry" replace />
      },
      {
        path: "/entry",
        element: <Entry />
      },
      {
        path: "/signIn",
        element: <AuthRoute><SignIn /></AuthRoute>
      },
      {
        path: "/signup",
        element: <AuthRoute><Signup /></AuthRoute>
      },
      {
        path: "/login",
        element: <AuthRoute><Login /></AuthRoute>
      },
      {
        path: "/userSettings",
        element: <ProtectedRoute><UserSettings /></ProtectedRoute> // Added ProtectedRoute back
      },
      {
        path: "/chatlist",
        element: <ProtectedRoute><ChatList /></ProtectedRoute>
      },
      {
        path: "/user",
        element: <ProtectedRoute><UserInfo /></ProtectedRoute>
      },
      {
        path: "*",
        element: <Navigate to="/entry" replace />
      }
    ]
  }
]);

const App = () => {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    const unsubscribe = checkAuth();
    return () => unsubscribe();
  }, [checkAuth]);
  
  return <RouterProvider router={router} />;
};

export default App;