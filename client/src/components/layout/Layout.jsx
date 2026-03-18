import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showMenuHint, setShowMenuHint] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  // Detect mobile screen size - Lower breakpoint for better mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // md breakpoint - better for tablets like iPad Mini
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // Always show full sidebar on mobile when open
        setIsMobileMenuOpen(false); // Close mobile menu on resize
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Touch gesture handlers for smooth mobile interactions
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isRightSwipe && !isMobileMenuOpen && isMobile) {
      toggleMobileMenu();
      setShowMenuHint(false);
    }
    if (isLeftSwipe && isMobileMenuOpen && isMobile) {
      toggleMobileMenu();
    }
  };

  // Enhanced mobile menu toggle with animations
  const toggleMobileMenu = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newState = !isMobileMenuOpen;
    console.log('[Layout] Toggling mobile menu:', { from: isMobileMenuOpen, to: newState });
    setIsMobileMenuOpen(newState);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Hide menu hint after first interaction
  useEffect(() => {
    if (isMobileMenuOpen) {
      setShowMenuHint(false);
    }
  }, [isMobileMenuOpen]);

  // Only show sidebar for roles that need it
  const showSidebar = ['admin', 'manager', 'technician'].includes(user?.role);

  const pageTitle = useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (!pathParts.length) return 'Overview';
    const last = pathParts[pathParts.length - 1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return last || 'Overview';
  }, [location.pathname]);

  if (!showSidebar) {
    return (
      <div className="app-shell min-h-screen">
        <div className="content-surface">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell h-screen overflow-hidden">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="flex items-center gap-2">
            {isMobile && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(true);
                }}
                className="header-icon-btn"
                whileTap={{ scale: 0.96 }}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                {showMenuHint && !isMobileMenuOpen && (
                  <span className="menu-hint-ring" aria-hidden="true" />
                )}
              </motion.button>
            )}

            <div className="brand-pill">
              <img src="/logo.jpg" alt="Confine" className="brand-mark" />
              <div className="brand-text">
                <span className="brand-title">Confine OS</span>
                <span className="brand-subtitle">Agile Facilities</span>
              </div>
            </div>
          </div>

          <div className="header-meta">
            <div className="header-title">
              <span className="header-title-label">{pageTitle}</span>
              <span className="header-title-sub">{user?.role || 'User'} workspace</span>
            </div>
            <div className="header-user">
              <span className="header-user-name">{user?.firstName} {user?.lastName}</span>
              <span className="header-user-role">{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`app-body ${isMobile ? 'app-body-mobile' : 'app-body-desktop'}`}>
        {isMobile ? (
          <Sidebar
            isCollapsed={false}
            setIsCollapsed={setIsCollapsed}
            isMobile={true}
            isMobileMenuOpen={isMobileMenuOpen}
            closeMobileMenu={() => setIsMobileMenuOpen(false)}
          />
        ) : (
          <div className="flex-shrink-0 h-full">
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isMobile={isMobile}
              isMobileMenuOpen={isMobileMenuOpen}
              closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />
          </div>
        )}

        <motion.div
          initial={false}
          className={`app-content ${isMobile ? 'w-full' : 'flex-1'}`}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          <main className="content-surface">
            <motion.div
              key={children?.key || 'main-content'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="content-pad"
            >
              {children}
            </motion.div>
          </main>

          <footer className="app-footer">
            <div className="footer-inner">
              <span>Confine OS</span>
              <span className="footer-dot" />
              <span>Operational safety suite</span>
            </div>
          </footer>

          {isMobile && showMenuHint && !isMobileMenuOpen && (
            <motion.div
              className="menu-hint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              <div className="menu-hint-pill">
                <span className="menu-hint-dot" />
                <span className="menu-hint-text">Tap menu to get started</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;
