import { useState, useRef, useEffect } from "react";
import { MdArrowBackIosNew } from "react-icons/md";
import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function Chat({ chat, onBack, currentUser, messages, messagesLoading }) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [recipientInfo, setRecipientInfo] = useState(chat?.userInfo || {});

  // Real-time recipient profile updates
  useEffect(() => {
    if (!chat?.userInfo?.uid) return;

    const userRef = doc(db, "users", chat.userInfo.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setRecipientInfo({
          uid: doc.id,
          username: doc.data().username,
          profileImage: doc.data().profileImage || "/default-avatar.png"
        });
      }
    });

    return () => unsubscribe();
  }, [chat?.userInfo?.uid]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chat?.chatId || !currentUser?.uid) return;

    try {
      setSending(true);
      
      // Clear input field immediately to prevent duplicate sends
      const messageText = newMessage.trim();
      setNewMessage("");
      
      // Get current timestamp as regular Timestamp (not serverTimestamp)
      const currentTimestamp = Timestamp.now();
      
      // Create message object
      const messageData = {
        text: messageText,
        sender: currentUser.uid,
        createdAt: serverTimestamp(), // Use serverTimestamp for actual message
        read: false
      };

      // 1. Add message to chat's messages collection
      const messagesRef = collection(db, "chats", chat.chatId, "messages");
      await addDoc(messagesRef, messageData);

      // 2. Update the chat document with the last message info
      const chatRef = doc(db, "chats", chat.chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          text: messageText,
          sender: currentUser.uid,
          createdAt: serverTimestamp(),
          read: false
        }
      });

      // 3. Update both users' chat lists (in userchats collection) with regular timestamp
      await updateUserChatList(currentUser.uid, chat.userInfo.uid, chat.chatId, messageText, currentTimestamp, false);
      await updateUserChatList(chat.userInfo.uid, currentUser.uid, chat.chatId, messageText, currentTimestamp, true);

    } catch (error) {
      console.error("Send message error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Helper function to update a user's chat list
  const updateUserChatList = async (userId, otherUserId, chatId, messageText, timestamp, incrementUnread = false) => {
    try {
      // Get the other user's info to include in the chat entry
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
      if (!otherUserDoc.exists()) return;
      
      const otherUserInfo = {
        uid: otherUserId,
        username: otherUserDoc.data().username,
        profileImage: otherUserDoc.data().profileImage || "/default-avatar.png"
      };
      
      // Get the current user's chat list
      const userChatRef = doc(db, "userchat", userId);
      const userChatDoc = await getDoc(userChatRef);
      
      let updatedChats = [];
      let existingChat = null;
      
      if (userChatDoc.exists() && userChatDoc.data().chats) {
        // Filter out the current chat (we'll add an updated version)
        updatedChats = userChatDoc.data().chats.filter(c => c.chatId !== chatId);
        existingChat = userChatDoc.data().chats.find(c => c.chatId === chatId);
      }
      
      // Create updated chat entry with regular Timestamp (not serverTimestamp)
      const updatedChat = {
        chatId: chatId,
        userInfo: otherUserInfo,
        lastMessage: {
          text: messageText,
          sender: currentUser.uid,
          createdAt: timestamp // Use regular Timestamp instead of serverTimestamp
        },
        // Increment unread count only for recipient, not sender
        unreadCount: incrementUnread 
          ? (existingChat?.unreadCount || 0) + 1 
          : 0
      };
      
      // Add the updated chat entry to the beginning of the array
      updatedChats.unshift(updatedChat);
      
      // Update the user's chat list
      await updateDoc(userChatRef, { chats: updatedChats });
    } catch (error) {
      console.error("Error updating user chat list:", error);
    }
  };

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center p-4 gap-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
        <button
          className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
          onClick={onBack}
        >
          <MdArrowBackIosNew />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <img
            src={recipientInfo?.profileImage || "/default-avatar.png"}
            alt={recipientInfo?.username || "User"}
            className="w-10 h-10 rounded-full border-2 border-purple-600"
            onError={(e) => {
              e.target.src = "/default-avatar.png";
            }}
          />
          <div>
            <h2 className="text-gray-200 font-medium">
              {recipientInfo?.username || "User"}
            </h2>
            <p className="text-xs text-gray-400">
              {recipientInfo?.uid === currentUser.uid ? "You" : "Online"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {messagesLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 opacity-20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === currentUser.uid ? "justify-end" : "justify-start"} mb-4`}
            >
              <div className={`max-w-xs p-3 rounded-2xl ${
                message.sender === currentUser.uid 
                  ? "bg-gradient-to-br from-purple-600 to-blue-500 rounded-br-none shadow-md"
                  : "bg-gradient-to-br from-gray-800 to-gray-700 rounded-bl-none shadow-md"
              }`}>
                <p className="text-gray-100">{message.text}</p>
                <div className="flex items-center justify-end mt-1 space-x-2">
                  <span className="text-xs text-gray-300">
                    {formatTimestamp(message.createdAt)}
                  </span>
                  {message.sender === currentUser.uid && (
                    <span className="text-xs text-gray-300">
                      {message.read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-inner"
          />
          
          <button 
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 shadow-md transition-all duration-200"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </>
  );
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  
  try {
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
    
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
}