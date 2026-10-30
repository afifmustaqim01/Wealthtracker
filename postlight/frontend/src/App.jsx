import React, { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import Auth from './components/Auth';
import Editor from './components/Editor';
import Chat from './components/Chat';
import {
  Plus,
  Sparkles,
  LogOut,
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  Trash2,
  Edit3,
  FileText
} from 'lucide-react';

export default function App() {
  const { session, loading: sessionLoading, user } = useSession();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const [showEditor, setShowEditor] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await api('/transactions');
      setTransactions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api(`/transactions/${id}`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTxn(null);
    setShowEditor(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Format currency directly into Malaysian Ringgit (RM)
  const formatMYR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Helper to resolve whichever date key the backend returned
  const formatTxnDate = (t) => {
    const rawDate = t.transaction_date || t.date || t.txn_date || t.created_at;
    if (!rawDate) return '—';
    return String(rawDate).split('T')[0];
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0';

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (sessionLoading) {
    return (
      <div className="center-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app-layout">
      {/* Navbar Header */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-logo-glow">
            <Wallet className="brand-icon" size={26} />
          </div>
          <div className="brand-titles">
            <h1 className="brand-name">WealthTracker</h1>
            <span className="brand-sub">Smart Personal Finance</span>
          </div>
        </div>

        <div className="nav-actions">
          <button className="btn-ai-glow" onClick={() => setShowChat(true)}>
            <Sparkles size={18} />
            <span>Ask AI Advisor</span>
          </button>
          <button className="btn-primary-action" onClick={handleCreate}>
            <Plus size={18} />
            <span>New Record</span>
          </button>
          <button className="btn-logout" onClick={handleSignOut} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* KPI Dashboard Cards */}
        <section className="kpi-grid">
          <div className="kpi-card card-balance">
            <div className="kpi-header">
              <span className="kpi-label">Net Balance</span>
              <span className="kpi-tag">Savings Rate: {savingsRate}%</span>
            </div>
            <div className={`kpi-amount ${netBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatMYR(netBalance)}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Income</span>
              <div className="kpi-badge income">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="kpi-amount text-positive">+{formatMYR(totalIncome)}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Total Expenses</span>
              <div className="kpi-badge expense">
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="kpi-amount text-negative">-{formatMYR(totalExpenses)}</div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search descriptions, categories, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`tab-btn ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              Expenses
            </button>
            <button
              className={`tab-btn ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Income
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* CRUD Table View */}
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Notes</th>
                <th>Receipt</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    Loading financial data...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    No transactions recorded yet. Click "New Record" to begin.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="font-mono text-muted">{formatTxnDate(t)}</td>
                    <td className="font-semibold text-primary">{t.title}</td>
                    <td>
                      <span className="category-pill">{t.category}</span>
                    </td>
                    <td className="text-muted">{t.notes || '—'}</td>
                    <td>
                      {t.receipt_url ? (
                        <a
                          href={t.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="receipt-link"
                          title="View Receipt"
                        >
                          <FileText size={16} />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className={`text-right font-bold ${
                        t.type === 'income' ? 'text-positive' : 'text-negative'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatMYR(t.amount)}
                    </td>
                    <td className="table-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(t)}
                        title="Update Record"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(t.id)}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Editor Modal for Create / Update */}
      {showEditor && (
        <Editor
          txn={editingTxn}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            fetchTransactions();
          }}
        />
      )}

      {/* Financial Assistant Chat Modal */}
      {showChat && <Chat onClose={() => setShowChat(false)} />}
    </div>
  );
}