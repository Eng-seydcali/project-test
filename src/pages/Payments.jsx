import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Building2, Calendar, Eye, CreditCard as Edit2, CreditCard as Edit, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useToast } from '../contexts/ToastContext';
import { paymentsAPI, customersAPI, carsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';

const Payments = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentOutModal, setShowPaymentOutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
const [editPaymentData, setEditPaymentData] = useState(null);



  
  // Payment number state
  const [nextMakePaymentNumber, setNextMakePaymentNumber] = useState('MKPYNO-001');
  const [nextOutPaymentNumber, setNextOutPaymentNumber] = useState('OTPYNO-001');
  
  const [receiveFormData, setReceiveFormData] = useState({
    customerId: '',
    paymentNo: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });
  
  const [paymentOutFormData, setPaymentOutFormData] = useState({
    carId: '',
    paymentNo: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  // Data from database
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([
    { value: 'farsamo', label: 'farsamo' },
    { value: 'shidaal', label: 'shidaal' },
    { value: 'canshuur', label: 'canshuur' },
    { value: 'mushaar', label: 'mushaar' },
    { value: 'other', label: 'Other' }
  ]);

  // Account Monthly options - generate for current and past months
  const [accountMonths, setAccountMonths] = useState([]);

  // Modal states for adding new category
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal for viewing payment details
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Load data from database
  useEffect(() => {
    loadAllData();
    generateAccountMonths();
    generateNextPaymentNumber();
  }, []);

  const generateAccountMonths = () => {
    const months = [];
    const currentDate = new Date();

    // Generate 12 months (current + 11 previous)
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthLabel = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      months.push({
        value: monthKey,
        label: monthLabel,
        status: i === 0 ? 'Active' : 'Closed' // Current month is active, others are closed
      });
    }

    setAccountMonths(months);
  };

  const generateNextPaymentNumber = () => {
    // Find the highest MKPYNO- number
    const makePaymentNumbers = payments
      .filter(payment => payment.paymentNo && payment.paymentNo.startsWith('MKPYNO-'))
      .map(payment => parseInt(payment.paymentNo.replace('MKPYNO-', '')))
      .filter(num => !isNaN(num));

    const maxMakeNumber = makePaymentNumbers.length > 0 ? Math.max(...makePaymentNumbers) : 0;
    const nextMakeNumber = maxMakeNumber + 1;
    const nextMakePaymentNo = `MKPYNO-${String(nextMakeNumber).padStart(3, '0')}`;

    // Find the highest OTPYNO- number
    const outPaymentNumbers = payments
      .filter(payment => payment.paymentNo && payment.paymentNo.startsWith('OTPYNO-'))
      .map(payment => parseInt(payment.paymentNo.replace('OTPYNO-', '')))
      .filter(num => !isNaN(num));

    const maxOutNumber = outPaymentNumbers.length > 0 ? Math.max(...outPaymentNumbers) : 0;
    const nextOutNumber = maxOutNumber + 1;
    const nextOutPaymentNo = `OTPYNO-${String(nextOutNumber).padStart(3, '0')}`;

    setNextMakePaymentNumber(nextMakePaymentNo);
    setNextOutPaymentNumber(nextOutPaymentNo);

    // Set in forms
    setReceiveFormData(prev => ({
      ...prev,
      paymentNo: nextMakePaymentNo
    }));

    setPaymentOutFormData(prev => ({
      ...prev,
      paymentNo: nextOutPaymentNo
    }));
  };

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [customersResponse, carsResponse, paymentsResponse] = await Promise.all([
        customersAPI.getAll(),
        carsAPI.getAll(),
        paymentsAPI.getAll()
      ]);
      
      setCustomers(customersResponse.data);
      setCars(carsResponse.data);
      setPayments(paymentsResponse.data);
      
      console.log('✅ Payment data loaded:', {
        customers: customersResponse.data.length,
        cars: carsResponse.data.length,
        payments: paymentsResponse.data.length
      });
      
      // Generate next payment number after loading payments
      setTimeout(() => {
        generateNextPaymentNumber();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error loading payment data:', error);
      showError('Load Failed', 'Failed to load required data for payments');
    } finally {
      setLoadingData(false);
    }
  };

  const handleReceiveChange = (e) => {
    let { name, value } = e.target;

    // Phone number validation - must start with +1
    if (name === 'phoneNumber' && value && !value.startsWith('+1')) {
      value = '+1' + value.replace(/^\+?1?/, '');
    }

    // Payment number validation - must start with MKPYNO-
    if (name === 'paymentNo' && value && !value.startsWith('MKPYNO-')) {
      value = 'MKPYNO-' + value.replace(/^MKPYNO-/i, '');
    }

    setReceiveFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentOutChange = (e) => {
    let { name, value } = e.target;

    // Phone number validation - must start with +1
    if (name === 'phoneNumber' && value && !value.startsWith('+1')) {
      value = '+1' + value.replace(/^\+?1?/, '');
    }

    // Payment number validation - must start with OTPYNO-
    if (name === 'paymentNo' && value && !value.startsWith('OTPYNO-')) {
      value = 'OTPYNO-' + value.replace(/^OTPYNO-/i, '');
    }

    setPaymentOutFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showError('Validation Error', 'Please enter a category name');
      return;
    }

    const newCategory = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryName
    };

    setCategories(prev => [...prev, newCategory]);
    setPaymentOutFormData(prev => ({
      ...prev,
      category: newCategory.value
    }));

    setNewCategoryName('');
    setShowAddCategoryModal(false);
    showSuccess('Category Added', `${newCategoryName} has been added to categories`);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
    console.log('👁️ Viewing payment:', payment);
  };
const formatDateForInput = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// change handler for edit form
const handleEditPaymentChange = (e) => {
  let { name, value } = e.target;

  // Payment number validation based on type
  if (name === 'paymentNo' && value && editPaymentData) {
    if (editPaymentData.type === 'receive' && !value.startsWith('MKPYNO-')) {
      value = 'MKPYNO-' + value.replace(/^(MKPYNO-|OTPYNO-)/i, '');
    } else if (editPaymentData.type === 'out' && !value.startsWith('OTPYNO-')) {
      value = 'OTPYNO-' + value.replace(/^(MKPYNO-|OTPYNO-)/i, '');
    }
  }

  setEditPaymentData(prev => ({
    ...prev,
    [name]: value
  }));
};

// ✅ EDIT PAYMENT SUBMIT (UPDATED)
const handleEditPaymentSubmit = async (e) => {
  e.preventDefault();
  if (!editPaymentData) return;

  // Validate payment number prefix
  if (editPaymentData.paymentNo) {
    if (
      editPaymentData.type === 'receive' &&
      !editPaymentData.paymentNo.startsWith('MKPYNO-')
    ) {
      showError('Validation Error', 'Make payment number must start with MKPYNO-');
      return;
    }
    if (
      editPaymentData.type === 'out' &&
      !editPaymentData.paymentNo.startsWith('OTPYNO-')
    ) {
      showError('Validation Error', 'Out payment number must start with OTPYNO-');
      return;
    }
  }

  setLoading(true);

  try {
    // Get original amount for logging/debug
    const originalAmount =
      payments.find((p) => p._id === editPaymentData._id)?.amount || 0;

    // Extract customer or car ID
    let customerId = null;
    let carId = null;

    if (editPaymentData.type === 'receive') {
      if (
        typeof editPaymentData.recipientId === 'object' &&
        editPaymentData.recipientId?._id
      ) {
        customerId = editPaymentData.recipientId._id;
      } else {
        customerId =
          editPaymentData.recipientId ||
          editPaymentData.customerId?._id ||
          editPaymentData.customerId;
      }
    } else if (editPaymentData.type === 'out') {
      if (
        typeof editPaymentData.recipientId === 'object' &&
        editPaymentData.recipientId?._id
      ) {
        carId = editPaymentData.recipientId._id;
      } else {
        carId =
          editPaymentData.recipientId ||
          editPaymentData.carId?._id ||
          editPaymentData.carId;
      }
    }

    // Payload for API
    const payload = {
      paymentNo: editPaymentData.paymentNo,
      amount: parseFloat(editPaymentData.amount || 0),
      description: editPaymentData.description,
      paymentDate: editPaymentData.paymentDate,
      type: editPaymentData.type,
    };

    console.log('🚀 Submitting payment update:', {
      id: editPaymentData._id,
      type: editPaymentData.type,
      customerId,
      carId,
      payload,
    });

    // ✅ Use separate API endpoints based on type
    let response;
    if (editPaymentData.type === 'receive') {
      response = await paymentsAPI.updateReceivePayment(editPaymentData._id, {
        ...payload,
        customerId,
      });
    } else if (editPaymentData.type === 'out') {
      response = await paymentsAPI.updatePaymentOut(editPaymentData._id, {
        ...payload,
        carId,
      });
    }

    console.log('✅ Payment update response:', response?.data);

    // ✅ Success message
    if (response?.data?.success) {
      showSuccess(`Payment ${editPaymentData.paymentNo} updated successfully`);

      // Close modal and refresh data
      setShowEditPaymentModal(false);
      setEditPaymentData(null);
      await loadAllData();
    } else {
      throw new Error(response?.data?.error || 'Failed to update payment');
    }
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    showError(error.response?.data?.error || error.message || 'Error updating payment');
  } finally {
    setLoading(false);
  }
};




// delete payment handler
const handleDeletePayment = async (payment) => {
  const confirmMessage = `Delete Payment?\n\n` +
    `Payment: ${payment.paymentNo || 'N/A'}\n` +
    `Amount: $${payment.amount.toLocaleString()}\n` +
    `Type: ${payment.type === 'receive' ? 'Payment Received' : 'Payment Out'}\n\n` +
    `This action cannot be undone.\n\n` +
    `Continue?`;

  if (window.confirm(confirmMessage)) {
    try {
      setLoading(true);

      const customerId = payment.customerId?._id || payment.customerId;
      const carId = payment.carId?._id || payment.carId;

      await paymentsAPI.deleteWithBalanceAdjustment(
        payment._id,
        payment.amount,
        customerId,
        carId
      );

      showSuccess(
        'Payment Deleted',
        `Payment deleted successfully`
      );

      loadAllData();

    } catch (error) {
      console.error('❌ Error deleting payment:', error);
      showError('Delete Failed', 'Failed to delete payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }
};


  const validateReceiveForm = () => {
    if (!receiveFormData.customerId) {
      showError('Validation Error', 'Please select a customer');
      return false;
    }
    if (!receiveFormData.amount || parseFloat(receiveFormData.amount) <= 0) {
      showError('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (receiveFormData.phoneNumber && !receiveFormData.phoneNumber.startsWith('+1')) {
      showError('Validation Error', 'Phone number must start with +1');
      return false;
    }
    if (receiveFormData.paymentNo && !receiveFormData.paymentNo.startsWith('MKPYNO-')) {
      showError('Validation Error', 'Payment number must start with MKPYNO-');
      return false;
    }
    return true;
  };

  const validatePaymentOutForm = () => {
    if (!paymentOutFormData.carId) {
      showError('Validation Error', 'Please select a car');
      return false;
    }
    if (!paymentOutFormData.amount || parseFloat(paymentOutFormData.amount) <= 0) {
      showError('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (paymentOutFormData.phoneNumber && !paymentOutFormData.phoneNumber.startsWith('+1')) {
      showError('Validation Error', 'Phone number must start with +1');
      return false;
    }
    if (paymentOutFormData.paymentNo && !paymentOutFormData.paymentNo.startsWith('OTPYNO-')) {
      showError('Validation Error', 'Payment number must start with OTPYNO-');
      return false;
    }
    return true;
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateReceiveForm()) return;
    
    setLoading(true);
    
    try {
      const paymentData = {
        customerId: receiveFormData.customerId,
        paymentNo: receiveFormData.paymentNo,
        amount: parseFloat(receiveFormData.amount),
        description: receiveFormData.description,
        paymentDate: receiveFormData.date
      };
      
      const response = await paymentsAPI.receive(paymentData);
      console.log('✅ Payment received:', response.data);
      
      const customer = customers.find(c => c._id === receiveFormData.customerId);
      
      showSuccess(
        'Payment Received', 
        `Payment of $${receiveFormData.amount} received from ${customer?.customerName} with payment number ${receiveFormData.paymentNo}`
      );
      
      setShowReceiveModal(false);

      // Generate next payment number
      const nextNum = parseInt(nextMakePaymentNumber.replace('MKPYNO-', '')) + 1;
      const newPaymentNo = `MKPYNO-${String(nextNum).padStart(3, '0')}`;
      setNextMakePaymentNumber(newPaymentNo);

      // Reset form with new payment number
      setReceiveFormData({
        customerId: '',
        paymentNo: newPaymentNo,
        phoneNumber: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
      });
      
      // Reload payments
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      showError('Payment Failed', error.response?.data?.error || 'Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentOutSubmit = async (e) => {
    e.preventDefault();

    if (!validatePaymentOutForm()) return;

    setLoading(true);

    try {
      const paymentData = {
        accountType: 'car',
        recipientId: paymentOutFormData.carId,
        paymentNo: paymentOutFormData.paymentNo,
        amount: parseFloat(paymentOutFormData.amount),
        description: paymentOutFormData.description || 'Payment Out',
        paymentDate: paymentOutFormData.date
      };

      const response = await paymentsAPI.paymentOut(paymentData);
      console.log('✅ Payment processed:', response.data);

      // Add payment amount to car left amount
      const selectedCar = cars.find(car => car._id === paymentOutFormData.carId);
      if (selectedCar) {
        const newCarLeft = (selectedCar.left || 0) + parseFloat(paymentOutFormData.amount);
        await carsAPI.update(paymentOutFormData.carId, {
          left: newCarLeft
        });
        console.log(`✅ Car ${selectedCar.carName} left amount updated: +$${paymentOutFormData.amount} = $${newCarLeft}`);
      }

      showSuccess(
        'Payment Processed',
        `Payment of $${paymentOutFormData.amount} processed for ${selectedCar?.carName} with payment number ${paymentOutFormData.paymentNo}`
      );

      setShowPaymentOutModal(false);

      // Generate next payment number
      const nextNum = parseInt(nextOutPaymentNumber.replace('OTPYNO-', '')) + 1;
      const newPaymentNo = `OTPYNO-${String(nextNum).padStart(3, '0')}`;
      setNextOutPaymentNumber(newPaymentNo);

      // Reset form with new payment number
      setPaymentOutFormData({
        carId: '',
        paymentNo: newPaymentNo,
        phoneNumber: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
      });

      // Reload payments
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      showError('Payment Failed', error.response?.data?.error || 'Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">Manage incoming and outgoing payments</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Receive Payment</h3>
              <p className="text-gray-600">Record payments from customers</p>
            </div>
          </div>
          <Button
            onClick={() => setShowReceiveModal(true)}
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Receive Payment
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Out</h3>
              <p className="text-gray-600">Make payments for car expenses</p>
            </div>
          </div>
          <Button
            onClick={() => setShowPaymentOutModal(true)}
            variant="secondary"
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Payment Out
          </Button>
        </div>
      </div>

      {/* Account Monthly Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Monthly Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountMonths.slice(0, 6).map((month) => (
            <div key={month.value} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{month.label}</h4>
                  <p className="text-sm text-gray-600">{month.value}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    month.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {month.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Transactions</h3>
              <p className="text-gray-600">Payment transactions will appear here once you start processing payments.</p>
            </div>
          ) : (
            <div className="space-y-4">
           {payments.map((payment) => (

                <div key={payment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      payment.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {payment.type === 'receive' ? (
                        <ArrowDownLeft className={`w-5 h-5 ${
                          payment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.paymentNo && `Payment: ${payment.paymentNo}`}
                        {payment.accountMonth && ` - ${payment.accountMonth}`}
                        {payment.description && ` - ${payment.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <p className={`font-semibold ${
                        payment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'receive' ? '+' : '-'}${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditPaymentData(payment);
                        setShowEditPaymentModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit Payment"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receive Payment Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Haype System</h3>
                  <p className="text-sm text-gray-600">Receive Payment</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
              <FormSelect
                label="Select Customer"
                name="customerId"
                value={receiveFormData.customerId}
                onChange={handleReceiveChange}
                options={[
                  { value: '', label: 'Choose a customer' },
                  ...customers.map(customer => ({
                    value: customer._id,
                    label: `${customer.customerName} (Balance: $${(customer.balance || 0).toLocaleString()})`
                  }))
                ]}
                required
              />

              <FormInput
                label="Payment Number (Optional)"
                name="paymentNo"
                value={receiveFormData.paymentNo}
                onChange={handleReceiveChange}
                placeholder="e.g., MKPYNO-001"
              />

              <FormInput
                label="Phone Number (Optional)"
                name="phoneNumber"
                value={receiveFormData.phoneNumber}
                onChange={handleReceiveChange}
                placeholder="+1234567890"
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={receiveFormData.date}
                onChange={handleReceiveChange}
                required
              />

              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={receiveFormData.amount}
                onChange={handleReceiveChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={receiveFormData.description}
                onChange={handleReceiveChange}
                placeholder="Payment description"
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Processing...' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Out Modal */}
      {showPaymentOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Haype System</h3>
                  <p className="text-sm text-gray-600">Payment Out - Car Expenses</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handlePaymentOutSubmit} className="p-6 space-y-4">
              <FormSelect
                label="Select Car"
                name="carId"
                value={paymentOutFormData.carId}
                onChange={handlePaymentOutChange}
                options={[
                  { value: '', label: 'Choose a car' },
                  ...cars.map(car => ({
                    value: car._id,
                    label: `${car.carName} (Balance: $${(car.balance || 0).toLocaleString()})`
                  }))
                ]}
                required
              />

              <FormInput
                label="Payment Number (Optional)"
                name="paymentNo"
                value={paymentOutFormData.paymentNo}
                onChange={handlePaymentOutChange}
                placeholder="e.g., OTPYNO-001"
              />

              <FormInput
                label="Phone Number (Optional)"
                name="phoneNumber"
                value={paymentOutFormData.phoneNumber}
                onChange={handlePaymentOutChange}
                placeholder="+1234567890"
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={paymentOutFormData.date}
                onChange={handlePaymentOutChange}
                required
              />

              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={paymentOutFormData.amount}
                onChange={handlePaymentOutChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={paymentOutFormData.description}
                onChange={handlePaymentOutChange}
                placeholder="Payment description"
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentOutModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Processing...' : 'Process Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
              <p className="text-sm text-gray-600">Create a new expense category</p>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Tolls, Parking"
                required
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCategory} className="flex-1">
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewPaymentModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full ${
                    selectedPayment.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {selectedPayment.type === 'receive' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">
                      {selectedPayment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-medium">{selectedPayment.paymentNo || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-semibold ${
                      selectedPayment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedPayment.type === 'receive' ? '+' : '-'}${selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  {(selectedPayment.customerId || (selectedPayment.accountType === 'customer' && selectedPayment.recipientId)) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">
                        {(() => {
                          const customerId = selectedPayment.customerId?._id || selectedPayment.customerId || selectedPayment.recipientId?._id || selectedPayment.recipientId;
                          const customer = customers.find(c => c._id === customerId);
                          return customer?.customerName || selectedPayment.customerId?.customerName || 'Unknown Customer';
                        })()}
                      </span>
                    </div>
                  )}

                  {(selectedPayment.carId || (selectedPayment.accountType === 'car' && selectedPayment.recipientId)) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Car:</span>
                      <span className="font-medium">
                        {(() => {
                          const carId = selectedPayment.carId?._id || selectedPayment.carId || selectedPayment.recipientId?._id || selectedPayment.recipientId;
                          const car = cars.find(c => c._id === carId);
                          return car?.carName || selectedPayment.carId?.carName || 'Unknown Car';
                        })()}
                      </span>
                    </div>
                  )}
                  
                  {selectedPayment.accountMonth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Month:</span>
                      <span className="font-medium">{selectedPayment.accountMonth}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{selectedPayment.description || 'No description'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowViewPaymentModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Edit Payment Modal */}
{showEditPaymentModal && editPaymentData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Payment</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowEditPaymentModal(false);
              setEditPaymentData(null);
            }}
          >
            Close
          </Button>
        </div>
      </div>

      <form onSubmit={handleEditPaymentSubmit} className="p-6 space-y-4">
        <FormInput
          label="Payment Number (Optional)"
          name="paymentNo"
          value={editPaymentData.paymentNo || ''}
          onChange={handleEditPaymentChange}
          placeholder={editPaymentData.type === 'receive' ? 'MKPYNO-001' : 'OTPYNO-001'}
        />

        <FormInput
          label="Payment Date"
          type="date"
          name="paymentDate"
          value={formatDateForInput(editPaymentData.paymentDate)}
          onChange={handleEditPaymentChange}
          required
        />

        {/* ✅ Conditional select field */}
      {editPaymentData.type === 'receive' ? (
  <FormSelect
    label="Select Customer"
    name="customerId"
    value={
      editPaymentData.customerId?._id ||
      editPaymentData.customerId ||
      ''
    }
    onChange={handleEditPaymentChange}
   options={[
                  { value: '', label: 'Choose a customer' },
                  ...customers.map(customer => ({
                    value: customer._id,
                    label: `${customer.customerName} (Balance: $${(customer.balance || 0).toLocaleString()})`
                  }))
                ]}
    required
  />
) : (
          <FormSelect
            label="Select Car"
            name="carId"
            value={editPaymentData.carId?._id || editPaymentData.carId || ''}
            onChange={handleEditPaymentChange}
            options={[
              { value: '', label: 'Choose a car' },
              ...cars.map(car => ({
                value: car._id,
                label: `${car.carName} (Balance: $${(car.balance || 0).toLocaleString()})`
              }))
            ]}
            required
          />
        )}

        <FormInput
          label="Amount"
          type="number"
          name="amount"
          value={editPaymentData.amount || ''}
          onChange={handleEditPaymentChange}
          required
        />

        <FormInput
          label="Description"
          name="description"
          value={editPaymentData.description || ''}
          onChange={handleEditPaymentChange}
        />

        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowEditPaymentModal(false);
              setEditPaymentData(null);
            }}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  </div>
)}




      <Footer/>
    </div>
  );
};

export default Payments;