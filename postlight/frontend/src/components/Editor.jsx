import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Salary',
  'Investment',
  'Other'
];

// Helper to get local date (YYYY-MM-DD) instead of UTC
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Editor({ txn, onClose, onSaved }) {
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (txn) {
      setType(txn.type || 'expense');
      setTitle(txn.title || '');
      setAmount(txn.amount !== undefined && txn.amount !== null ? String(txn.amount) : '');
      
      const rawDate = txn.transaction_date || txn.date;
      if (rawDate) {
        setDate(String(rawDate).split('T')[0].split(' ')[0]);
      } else {
        setDate(getLocalDateString());
      }

      setCategory(txn.category || CATEGORIES[0]);
      setNotes(txn.notes || '');
    } else {
      setDate(getLocalDateString());
    }
  }, [txn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please provide a valid amount greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('amount', String(amount));
      // Send both field keys so backend accepts either
      formData.append('date', date);
      formData.append('transaction_date', date);
      formData.append('category', category);
      formData.append('notes', notes || '');
      if (file) {
        formData.append('file', file);
      }

      if (txn?.id) {
        await api(`/transactions/${txn.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await api('/transactions', {
          method: 'POST',
          body: formData,
        });
      }

      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{txn ? 'Edit Transaction' : 'Record Transaction'}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            {/* Expense / Income Toggle */}
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </button>
            </div>

            {/* Title */}
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Grab Income, Fuel, Salary, Lunch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Amount and Date */}
            <div className="form-row">
              <div className="form-group">
                <label>Amount (MYR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                  style={{ colorScheme: 'dark', cursor: 'pointer' }}
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Add extra context or remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Receipt Upload */}
            <div className="form-group">
              <label>Receipt Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="form-file-input"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}