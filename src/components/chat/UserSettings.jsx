import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { notifySuccess, notifyError } from "../notification/Notificiation";
import upload from "../upload/upload";

const UserSettings = ({ onClose, forceComplete }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // If forceComplete isn't passed as a prop, check the location state
  const isForceComplete = forceComplete || location.state?.forceComplete || false;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setUsername(data.username || "");
          setProfileImage(data.profileImage || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        notifyError("Failed to load profile data");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      notifySuccess("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      notifyError("Failed to log out");
      setIsLoggingOut(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setProfileImageFile(file);
        notifySuccess("Profile picture selected. Save to update.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Validate username
      if (!username.trim()) {
        throw new Error("Username is required");
      }

      // Initialize update data object
      const updateData = {
        username,
        profileComplete: true,
        updatedAt: new Date()
      };

      // Upload profile image if a new one was selected
      if (profileImageFile) {
        try {
          const imgUrl = await upload(profileImageFile);
          updateData.profileImage = imgUrl;
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          notifyError("Failed to upload profile picture, but profile will be updated");
        }
      }

      // Update user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updateData);

      notifySuccess("Profile updated successfully!");
      
      // Check if we should close the modal or navigate
      if (onClose) {
        onClose(); // Close the modal if it's opened from UserInfo
      } else {
        // Navigate to chat list
        navigate("/chatlist", { replace: true }); // Using replace to prevent stacking in history
      }
    } catch (error) {
      console.error("Profile update error:", error);
      notifyError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToChatList = () => {
    if (onClose) {
      // If opened as a modal from UserInfo, just close it
      onClose();
    } else {
      // Otherwise navigate to chatlist
      navigate("/chatlist", { replace: true });
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // If rendered as a modal, we need different styling
  const isModal = !!onClose;

  return (
    <div className={isModal ? 
      "fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" : 
      "min-h-screen bg-gray-900 flex flex-col items-center justify-center p-3 sm:p-4"
    }>
      <div className="w-full max-w-sm sm:max-w-md bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
        {isModal && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
              {isForceComplete ? "Complete Your Profile" : "Profile Settings"}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}

        {!isModal && (
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
            {isForceComplete ? "Complete Your Profile" : "Profile Settings"}
          </h2>
        )}
        
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <label htmlFor="profile-picture" className="relative cursor-pointer group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-cyan-500 mb-2">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
            </div>
            <input
              type="file"
              id="profile-picture"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <label htmlFor="profile-picture" className="text-cyan-400 cursor-pointer hover:text-cyan-300 text-xs sm:text-sm">
            Change profile picture
          </label>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm mb-1 sm:mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
              placeholder="Choose a username"
              required
            />
          </div>

          {/* Email Display (Read-only) */}
          <div>
            <label className="block text-gray-300 text-sm mb-1 sm:mb-2">
              Email
            </label>
            <div className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 text-sm sm:text-base overflow-hidden overflow-ellipsis">
              {userData.email}
            </div>
          </div>

          {/* Save Profile Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 sm:py-3 text-white text-sm sm:text-base font-medium rounded-lg transition-all ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                </svg>
                Saving...
              </div>
            ) : (
              'Save Profile'
            )}
          </button>
          
          {!isForceComplete && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4">
              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full py-2 sm:py-3 text-white text-sm sm:text-base font-medium bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:bg-red-800 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                    </svg>
                    Logging out...
                  </div>
                ) : (
                  'Logout'
                )}
              </button>
              
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToChatList}
                className="w-full py-2 sm:py-3 text-white text-sm sm:text-base font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
              >
                Back to Chats
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserSettings;