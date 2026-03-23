import React from "react";
import { Shield, Lock, Terminal, Activity, History as HistoryIcon, LogOut, User } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { generateBackgroundPrompt, generateImage } from "../services/geminiService";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user] = useAuthState(auth);
  const [bgImage, setBgImage] = React.useState<string>("https://picsum.photos/seed/cybersecurity/1920/1080");
  const [loadingBg, setLoadingBg] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.error("Error updating user document:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const updateBackground = async () => {
    setLoadingBg(true);
    try {
      const prompt = await generateBackgroundPrompt("cybersecurity, hacking, digital fortress");
      const imageUrl = await generateImage(prompt);
      setBgImage(imageUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBg(false);
    }
  };

  React.useEffect(() => {
    updateBackground();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 10, 0.8), rgba(10, 10, 10, 0.95)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: loadingBg ? 0.5 : 1
        }}
      />

      {/* Grid Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">VMC SENTINEL</h1>
              <p className="text-[10px] text-emerald-500 font-mono tracking-[0.2em] uppercase">Cybersecurity Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <img src={user.photoURL || ""} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-sm font-medium">{user.displayName}</span>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await signInWithPopup(auth, googleProvider);
                  } catch (error: any) {
                    console.error("Sign in error:", error);
                    if (error.code === 'auth/popup-blocked') {
                      alert("Please allow popups for this site to sign in.");
                    } else if (error.code === 'auth/unauthorized-domain') {
                      const domains = [
                        window.location.hostname,
                        "ais-dev-krsfhpjdgckprvwhhatsdd-499685025183.asia-east1.run.app",
                        "ais-pre-krsfhpjdgckprvwhhatsdd-499685025183.asia-east1.run.app"
                      ];
                      alert(
                        "UNAUTHORIZED DOMAIN ERROR\n\n" +
                        "You must add these domains to your Firebase Console (Authentication > Settings > Authorized domains):\n\n" +
                        domains.join("\n")
                      );
                    } else {
                      alert("Sign in failed: " + error.message);
                    }
                  }
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                SIGN IN
              </button>
            )}
            <button 
              onClick={updateBackground}
              disabled={loadingBg}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all disabled:opacity-50"
              title="Refresh AI Background"
            >
              <Activity className={`w-5 h-5 ${loadingBg ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Shield className="w-4 h-4" />
            <span>© 2026 VMC Cybersecurity. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs font-mono text-white/40 uppercase tracking-widest">
            <a href="#" className="hover:text-emerald-500 transition-colors">Protocol</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Encryption</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
