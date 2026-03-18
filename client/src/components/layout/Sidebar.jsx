import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Shield,
  BarChart3,
  FileText,
  Bell,
  Wrench,
  ClipboardList,
  Calendar,
  MessageSquare,
  Database,
  Activity,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Map,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { technicianLocationService } from '../../services/technicianLocationService';
import workOrderAPI from '../../services/workOrderAPI';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile = false, isMobileMenuOpen = false, closeMobileMenu }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for technician's assigned location and tasks
  const [assignedLocation, setAssignedLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTasksSection, setShowTasksSection] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch technician's location and tasks if user is a technician
  useEffect(() => {
    if (user?.role === 'technician') {
      fetchTechnicianData();
    }
  }, [user]);

  // Auto-close mobile menu when route changes
  useEffect(() => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  }, [location.pathname, isMobile, closeMobileMenu]);

  // Debug: Log when isMobileMenuOpen changes
  useEffect(() => {
    if (isMobile) {
      console.log('[Sidebar] Mobile menu state changed:', isMobileMenuOpen);
    }
  }, [isMobileMenuOpen, isMobile]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
    };
  }, [isMobile, isMobileMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobile && closeMobileMenu) {
        closeMobileMenu();
      }
    };

    if (isMobile) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, closeMobileMenu]);

  // Swipe gesture handlers for mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    
    if (isLeftSwipe && isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
    setIsDragging(false);
  };

  const fetchTechnicianData = async () => {
    try {
      setTasksLoading(true);
      
      // Fetch assigned location
      try {
        const locationResponse = await technicianLocationService.getMyLocation();
        if (locationResponse.data) {
          setAssignedLocation(locationResponse.data);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
      
      // Fetch work orders (tasks) for technician
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const workOrdersResponse = await workOrderAPI.getWorkOrders(token, {
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          });
          
          if (workOrdersResponse.success) {
            setWorkOrders(workOrdersResponse.data?.orders || []);
          }
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
      }
      
      // Also try to fetch generic tasks if available
      try {
        const tasksResponse = await technicianLocationService.getMyTasks();
        if (tasksResponse.data) {
          setTasks(tasksResponse.data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // No need to navigate here as logout function handles redirection
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation as fallback
      navigate('/login');
    }
  };

  const handleViewMap = () => {
    try {
      if (!assignedLocation) {
        alert('No assigned location found. Please contact your manager.');
        return;
      }
      // Navigate to location map view
      navigate('/technician/location-map', { 
        state: { location: assignedLocation } 
      });
    } catch (error) {
      console.error('Error navigating to map:', error);
      alert('Failed to open location map. Please try again.');
    }
  };

  const handleAddInspection = () => {
    try {
      if (!assignedLocation) {
        alert('No assigned location found. Please contact your manager.');
        return;
      }
      // Navigate to inspection form
      navigate('/technician/inspection-forms', { 
        state: { location: assignedLocation } 
      });
    } catch (error) {
      console.error('Error navigating to inspection form:', error);
      alert('Failed to open inspection form. Please try again.');
    }
  };

  const handleCloseWorkOrder = async () => {
    try {
      if (!workOrders || workOrders.length === 0) {
        alert('No active work orders to close');
        return;
      }

      // Find the most recent in-progress work order
      const activeOrder = workOrders.find(order => 
        order.status === 'in-progress' || order.status === 'approved'
      );

      if (!activeOrder) {
        alert('No active work orders found');
        return;
      }

      const confirmMessage = `Close work order "${activeOrder.spaceName || activeOrder.building || activeOrder._id}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication error. Please log in again.');
        navigate('/login');
        return;
      }

      // Show loading state
      const originalText = 'Closing work order...';
      alert(originalText); // Simple loading indicator

      await workOrderAPI.updateWorkOrderStatus(token, activeOrder._id, 'completed', 'Closed by technician');
      
      // Refresh work orders
      await fetchTechnicianData();
      alert('Work order closed successfully');
    } catch (error) {
      console.error('Error closing work order:', error);
      
      let errorMessage = 'Failed to close work order';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        navigate('/login');
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to close this work order.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Work order not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/${user.role}/dashboard` },
      { icon: MapPin, label: 'Locations', path: '/locations' },
      { icon: Activity, label: 'Activity', path: `/${user.role}/activity` },
      { icon: Bell, label: 'Notifications', path: `/${user.role}/notifications` },
    ];

    // Base items without locations for technicians
    const technicianBaseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/${user.role}/dashboard` },
      { icon: Activity, label: 'Activity', path: `/${user.role}/activity` },
      { icon: Bell, label: 'Notifications', path: `/${user.role}/notifications` },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: Wrench, label: 'Work Orders', path: '/admin/work-orders' },
          { icon: Users, label: 'User Management', path: '/admin/users' },
          { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
          { icon: Shield, label: 'Security', path: '/admin/security' },
          { icon: Database, label: 'System Logs', path: '/admin/logs' },
          { icon: Settings, label: 'System Settings', path: '/admin/settings' },
        ];
      case 'manager':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/manager/dashboard' },
          { icon: Users, label: 'User Management', path: '/manager/users' },
          { icon: MapPin, label: 'Locations', path: '/locations' },
          { icon: Wrench, label: 'Work Orders', path: '/manager/work-orders' },
          { icon: Settings, label: 'Settings', path: '/manager/settings' },
        ];
      case 'technician':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: `/${user.role}/dashboard` },
          { icon: ClipboardList, label: 'Tasks', path: '/technician/tasks' },
          { icon: Wrench, label: 'Work Orders', path: '/technician/work-orders' },
          { icon: FileText, label: 'Inspection Forms', path: '/technician/inspection-forms' },
          { icon: Settings, label: 'Settings', path: '/technician/settings' },
          { icon: Calendar, label: 'Schedule', path: '/technician/schedule' },
          { icon: MessageSquare, label: 'Messages', path: '/technician/messages' },
          { icon: BarChart3, label: 'Reports', path: '/technician/reports' },
          { icon: Activity, label: 'Activity', path: `/${user.role}/activity` },
          { icon: Bell, label: 'Notifications', path: `/${user.role}/notifications` },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const getRoleColor = () => {
    switch (user.role) {
      case 'admin':
        return 'from-red-600 to-pink-600';
      case 'manager':
        return 'from-purple-600 to-indigo-600';
      case 'technician':
        return 'from-blue-600 to-cyan-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'technician':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay - Only show when sidebar is OPEN on mobile */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              closeMobileMenu && closeMobileMenu();
            }}
            className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-md z-40 cursor-pointer"
            style={{ 
              touchAction: 'auto',
              WebkitTapHighlightColor: 'transparent',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'auto'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container - Enhanced Mobile with Proper Open/Close States */}
      <motion.div
        initial={isMobile ? false : false}
        animate={isMobile ? {} : { width: isCollapsed ? 80 : 300 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
          type: 'spring',
          stiffness: 350,
          damping: 35
        }}
        drag={isMobile && isMobileMenuOpen ? "x" : false}
        dragConstraints={{ left: -300, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (isMobile && isMobileMenuOpen && (offset.x < -100 || velocity.x < -500)) {
            closeMobileMenu && closeMobileMenu();
          }
        }}
        className={`sidebar-surface flex flex-col ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 h-full w-[80vw] sm:w-[75vw] max-w-[280px] sm:max-w-[300px] transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative h-full z-10'
        }`}
        style={isMobile ? {
          paddingTop: 'calc(env(safe-area-inset-top) + 60px)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        } : {}}
      >
      {/* Swipe Indicator - Mobile Only (when open) */}
      {isMobile && isMobileMenuOpen && (
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-20 bg-gradient-to-b from-transparent via-gray-400/50 to-transparent rounded-l-full pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent"
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}
      {/* Header - Mobile-First */}
      <div className="sidebar-header">
        <div className="sidebar-header-inner">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="sidebar-brand"
              >
                <div className="sidebar-logo">
                  <img src="/logo.jpg" alt="Confine" />
                </div>
                <div className="sidebar-brand-text">
                  <span className="sidebar-brand-title">Confine OS</span>
                  <span className="sidebar-brand-subtitle">Operations Suite</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="sidebar-header-actions">
            {isMobile ? (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMobileMenu && closeMobileMenu();
                }}
                whileTap={{ scale: 0.94 }}
                className="sidebar-action-btn danger"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                whileTap={{ scale: 0.94 }}
                className="sidebar-action-btn"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile - Enhanced Mobile */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          <UserCog className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="sidebar-user-meta"
            >
              <p className="sidebar-user-name">
                {user.firstName} {user.lastName}
              </p>
              <span className="sidebar-user-role">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Navigation Menu with Mobile Optimization */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <Link
                to={item.path}
                onClick={() => {
                  if (isMobile && closeMobileMenu) {
                    closeMobileMenu();
                  }
                }}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <motion.div
                  className="sidebar-link-icon"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.4} />
                </motion.div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="sidebar-link-label"
                    >
                      <span className="sidebar-link-text">
                        {item.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Technician Tasks Section removed: Assigned Location tab hidden for technicians */}

      {/* Enhanced Logout Button - Premium Mobile */}
      <div className="sidebar-footer">
        <motion.button
          type="button"
          onClick={() => {
            handleLogout();
            if (isMobile && closeMobileMenu) {
              closeMobileMenu();
            }
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="sidebar-logout"
        >
          <motion.div 
            className="sidebar-logout-icon"
            whileHover={{ scale: 1.05, rotate: -6 }}
            whileTap={{ scale: 0.92, rotate: 6 }}
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200" strokeWidth={2.5} />
          </motion.div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="sidebar-logout-label"
              >
                <span className="sidebar-logout-title">
                  Logout
                </span>
                <span className="sidebar-logout-subtitle">
                  Sign out safely
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
