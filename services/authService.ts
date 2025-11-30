
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously,
    signOut, 
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore, isFirebaseReady } from "./firebase";
import { User } from '../types';

// Helper to map Firebase User to App User
const mapUser = async (fbUser: FirebaseUser, additionalData?: Partial<User>): Promise<User> => {
    let userData: any = {};
    
    if (isFirebaseReady && firestore) { 
        try {
            const userDocRef = doc(firestore, "users", fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            userData = userSnap.exists() ? userSnap.data() : {};
        } catch (e) {
            console.warn("Could not fetch user profile from DB", e);
        }
    }

    return {
        id: fbUser.uid,
        name: fbUser.displayName || userData.name || (fbUser.isAnonymous ? 'Guest Explorer' : 'User'),
        email: fbUser.email || undefined,
        handle: userData.handle || (fbUser.isAnonymous ? '@guest' : `@${fbUser.email?.split('@')[0] || 'user'}`),
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
        status: 'online',
        isVerified: userData.isVerified || false,
        bio: userData.bio || (fbUser.isAnonymous ? "Just browsing..." : "Flux Explorer"),
        isGuest: fbUser.isAnonymous,
        ...additionalData
    };
};

export const authService = {
    signIn: async (email: string, password: string): Promise<User> => {
        if (!isFirebaseReady || !auth) throw new Error("Firebase configuration missing. Check API Keys.");
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return mapUser(userCredential.user);
        } catch (e: any) {
            throw new Error(e.message || "Login failed");
        }
    },

    signUp: async (name: string, email: string, handle: string, password?: string): Promise<User> => {
        if (!password) throw new Error("Password required");
        if (!isFirebaseReady || !auth) throw new Error("Firebase configuration missing.");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;

            await updateProfile(fbUser, {
                displayName: name,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`
            });

            const newUser: User = {
                id: fbUser.uid,
                name,
                email,
                handle: handle.startsWith('@') ? handle : `@${handle}`,
                avatar: fbUser.photoURL || "",
                status: 'online',
                isVerified: false,
                bio: "Just joined Flux!"
            };

            if (firestore) {
                 await setDoc(doc(firestore, "users", fbUser.uid), newUser);
            }
            return newUser;
        } catch (e: any) {
            throw new Error(e.message || "Signup failed");
        }
    },

    signInWithGoogle: async (): Promise<User> => {
        if (!isFirebaseReady || !auth) throw new Error("Firebase configuration missing.");

        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            if (firestore) {
                const userDocRef = doc(firestore, "users", result.user.uid);
                const userSnap = await getDoc(userDocRef);
                
                // Only create doc if it doesn't exist
                if (!userSnap.exists()) {
                    const newUser: User = {
                        id: result.user.uid,
                        name: result.user.displayName || 'User',
                        email: result.user.email || undefined,
                        handle: `@${result.user.email?.split('@')[0]}`,
                        avatar: result.user.photoURL || '',
                        status: 'online',
                        isVerified: false,
                        bio: "Flux Explorer"
                    };
                    await setDoc(userDocRef, newUser);
                    return mapUser(result.user, newUser);
                }
            }
            return mapUser(result.user);
        } catch (error: any) {
            console.error("Google Auth Error", error);
            // Throw cleaner error messages
            if (error.code === 'auth/unauthorized-domain') {
                throw new Error("Domain not authorized in Firebase Console. Add your Netlify URL to Authentication > Settings > Authorized Domains.");
            } else if (error.code === 'auth/configuration-not-found') {
                throw new Error("Google Sign-In not enabled in Firebase Console.");
            }
            throw new Error(error.message);
        }
    },

    continueAsGuest: async (): Promise<User> => {
        if (!isFirebaseReady || !auth) throw new Error("Firebase configuration missing.");
        
        try {
            // Pure Firebase Anonymous Auth - No fake local users
            const result = await signInAnonymously(auth);
            return mapUser(result.user);
        } catch (error: any) {
            console.error("Guest Auth Error", error);
            throw new Error("Could not start guest session.");
        }
    },

    logout: async () => {
        if (isFirebaseReady && auth) {
            await signOut(auth);
        }
    },

    onAuthStateChanged: (callback: (user: User | null) => void) => {
        if (isFirebaseReady && auth) {
            return onAuthStateChanged(auth, async (fbUser) => {
                if (fbUser) {
                    const appUser = await mapUser(fbUser);
                    callback(appUser);
                } else {
                    callback(null);
                }
            });
        }
        return () => {};
    }
};
