import { useState } from 'react';
import avatar from "../../assets/avatar.png";
import edit from "../../assets/edit.png";
import info from "../../assets/info.png";
import { useAuthStore } from "../zustland/userStore";
import UserSettings from './UserSettings';

const UserInfo = () => {
  const { users } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <img
          src={users?.profileImage || avatar}
          alt="user"
          className="w-10 h-10 rounded-full border-2 border-purple-600"
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />
        <p className="text-lg font-semibold text-gray-200">
          {users?.username || "Anonymous"}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <img src={edit} alt="Edit profile" className="w-6 h-6 opacity-80 hover:opacity-100" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <img src={info} alt="Info" className="w-6 h-6 opacity-80 hover:opacity-100" />
        </button>
      </div>
      
      {showSettings && <UserSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default UserInfo;