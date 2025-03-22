import signIn from "../../assets/darklogin.png";
import { NavLink } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { notifyError, notifySuccess } from "../notification/Notificiation";
import { useState } from "react";

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSign = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      // Make sure email and password are not empty
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      await signInWithEmailAndPassword(auth, email, password);
      notifySuccess("Login successful");
      
      // Add a small delay before navigation to ensure auth state is updated
      setTimeout(() => {
        navigate("/chatlist");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      // Display the actual error message instead of the string "error.message"
      notifyError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${signIn})` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-xl"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* ChattZ! Header */}
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ChattZ!
          </h1>
          <p className="mt-3 text-gray-200 text-lg md:text-xl font-light">
            Welcome Back to Your Conversations
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-lg rounded-2xl border border-gray-700/30 p-8 md:p-10 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSign}>
            <h2 className="text-3xl font-bold text-center text-white mb-8">
              Sign In to Continue
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-gray-900/30 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-white placeholder-gray-400 transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 bg-gray-900/30 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-white placeholder-gray-400 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
   
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 text-white font-bold text-lg rounded-xl transition-all duration-300 transform shadow-lg ${
                loading 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:scale-[1.02] hover:shadow-cyan-500/20'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                  </svg>
                  Signing In...
                </div>
              ) : (
                'Sign In Now'
              )}
            </button>
            
            <div className="text-center pt-6">
              <p className="text-gray-300 text-sm">
                Don't have an account?{" "}
                <NavLink 
                  to="/entry"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 transition-colors"
                >
                  Create Account
                </NavLink>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;