import { auth, db } from '../firebase/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../notification/Notificiation';
import { useState } from 'react';
import { useAuthStore } from '../zustland/userStore';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // Create minimal user document
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          profileComplete: false,
          createdAt: new Date(),
          username: user.displayName || `User${Math.random().toString(36).substr(2, 9)}`,
          profileImage: user.photoURL || '',
          blocked: []
        });

        // Create empty chats document
        await setDoc(doc(db, "userchat", user.uid), { chats: [] });
        notifySuccess("Welcome to ChattZ! Please complete your profile");
        
        // Navigate to profile setup if the profile is not complete
        await checkAuth();
        navigate('/userSettings', { state: { forceComplete: true } });
      } else {
        // User exists, check if profile is complete
        const userData = docSnap.data();
        await checkAuth();
        
        if (!userData.profileComplete) {
          notifySuccess("Please complete your profile");
          navigate('/userSettings', { state: { forceComplete: true } });
        } else {
          notifySuccess("Welcome back!");
          navigate('/chatlist');
        }
      }

    } catch (error) {
      console.error("Google login error:", error);
      notifyError(error.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  



  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md w-full">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-4">
            ChattZ
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-8">
            Secure Messaging Reimagined
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group relative max-w-md w-full mx-auto flex items-center justify-center gap-3 px-8 py-4
                     bg-gradient-to-br from-gray-800 to-gray-900 hover:from-purple-900 hover:to-gray-900
                     text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-70
                     shadow-2xl hover:shadow-purple-900/30 border-2 border-purple-900/50 hover:border-purple-400
                     transform hover:scale-[1.02] active:scale-95"
          aria-label="Sign in with Google"
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                          bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
          
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-6 w-6 text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-lg">Authenticating...</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="w-6 h-6 md:w-8 md:h-8 animate-pulse-slow"
                   viewBox="0 0 24 24">
                <path fill="currentColor" 
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" 
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" 
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" 
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-lg md:text-xl bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">
                Continue with Google
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Login;