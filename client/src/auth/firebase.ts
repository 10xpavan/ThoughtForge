import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    type User
} from 'firebase/auth';

// Verify required environment variables
const requiredEnvVars = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    throw new Error(
        `Missing required Firebase environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set."
    );
}

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Log user's email after successful sign-in
        console.log('Successfully signed in user:', user.email);
        
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

export const signOut = async (): Promise<void> => {
    try {
        await auth.signOut();
        console.log('Successfully signed out');
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};

export { auth };
