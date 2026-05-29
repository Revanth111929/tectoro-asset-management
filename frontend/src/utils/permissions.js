// permissions.js - Role-based access control utilities

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Get current user's role
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'viewer';
};

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  return getUserRole() === 'admin';
};

/**
 * Check if user is viewer (read-only)
 */
export const isViewer = () => {
  return getUserRole() === 'viewer';
};

/**
 * Check if user can perform an action
 */
export const canPerform = (action) => {
  const role = getUserRole();
  
  const permissions = {
    admin: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      import: true,
      export: true,
      bulkActions: true,
    },
    viewer: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      import: false,
      export: true,
      bulkActions: false,
    },
    standard: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      import: false,
      export: true,
      bulkActions: false,
    },
  };
  
  return permissions[role]?.[action] || false;
};

/**
 * Get user display info
 */
export const getUserInfo = () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  return {
    username: user.username,
    role: user.role,
    roleLabel: user.role === 'admin' ? 'Administrator' : 'Viewer',
    canEdit: canPerform('edit'),
    canCreate: canPerform('create'),
    canDelete: canPerform('delete'),
  };
};
