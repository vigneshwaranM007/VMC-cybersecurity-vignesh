import React from "react";
import { Shield, Check, X, AlertCircle, Lock, Hash, Terminal, History as HistoryIcon, Activity, RefreshCcw } from "lucide-react";
import { checkPasswordStrength, StrengthResult } from "../utils/strength";
import { generateSalt, hashPassword } from "../utils/crypto";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, limit, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "motion/react";
import { dictionaryAttack, bruteForceAttack } from "../utils/cracker";
import { encryptMessage, decryptMessage } from "../utils/crypto";

// --- Components ---

export const SessionInfo: React.FC = () => {
  const [user] = useAuthState(auth);

  if (!user) return null;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={user.photoURL || ""} alt="" className="w-12 h-12 rounded-full border-2 border-emerald-500/50" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
              <Check className="w-2 h-2 text-black" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm">{user.displayName}</h3>
            <p className="text-xs text-white/40 font-mono">{user.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1">Session Active</p>
          <div className="flex items-center gap-2 justify-end">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-white/40">UID: {user.uid.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PasswordGenerator: React.FC = () => {
  const [length, setLength] = React.useState(16);
  const [includeUpper, setIncludeUpper] = React.useState(true);
  const [includeLower, setIncludeLower] = React.useState(true);
  const [includeNumbers, setIncludeNumbers] = React.useState(true);
  const [includeSymbols, setIncludeSymbols] = React.useState(true);
  const [generatedPassword, setGeneratedPassword] = React.useState("");

  const generate = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let chars = "";
    if (includeUpper) chars += upper;
    if (includeLower) chars += lower;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;
    
    if (!chars) return;
    
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(result);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <RefreshCcw className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Vault Generator</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-white/40">
            <span>Password Length</span>
            <span>{length}</span>
          </div>
          <input 
            type="range" 
            min="8" 
            max="64" 
            value={length} 
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Uppercase", state: includeUpper, set: setIncludeUpper },
            { label: "Lowercase", state: includeLower, set: setIncludeLower },
            { label: "Numbers", state: includeNumbers, set: setIncludeNumbers },
            { label: "Symbols", state: includeSymbols, set: setIncludeSymbols },
          ].map((opt, i) => (
            <button 
              key={i}
              onClick={() => opt.set(!opt.state)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${opt.state ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' : 'bg-white/5 border-white/10 text-white/40'}`}
            >
              {opt.state ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-5 h-5" />
          GENERATE SECURE PASSWORD
        </button>

        <AnimatePresence>
          {generatedPassword && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-blue-500 break-all pr-12">
                {generatedPassword}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(generatedPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                title="Copy to clipboard"
              >
                <Hash className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const EncryptionTool: React.FC = () => {
  const [mode, setMode] = React.useState<"encrypt" | "decrypt">("encrypt");
  const [text, setText] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");
  const [output, setOutput] = React.useState("");

  const process = () => {
    if (mode === "encrypt") {
      setOutput(encryptMessage(text, passphrase));
    } else {
      setOutput(decryptMessage(text, passphrase) || "Decryption failed: Invalid passphrase or corrupted data.");
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Lock className="w-6 h-6 text-purple-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">AES Vault</h2>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button 
            onClick={() => setMode("encrypt")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === "encrypt" ? 'bg-purple-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            ENCRYPT
          </button>
          <button 
            onClick={() => setMode("decrypt")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === "decrypt" ? 'bg-purple-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            DECRYPT
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === "encrypt" ? "Enter message to encrypt..." : "Enter ciphertext to decrypt..."}
            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
          <div className="relative">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Master Passphrase"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          </div>
        </div>

        <button
          onClick={process}
          disabled={!text || !passphrase}
          className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {mode === "encrypt" ? <Lock className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
          {mode === "encrypt" ? "ENCRYPT MESSAGE" : "DECRYPT MESSAGE"}
        </button>

        <AnimatePresence>
          {output && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-mono text-purple-500 uppercase tracking-widest">Result</label>
              <div className="w-full bg-black/40 border border-purple-500/20 rounded-xl px-4 py-4 font-mono text-sm text-white/80 break-all max-h-32 overflow-y-auto">
                {output}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const StrengthChecker: React.FC = () => {
  const [password, setPassword] = React.useState("");
  const [result, setResult] = React.useState<StrengthResult | null>(null);
  const [user] = useAuthState(auth);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (password) {
      setResult(checkPasswordStrength(password));
    } else {
      setResult(null);
    }
  }, [password]);

  const saveCheck = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const salt = generateSalt();
      const hash = hashPassword(password, salt);
      await addDoc(collection(db, "passwordChecks"), {
        userId: user.uid,
        passwordHash: hash,
        salt,
        strength: result.strength,
        score: result.score,
        timestamp: Date.now(),
        metadata: result.metadata,
      });
      setPassword("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "passwordChecks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Shield className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Strength Validator</h2>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to analyze..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
          />
          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6"
            >
              {/* Score Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-white/40">
                  <span>Security Score</span>
                  <span className={result.strength === "Strong" ? "text-emerald-500" : result.strength === "Medium" ? "text-yellow-500" : "text-red-500"}>
                    {result.score} / 10
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.score / 10) * 100}%` }}
                    className={`h-full transition-all ${
                      result.strength === "Strong" ? "bg-emerald-500" : result.strength === "Medium" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Length (8+)", met: result.metadata.length >= 8 },
                  { label: "Uppercase", met: result.metadata.hasUpper },
                  { label: "Lowercase", met: result.metadata.hasLower },
                  { label: "Numbers", met: result.metadata.hasNumber },
                  { label: "Symbols", met: result.metadata.hasSymbol },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${item.met ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                    {item.met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {result.feedback.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-500 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Recommendations</span>
                  </div>
                  <ul className="space-y-1">
                    {result.feedback.map((f, i) => (
                      <li key={i} className="text-sm text-white/60 flex items-center gap-2">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {user && (
                <button
                  onClick={saveCheck}
                  disabled={saving}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Activity className="w-4 h-4 animate-spin" /> : <HistoryIcon className="w-4 h-4" />}
                  LOG TO SECURE HISTORY
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const CrackerSimulation: React.FC = () => {
  const [target, setTarget] = React.useState("");
  const [salt, setSalt] = React.useState("");
  const [cracking, setCracking] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [type, setType] = React.useState<"dictionary" | "brute">("dictionary");

  const startCracking = async () => {
    if (!target) return;
    setCracking(true);
    setResult(null);
    setProgress(0);

    try {
      let wordlist = ["password", "123456", "admin", "welcome", "qwerty", "letmein", "monkey", "dragon", "football", "soccer"];
      
      try {
        const response = await fetch("/wordlist.txt");
        if (response.ok) {
          const text = await response.text();
          wordlist = text.split("\n").map(w => w.trim()).filter(w => w.length > 0);
        }
      } catch (e) {
        console.warn("Could not load wordlist.txt, using fallback.");
      }

      if (type === "dictionary") {
        const found = await dictionaryAttack(target, salt, wordlist, (i) => setProgress(i));
        setResult(found);
      } else {
        const found = await bruteForceAttack(target, salt, 4, (c) => setProgress(c));
        setResult(found);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCracking(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <Terminal className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Attack Simulator</h2>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button 
            onClick={() => setType("dictionary")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === "dictionary" ? 'bg-red-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            DICTIONARY
          </button>
          <button 
            onClick={() => setType("brute")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === "brute" ? 'bg-red-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            BRUTE FORCE
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Target Hash (SHA-256)</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Salt (Optional)</label>
            <input
              type="text"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="Enter salt if used..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>

        <button
          onClick={startCracking}
          disabled={cracking || !target}
          className="w-full py-4 bg-red-500 hover:bg-red-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {cracking ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Terminal className="w-5 h-5" />}
          {cracking ? "CRACKING IN PROGRESS..." : "EXECUTE ATTACK"}
        </button>

        <AnimatePresence>
          {cracking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-[10px] font-mono text-red-500 uppercase tracking-widest">
                <span>Analyzing Combinations</span>
                <span>{progress.toLocaleString()} attempts</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-1/2 h-full bg-red-500"
                />
              </div>
            </motion.div>
          )}

          {result !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border ${result ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {result ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                <span className={`text-xs font-bold uppercase tracking-wider ${result ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result ? "SUCCESS: PASSWORD CRACKED" : "FAILURE: EXHAUSTED WORDLIST"}
                </span>
              </div>
              {result && (
                <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-lg text-center text-emerald-500">
                  {result}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const SecureMessenger: React.FC = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "messages");
    });
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        content: newMessage.trim(),
        timestamp: Date.now(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Message error:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col h-[500px]">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold tracking-tight">Secure Messenger</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Channel</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 text-center">
            <Shield className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm">No messages in this secure channel.</p>
            <p className="text-[10px] uppercase tracking-widest mt-1">Encrypted end-to-end</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''}`}
            >
              <img src={msg.senderPhoto || ""} alt="" className="w-8 h-8 rounded-full border border-white/10" />
              <div className={`max-w-[80%] space-y-1 ${msg.senderId === user?.uid ? 'items-end' : ''}`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold text-white/40">{msg.senderName}</span>
                  <span className="text-[9px] font-mono text-white/20">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  msg.senderId === user?.uid 
                    ? 'bg-emerald-500 text-black font-medium rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user ? "Type a secure message..." : "Sign in to join the conversation"}
            disabled={!user || sending}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-12"
          />
          <button
            type="submit"
            disabled={!user || !newMessage.trim() || sending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/20"
          >
            {sending ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export const History: React.FC = () => {
  const [user] = useAuthState(auth);
  const [checks, setChecks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setChecks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "passwordChecks"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChecks(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "passwordChecks");
    });

    return () => unsubscribe();
  }, [user]);

  const deleteCheck = async (id: string) => {
    try {
      await deleteDoc(doc(db, "passwordChecks", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `passwordChecks/${id}`);
    }
  };

  if (!user) return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
      <Lock className="w-12 h-12 text-white/10 mx-auto mb-4" />
      <h3 className="text-lg font-bold mb-2">Secure History Locked</h3>
      <p className="text-sm text-white/40">Sign in to view and manage your password security history.</p>
    </div>
  );

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold tracking-tight">Security History</h2>
        </div>
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Last 10 Checks</span>
      </div>

      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="p-12 text-center text-white/20 animate-pulse">Loading secure records...</div>
        ) : checks.length === 0 ? (
          <div className="p-12 text-center text-white/20">No security records found.</div>
        ) : (
          checks.map((check) => (
            <div key={check.id} className="p-6 hover:bg-white/5 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    check.strength === "Strong" ? "bg-emerald-500" : check.strength === "Medium" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <span className="text-sm font-bold">{check.strength}</span>
                  <span className="text-[10px] font-mono text-white/40">{new Date(check.timestamp).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => deleteCheck(check.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">SHA-256 Hash</label>
                  <div className="text-[11px] font-mono text-white/60 break-all bg-black/20 p-2 rounded border border-white/5">
                    {check.passwordHash}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Salt</label>
                    <div className="text-[11px] font-mono text-white/60 truncate bg-black/20 p-2 rounded border border-white/5">
                      {check.salt}
                    </div>
                  </div>
                  <div className="space-y-1 w-24">
                    <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Score</label>
                    <div className="text-[11px] font-mono text-white/60 text-center bg-black/20 p-2 rounded border border-white/5">
                      {check.score}/10
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
