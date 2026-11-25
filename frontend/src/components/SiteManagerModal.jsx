import React, { useState } from 'react';
import { X, Plus, Globe, Trash2, Copy, Check, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SiteManagerModal({ onClose, onNotify }) {
  const { sites, activeSite, setActiveSite, createSite, deleteSite } = useAuth();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) return;
    setError('');
    setCreating(true);
    try {
      const site = await createSite(name, domain);
      setName('');
      setDomain('');
      onNotify?.(`Site "${site.name}" created and selected!`);
    } catch (err) {
      setError(err.message || 'Failed to create site');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const handleDelete = async (site) => {
    if (!window.confirm(`Delete "${site.name}" and all its tracked events/sessions?`)) return;
    try {
      await deleteSite(site.siteId);
      onNotify?.(`Deleted "${site.name}"`);
    } catch (err) {
      setError(err.message || 'Failed to delete site');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="#38bdf8" />
              <span>Manage Tracked Websites</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Each website gets an isolated Site ID & API Key so your analytics stay strictly separated.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Add New Site Form */}
          <form
            onSubmit={handleCreate}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Register New Website</div>
            {error && (
              <div style={{ color: '#fda4af', fontSize: '0.8rem' }}>{error}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.6rem' }}>
              <input
                type="text"
                required
                placeholder="Site Name (e.g. Portfolio Site)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="search-input"
              />
              <input
                type="text"
                required
                placeholder="Domain (e.g. mysite.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="search-input"
              />
              <button type="submit" disabled={creating} className="btn btn-primary btn-sm">
                <Plus size={15} />
                <span>{creating ? 'Adding...' : 'Add Site'}</span>
              </button>
            </div>
          </form>

          {/* Existing Sites List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Your Websites ({sites.length})
            </div>

            {sites.map((site) => {
              const isSelected = activeSite?.siteId === site.siteId;
              return (
                <div
                  key={site.siteId}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.45)' : 'var(--border-subtle)'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{site.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{site.domain}</span>
                      {isSelected && <span className="badge badge-blue">Active</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(site.siteId, site.siteId)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}
                        title="Copy Site ID"
                      >
                        <Key size={12} />
                        <span>{site.siteId}</span>
                        {copiedId === site.siteId ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isSelected && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveSite(site);
                          onClose();
                        }}
                      >
                        Switch
                      </button>
                    )}
                    {sites.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#fb7185' }}
                        onClick={() => handleDelete(site)}
                        title="Delete site"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
