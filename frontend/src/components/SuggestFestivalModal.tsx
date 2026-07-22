import React, { useState } from 'react';
import { api } from '../lib/axios';
import { X, Sparkles, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SuggestFestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestFestivalModal: React.FC<SuggestFestivalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [suggestedName, setSuggestedName] = useState('');
  const [suggestedCity, setSuggestedCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedName.trim() || !suggestedCity.trim() || loading) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/api/festivals/suggest', {
        suggested_name: suggestedName.trim(),
        suggested_city: suggestedCity.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      });

      const message =
        response.data?.message || 'Thank you! We will review and add this to our database.';
      setSuccessMsg(message);
      setSuggestedName('');
      setSuggestedCity('');
      setStartDate('');
      setEndDate('');

      window.alert(message);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting suggestion:', err);
      setErrorMsg(
        err.response?.data?.detail ||
          'Failed to submit festival suggestion. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(18,18,18,0.85)',
        padding: '16px',
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1E1E1E',
          border: '1px solid #2D2D2D',
          borderRadius: '2px',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2D2D2D', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #2D2D2D', borderRadius: '2px', color: '#10B981' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#EDEDED', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Suggest Festival
              </h3>
              <p style={{ fontSize: '0.7rem', color: '#A1A1AA', margin: '4px 0 0 0' }}>
                Help us expand our database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '2px', color: '#10B981', fontSize: '0.75rem' }}>
              <CheckCircle2 size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', color: '#ef4444', fontSize: '0.75rem' }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 500, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Festival Name <span style={{ color: '#10B981' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Garbicz Festival"
              value={suggestedName}
              onChange={(e) => setSuggestedName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#121212',
                border: '1px solid #2D2D2D',
                borderRadius: '2px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#EDEDED',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 500, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              City / Location <span style={{ color: '#10B981' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Garbicz, Poland"
              value={suggestedCity}
              onChange={(e) => setSuggestedCity(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#121212',
                border: '1px solid #2D2D2D',
                borderRadius: '2px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                color: '#EDEDED',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 500, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#121212',
                  border: '1px solid #2D2D2D',
                  borderRadius: '2px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: '#EDEDED',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 500, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#121212',
                  border: '1px solid #2D2D2D',
                  borderRadius: '2px',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: '#EDEDED',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #2D2D2D' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'none',
                border: '1px solid transparent',
                color: '#A1A1AA',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !suggestedName.trim() || !suggestedCity.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#10B981',
                color: '#121212',
                border: 'none',
                borderRadius: '2px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 16px',
                cursor: (loading || !suggestedName.trim() || !suggestedCity.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !suggestedName.trim() || !suggestedCity.trim()) ? 0.5 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
