"use client";

import { useState, useEffect } from "react";
import { IconX, IconMessage, IconSend, IconDownload, IconTrash } from "@tabler/icons-react";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp?: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed);
        console.log('📚 Loaded chat history:', parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
      console.log('💾 Chat history saved:', messages);

      // Also log to console for immediate viewing
      console.group('🔍 Current Chat Session');
      messages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.role.toUpperCase()}]${msg.timestamp ? ` at ${msg.timestamp}` : ''}: ${msg.content}`);
      });
      console.groupEnd();
    }
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    const timestamp = new Date().toISOString();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: message, timestamp }]);
    setLoading(true);

    try {
      const res = await fetch("/blog/api/openai-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input_as_text: message }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      let assistantMessage = result.message || JSON.stringify(result);

      // Add a note if in demo mode
      if (result.demo && result.intent === 'default') {
        assistantMessage = result.message;
      }

      const responseTimestamp = new Date().toISOString();
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage, timestamp: responseTimestamp }]);
    } catch (error) {
      console.error("Error running workflow:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input.trim());
  };

  const handleExampleClick = async (query: string) => {
    setInput(query);
    await sendMessage(query);
  };

  // Export chat history as JSON
  const exportChatHistory = () => {
    const historyData = {
      exportDate: new Date().toISOString(),
      messages: messages,
      totalMessages: messages.length
    };
    const dataStr = JSON.stringify(historyData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('📥 Chat history exported');
  };

  // Clear chat history
  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
      console.log('🗑️ Chat history cleared');
    }
  };

  // Function to view history in console (can be called from browser console)
  useEffect(() => {
    (window as any).viewChatHistory = () => {
      console.group('📋 Complete Chat History');
      console.log('Total messages:', messages.length);
      console.table(messages);
      console.groupEnd();
      return messages;
    };
    console.log('💡 Tip: Type viewChatHistory() in console to see chat history');
  }, [messages]);

  const exampleQueries = [
    "How does it work?",
    "I have an error",
    "Payment Questions"
  ];

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? (
          <IconX size={24} />
        ) : (
          <IconMessage size={24} />
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-stone-900 rounded-lg shadow-2xl border border-stone-200 dark:border-stone-700 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">NextRows Support Agent</h3>
                <p className="text-sm opacity-90">Powered by OpenAI</p>
              </div>
              <div className="flex gap-2">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={exportChatHistory}
                      className="p-1.5 hover:bg-white/20 rounded transition-colors"
                      title="Export chat history"
                    >
                      <IconDownload size={18} />
                    </button>
                    <button
                      onClick={clearChatHistory}
                      className="p-1.5 hover:bg-white/20 rounded transition-colors"
                      title="Clear chat history"
                    >
                      <IconTrash size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {/* Initial greeting as chat bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
                    <p className="text-sm">
                      Hi! I'm your AI assistant. I do my best, but I can make mistakes sometimes.
                      If you'd like help from a real person, please leave your email, and our friendly team will reach out to you as soon as possible.
                    </p>
                  </div>
                </div>
                {/* Example queries */}
                <div className="text-center pt-4">
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Quick options:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {exampleQueries.map((query) => (
                      <button
                        key={query}
                        onClick={() => handleExampleClick(query)}
                        disabled={loading}
                        className="px-3 py-1 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-orange-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-stone-200 dark:border-stone-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 text-sm border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
              >
                <IconSend size={20} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}