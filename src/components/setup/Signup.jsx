import bgimg from '../../assets/darklogin.png';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../notification/Notificiation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import upload from '../upload/upload';
import { useAuthStore } from '../zustland/userStore';

const Signup = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setProfileImageFile(file);
        notifySuccess("Profile picture ready!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      // Validate inputs
      if (!username || !email || !password) {
        throw new Error("All fields are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Create user authentication
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      // Upload profile image if exists
      let imgUrl = '';
      if (profileImageFile) {
        try {
          imgUrl = await upload(profileImageFile);
        } catch (error) {
          console.error("Image upload error:", error);
          notifyError("Failed to upload image but account was created");
        }
      }

      // Prepare user data
      const userData = {
        username,
        email,
        uid: res.user.uid,
        profileImage: imgUrl,
        blocked: [],
        profileComplete: true,
        createdAt: new Date()
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", res.user.uid), userData);

      // Create user chat document
      await setDoc(doc(db, "userchat", res.user.uid), {
        chats: []
      });

      // Explicitly update the auth store with the new user data
      useAuthStore.getState().setUser(userData);

      notifySuccess("Account created successfully!");
      
      // Direct navigation to chatlist
      navigate("/chatlist");
    } catch (error) {
      console.error("Registration error:", error);
      notifyError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgimg})` }}
    >
      <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-2xl"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ChattZ!
          </h1>
          <p className="mt-3 text-gray-300 text-lg md:text-xl font-light">
            Your Gateway to Seamless Communication
          </p>
        </div>

        {/* Registration Form */}
        <div className="w-full max-w-2xl bg-gray-900/40 backdrop-blur-lg rounded-2xl border border-gray-700/30 p-8 md:p-12 shadow-2xl">
          <form className="space-y-8" onSubmit={handleRegister}>
            <h2 className="text-4xl font-bold text-center text-white mb-10">
              Join Our Community
            </h2>

            {/* Profile Picture Upload */}
            <div className="flex justify-center mb-8">
              <label 
                htmlFor="profile-picture" 
                className="relative cursor-pointer group"
              >
                <div className="w-32 h-32 rounded-full bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-cyan-400 group-hover:bg-gray-800/70">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover rounded-full animate-fade-in"
                    />
                  ) : (
                    <svg 
                      className="w-12 h-12 text-gray-500 group-hover:text-cyan-400 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  )}
                </div>
                <input
                  id="profile-picture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-lg font-medium text-gray-300 mb-3">
                  User Name
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full px-5 py-4 bg-gray-900/30 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-white placeholder-gray-400 text-lg transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-300 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-5 py-4 bg-gray-900/30 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-white placeholder-gray-400 text-lg transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-300 mb-3">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full px-5 py-4 bg-gray-900/30 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-white placeholder-gray-400 text-lg transition-all"
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <p className="text-gray-400 text-sm mt-2">Must be at least 6 characters</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 text-white font-bold text-lg rounded-xl transition-all duration-300 transform shadow-lg ${
                loading 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:scale-[1.02] hover:shadow-cyan-500/20'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 mr-3 text-white" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Start Chatting Now'
              )}
            </button>

            <p className="text-center text-gray-300 mt-8 text-md">
              Already have an account?{' '}
              <NavLink 
                to="/signin" 
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4"
              >
                Sign In
              </NavLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;