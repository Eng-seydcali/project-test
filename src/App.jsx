import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CarsCenter from './pages/CarsCenter';
import CarProfile from './pages/CarProfile';
import CreateCar from './pages/CreateCar';
import CarReports from './pages/CarReports';
import EmployeeCenter from './pages/EmployeeCenter';
import EmployeeProfile from './pages/EmployeeProfile';
import CreateEmployee from './pages/CreateEmployee';
import ItemsCenter from './pages/ItemsCenter';
import ItemProfile from './pages/ItemProfile';
import CreateItem from './pages/CreateItem';
import CustomerCenter from './pages/CustomerCenter';
import CustomerProfile from './pages/CustomerProfile';
import CreateCustomer from './pages/CreateCustomer';
import CustomerReports from './pages/CustomerReports';
import InvoiceCenter from './pages/InvoiceCenter';
import CreateInvoice from './pages/CreateInvoice';
import Payments from './pages/Payments';
import AccountManagement from './pages/AccountManagement';
import UserCenter from './pages/UserCenter';
import CreateUser from './pages/CreateUser';
import ProtectedRoute from './components/ProtectedRoute';
import CreditOverview from './pages/CreditOverview';
import CustomerSMS from './pages/CustomerSMS';
import EmployeeSMS from './pages/EmployeeSMS';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <ToastProvider>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Cars Routes */}
                <Route path="/cars" element={<CarsCenter />} />
                <Route path="/cars/create" element={<CreateCar />} />
                <Route path="/cars/:id" element={<CarProfile />} />
                <Route path="/car-reports" element={<CarReports />} />
                
                {/* Employee Routes */}
                <Route path="/employees" element={<EmployeeCenter />} />
                <Route path="/employees/create" element={<CreateEmployee />} />
                <Route path="/employees/:id" element={<EmployeeProfile />} />
                
                {/* Items Routes */}
                <Route path="/items" element={<ItemsCenter />} />
                <Route path="/items/create" element={<CreateItem />} />
                <Route path="/items/:id" element={<ItemProfile />} />
                
                {/* Customer Routes */}
                <Route path="/customers" element={<CustomerCenter />} />
                <Route path="/customers/create" element={<CreateCustomer />} />
                <Route path="/customers/reports" element={<CustomerReports />} />
                <Route path="/customers/:id" element={<CustomerProfile />} />
                <Route path="/CreditOverview" element={<CreditOverview/>} />
                
                {/* Invoice Routes */}
                <Route path="/invoices" element={<InvoiceCenter />} />
                <Route path="/invoices/create" element={<CreateInvoice />} />
                
                {/* SMS Routes */}
                <Route path="/sms/customers" element={<CustomerSMS />} />
                <Route path="/sms/employees" element={<EmployeeSMS />} />

                {/* Other Routes */}
                <Route path="/payments" element={<Payments />} />
                <Route path="/account-management" element={<AccountManagement />} />
                <Route path="/users" element={<UserCenter />} />
                <Route path="/users/create" element={<CreateUser />} />
              </Route>
            </Routes>
          </div>
        </ToastProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;