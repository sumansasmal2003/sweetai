// src/components/CheckoutModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Image as ImageIcon, Music, Loader2, Check } from "lucide-react";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
};

const PLANS = [
  { id: "starter", name: "Starter", credits: 100, price: 99, popular: false },
  { id: "pro", name: "Pro", credits: 500, price: 399, popular: true },
  { id: "ultra", name: "Ultra", credits: 1500, price: 999, popular: false },
];

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);

  // Dynamically load the Razorpay script
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Create order on your Next.js backend
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan.id, amount: selectedPlan.price }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Initialize Razorpay options
      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: "INR",
        name: "Sweet AI",
        description: `${selectedPlan.credits} Credits Top-up`,
        order_id: data.order.id,
        handler: async function (response: any) {
          // 3. Verify Payment on your backend
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              addedCredits: selectedPlan.credits
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            onSuccess(verifyData.credits);
            onClose();
          } else {
            alert("Payment verification failed.");
          }
        },
        theme: { color: "#4b90ff" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(response.error.description);
      });
      rzp.open();

    } catch (error) {
      console.error("Payment init error:", error);
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-[#444746] rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col md:flex-row"
          >
            {/* Left Side: Pricing Info */}
            <div className="flex-1 p-6 md:p-8 bg-gray-50 dark:bg-[#131314] border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#444746]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-semibold text-gray-900 dark:text-[#e3e3e3] flex items-center gap-2">
                  <Sparkles className="text-[#4b90ff]" /> Get Credits
                </h2>
                <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-[#c4c7c5] dark:hover:text-[#e3e3e3] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <p className="text-[14px] text-gray-600 dark:text-[#c4c7c5] mb-6 leading-relaxed">
                Sweet AI operates on a pay-as-you-go model. Top up your balance to keep generating premium content. No monthly subscriptions!
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1e1f20] rounded-xl border border-gray-200 dark:border-[#444746]">
                  <div className="flex items-center gap-3"><Zap size={16} className="text-[#4b90ff]"/> <span className="text-[14px] font-medium dark:text-[#e3e3e3]">Text (Qwen 3B / Web)</span></div>
                  <span className="text-[13px] font-bold text-gray-500 dark:text-[#c4c7c5]">1 Credit</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1e1f20] rounded-xl border border-gray-200 dark:border-[#444746]">
                  <div className="flex items-center gap-3"><ImageIcon size={16} className="text-[#ff5546]"/> <span className="text-[14px] font-medium dark:text-[#e3e3e3]">Image (FLUX.1 8K)</span></div>
                  <span className="text-[13px] font-bold text-gray-500 dark:text-[#c4c7c5]">5 Credits</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1e1f20] rounded-xl border border-gray-200 dark:border-[#444746]">
                  <div className="flex items-center gap-3"><Music size={16} className="text-[#137333] dark:text-[#81c995]"/> <span className="text-[14px] font-medium dark:text-[#e3e3e3]">Music (MusicGen)</span></div>
                  <span className="text-[13px] font-bold text-gray-500 dark:text-[#c4c7c5]">10 Credits</span>
                </div>
              </div>
            </div>

            {/* Right Side: Plans & Checkout */}
            <div className="flex-1 p-6 md:p-8 bg-white dark:bg-[#1e1f20] relative">
              <button onClick={onClose} className="hidden md:block absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:text-[#c4c7c5] dark:hover:text-[#e3e3e3] rounded-full hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-[16px] font-medium text-gray-900 dark:text-[#e3e3e3] mb-4 mt-2">Select a Top-up Amount</h3>

              <div className="space-y-3 mb-8">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 relative ${
                      selectedPlan.id === plan.id
                        ? "border-[#4b90ff] bg-[#4b90ff]/5"
                        : "border-gray-200 dark:border-[#444746] hover:border-gray-300 dark:hover:border-[#5f6368]"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-4 bg-gradient-to-r from-[#4b90ff] to-[#ff5546] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan.id === plan.id ? "border-[#4b90ff] bg-[#4b90ff]" : "border-gray-300 dark:border-[#5f6368]"}`}>
                        {selectedPlan.id === plan.id && <Check size={12} className="text-white" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-[15px] font-bold ${selectedPlan.id === plan.id ? "text-[#4b90ff]" : "text-gray-900 dark:text-[#e3e3e3]"}`}>{plan.credits} Credits</p>
                      </div>
                    </div>
                    <span className="text-[16px] font-bold text-gray-900 dark:text-[#e3e3e3]">₹{plan.price}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-3.5 bg-gray-900 dark:bg-[#e3e3e3] text-white dark:text-[#131314] rounded-full text-[15px] font-bold hover:bg-gray-800 dark:hover:bg-[#c4c7c5] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><Sparkles size={18}/> Pay ₹{selectedPlan.price} Securely</>}
              </button>
              <p className="text-center text-[11px] text-gray-500 dark:text-[#c4c7c5] mt-3">Secured by Razorpay. All transactions are encrypted.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
