import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Eye } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SendMessageModal from '../components/SendMessageModal';
import MessageHistoryModal from '../components/MessageHistoryModal';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const EmployeeSMS = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [employees, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const [employeesRes, messagesRes] = await Promise.all([
        api.get('/employees'),
        api.get('/sms/messages?type=employee')
      ]);

      const employeesWithStats = employeesRes.data.map(employee => {
        const employeeMessages = messagesRes.data.filter(
          msg => msg.recipient_id === employee._id
        );

        return {
          ...employee,
          id: employee._id,
          name: employee.employeeName,
          phone: employee.phoneNumber,
          balance: employee.lastPaymentAmount || 0,
          sent_count: employeeMessages.filter(msg => msg.status === 'sent').length,
          failed_count: employeeMessages.filter(msg => msg.status === 'failed').length
        };
      });

      setEmployees(employeesWithStats);
    } catch (error) {
      console.error('Error loading employees:', error);
      showToast('Error loading employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    if (statusFilter === 'sent') {
      filtered = filtered.filter(e => e.sent_count > 0);
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(e => e.failed_count > 0);
    }

    setFilteredEmployees(filtered);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map(e => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        balance: e.balance
      })));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employee, checked) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        balance: employee.balance
      }]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(e => e.id !== employee.id));
    }
  };

  const handleSendMessage = () => {
    if (selectedEmployees.length === 0) {
      alert('No employee selected.');
      return;
    }
    setShowSendModal(true);
  };

  const handleViewHistory = async (employee) => {
    try {
      const response = await api.get(`/sms/messages?type=employee&recipient_id=${employee.id}`);
      setMessageHistory(response.data);
      setSelectedEmployeeHistory(employee);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading message history:', error);
      showToast('Error loading message history', 'error');
    }
  };

  const handleSendComplete = () => {
    setSelectedEmployees([]);
    loadEmployees();
    showToast('Messages sent successfully', 'success');
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      ),
      accessor: 'select',
      cell: (employee) => (
        <input
          type="checkbox"
          checked={selectedEmployees.some(e => e.id === employee.id)}
          onChange={(e) => handleSelectEmployee(employee, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      )
    },
    {
      header: 'Employee Name',
      accessor: 'name'
    },
    {
      header: 'Phone Number',
      accessor: 'phone'
    },
    {
      header: 'Last Payment Amount',
      accessor: 'balance',
      cell: (employee) => {
        const amount = employee.balance || 0;
        return (
          <span className={`font-semibold ${amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {amount > 0 ? '+' : ''}${amount.toFixed(2)}
          </span>
        );
      }
    },
    {
      header: 'Sent Messages',
      accessor: 'sent_count',
      cell: (employee) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          {employee.sent_count || 0}
        </span>
      )
    },
    {
      header: 'Failed Messages',
      accessor: 'failed_count',
      cell: (employee) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
          {employee.failed_count || 0}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (employee) => (
        <button
          onClick={() => handleViewHistory(employee)}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Employee SMS</h1>
        </div>
        <Button
          onClick={handleSendMessage}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send Message
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-end mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">
              Message Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedEmployees.length}</strong> employee(s) selected
            </p>
          </div>
        )}

        <Table
          data={filteredEmployees}
          columns={columns}
          loading={loading}
        />
      </div>

      <SendMessageModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        recipientType="employee"
        selectedRecipients={selectedEmployees}
        onSendComplete={handleSendComplete}
      />

      <MessageHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        messages={messageHistory}
        recipientName={selectedEmployeeHistory?.name}
      />
    </div>
  );
};

export default EmployeeSMS;
