import { useEffect, useState } from "react";
import { 
  getDoc, 
  setDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  collection, 
  query, 
  orderBy,
  updateDoc,
  where,
  getDocs,
  writeBatch 
} from "firebase/firestore";
import UserInfo from "./UserInfo";
import Chat from "./Chat";
import Details from "./Details";
import AddFriend from "./AddFriend";
import plus from "../../assets/plus.png";
import search from "../../assets/search.png";
import { useAuthStore } from "../zustland/userStore";
import { db } from "../firebase/firebase";

function ChatList() {
  const { users } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load user's chats
  useEffect(() => {
    if (!users?.uid) return;
    
    const userChatRef = doc(db, "userchat", users.uid);
    
    const unsubscribe = onSnapshot(userChatRef, (doc) => {
      if (doc.exists() && doc.data().chats) {
        const chatsData = doc.data().chats;
        
        // Sort chats by last message time, with most recent first
        const sortedChats = [...chatsData].sort((a, b) => {
          const getTime = (chat) => {
            const timestamp = chat.lastMessage?.createdAt || chat.createdAt;
            if (!timestamp) return 0;
            
            if (timestamp.toDate) return timestamp.toDate().getTime();
            if (timestamp.seconds) return timestamp.seconds * 1000;
            if (timestamp instanceof Date) return timestamp.getTime();
            if (typeof timestamp === 'string') return new Date(timestamp).getTime();
            return 0;
          };
          
          return getTime(b) - getTime(a); // Descending order (newest first)
        });
        
        // Deduplicate chats based on chatId to fix key issue
        const uniqueChats = [];
        const chatIds = new Set();
        
        for (const chat of sortedChats) {
          if (!chatIds.has(chat.chatId)) {
            chatIds.add(chat.chatId);
            uniqueChats.push(chat);
          }
        }
        
        setChats(uniqueChats);
      } else {
        // Initialize the userchat document if it doesn't exist
        setDoc(userChatRef, { chats: [] }, { merge: true })
          .catch(err => console.error("Error initializing userchat:", err));
      }
    });
    
    return () => unsubscribe();
  }, [users?.uid]);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat?.chatId || !users?.uid) {
      setMessages([]);
      return;
    }

    const chatId = selectedChat.chatId;
    setMessagesLoading(true);

    const checkChatExists = async () => {
      try {
        const chatDocRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatDocRef);
        
        if (!chatDoc.exists()) {
          // Create the chat if it doesn't exist
          await setDoc(chatDocRef, {
            participants: [users.uid, selectedChat.userInfo.uid],
            createdAt: serverTimestamp(),
            lastMessage: null
          });
        }
      } catch (error) {
        console.error("Error checking chat:", error);
      }
    };
    
    checkChatExists();
    
    // Subscribe to messages collection
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      setMessagesLoading(false);
      
      // Mark messages as read when opening the chat
      markChatAsRead(chatId, users.uid);
    }, (error) => {
      console.error("Error loading messages:", error);
      setMessagesLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedChat?.chatId, users?.uid]);

  const markChatAsRead = async (chatId, userId) => {
    try {
      // Get current user's chat list
      const userChatRef = doc(db, "userchat", userId);
      const userChatDoc = await getDoc(userChatRef);
      
      if (userChatDoc.exists() && userChatDoc.data().chats) {
        const chats = userChatDoc.data().chats;
        
        // Find and update the specific chat
        const updatedChats = chats.map(chat => {
          if (chat.chatId === chatId) {
            // Reset unread count to 0
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });
        
        // Update Firestore
        await updateDoc(userChatRef, { chats: updatedChats });
        
        // Also update messages in the chat as read
        const messagesQuery = query(
          collection(db, "chats", chatId, "messages"),
          where("sender", "!=", userId),
          where("read", "==", false)
        );
        
        const unreadMsgs = await getDocs(messagesQuery);
        
        // Batch update all unread messages
        if (unreadMsgs.size > 0) {
          const batch = writeBatch(db);
          unreadMsgs.forEach(doc => {
            batch.update(doc.ref, { read: true });
          });
          await batch.commit();
        }
      }
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  const handleAddFriendSuccess = (newChat) => {
    setShowAddFriend(false);
    if (newChat) {
      setSelectedChat(newChat);
    }
  };

  // Filter chats based on search term
  const filteredChats = searchTerm.trim() === "" 
    ? chats 
    : chats.filter(chat => 
        chat.userInfo.username.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="h-screen flex bg-gray-950">
      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddFriend 
            onClose={() => setShowAddFriend(false)}
            onSuccess={handleAddFriendSuccess}
            currentUserId={users?.uid}
          />
        </div>
      )}

      {/* Chat List Section */}
      <div className={`w-full md:w-96 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"} border-r border-gray-800`}>
        <UserInfo />
        
        <div className="flex items-center p-4 gap-2 border-b border-gray-800">
          <div className="flex items-center flex-1 bg-gray-900 rounded-lg px-4 py-2 gap-2">
            <img src={search} className="w-5 h-5 opacity-50" alt="search" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations"
              className="flex-1 bg-transparent outline-none text-gray-300 placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowAddFriend(true)}
            className="p-2 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <img src={plus} className="w-5 h-5" alt="add chat" />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              // Check if there are unread messages
              const hasUnreadMessages = chat.unreadCount > 0;
              
              return (
                <div
                  key={chat.chatId}
                  onClick={() => {
                    setSelectedChat(chat);
                  }}
                  className={`flex items-center p-4 gap-3 hover:bg-gray-900 cursor-pointer border-b border-gray-800 relative group ${
                    selectedChat?.chatId === chat.chatId ? "bg-gray-900" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={chat.userInfo.profileImage || "/default-avatar.png"}
                      alt={chat.userInfo.username}
                      className="w-12 h-12 rounded-full border-2 border-purple-600"
                      onError={(e) => {
                        e.target.src = "/default-avatar.png";
                      }}
                    />
                    
                    {/* Unread messages badge */}
                    {hasUnreadMessages && (
                      <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 h-6 flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      {/* Username with bold styling for unread messages */}
                      <h3 className={`${hasUnreadMessages ? 'text-white font-semibold' : 'text-gray-200 font-medium'}`}>
                        {chat.userInfo.username}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(chat.lastMessage?.createdAt || chat.createdAt)}
                      </span>
                    </div>
                    
                    {/* Preview message with bold styling and different color for unread messages */}
                    <p className={`text-sm truncate ${
                      hasUnreadMessages 
                        ? 'text-purple-300 font-medium' 
                        : 'text-gray-400 font-normal'
                    }`}>
                      {chat.lastMessage?.text ? 
                        (chat.lastMessage.sender === users.uid ? "You: " : "") + chat.lastMessage.text : 
                        "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No matching conversations found." : "No conversations yet. Add a friend to start chatting!"}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className={`flex-1 flex flex-col ${selectedChat || showProfile ? "flex" : "hidden md:flex"}`}>
        {showProfile ? (
          <Details onClose={() => setShowProfile(false)} />
        ) : selectedChat ? (
          <Chat 
            chat={selectedChat} 
            onBack={() => setSelectedChat(null)}
            showProfile={() => setShowProfile(true)}
            currentUser={users}
            messages={messages}
            messagesLoading={messagesLoading}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return "";
  }
  
  // For messages from today, show just the time
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // For older messages, show the date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default ChatList;