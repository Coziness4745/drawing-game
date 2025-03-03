import { auth } from './config';
import { 
  signInAnonymously, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';

// Sign in anonymously
export const anonymousSignIn = async (displayName) => {
  try {
    const userCredential = await signInAnonymously(auth);
    
    // Update the user profile with the provided display name
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error.message);
    throw error;
  }
};

// Sign out
export const userSignOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out:", error.message);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};