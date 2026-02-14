import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Car,
  Users,
  Package,
  UserCheck,
  FileText,
  CreditCard,
  Settings,
  UserPlus,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
  Database,
  MessageSquare
} from 'lucide-react';
import { useState as useLocalState } from 'react';
import BackupRestoreModal from './BackupRestoreModal';

const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const { logout } = useAuth();
  const [showBackupModal, setShowBackupModal] = useLocalState(false);
  const location = useLocation();
  
  const [expandedMenus, setExpandedMenus] = useState({
    cars: false,
    employees: false,
    items: false,
    customers: false,
    invoices: false,
    users: false,
    sms: false
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const sidebarItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Cars',
      icon: Car,
      key: 'cars',
      isExpanded: expandedMenus.cars,
      subItems: [
        { name: 'Cars Center', path: '/cars' },
        { name: 'Create Car', path: '/cars/create' },
        { name: 'Car Reports', path: '/car-reports' }
      ]
    },
    {
      name: 'Employee',
      icon: Users,
      key: 'employees',
      isExpanded: expandedMenus.employees,
      subItems: [
        { name: 'Employee Center', path: '/employees' },
        { name: 'Create Employee', path: '/employees/create' }
      ]
    },
    {
      name: 'Items',
      icon: Package,
      key: 'items',
      isExpanded: expandedMenus.items,
      subItems: [
        { name: 'Items Center', path: '/items' },
        { name: 'Create Item', path: '/items/create' }
      ]
    },
    {
      name: 'Customer',
      icon: UserCheck,
      key: 'customers',
      isExpanded: expandedMenus.customers,
      subItems: [
        { name: 'Customer Center', path: '/customers' },
        { name: 'Customer Reports', path: '/customers/reports' },
        { name: 'Create Customer', path: '/customers/create' },
        { name: 'Credit-Overview', path: '/CreditOverview' }
      ]
    },
    {
      name: 'Invoice',
      icon: FileText,
      key: 'invoices',
      isExpanded: expandedMenus.invoices,
      subItems: [
        { name: 'Invoice Center', path: '/invoices' },
        { name: 'Create Invoice', path: '/invoices/create' }
      ]
    },
    {
      name: 'Payments',
      icon: CreditCard,
      path: '/payments'
    },
    {
      name: 'SMS',
      icon: MessageSquare,
      key: 'sms',
      isExpanded: expandedMenus.sms,
      subItems: [
        { name: 'Customer SMS', path: '/sms/customers' },
        { name: 'Employee SMS', path: '/sms/employees' }
      ]
    },
    {
      name: 'Account Management',
      icon: Settings,
      path: '/account-management'
    },
    {
      name: 'Users',
      icon: UserPlus,
      key: 'users',
      isExpanded: expandedMenus.users,
      subItems: [
        { name: 'User Center', path: '/users' },
        { name: 'Create User', path: '/users/create' }
      ]
    }
  ];

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 print:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="w-16 h-32 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-800">Haype Construction</span>
            </div>
            
            {/* Close button - only visible on mobile */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.name}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                          isParentActive([`/${item.key}`]) 
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      {item.isExpanded && (
                        <ul className="mt-2 ml-6 space-y-1">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.path}
                                onClick={handleLinkClick}
                                className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                                  isActive(subItem.path)
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowBackupModal(true)}
              className="w-full flex items-center px-4 py-3 text-green-600 hover:bg-green-50 rounded-lg transition-colors mb-3"
            >
              <Database className="w-5 h-5 mr-3" />
              <span className="font-medium">Backup & Restore</span>
            </button>
            
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Backup & Restore Modal */}
        <BackupRestoreModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
        />
      </div>
    </>
  );
};

export default Sidebar;