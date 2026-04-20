"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Menu, Plus, MessageSquare, LogIn, LogOut, Compass, Pencil, Trash2, Check, X, Copy, Globe, Image as ImageIcon, Paperclip, FileText, ChevronDown, Code2, GraduationCap, Share2, Search, Music, Link as LinkIcon, Loader2, BookOpen, Terminal, Leaf, Calculator, Settings, Sun, Moon, Monitor, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import { useTheme } from "next-themes";

type Message = { id: string; role: "user" | "ai"; text: string; sources?: {title: string, url: string}[]; status?: string };
type ChatHistoryItem = { _id: string; title: string };

const ALL_SUGGESTIONS = [
  { title: "Implement Framer Motion", subtitle: "in a Next.js project", prompt: "Can you explain how to implement page transitions using Framer Motion in a Next.js App Router project?", icon: <Sparkles size={18} className="text-[#4b90ff] dark:text-[#a8c7fa]" /> },
  { title: "Sukumar Ray's literature", subtitle: "summarize his unique style", prompt: "Write a short paragraph summarizing the unique literary style and humor of Bengali author Sukumar Ray.", icon: <BookOpen size={18} className="text-[#ff5546] dark:text-[#f28b82]" /> },
  { title: "Growing tomatoes & coriander", subtitle: "best practices for home gardens", prompt: "What are the best seasonal tips and soil practices for growing healthy tomatoes and coriander in a home garden?", icon: <Leaf size={18} className="text-[#137333] dark:text-[#81c995]" /> },
  { title: "MongoDB Aggregation", subtitle: "complex data pipelines", prompt: "Explain how to write a MongoDB aggregation pipeline to filter, group, and sort a large dataset of service providers.", icon: <Terminal size={18} className="text-[#f9ab00] dark:text-[#fde293]" /> },
  { title: "Tailwind CSS layouts", subtitle: "building responsive dashboards", prompt: "What is the best way to structure a responsive sidebar and main content area layout using Tailwind CSS?", icon: <Code2 size={18} className="text-[#4b90ff] dark:text-[#a8c7fa]" /> },
  { title: "Bibhutibhusan Bandopadhyay", subtitle: "key themes in his novels", prompt: "What are the central themes regarding nature and human life in the writings of Bibhutibhusan Bandopadhyay?", icon: <Compass size={18} className="text-[#ff5546] dark:text-[#f28b82]" /> },
  { title: "Jagadish Chandra Bose", subtitle: "his scientific legacy", prompt: "Summarize the major scientific contributions of Jagadish Chandra Bose in the fields of plant biology and radio waves.", icon: <GraduationCap size={18} className="text-[#137333] dark:text-[#81c995]" /> },
  { title: "English Grammar", subtitle: "Active to Passive voice", prompt: "Explain the rules for converting Active Voice to Passive Voice in English grammar. Provide the explanations in Bengali but keep the grammar terms in English.", icon: <BookOpen size={18} className="text-[#f9ab00] dark:text-[#fde293]" /> },
  { title: "Advanced Mathematics", subtitle: "explain calculus simply", prompt: "Explain the fundamental concept of a derivative in calculus as if I am a beginner learning basic algebra.", icon: <Calculator size={18} className="text-[#4b90ff] dark:text-[#a8c7fa]" /> },
  { title: "Web Scraping", subtitle: "using Puppeteer securely", prompt: "What are the best practices for setting up Puppeteer in a Node.js backend to scrape dynamic websites without getting blocked?", icon: <Terminal size={18} className="text-[#ff5546] dark:text-[#f28b82]" /> }
];

