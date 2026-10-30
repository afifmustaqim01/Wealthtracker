import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function Chat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Wealth Advisor. Ask me anything about your recorded expenses, monthly spending patterns, or savings rate.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await api('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const reply = res?.answer || res?.response || 'I analyzed your records but could not produce a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to retrieve answer from AI advisor.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-backdrop" onClick={onClose}>
      <div className="chat-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="chat-header">
          <div className="chat-header-title">
            <div className="chat-header-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Financial AI Assistant</h3>
              <p>Powered by Gemini & Semantic RAG</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Message Log */}
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-bubble-row ${m.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="chat-avatar">
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-bubble">
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble typing">
                <Loader2 size={16} className="chat-spinner" />
                <span>Analyzing your financial data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Question Input Form */}
        <form className="chat-footer" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="e.g. How much did I spend on YouTube Music?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}