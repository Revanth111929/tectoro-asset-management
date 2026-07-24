// permissions.js – Role-based access control utility
// Provides centralized permission checking for UI elements

/**
 * Check if current user can perform an action
 * @param {string} action - Action to check (create, edit, delete, bulkActions)
 * @returns {boolean} - True if user has permission
 */
export const canPerform = (action) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;

  try {
    const user = JSON.parse(userStr);
    const role = user.role || 'viewer';

    // Permission matrix
    const permissions = {
      admin: ['create', 'edit', 'delete', 'bulkActions', 'export', 'import', 'settings'],
      user: ['create', 'edit', 'export', 'bulkActions'],
      viewer: ['export']
    };

    return permissions[role]?.includes(action) || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Get current user role
 * @returns {string} - User role (admin, user, viewer)
 */
export const getCurrentRole = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'viewer';
    const user = JSON.parse(userStr);
    return user.role || 'viewer';
  } catch {
    return 'viewer';
  }
};

/**
 * Check if user is admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  return getCurrentRole() === 'admin';
};

/**
 * Get current user information
 * @returns {object} - User object with username, email, role
 */
export const getUserInfo = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
