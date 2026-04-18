"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (isLogin) {
        onSuccess(data.user);
        onClose();
      } else {
        // Automatically switch to login mode after successful registration
        setIsLogin(true);
        setFormData({ ...formData, password: "" });
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#1e1f20] border border-[#444746] rounded-[24px] shadow-2xl overflow-hidden relative font-sans"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <h2 className="text-[24px] font-medium text-[#e3e3e3] mb-2">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-[#c4c7c5] text-[14px] mb-6">
                {isLogin ? "Enter your details to access your chats." : "Sign up to start saving your Sweet AI conversations."}
              </p>

              {error && (
                <div className={`p-3.5 rounded-2xl mb-6 text-[14px] font-medium ${
                  error.includes("successful")
                    ? "bg-[#81c995]/10 text-[#81c995] border border-[#81c995]/20"
                    : "bg-[#ff5546]/10 text-[#ff5546] border border-[#ff5546]/20"
                }`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <UserIcon className="absolute left-4 top-3.5 text-[#c4c7c5]" size={18} />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                        className="w-full bg-[#131314] border border-[#444746] rounded-2xl pl-11 pr-4 py-3.5 text-[15px] text-[#e3e3e3] placeholder-[#c4c7c5]/60 focus:outline-none focus:border-[#a8c7fa] transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-[#c4c7c5]" size={18} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full bg-[#131314] border border-[#444746] rounded-2xl pl-11 pr-4 py-3.5 text-[15px] text-[#e3e3e3] placeholder-[#c4c7c5]/60 focus:outline-none focus:border-[#a8c7fa] transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-[#c4c7c5]" size={18} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full bg-[#131314] border border-[#444746] rounded-2xl pl-11 pr-4 py-3.5 text-[15px] text-[#e3e3e3] placeholder-[#c4c7c5]/60 focus:outline-none focus:border-[#a8c7fa] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#a8c7fa] text-[#041e49] rounded-2xl py-3.5 font-medium hover:bg-[#b9d3fa] transition-all duration-200 disabled:opacity-70 flex items-center justify-center mt-6 text-[15px]"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : isLogin ? "Sign In" : "Sign Up"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-[14px] text-[#a8c7fa] hover:text-[#b9d3fa] transition-colors font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
