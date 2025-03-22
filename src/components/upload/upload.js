// src/upload/upload.js
import { storage, auth } from "../firebase/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const upload = async (file) => {
  try {
    if (!file) return "";
    
    // Get current user
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    // Create a unique filename using timestamp and user ID
    const timestamp = new Date().getTime();
    const filename = `profile_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    
    // Include user ID in the path for better organization
    const storageRef = ref(storage, `profile_images/${user.uid}/${filename}`);
    
    // Upload the file
    const uploadTask = await uploadBytesResumable(storageRef, file);
    
    // Get and return the download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);
    return downloadURL;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export default upload;