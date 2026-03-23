import React from "react";
import { Layout } from "./components/Layout";
import { StrengthChecker, CrackerSimulation, History, PasswordGenerator, EncryptionTool, SessionInfo, SecureMessenger } from "./components/Features";
import { Shield, Lock, Terminal, Activity, Info, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { motion } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const App: React.FC = () => {
  const [insight, setInsight] = React.useState<string>("");
  const [loadingInsight, setLoadingInsight] = React.useState(false);

  const fetchInsight = async () => {
    const ai = getAi();
    if (!ai) {
      setInsight("Security Tip: Use a password manager to generate and store complex, unique passwords for all your online accounts.");
      return;
    }
    setLoadingInsight(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Give a brief, punchy cybersecurity tip about password security or encryption. Keep it under 100 words. Use markdown for formatting.",
      });
      setInsight(response.text || "Always use a unique password for every account and enable multi-factor authentication whenever possible.");
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("429")) {
        console.warn("Gemini quota exceeded for security insight.");
        setInsight("Security Tip: Always use a unique password for every account and enable multi-factor authentication whenever possible. (AI insights are temporarily unavailable due to high demand)");
      } else {
        console.error(error);
        setInsight("Security Tip: Use a password manager to generate and store complex, unique passwords for all your online accounts.");
      }
    } finally {
      setLoadingInsight(false);
    }
  };

  React.useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Live Security Intelligence
            </div>
            <h1 className="text-6xl font-bold tracking-tighter leading-[0.9]">
              SECURE YOUR <br />
              <span className="text-emerald-500">DIGITAL IDENTITY</span>
            </h1>
            <p className="text-lg text-white/60 max-w-lg leading-relaxed">
              VMC Sentinel provides advanced cryptographic analysis, password strength validation, and ethical attack simulations to fortify your security posture.
            </p>
            

          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Activity className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">AI Security Insight</span>
                </div>
                <button 
                  onClick={fetchInsight}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="min-h-[120px] prose prose-invert prose-sm max-w-none">
                {loadingInsight ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                ) : (
                  <ReactMarkdown>{insight}</ReactMarkdown>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                {[
                  { label: "Encrypted", icon: Lock, color: "text-emerald-500" },
                  { label: "Verified", icon: CheckCircle2, color: "text-blue-500" },
                  { label: "Protected", icon: Shield, color: "text-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="text-center space-y-2">
                    <item.icon className={`w-5 h-5 mx-auto ${item.color}`} />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Session Info */}
        <SessionInfo />

        {/* Main Tools */}
        <section className="grid md:grid-cols-2 gap-8">
          <StrengthChecker />
          <CrackerSimulation />
          <PasswordGenerator />
          <EncryptionTool />
        </section>

        {/* Secure Messenger */}
        <section>
          <SecureMessenger />
        </section>

        {/* History Section */}
        <section>
          <History />
        </section>

        {/* Educational Section */}
        <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-12 text-center space-y-6">
          <AlertTriangle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-3xl font-bold tracking-tight">Ethical Security Disclaimer</h2>
          <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
            The Password Cracker simulation is provided for <strong>educational purposes only</strong>. Understanding how attacks work is the first step in building stronger defenses. Never attempt to crack passwords you do not own or have explicit permission to test.
          </p>

        </section>
      </div>
    </Layout>
  );
};

export default App;
