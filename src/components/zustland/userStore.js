import { create } from "zustand";
import { auth } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const useAuthStore = create((set, get) => ({
  users: null,
  loading: true,
  needsProfileSetup: false,
  
  setUser: (users) => set({ users, loading: false, needsProfileSetup: !users?.profileComplete }),
  
  logout: async () => {
    try {
      await auth.signOut();
      set({ users: null, loading: false, needsProfileSetup: false });
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
  
  checkAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const profileComplete = userData.profileComplete === true;
            
            set({
              users: { ...userData, uid: firebaseUser.uid },
              loading: false,
              needsProfileSetup: !profileComplete
            });
            
            // If profile is incomplete, ensure state reflects this
            if (!profileComplete) {
              set({ needsProfileSetup: true });
            }
          } else {
            // New user - requires profile setup
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              profileComplete: false,
              createdAt: new Date()
            });
            
            set({ 
              users: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                profileComplete: false,
                createdAt: new Date()
              },
              loading: false,
              needsProfileSetup: true
            });
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
          set({ users: null, loading: false, needsProfileSetup: false });
        }
      } else {
        set({ users: null, loading: false, needsProfileSetup: false });
      }
    });
    
    return unsubscribe;
  },
  
  updateProfile: async (updates) => {
    const { users } = get();
    if (!users?.uid) return;
    
    try {
      const userRef = doc(db, "users", users.uid);
      await updateDoc(userRef, updates);
      
      set(state => ({
        users: { ...state.users, ...updates },
        needsProfileSetup: updates.profileComplete === false
      }));
      
      // If completing profile, update state
      if (updates.profileComplete) {
        set({ needsProfileSetup: false });
      }
    } catch (error) {
      console.error("Profile update error:", error);
    }
  }
}));