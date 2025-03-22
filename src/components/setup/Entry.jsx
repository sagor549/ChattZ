import React from 'react';
import entry from "../../assets/ok.jpg";
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; 

const Entry = () => {
 
  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${entry})` }}
    >
      
      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-sm"></div>

      <div className="relative z-10 text-center mb-8 space-y-6">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-2 tracking-tighter animate-gradient-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          ChattZ<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">!</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-light italic animate-fade-in drop-shadow-md">
          Let's Connect, Let's Chat
        </p>
      </div>
      
      <div className="relative z-10 flex flex-col w-full max-w-xs md:max-w-sm space-y-4 animate-slide-up">
        <NavLink to="/signup">
          <button className="btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500/90 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-cyan-500/20 border border-cyan-400/20">
            <svg 
              aria-label="Email icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24"
              className="fill-current text-cyan-300"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span className="text-lg">Continue with Email</span>
          </button>
        </NavLink>

        <NavLink to="/login">
        <button className="btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/90 hover:bg-white text-gray-800 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-gray-500/20 border border-gray-200/30" > 
          <svg 
            aria-label="Google logo" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24"
          >
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a5.94 5.94 0 1 1 0-11.88c1.6 0 3.08.549 4.237 1.453l3.027-3.027a9.572 9.572 0 0 0-7.264-2.681 9.611 9.611 0 0 0 0 19.222c5.3 0 9.617-4.356 9.617-9.611a9.18 9.18 0 0 0-.157-1.641h-9.46z" fill="#4285F4"/>
          </svg>
          <span className="text-lg">Sign in with Google</span>
        </button>
        
        </NavLink>
      </div>
    </div>
  );
};

export default Entry;