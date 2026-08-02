import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  signInAnonymously 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { CandidateProfile } from "../types";
import { initialProfile, initialJobs } from "../data/mockData";

interface AuthContextType {
  user: User | null;
  profile: CandidateProfile;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemoUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileInDb: (newProfile: Partial<CandidateProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(initialProfile);
  const [loading, setLoading] = useState(true);

  // Sync or create user profile document in Firestore
  const ensureUserProfile = async (firebaseUser: User, customName?: string) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const derivedName = customName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "");
      const formattedName = derivedName 
        ? derivedName.split(/[._-]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
        : "Guest User";

      if (!userSnap.exists()) {
        const newProfile: CandidateProfile = {
          ...initialProfile,
          fullName: formattedName,
          email: firebaseUser.email || "",
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(userSnap.data() as CandidateProfile);
      }
    } catch (err) {
      console.error("Error ensuring user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await ensureUserProfile(firebaseUser);

        // Listen for real-time user profile updates from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as CandidateProfile);
            }
          },
          (err) => {
            console.warn("User profile snapshot listener notice:", err.message);
          }
        );

        setLoading(false);
        return () => unsubscribeProfile();
      } else {
        setProfile(initialProfile);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string) => {
    setLoading(true);
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await ensureUserProfile(res.user, fullName);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const res = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(res.user);
  };

  const signInDemoUser = async () => {
    setLoading(true);
    const res = await signInAnonymously(auth);
    await ensureUserProfile(res.user, "Alex Rivera (Demo Account)");
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfileInDb = async (newProfileData: Partial<CandidateProfile>) => {
    const updated = {
      ...profile,
      ...newProfileData,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setProfile(updated);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, updated, { merge: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInDemoUser,
        logout,
        updateProfileInDb,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
