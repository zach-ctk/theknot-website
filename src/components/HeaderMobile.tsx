import { useState, useEffect, useRef } from 'react';

interface NavItem {
  label: string;
  href: string;
  isPopup?: boolean;
  external?: boolean;
}

interface HeaderMobileProps {
  navItems: NavItem[];
  isHome?: boolean;
}

export default function HeaderMobile({ navItems, isHome = false }: HeaderMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Move focus to an obvious close control when the menu opens.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const focusableElements = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === buttonRef.current) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          buttonRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const iconColor = isHome || isScrolled ? '#f0f0f0' : '#000';

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '18px',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              backgroundColor: iconColor,
              top: isOpen ? '8px' : '0',
              transform: isOpen ? 'rotate(45deg)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              backgroundColor: iconColor,
              top: '8px',
              opacity: isOpen ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              backgroundColor: iconColor,
              top: isOpen ? '8px' : '16px',
              transform: isOpen ? 'rotate(-45deg)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-label="Mobile navigation menu"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
      >
        <nav aria-label="Mobile navigation" style={{ marginBottom: '14px' }}>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              textAlign: 'center',
            }}
          >
          {navItems.map((item, index) => (
            <li
              key={item.label}
              style={{
                marginBottom: '24px',
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s`,
              }}
            >
              <a
                href={item.href}
                onClick={handleNavClick}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
          </ul>
        </nav>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          style={{
            minWidth: '132px',
            height: '42px',
            borderRadius: '4px',
            border: '1px solid rgba(201, 201, 201, 0.72)',
            background: 'transparent',
            color: '#c9c9c9',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: 1,
            padding: '0 16px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <span>Close</span>
          <span aria-hidden="true" style={{ fontSize: '18px', transform: 'translateY(-1px)' }}>X</span>
        </button>
      </div>
    </>
  );
}
