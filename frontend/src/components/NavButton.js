// NavButton.js - Programmatic navigation component to prevent URL preview in browser status bar
import { useNavigate } from 'react-router-dom';

/**
 * NavButton - A button component that navigates using React Router's programmatic navigation
 * This prevents the browser from showing URL previews in the status bar on hover
 *
 * @param {string} to - The navigation destination path
 * @param {object} state - Optional state to pass to the navigation
 * @param {string} className - CSS classes to apply
 * @param {object} style - Inline styles
 * @param {ReactNode} children - Button content
 * @param {function} onClick - Optional additional onClick handler
 * @param {string} title - Optional title attribute
 * @param {object} props - Any other props to pass to the button
 */
export function NavButton({ to, state, className = '', style = {}, children, onClick, title, ...props }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented) {
      navigate(to, { state });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Check if Bootstrap button classes are present
  const hasBootstrapBtn = className && className.includes('btn');

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      className={className}
      title={title}
      style={{
        cursor: 'pointer',
        // Only apply minimal styles if Bootstrap button classes are NOT present
        // This allows btn-primary, btn-success, etc. to work properly
        ...(hasBootstrapBtn ? {} : {
          border: 'none',
          background: 'none',
          padding: 0,
          font: 'inherit',
          textDecoration: 'none',
        }),
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default NavButton;
