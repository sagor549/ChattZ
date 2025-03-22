import { useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  setDoc,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { notifySuccess, notifyError } from "../notification/Notificiation";

export default function AddFriend({ onClose, onSuccess, currentUserId }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [addingFriend, setAddingFriend] = useState(false);

  // Search users by username
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Query users collection by username
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", ">=", username), where("username", "<=", username + "\uf8ff"));
      const querySnapshot = await getDocs(q);
      
      // Filter out current user
      const results = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) {
          results.push({ id: doc.id, uid: doc.id, ...doc.data() });
        }
      });
      
      if (results.length === 0) {
        setError("No users found with that username");
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search for users");
    } finally {
      setLoading(false);
    }
  };

  // Add user as friend and create a chat
  const handleAddFriend = async (user) => {
    if (addingFriend) return;
    
    try {
      setAddingFriend(true);
      
      // 1. Check if chat already exists by checking user's chat list
      const userChatRef = doc(db, "userchat", currentUserId);
      const userChatDoc = await getDoc(userChatRef);
      
      // Important: Use regular timestamp instead of serverTimestamp for arrays
      const currentTime = Timestamp.now();
      
      if (userChatDoc.exists() && userChatDoc.data().chats) {
        const existingChat = userChatDoc.data().chats.find(
          chat => chat.userInfo.uid === user.uid
        );
        
        if (existingChat) {
          // Chat already exists, just return it
          onSuccess(existingChat);
          return;
        }
      }
      
      // 2. Create a new chat document if it doesn't exist
      const chatId = [currentUserId, user.uid].sort().join("_");
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [currentUserId, user.uid],
          createdAt: currentTime,
          lastMessage: null
        });
      }
      
      // 3. Get current user info for the other user's chat list
      const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
      const currentUserInfo = {
        uid: currentUserId,
        username: currentUserDoc.data().username,
        profileImage: currentUserDoc.data().profileImage || "/default-avatar.png"
      };
      
      // 4. Add/Update chat in current user's chat list
      const newChat = {
        chatId,
        userInfo: {
          uid: user.uid,
          username: user.username,
          profileImage: user.profileImage || "/default-avatar.png"
        },
        createdAt: currentTime, // Use regular timestamp, not serverTimestamp
        unreadCount: 0
      };
      
      await updateUserChatList(userChatRef, userChatDoc, newChat);
      
      // 5. Add/Update chat in the other user's chat list
      const otherUserChatRef = doc(db, "userchat", user.uid);
      const otherUserChatDoc = await getDoc(otherUserChatRef);
      
      const otherUserChat = {
        chatId,
        userInfo: currentUserInfo,
        createdAt: currentTime, // Use regular timestamp, not serverTimestamp
        unreadCount: 0
      };
      
      await updateOtherUserChatList(otherUserChatRef, otherUserChatDoc, otherUserChat);
      
      // 6. Return the new chat object to parent component
      onSuccess(newChat);
      
    } catch (error) {
      console.error("Add friend error:", error);
      setError("Failed to add friend. Please try again.");
      setAddingFriend(false);
    }
  };
  
  // Helper function to update current user's chat list
  const updateUserChatList = async (userChatRef, userChatDoc, newChat) => {
    if (userChatDoc.exists()) {
      // Check if chat already exists in array
      const existingChats = userChatDoc.data().chats || [];
      const updatedChats = existingChats.filter(chat => chat.chatId !== newChat.chatId);
      updatedChats.unshift(newChat); // Add to beginning
      
      await updateDoc(userChatRef, { chats: updatedChats });
    } else {
      // Create new document with chats array
      await setDoc(userChatRef, { chats: [newChat] });
    }
  };
  
  // Helper function to update other user's chat list
  const updateOtherUserChatList = async (otherUserChatRef, otherUserChatDoc, otherUserChat) => {
    if (otherUserChatDoc.exists()) {
      // Check if chat already exists in array
      const existingChats = otherUserChatDoc.data().chats || [];
      const updatedChats = existingChats.filter(chat => chat.chatId !== otherUserChat.chatId);
      updatedChats.unshift(otherUserChat); // Add to beginning
      
      await updateDoc(otherUserChatRef, { chats: updatedChats });
    } else {
      // Create new document with chats array
      await setDoc(otherUserChatRef, { chats: [otherUserChat] });
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-gray-200 font-semibold">Add Friend</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Search by username"
            className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="text-red-400 text-sm mb-4">
          {error}
        </div>
      )}
      
      <div className="max-h-60 overflow-y-auto">
        {searchResults.map((user) => (
          <div 
            key={user.id} 
            className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg mb-2 cursor-pointer"
            onClick={() => handleAddFriend(user)}
          >
            <img
              src={user.profileImage || "/default-avatar.png"}
              alt={user.username}
              className="w-10 h-10 rounded-full border-2 border-purple-600"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className="flex-1">
              <div className="text-gray-200">{user.username}</div>
              <div className="text-xs text-gray-400">{user.email}</div>
            </div>
            <button 
              className="px-3 py-1 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-lg text-sm"
              disabled={addingFriend}
            >
              {addingFriend ? "Adding..." : "Add"}
            </button>
          </div>
        ))}
      </div>
      
      {searchResults.length > 0 && (
        <div className="mt-4 text-xs text-gray-400">
          Click on a user to add them and start a conversation.
        </div>
      )}
    </div>
  );
}