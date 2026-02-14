import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Table from '../components/Table';
import SendMessageModal from '../components/SendMessageModal';
import MessageHistoryModal from '../components/MessageHistoryModal';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const CustomerSMS = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, customerFilter, statusFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const [customersRes, messagesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/sms/messages?type=customer')
      ]);

      const customersWithStats = customersRes.data.map(customer => {
        const customerMessages = messagesRes.data.filter(
          msg => msg.recipient_id === customer.id
        );

        return {
          ...customer,
          sent_count: customerMessages.filter(msg => msg.status === 'sent').length,
          failed_count: customerMessages.filter(msg => msg.status === 'failed').length
        };
      });

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('Error loading customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    if (customerFilter === 'credit') {
      filtered = filtered.filter(c => c.balance > 0);
    }

    if (statusFilter === 'sent') {
      filtered = filtered.filter(c => c.sent_count > 0);
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(c => c.failed_count > 0);
    }

    setFilteredCustomers(filtered);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        balance: c.balance
      })));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customer, checked) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        balance: customer.balance
      }]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
    }
  };

  const handleSendMessage = () => {
    if (selectedCustomers.length === 0) {
      alert('No customer selected.');
      return;
    }
    setShowSendModal(true);
  };

  const handleViewHistory = async (customer) => {
    try {
      const response = await api.get(`/sms/messages?type=customer&recipient_id=${customer.id}`);
      setMessageHistory(response.data);
      setSelectedCustomerHistory(customer);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading message history:', error);
      showToast('Error loading message history', 'error');
    }
  };

  const handleSendComplete = () => {
    setSelectedCustomers([]);
    loadCustomers();
    showToast('Messages sent successfully', 'success');
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      ),
      accessor: 'select',
      cell: (customer) => (
        <input
          type="checkbox"
          checked={selectedCustomers.some(c => c.id === customer.id)}
          onChange={(e) => handleSelectCustomer(customer, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      )
    },
    {
      header: 'Customer Name',
      accessor: 'name'
    },
    {
      header: 'Phone Number',
      accessor: 'phone'
    },
    {
      header: 'Balance',
      accessor: 'balance',
      cell: (customer) => `$${customer.balance?.toFixed(2) || '0.00'}`
    },
    {
      header: 'Sent Messages',
      accessor: 'sent_count',
      cell: (customer) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          {customer.sent_count || 0}
        </span>
      )
    },
    {
      header: 'Failed Messages',
      accessor: 'failed_count',
      cell: (customer) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
          {customer.failed_count || 0}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (customer) => (
        <button
          onClick={() => handleViewHistory(customer)}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      )
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Customer SMS</h1>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Customer Type:
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Customers</option>
                  <option value="credit">Credit Customers</option>
                </select>
              </div>
            </div>

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

          {selectedCustomers.length > 0 && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedCustomers.length}</strong> customer(s) selected
              </p>
            </div>
          )}

          <Table
            data={filteredCustomers}
            columns={columns}
            loading={loading}
          />
        </div>

        <SendMessageModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          recipientType="customer"
          selectedRecipients={selectedCustomers}
          onSendComplete={handleSendComplete}
        />

        <MessageHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          messages={messageHistory}
          recipientName={selectedCustomerHistory?.name}
        />
      </div>
    </Layout>
  );
};

export default CustomerSMS;
