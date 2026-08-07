// Settings.js – User Management
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EMPTY = { username: '', email: '', password: '', role: 'user', smtp_password: '' };

const ROLES = [
  { value: 'admin',    label: 'Admin',           desc: 'Full access — manage assets, users, settings',         color: '#dc2626' },
  { value: 'user',     label: 'Standard User',   desc: 'Can create and edit assets. Cannot delete or manage users', color: '#2563eb' },
  { value: 'viewer',   label: 'View Only',       desc: 'Read-only access. Cannot create, edit, or delete anything', color: '#64748b' },
];

function Settings() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null); // user object or null
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowForm(true);
    setShowPwd(false);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email || '', password: '', role: u.role });
    setError('');
    setShowForm(true);
    setShowPwd(false);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required'); return; }
    if (!editing && !form.password) { setError('Password is required'); return; }
    if (form.password && form.password.length < 8) { 
      setError('Password must be at least 8 characters long'); 
      return; 
    }

    setSaving(true); setError('');
    try {
      if (editing) {
        const payload = { username: form.username, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id}`, payload);
        if (form.smtp_password) {
          await api.put(`/users/${editing.id}/smtp-password`, { smtp_password: form.smtp_password });
        }
        setSuccess('User updated successfully');
      } else {
        await api.post('/users', form);
        setSuccess('User created successfully');
      }
      closeForm();
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setDeleting(u.id);
    setError(''); // Clear any previous errors
    try {
      await api.delete(`/users/${u.id}`);
      setSuccess('User deleted successfully');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete user';
      setError(errorMsg);
      console.error('Delete user error:', err);
      setTimeout(() => setError(''), 5000);
    } finally { 
      setDeleting(null); 
    }
  };
  
  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      // Select all except admin and current user
      setSelectedIds(users.filter(u => u.username !== 'admin' && u.id !== currentUser.id).map(u => u.id));
    }
  };

  const toggleSelect = (userId) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setError('No users selected');
      return;
    }
    
    const selectedUsers = users.filter(u => selectedIds.includes(u.id));
    const usernames = selectedUsers.map(u => u.username).join(', ');
    
    if (!window.confirm(`Delete ${selectedIds.length} users?\n\nUsers: ${usernames}\n\nThis cannot be undone.`)) {
      return;
    }
    
    setBulkDeleting(true);
    setError('');
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    try {
      // Delete users one by one
      for (const userId of selectedIds) {
        try {
          await api.delete(`/users/${userId}`);
          successCount++;
        } catch (error) {
          failCount++;
          const user = users.find(u => u.id === userId);
          const errorMsg = error.response?.data?.error || error.message;
          errors.push(`${user?.username || userId}: ${errorMsg}`);
          console.error(`Failed to delete user ${userId}:`, error);
        }
      }
      
      // Clear selection
      setSelectedIds([]);
      
      // Refresh user list
      fetchUsers();
      
      // Show result message
      if (failCount === 0) {
        setSuccess(`✓ Successfully deleted ${successCount} user${successCount !== 1 ? 's' : ''}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorSummary = errors.slice(0, 3).join('\n');
        const moreErrors = errors.length > 3 ? `\n... and ${errors.length - 3} more` : '';
        setError(`Deleted ${successCount} users. ${failCount} failed:\n${errorSummary}${moreErrors}`);
        setTimeout(() => setError(''), 10000);
      }
    } catch (error) {
      setError('Bulk deletion failed. Please try again.');
      console.error('Bulk delete error:', error);
      setTimeout(() => setError(''), 5000);
    } finally {
      setBulkDeleting(false);
    }
  };

  const RoleBadge = ({ role }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      background: role === 'admin' ? 'rgba(37,99,235,0.12)' : role === 'viewer' ? 'rgba(100,116,139,0.12)' : 'rgba(22,163,74,0.10)',
      color: role === 'admin' ? '#2563eb' : role === 'viewer' ? '#64748b' : '#16a34a',
      border: `1px solid ${role === 'admin' ? 'rgba(37,99,235,0.25)' : role === 'viewer' ? 'rgba(100,116,139,0.25)' : 'rgba(22,163,74,0.25)'}`,
    }}>
      <i className={`bi bi-${role==='admin' ? 'shield-fill' : role==='viewer' ? 'eye-fill' : 'person-fill'}`}></i>
      {role==='admin' ? 'Administrator' : role==='viewer' ? 'View Only' : 'Standard User'}
    </span>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Settings</h2>
          <p className="text-muted mb-0">Manage users and access permissions</p>
        </div>
      </div>

      {success && (
        <div className="alert d-flex align-items-center gap-2 mb-4"
          style={{ background:'rgba(22,163,74,0.1)', border:'1px solid rgba(22,163,74,0.3)', borderRadius:'10px', color:'#16a34a' }}>
          <i className="bi bi-check-circle-fill"></i>{success}
        </div>
      )}

      {/* User Management Card */}
      <div className="table-card">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0">
              <i className="bi bi-people me-2 text-primary"></i>User Management
            </h5>
            <p className="text-muted small mb-0 mt-1">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-person-plus me-2"></i>Add User
          </button>
        </div>

        {error && !showForm && (
          <div className="alert alert-danger mb-3">{error}</div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="mb-4 p-4" style={{
            background: 'var(--nav-hover, #f8fafc)',
            border: '1px solid var(--nav-border, #e5e7eb)',
            borderRadius: '12px'
          }}>
            <h6 className="fw-bold mb-3">
              <i className={`bi bi-person-${editing ? 'gear' : 'plus'} me-2 text-primary`}></i>
              {editing ? `Edit User — ${editing.username}` : 'Create New User'}
            </h6>

            {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="row g-3">
                {/* Username */}
                <div className="col-md-4">
                  <label className="form-label fw-500">Username <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person"></i></span>
                    <input type="text" className="form-control"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="e.g. john.doe"
                      autoComplete="off"
                      autoFocus />
                  </div>
                </div>

                {/* Email */}
                <div className="col-md-4">
                  <label className="form-label fw-500">Email</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                    <input type="email" className="form-control"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="e.g. john@tectoro.com"
                      autoComplete="off" />
                  </div>
                </div>

                {/* Role */}
                <div className="col-md-4">
                  <label className="form-label fw-500">Role <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-shield"></i></span>
                    <select className="form-select"
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="col-md-4">
                  <label className="form-label fw-500">
                    Password {!editing && <span className="text-danger">*</span>}
                    {editing && <span className="text-muted small fw-normal ms-1">(leave blank to keep current)</span>}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-lock"></i></span>
                    <input type={showPwd ? 'text' : 'password'} className="form-control"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editing ? 'Leave blank to keep' : 'Min. 8 characters'} />
                    <button type="button" className="btn btn-outline-secondary"
                      onClick={() => setShowPwd(!showPwd)}>
                      <i className={`bi bi-eye${showPwd ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                </div>

                {/* SMTP Password - only shown when editing */}
                {editing && (
                  <div className="col-md-4">
                    <label className="form-label fw-500">
                      Outlook SMTP Password
                      <span className="text-muted small fw-normal ms-1">(for sending emails)</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope-lock"></i></span>
                      <input type={showPwd ? 'text' : 'password'} className="form-control"
                        value={form.smtp_password || ''}
                        onChange={e => setForm(f => ({ ...f, smtp_password: e.target.value }))}
                        placeholder="Outlook app password" />
                    </div>
                    <small className="text-muted">Used to send asset assignment emails from your account</small>
                  </div>
                )}

                {/* Role description */}
                <div className="col-md-8 d-flex align-items-end">
                  <div className="p-3 rounded-3 w-100" style={{
                    background: ROLES.find(r=>r.value===form.role)?.color+'18' || '#f8fafc',
                    border: `1px solid ${ROLES.find(r=>r.value===form.role)?.color || '#e2e8f0'}40`,
                    fontSize: '13px'
                  }}>
                    <i className={`bi bi-${form.role === 'admin' ? 'shield-fill text-danger' : form.role === 'viewer' ? 'eye-fill text-secondary' : 'person-fill text-primary'} me-2`}></i>
                    {form.role === 'admin' && <><strong>Admin:</strong> Full access — manage assets, users, reports, import/export, delete records.</>}
                    {form.role === 'user' && <><strong>Standard User:</strong> Can create and edit assets, run reports, export data. Cannot manage users or delete records.</>}
                    {form.role === 'viewer' && <><strong>View Only:</strong> Read-only access. Can view assets and export data. Cannot create, edit, or delete anything.</>}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                    : <><i className={`bi bi-${editing ? 'check-circle' : 'person-plus'} me-2`}></i>
                        {editing ? 'Update User' : 'Create User'}</>
                  }
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded-3"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <span className="fw-600">
                  <i className="bi bi-check-square me-2 text-primary"></i>
                  {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}>
                    {bulkDeleting ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</>
                    ) : (
                      <><i className="bi bi-trash me-2"></i>Delete Selected</>
                    )}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => setSelectedIds([])}>
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            
            <div className="table-responsive" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.length > 0 && selectedIds.length === users.filter(u => u.username !== 'admin' && u.id !== currentUser.id).length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>#</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="bi bi-people fs-2 d-block mb-2"></i>No users found
                    </td></tr>
                  )}
                  {users.map((u, i) => {
                    const canSelect = u.username !== 'admin' && u.id !== currentUser.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          {canSelect ? (
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.includes(u.id)}
                              onChange={() => toggleSelect(u.id)}
                            />
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                    <td className="text-muted small">{i + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: u.role === 'admin'
                            ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
                            : 'linear-gradient(135deg,#16a34a,#059669)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '13px', fontWeight: '700'
                        }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-600" style={{ fontSize: '14px' }}>{u.username}</div>
                          {u.id === currentUser.id && (
                            <span style={{ fontSize: '11px', color: '#2563eb' }}>● You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted small">{u.email || '—'}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                        {u.role === 'admin' ? (
                          <span><i className="bi bi-check-circle-fill text-success me-1"></i>Full Access</span>
                        ) : u.role === 'viewer' ? (
                          <span><i className="bi bi-eye-fill text-secondary me-1"></i>View Only</span>
                        ) : (
                          <span><i className="bi bi-pencil-fill text-primary me-1"></i>Create & Edit</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" title="Edit"
                          onClick={() => openEdit(u)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-outline-danger"
                          title={u.username === 'admin' ? 'Cannot delete main admin' : 'Delete user'}
                          disabled={deleting === u.id || u.username === 'admin'}
                          onClick={() => handleDelete(u)}>
                          {deleting === u.id
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : <i className="bi bi-trash"></i>}
                        </button>
                      </div>
                    </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Settings;