const PERSONAS = [
  { id: "Default", name: "Sweet AI", icon: <Sparkles size={14} className="text-[#4b90ff] dark:text-[#a8c7fa]" /> },
  { id: "Technical Interviewer", name: "Interviewer", icon: <Code2 size={14} className="text-[#ff5546] dark:text-[#f28b82]" /> },
  { id: "Educational Tutor", name: "Tutor", icon: <GraduationCap size={14} className="text-[#137333] dark:text-[#81c995]" /> },
  { id: "Dashboard Copilot", name: "Copilot", icon: <Terminal size={14} className="text-[#f9ab00] dark:text-[#fde293]" /> }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [chatTitle, setChatTitle] = useState("New Chat");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [mode, setMode] = useState<"chat" | "image" | "music">("chat");

  const [searchQuery, setSearchQuery] = useState("");
  const [persona, setPersona] = useState("Default");
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string} | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [webSearch, setWebSearch] = useState(false);

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Updated user state to include credits
  const [user, setUser] = useState<{ name: string; email: string; credits: number } | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [currentSuggestions, setCurrentSuggestions] = useState<typeof ALL_SUGGESTIONS>([]);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffled.slice(0, 4));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    if (typeof window !== "undefined" && window.innerWidth < 768) setIsSidebarOpen(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const loadChatHistory = async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.chats || []);
      }
    } catch (e) { console.error("Failed to load history", e); }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          loadChatHistory();
        }
      })
      .catch(() => console.log("Not logged in"));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setChatHistory([]);
    startNewChat();
  };

  const loadSpecificChat = async (id: string) => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    try {
      const res = await fetch(`/api/chats?chatId=${id}`);
      const data = await res.json();
      if (data.chat) {
        setMessages(data.chat.messages);
        setChatTitle(data.chat.title);
        setCurrentChatId(data.chat._id);
        setMode("chat");
      }
    } catch (error) { console.error("Failed to load chat", error); }
  };

  const startNewChat = () => {
    setMessages([]);
    setChatTitle("New Chat");
    setCurrentChatId(null);
    setAttachedFile(null);
    setShowLinkInput(false);

    const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
    setCurrentSuggestions(shuffled.slice(0, 4));

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await fetch(`/api/chats?chatId=${id}`, { method: "DELETE" });
      setChatHistory((prev) => prev.filter((chat) => chat._id !== id));
      if (currentChatId === id) startNewChat();
    } catch (error) { console.error("Failed to delete chat", error); }
  };

  const startEditingChat = (id: string, currentTitle: string) => {
    setEditingChatId(id);
    setEditTitleValue(currentTitle);
  };

  const handleSaveEditChat = async (id: string) => {
    if (!editTitleValue.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: id, title: editTitleValue }),
      });
      setChatHistory((prev) => prev.map((chat) => (chat._id === id ? { ...chat, title: editTitleValue } : chat)));
      if (currentChatId === id) setChatTitle(editTitleValue);
      setEditingChatId(null);
    } catch (error) { console.error("Failed to update title", error); }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareChat = async () => {
    if (!currentChatId) return;
    try {
      const res = await fetch('/api/chats/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId })
      });
      if (!res.ok) {
        alert("Failed to generate share link. Please try again.");
        return;
      }
      const shareUrl = `${window.location.origin}/share/${currentChatId}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopiedId('share');
      setTimeout(() => setCopiedId(null), 3000);
    } catch (error) {
      console.error("Share process failed:", error);
    }
  };

  const handleSuggestionClick = (prompt: string) => setInput(prompt);

  const generateTitle = (promptText: string, targetChatId: string | null) => {
    fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText, chatId: targetChatId }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.title) {
        setChatTitle(data.title);
        loadChatHistory();
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && file.type !== "application/pdf") {
      alert("Please upload a .txt or .pdf file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsFileUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setAttachedFile({ name: file.name, data: base64String });
      setIsFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setIsFileUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleScrape = async () => {
    if (!linkUrl.trim()) return;
    setIsScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl }),
      });
      if (!res.ok) throw new Error("Failed to scrape");
      const data = await res.json();
      setAttachedFile({ name: data.title, data: data.base64Data });
      setShowLinkInput(false);
      setLinkUrl("");
    } catch (error) {
      alert("Could not scrape the URL. The site might be blocking bots.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFileUploading || isScraping) return;

    const currentInput = input;
    const isFirstMessage = messages.length === 0;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: currentInput };
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMsg: Message = { id: aiMessageId, role: "ai", text: "", status: "Initializing Engine..." };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    setInput("");

    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const chatHistoryPayload = messages.slice(-10).map(msg => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    try {
      const endpoint = mode === "image" ? "/api/image" : mode === "music" ? "/api/music" : "/api/ask";

      const payload: any = {
        prompt: currentInput,
        chatId: currentChatId,
      };

      if (mode === "chat") {
        payload.webSearch = webSearch;
        payload.fileData = attachedFile?.data || "";
        payload.fileName = attachedFile?.name || "";
        payload.persona = persona;
        payload.history = chatHistoryPayload;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setAttachedFile(null);

      // --- OUT OF CREDITS CHECKER ---
      if (res.status === 402) {
        setIsLoading(false);
        setIsCheckoutModalOpen(true);
        // Remove the "Thinking..." dummy message
        setMessages((prev) => prev.filter(msg => msg.id !== aiMessageId));
        return;
      }

      if (!res.ok) throw new Error("Network response was not ok");

      const returnedChatId = res.headers.get('X-Chat-Id') || currentChatId;
      if (!currentChatId && returnedChatId) setCurrentChatId(returnedChatId);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataObj = JSON.parse(line.slice(6));

                setMessages((prev) =>
                  prev.map(msg => {
                    if (msg.id === aiMessageId) {
                      if (dataObj.token !== undefined) {
                        return { ...msg, text: msg.text + dataObj.token, status: undefined };
                      }
                      if (dataObj.sources !== undefined) {
                        return { ...msg, sources: dataObj.sources };
                      }
                      if (dataObj.status !== undefined) {
                        return { ...msg, status: dataObj.status };
                      }
                      if (dataObj.reply !== undefined) {
                        if (!currentChatId && dataObj.chatId) setCurrentChatId(dataObj.chatId);
                        return { ...msg, text: dataObj.reply, status: undefined };
                      }
                    }
                    return msg;
                  })
                );
              } catch (e) {}
            }
          }
        }
      }

      if (isFirstMessage) generateTitle(currentInput, currentChatId || returnedChatId);

      // Update local credit balance by fetching user data again silently
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.user && user) setUser({ ...user, credits: data.user.credits });
        }).catch(() => {});

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map(msg => msg.id === aiMessageId ? { ...msg, text: "Error generating response.", status: undefined } : msg)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const decodeBase64Text = (dataUrl: string) => {
    try {
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return "Unable to generate preview for this document.";
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] dark:bg-[#131314] text-gray-900 dark:text-[#e3e3e3] overflow-hidden font-sans selection:bg-[#a8c7fa]/30 selection:text-gray-900 dark:selection:text-white relative transition-colors duration-300">

      {/* File Preview Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && attachedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={() => setIsPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl h-[85vh] bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-[#444746] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#444746] bg-gray-50 dark:bg-[#282a2c]">
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  {attachedFile.data.includes("application/pdf") ? (
                    <FileText size={20} className="text-[#ff5546] dark:text-[#f28b82] shrink-0" />
                  ) : attachedFile.name.includes("Scraped") || attachedFile.data.includes("URL SOURCE") ? (
                    <LinkIcon size={20} className="text-[#4b90ff] dark:text-[#a8c7fa] shrink-0" />
                  ) : (
                    <FileText size={20} className="text-[#4b90ff] dark:text-[#a8c7fa] shrink-0" />
                  )}
                  <h3 className="text-gray-900 dark:text-[#e3e3e3] font-medium text-[16px] truncate">{attachedFile.name}</h3>
                </div>
                <button onClick={() => setIsPreviewModalOpen(false)} className="p-1.5 text-gray-500 dark:text-[#c4c7c5] hover:text-[#ff5546] hover:bg-gray-200 dark:hover:bg-[#1e1f20] rounded-lg transition-colors cursor-pointer shrink-0">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden bg-[#f8f9fa] dark:bg-[#131314]">
                {attachedFile.data.includes('application/pdf') ? (
                  <iframe src={attachedFile.data} className="w-full h-full border-none" title="PDF Preview" />
                ) : (
                  <div className="w-full h-full overflow-y-auto p-6 text-gray-600 dark:text-[#c4c7c5] whitespace-pre-wrap font-mono text-[14px] leading-relaxed custom-scrollbar selection:bg-[#a8c7fa]/30 selection:text-gray-900 dark:selection:text-white">
                    {decodeBase64Text(attachedFile.data)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-20"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="fixed md:relative top-0 left-0 h-full bg-white dark:bg-[#1e1f20] border-r border-gray-200 dark:border-transparent flex flex-col whitespace-nowrap overflow-hidden z-30 shrink-0 shadow-2xl md:shadow-none transition-colors duration-300"
          >
            <div className="p-4 mt-2">
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 w-full px-4 py-3 bg-[#f8f9fa] dark:bg-[#131314] text-gray-900 dark:text-[#e3e3e3] hover:bg-gray-100 dark:hover:bg-[#282a2c] rounded-2xl font-medium transition-all duration-200 border border-gray-200 dark:border-[#444746]/50 cursor-pointer"
              >
                <Plus size={18} className="text-gray-500 dark:text-[#c4c7c5]" /> <span className="text-[14px]">New chat</span>
              </button>
            </div>

            {chatHistory.length > 0 && (
              <div className="px-4 mb-2">
                <div className="relative group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#c4c7c5] group-focus-within:text-[#4b90ff] dark:group-focus-within:text-[#a8c7fa] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f8f9fa] dark:bg-[#131314] text-gray-900 dark:text-[#e3e3e3] text-[13px] pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-[#444746]/50 focus:outline-none focus:border-[#4b90ff] dark:focus:border-[#a8c7fa] transition-all placeholder-gray-400 dark:placeholder-[#c4c7c5]/70"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#c4c7c5] hover:text-gray-700 dark:hover:text-[#e3e3e3] p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#444746] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar mt-2">
              <p className="text-[12px] font-medium text-gray-500 dark:text-[#c4c7c5] px-4 mb-3 uppercase tracking-wider">Recent</p>

              {filteredChats.length === 0 && searchQuery ? (
                <div className="px-4 py-3 text-center text-[13px] text-gray-500 dark:text-[#c4c7c5]">
                  No chats found for "{searchQuery}"
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-full transition-colors group ${currentChatId === chat._id ? "bg-gray-100 dark:bg-[#282a2c]" : "hover:bg-gray-50 dark:hover:bg-[#282a2c]"}`}
                  >
                    {editingChatId === chat._id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="w-full bg-[#f8f9fa] dark:bg-[#131314] text-gray-900 dark:text-[#e3e3e3] px-3 py-1 rounded-full text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4b90ff] dark:focus:ring-[#a8c7fa]"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditChat(chat._id)}
                        />
                        <button onClick={() => handleSaveEditChat(chat._id)} className="p-1 text-[#4b90ff] dark:text-[#a8c7fa] hover:text-blue-600 dark:hover:text-[#b9d3fa] cursor-pointer"><Check size={16}/></button>
                        <button onClick={() => setEditingChatId(null)} className="p-1 text-gray-500 dark:text-[#c4c7c5] hover:text-gray-900 dark:hover:text-[#e3e3e3] cursor-pointer"><X size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => loadSpecificChat(chat._id)} className="flex items-center gap-3 flex-1 text-left overflow-hidden cursor-pointer">
                          <MessageSquare size={16} className="text-gray-400 dark:text-[#c4c7c5] shrink-0" />
                          <span className="truncate text-[14px] text-gray-700 dark:text-[#e3e3e3]">{chat.title}</span>
                        </button>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditingChat(chat._id, chat.title); }}
                            className="p-1.5 text-gray-400 dark:text-[#c4c7c5] hover:text-gray-900 dark:hover:text-[#e3e3e3] transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-[#444746] cursor-pointer"
                            title="Rename"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat._id); }}
                            className="p-1.5 text-gray-400 dark:text-[#c4c7c5] hover:text-[#ff5546] transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-[#444746] cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}

              {!user && messages.length > 0 && !currentChatId && (
                <div className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-gray-700 dark:text-[#e3e3e3] bg-gray-100 dark:bg-[#282a2c] rounded-full transition-colors text-left group">
                  <MessageSquare size={16} className="text-gray-400 dark:text-[#c4c7c5] shrink-0" />
                  <span className="truncate">{chatTitle}</span>
                </div>
              )}
            </div>

            {user && (
              <div className="px-4 py-2">
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="flex items-center justify-between w-full px-3 py-2.5 bg-gradient-to-r from-[#4b90ff]/10 to-[#ff5546]/10 border border-[#4b90ff]/20 rounded-xl hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[#4b90ff] fill-[#4b90ff]/20" />
                    <span className="text-[13px] font-bold text-gray-800 dark:text-[#e3e3e3]">Balance</span>
                  </div>
                  <span className="text-[13px] font-bold text-gray-800 dark:text-[#e3e3e3]">{user.credits} CR</span>
                </button>
              </div>
            )}

            <div className="px-4 py-2 border-t border-gray-100 dark:border-[#444746]/50">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-[14px] font-medium text-gray-700 dark:text-[#c4c7c5] hover:bg-gray-100 dark:hover:bg-[#282a2c] rounded-full transition-colors"
              >
                <Settings size={18} /> Settings
              </button>
            </div>

            <div className="p-4 mb-2">
              {user ? (
                <div className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#282a2c] rounded-full p-2 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 px-2 truncate">
                    <div className="w-8 h-8 rounded-full bg-[#e8f0fe] dark:bg-[#a8c7fa] text-[#1a73e8] dark:text-[#041e49] flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-[14px] font-medium text-gray-900 dark:text-[#e3e3e3] truncate">{user.name}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-gray-500 dark:text-[#c4c7c5] md:opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-200 dark:hover:bg-[#444746]">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#e8f0fe] dark:bg-[#a8c7fa] text-[#1a73e8] dark:text-[#041e49] rounded-full text-[14px] font-medium hover:bg-[#d2e3fc] dark:hover:bg-[#b9d3fa] transition-all duration-200"
                >
                  <LogIn size={18} /> Sign In
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full relative w-full">
        <header className="absolute top-0 w-full p-3 md:p-4 flex items-center justify-between z-10 bg-gradient-to-b from-[#f8f9fa] dark:from-[#131314] via-[#f8f9fa]/90 dark:via-[#131314]/90 to-transparent">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 md:p-3 text-gray-500 dark:text-[#c4c7c5] rounded-full hover:bg-gray-200 dark:hover:bg-[#1e1f20] transition-colors"
            >
              <Menu size={22} />
            </button>
            <h1 className="ml-2 text-[20px] md:text-[22px] font-medium text-gray-800 dark:text-[#e3e3e3] tracking-wide">Sweet AI</h1>
          </div>

          <div className="flex items-center gap-2">
            {currentChatId && messages.length > 0 && (
               <button
                 onClick={handleShareChat}
                 className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#282a2c] rounded-full text-[12px] md:text-[13px] font-medium text-gray-600 dark:text-[#c4c7c5] transition-colors border border-gray-200 dark:border-[#444746]/50 shadow-sm dark:shadow-none"
                 title="Copy public link"
               >
                 {copiedId === 'share' ? <Check size={14} className="text-[#137333] dark:text-[#81c995]" /> : <Share2 size={14} />}
                 <span className="hidden sm:inline">{copiedId === 'share' ? "Copied!" : "Share"}</span>
               </button>
            )}

            <div className="relative">
              <button
                onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                disabled={messages.length > 0}
                className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#282a2c] rounded-full text-[12px] md:text-[13px] font-medium text-gray-600 dark:text-[#c4c7c5] transition-colors border border-gray-200 dark:border-[#444746]/50 shadow-sm dark:shadow-none ${messages.length > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                title={messages.length > 0 ? "Start a new chat to change persona" : "Select AI Persona"}
              >
                {PERSONAS.find(p => p.id === persona)?.icon}
                <span className="hidden sm:inline">{PERSONAS.find(p => p.id === persona)?.name}</span>
                <ChevronDown size={14} className={`transition-transform ${isPersonaMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isPersonaMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsPersonaMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 md:w-56 bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-[#444746] rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 p-2"
                    >
                      {PERSONAS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setPersona(p.id); setIsPersonaMenuOpen(false); }}
                          className={`flex items-center gap-3 w-full px-4 py-2.5 text-[13px] md:text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#282a2c] transition-colors rounded-xl ${persona === p.id ? 'bg-gray-100 dark:bg-[#282a2c] text-gray-900 dark:text-[#e3e3e3]' : 'text-gray-600 dark:text-[#c4c7c5]'}`}
                        >
                          <div className={`p-1.5 rounded-lg ${persona === p.id ? 'bg-white dark:bg-[#131314] shadow-sm dark:shadow-none' : 'bg-transparent'}`}>
                            {p.icon}
                          </div>
                          {p.name}
                          {persona === p.id && <Check size={14} className="ml-auto text-[#4b90ff] dark:text-[#a8c7fa]" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-24 md:pt-28 pb-36 md:pb-40 flex flex-col gap-6 md:gap-8 scroll-smooth custom-scrollbar w-full">
          {messages.length === 0 ? (
            <div className="m-auto flex flex-col items-center justify-center max-w-3xl px-2 w-full">
              <h2 className="text-[36px] md:text-[56px] font-medium mb-3 md:mb-4 tracking-tight leading-tight bg-gradient-to-r from-[#4b90ff] via-[#ff5546] to-[#4b90ff] text-transparent bg-clip-text text-center">
                Hello, {user ? user.name.split(" ")[0] : "there"}
              </h2>
              <p className="text-[32px] md:text-[56px] font-medium text-gray-400 dark:text-[#444746] leading-tight tracking-tight text-center mb-8 md:mb-12">
                How can I help you today?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
                {currentSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="flex flex-col items-start p-4 md:p-5 rounded-2xl bg-white dark:bg-[#1e1f20] hover:bg-gray-50 dark:hover:bg-[#282a2c] transition-colors border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-[#444746] shadow-sm dark:shadow-none text-left group w-full cursor-pointer"
                  >
                    <div className="mb-2 md:mb-3 p-2 rounded-full bg-gray-50 dark:bg-[#131314] group-hover:bg-white dark:group-hover:bg-[#1e1f20] transition-colors border border-gray-100 dark:border-transparent">
                      {suggestion.icon}
                    </div>
                    <span className="text-[14px] md:text-[15px] font-medium text-gray-800 dark:text-[#e3e3e3] mb-1">{suggestion.title}</span>
                    <span className="text-[13px] md:text-[14px] text-gray-500 dark:text-[#c4c7c5] line-clamp-2">{suggestion.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[800px] w-full mx-auto flex flex-col gap-8 md:gap-10">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 md:gap-5 w-full group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className={`w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full flex items-center justify-center mt-1 bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-zinc-800 dark:to-black shadow-md ${msg.text === "" && !msg.status ? "animate-pulse" : ""}`}>
                      <Sparkles size={14} className="text-white md:w-[16px] md:h-[16px]" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end max-w-[90%] md:max-w-[80%]" : "w-full items-start"}`}>

                    <div className={`text-[15px] md:text-[16px] leading-relaxed md:leading-loose ${
                      msg.role === "user"
                        ? "bg-gray-100 dark:bg-[#1e1f20] text-gray-900 dark:text-[#e3e3e3] px-5 py-3 md:px-6 rounded-[20px] md:rounded-[24px] border border-gray-200 dark:border-transparent"
                        : "text-gray-900 dark:text-[#e3e3e3] w-full pt-1"
                    }`}>
                      {msg.role === "user" ? (
                        msg.text
                      ) : msg.text === "" ? (
                        <div className="pt-1 flex items-center gap-3">
                          <Loader2 size={16} className="animate-spin text-[#4b90ff] dark:text-[#a8c7fa]" />
                          <span className="text-[15px] md:text-[16px] text-transparent bg-clip-text bg-gradient-to-r from-[#4b90ff] via-[#ff5546] to-[#4b90ff] bg-[length:200%_auto] animate-pulse font-medium">
                            {msg.status || "Thinking..."}
                          </span>
                        </div>
                      ) : msg.text.startsWith('data:audio') ? (
                        <div className="bg-white dark:bg-[#1e1f20] p-4 rounded-xl border border-gray-200 dark:border-[#444746] mt-2 shadow-lg w-full max-w-md">
                          <div className="flex items-center gap-3 mb-3">
                            <Music className="text-[#4b90ff] dark:text-[#a8c7fa]" size={20} />
                            <span className="text-gray-800 dark:text-[#e3e3e3] font-medium text-[15px]">Generated Music Track</span>
                          </div>
                          <audio controls className="w-full outline-none">
                            <source src={msg.text} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : msg.text.startsWith('data:image') ? (
                        <img src={msg.text} alt="Generated" className="rounded-xl mt-2 max-w-full h-auto border border-gray-200 dark:border-[#444746] shadow-md" />
                      ) : (
                        <div className="prose dark:prose-invert max-w-none prose-p:leading-loose prose-pre:bg-gray-100 dark:prose-pre:bg-[#1e1f20] prose-headings:text-gray-900 dark:prose-headings:text-[#e3e3e3] prose-strong:text-gray-900 dark:prose-strong:text-[#e3e3e3] prose-a:text-[#1a73e8] dark:prose-a:text-[#a8c7fa] prose-p:text-gray-800 dark:prose-p:text-[#e3e3e3] prose-p:text-[15px] md:prose-p:text-[16px]">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-4 md:mb-6 last:mb-0" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 md:pl-6 mb-4 md:mb-6 space-y-2 md:space-y-3 marker:text-gray-500 dark:marker:text-[#c4c7c5]" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 md:pl-6 mb-4 md:mb-6 space-y-2 md:space-y-3 marker:text-gray-500 dark:marker:text-[#c4c7c5]" {...props} />,
                              li: ({node, ...props}) => <li className="pl-1 md:pl-2" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-[#e3e3e3]" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-[20px] md:text-[24px] font-medium text-gray-900 dark:text-[#e3e3e3] mt-6 md:mt-8 mb-3 md:mb-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-[18px] md:text-[20px] font-medium text-gray-900 dark:text-[#e3e3e3] mt-6 md:mt-8 mb-3 md:mb-4" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-[16px] md:text-[18px] font-medium text-gray-900 dark:text-[#e3e3e3] mt-5 md:mt-6 mb-2 md:mb-3" {...props} />,
                              code: ({node, inline, ...props}: any) =>
                                inline
                                  ? <code className="bg-gray-100 dark:bg-[#1e1f20] text-[#1a73e8] dark:text-[#a8c7fa] px-1.5 py-0.5 rounded-md font-mono text-[13px] md:text-[14px] border border-gray-200 dark:border-transparent" {...props} />
                                  : <code className="block bg-gray-100 dark:bg-[#1e1f20] text-gray-800 dark:text-[#e3e3e3] p-4 md:p-6 rounded-2xl font-mono text-[13px] md:text-[14px] overflow-x-auto my-4 md:my-6 border border-gray-200 dark:border-transparent" {...props} />,
                              img: ({node, src, ...props}: any) => {
                                if (!src) return null;
                                return (
                                  <img src={src} className="rounded-xl w-full max-w-[512px] h-auto my-4 shadow-lg border border-gray-200 dark:border-[#444746]" alt="Generated" {...props} />
                                );
                              },
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#444746]/50">
                              <span className="text-[12px] font-medium text-gray-500 dark:text-[#c4c7c5] flex items-center gap-1.5 shrink-0">
                                <Globe size={14} /> Sources:
                              </span>
                              {msg.sources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#282a2c] hover:bg-gray-200 dark:hover:bg-[#444746] rounded-full text-[12px] text-[#1a73e8] dark:text-[#a8c7fa] transition-colors border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-[#5f6368] group/link"
                                  title={source.title}
                                >
                                  <span className="max-w-[150px] truncate">{source.title}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {msg.text !== "" && msg.role === "ai" && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className={`flex items-center gap-1.5 p-1.5 mt-1 text-[12px] font-medium transition-all duration-200 rounded-lg md:opacity-0 group-hover:opacity-100 ${
                          copiedId === msg.id
                            ? "text-[#137333] dark:text-[#81c995] bg-[#137333]/10 dark:bg-[#81c995]/10"
                            : "text-gray-500 dark:text-[#c4c7c5] hover:text-gray-800 dark:hover:text-[#e3e3e3] hover:bg-gray-100 dark:hover:bg-[#282a2c]"
                        }`}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    )}

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="absolute bottom-0 w-full p-4 md:p-6 bg-[#f8f9fa] dark:bg-[#131314] transition-colors">
          <form
            onSubmit={handleSubmit}
            className="max-w-[800px] mx-auto relative flex items-end bg-white dark:bg-[#1e1f20] rounded-[24px] focus-within:bg-gray-50 dark:focus-within:bg-[#282a2c] transition-colors duration-200 shadow-md dark:shadow-sm border border-gray-200 dark:border-transparent focus-within:border-[#4b90ff]/50 dark:focus-within:border-[#444746]/50 p-1.5 md:p-2"
          >

            {showLinkInput && (
              <div className="absolute -top-14 left-4 right-4 md:right-auto md:w-96 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#282a2c] rounded-xl border border-gray-200 dark:border-[#444746] animate-in fade-in slide-in-from-bottom-2 z-20 shadow-lg">
                <LinkIcon size={16} className="text-[#4b90ff] dark:text-[#a8c7fa] shrink-0" />
                <input
                  type="url"
                  autoFocus
                  placeholder="Paste article URL to scrape..."
                  className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-[#e3e3e3] outline-none placeholder-gray-400 dark:placeholder-[#c4c7c5]"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleScrape())}
                />
                <button type="button" onClick={handleScrape} disabled={isScraping} className="p-1 cursor-pointer">
                  {isScraping ? <Loader2 size={16} className="animate-spin text-gray-400 dark:text-[#c4c7c5]" /> : <Check size={16} className="text-[#137333] dark:text-[#81c995] hover:text-[#4b90ff] dark:hover:text-[#a8c7fa] transition-colors" />}
                </button>
                <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(""); }} className="p-1 cursor-pointer">
                  <X size={16} className="text-[#ff5546]" />
                </button>
              </div>
            )}

            {attachedFile && (
              <div className="absolute -top-14 left-4 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#282a2c] rounded-lg border border-gray-200 dark:border-[#444746] animate-in fade-in slide-in-from-bottom-2 hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors shadow-lg z-10">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="flex items-center gap-2 max-w-[200px] cursor-pointer"
                  title="Click to preview document"
                >
                  {attachedFile.name.includes("Scraped") || attachedFile.data.includes("URL SOURCE") ? (
                     <LinkIcon size={14} className="text-[#4b90ff] dark:text-[#a8c7fa] shrink-0" />
                  ) : (
                     <FileText size={14} className="text-[#4b90ff] dark:text-[#a8c7fa] shrink-0" />
                  )}
                  <span className="text-[13px] text-gray-800 dark:text-[#e3e3e3] truncate">{attachedFile.name}</span>
                </button>

                <div className="w-px h-3 bg-gray-300 dark:bg-[#444746] mx-0.5" />

                <button type="button" onClick={() => setAttachedFile(null)} className="p-1 text-gray-500 dark:text-[#c4c7c5] hover:text-[#ff5546] transition-colors cursor-pointer shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            <input
              type="file"
              accept=".txt,.pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <div className="relative shrink-0 mb-0.5">
              <button
                type="button"
                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isOptionsMenuOpen || attachedFile || webSearch || mode === 'image' || mode === 'music'
                  ? "bg-gray-200 dark:bg-[#444746] text-gray-900 dark:text-[#e3e3e3]"
                  : "text-gray-500 dark:text-[#c4c7c5] hover:bg-gray-100 dark:hover:bg-[#444746] hover:text-gray-800 dark:hover:text-[#e3e3e3]"
                }`}
                title="Tools & Options"
              >
                {isOptionsMenuOpen ? (
                  <X size={20} />
                ) : mode === "image" ? (
                  <ImageIcon size={20} className="text-[#4b90ff] dark:text-[#a8c7fa]" />
                ) : mode === "music" ? (
                  <Music size={20} className="text-[#4b90ff] dark:text-[#a8c7fa]" />
                ) : (
                  <Plus color={attachedFile || webSearch ? "currentColor" : "#9ca3af"} size={20} />
                )}
              </button>

              <AnimatePresence>
                {isOptionsMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOptionsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-3 w-56 bg-white dark:bg-[#282a2c] border border-gray-200 dark:border-[#444746] rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 origin-bottom-left"
                    >
                      <button
                        type="button"
                        onClick={() => { fileInputRef.current?.click(); setIsOptionsMenuOpen(false); }}
                        disabled={mode === "image" || mode === "music" || isFileUploading || showLinkInput}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] disabled:opacity-50 cursor-pointer"
                      >
                        <Paperclip size={16} className="text-gray-500 dark:text-[#c4c7c5]" /> Attach Document
                      </button>

                      <button
                        type="button"
                        onClick={() => { setShowLinkInput(true); setIsOptionsMenuOpen(false); }}
                        disabled={mode === "image" || mode === "music" || isFileUploading}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] disabled:opacity-50 cursor-pointer"
                      >
                        <LinkIcon size={16} className="text-gray-500 dark:text-[#c4c7c5]" /> Attach Web Link
                      </button>

                      <button
                        type="button"
                        onClick={() => { setWebSearch(!webSearch); setIsOptionsMenuOpen(false); }}
                        disabled={mode === "image" || mode === "music"}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] disabled:opacity-50 cursor-pointer"
                      >
                        <Globe size={16} className={webSearch ? "text-[#4b90ff]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                        {webSearch ? "Web Search (On)" : "Web Search (Off)"}
                      </button>

                      <div className="h-px bg-gray-200 dark:bg-[#444746] my-1 mx-2" />

                      <button
                        type="button"
                        onClick={() => { setMode("chat"); setIsOptionsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] cursor-pointer"
                      >
                        <MessageSquare size={16} className={mode === "chat" ? "text-[#4b90ff] dark:text-[#a8c7fa]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                        Switch to Text AI
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMode("image"); setIsOptionsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] cursor-pointer"
                      >
                        <ImageIcon size={16} className={mode === "image" ? "text-[#4b90ff] dark:text-[#a8c7fa]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                        Generate an Image
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMode("music"); setIsOptionsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left hover:bg-gray-50 dark:hover:bg-[#444746] transition-colors text-gray-800 dark:text-[#e3e3e3] cursor-pointer"
                      >
                        <Music size={16} className={mode === "music" ? "text-[#4b90ff] dark:text-[#a8c7fa]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                        Generate Music
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isFileUploading || isScraping}
              placeholder={mode === "image" ? "Describe the image you want to generate..." : mode === "music" ? "Describe the music you want to generate..." : "Message Sweet AI..."}
              className="flex-1 bg-transparent px-3 py-3 md:py-3 text-[15px] md:text-[16px] text-gray-900 dark:text-[#e3e3e3] placeholder-gray-500 dark:placeholder-[#c4c7c5] focus:outline-none disabled:opacity-50 resize-none custom-scrollbar leading-relaxed"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />

            <div className="shrink-0 mb-0.5 ml-1 mr-1">
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isFileUploading || isScraping}
                className="p-2.5 rounded-full bg-gray-900 dark:bg-[#e3e3e3] text-white dark:text-[#131314] hover:bg-gray-700 dark:hover:bg-[#c4c7c5] transition-all duration-200 disabled:opacity-20 disabled:bg-transparent disabled:text-gray-400 dark:disabled:text-[#e3e3e3] cursor-pointer"
              >
                <Send size={18} />
              </button>
            </div>
          </form>

          <p className="text-center text-[10px] md:text-[12px] text-gray-500 dark:text-[#c4c7c5] mt-3 md:mt-4 font-normal tracking-wide px-2">
            Sweet AI may display inaccurate info, including about people, so double-check its responses.
          </p>
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          loadChatHistory();
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={(newCredits) => {
          if (user) setUser({ ...user, credits: newCredits });
          alert(`Successfully added credits! Your new balance is ${newCredits}.`);
        }}
      />

      {/* --- SETTINGS MODAL --- */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-[#444746] rounded-[24px] shadow-2xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#444746]/50">
                <h2 className="text-[20px] font-medium text-gray-900 dark:text-[#e3e3e3] flex items-center gap-2">
                  <Settings size={20} className="text-[#4b90ff]" /> Settings
                </h2>
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-[#c4c7c5] dark:hover:text-[#e3e3e3] rounded-full hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-[14px] font-medium text-gray-500 dark:text-[#c4c7c5] mb-4 uppercase tracking-wider">Appearance</h3>

                {mounted && (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        theme === "light"
                          ? "border-[#4b90ff] bg-[#4b90ff]/5"
                          : "border-gray-200 dark:border-[#444746] hover:border-gray-300 dark:hover:border-[#5f6368]"
                      }`}
                    >
                      <Sun size={24} className={theme === "light" ? "text-[#4b90ff]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                      <span className={`text-[13px] font-medium ${theme === "light" ? "text-[#4b90ff]" : "text-gray-700 dark:text-[#c4c7c5]"}`}>Light</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        theme === "dark"
                          ? "border-[#4b90ff] bg-[#4b90ff]/5"
                          : "border-gray-200 dark:border-[#444746] hover:border-gray-300 dark:hover:border-[#5f6368]"
                      }`}
                    >
                      <Moon size={24} className={theme === "dark" ? "text-[#4b90ff]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                      <span className={`text-[13px] font-medium ${theme === "dark" ? "text-[#4b90ff]" : "text-gray-700 dark:text-[#c4c7c5]"}`}>Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        theme === "system"
                          ? "border-[#4b90ff] bg-[#4b90ff]/5"
                          : "border-gray-200 dark:border-[#444746] hover:border-gray-300 dark:hover:border-[#5f6368]"
                      }`}
                    >
                      <Monitor size={24} className={theme === "system" ? "text-[#4b90ff]" : "text-gray-500 dark:text-[#c4c7c5]"} />
                      <span className={`text-[13px] font-medium ${theme === "system" ? "text-[#4b90ff]" : "text-gray-700 dark:text-[#c4c7c5]"}`}>System</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
