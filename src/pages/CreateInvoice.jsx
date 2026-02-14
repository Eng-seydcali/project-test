import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Save, Plus, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import SearchableDropdown from '../components/SearchableDropdown';
import { useToast } from '../contexts/ToastContext';
import { invoicesAPI, carsAPI, itemsAPI, customersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();
  const [currentInvoice, setCurrentInvoice] = useState(1);
  const [formData, setFormData] = useState({
    carId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNo: 'INV-001'
  });
  
  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      itemId: '',
      customerId: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      leftAmount: 0,
      paymentMethod: 'cash'
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Data from database
  const [cars, setCars] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Modal states for adding new items/customers
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  // New item form data
  const [newItemData, setNewItemData] = useState({
    itemName: '',
   
  });

  // New customer form data
  const [newCustomerData, setNewCustomerData] = useState({
    customerName: '',
    phoneNumber: '',
    balance: 0
  });

  // Load data from database and get next invoice number
  useEffect(() => {
    loadAllData();
    getNextInvoiceNumber();
  }, []);

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [carsResponse, itemsResponse, customersResponse] = await Promise.all([
        carsAPI.getAll(),
        itemsAPI.getAll(),
        customersAPI.getAll()
      ]);
      
      setCars(carsResponse.data);
      setItems(itemsResponse.data);
      setCustomers(customersResponse.data);
      
      console.log('✅ Invoice creation data loaded:', {
        cars: carsResponse.data.length,
        items: itemsResponse.data.length,
        customers: customersResponse.data.length
      });
    } catch (error) {
      console.error('❌ Error loading invoice data:', error);
      showError('Load Failed', 'Failed to load required data for invoice creation');
    } finally {
      setLoadingData(false);
    }
  };

  const getNextInvoiceNumber = async () => {
    try {
      const response = await invoicesAPI.getAll();
      const invoices = response.data;
      
      if (invoices.length === 0) {
        setFormData(prev => ({ ...prev, invoiceNo: 'INV-001' }));
        setCurrentInvoice(1);
      } else {
        // Find the highest invoice number
        const invoiceNumbers = invoices
          .map(inv => inv.invoiceNo)
          .filter(no => no.startsWith('INV-'))
          .map(no => parseInt(no.replace('INV-', '')))
          .filter(num => !isNaN(num));
        
        const maxNumber = Math.max(...invoiceNumbers, 0);
        const nextNumber = maxNumber + 1;
        const nextInvoiceNo = `INV-${String(nextNumber).padStart(3, '0')}`;
        
        setFormData(prev => ({ ...prev, invoiceNo: nextInvoiceNo }));
        setCurrentInvoice(nextNumber);
      }
    } catch (error) {
      console.error('❌ Error getting next invoice number:', error);
      setFormData(prev => ({ ...prev, invoiceNo: 'INV-001' }));
      setCurrentInvoice(1);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    // Check if user selected "Add New" option
    if (field === 'itemId' && value === 'add_new') {
      setCurrentItemIndex(index);
      setShowAddItemModal(true);
      return;
    }

    if (field === 'customerId' && value === 'add_new') {
      setCurrentItemIndex(index);
      setShowAddCustomerModal(true);
      return;
    }

    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    
    // Auto-calculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    
    // Auto-fill price when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        updatedItems[index].price = selectedItem.price;
        updatedItems[index].total = updatedItems[index].quantity * selectedItem.price;
      }
    }
    
    setInvoiceItems(updatedItems);
  };

  // Handle new item creation
  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItemData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateNewItem = async (e) => {
    e.preventDefault();
    
    if (!newItemData.itemName.trim() || !newItemData.price) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const itemToCreate = {
        itemName: newItemData.itemName.trim(),
        
      };
      
      console.log('🔄 Creating new item:', itemToCreate);
      const response = await itemsAPI.create(itemToCreate);
      console.log('✅ New item created:', response.data);
      
      // Add to items list
      const newItem = {
        _id: response.data._id || response.data.itemId || Date.now().toString(),
        itemName: itemToCreate.itemName,
        
      };
      
      setItems(prev => [...prev, newItem]);
      
      // Auto-select the new item in the current row
      if (currentItemIndex !== null) {
        const updatedItems = [...invoiceItems];
        updatedItems[currentItemIndex].itemId = newItem._id;
        updatedItems[currentItemIndex].price = newItem.price;
        updatedItems[currentItemIndex].total = updatedItems[currentItemIndex].quantity * newItem.price;
        setInvoiceItems(updatedItems);
      }
      
      // Reset form and close modal
      setNewItemData({
        itemName: '',
        
      });
      setShowAddItemModal(false);
      setCurrentItemIndex(null);
      
      showSuccess('Item Created', `${itemToCreate.itemName} has been created and selected!`);
      
    } catch (error) {
      console.error('❌ Error creating item:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle new customer creation
  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomerData.customerName.trim()) {
      showError('Validation Error', 'Customer name is required');
      return;
    }

    try {
      setLoading(true);
      
      const customerToCreate = {
        customerName: newCustomerData.customerName.trim(),
        phoneNumber: newCustomerData.phoneNumber.trim(),
        balance: parseFloat(newCustomerData.balance) || 0
      };
      
      console.log('🔄 Creating new customer:', customerToCreate);
      const response = await customersAPI.create(customerToCreate);
      console.log('✅ New customer created:', response.data);
      
      // Add to customers list
      const newCustomer = {
        _id: response.data._id || response.data.customerId || Date.now().toString(),
        customerName: customerToCreate.customerName,
        phoneNumber: customerToCreate.phoneNumber,
        balance: customerToCreate.balance
      };
      
      setCustomers(prev => [...prev, newCustomer]);
      
      // Auto-select the new customer in the current row
      if (currentItemIndex !== null) {
        const updatedItems = [...invoiceItems];
        updatedItems[currentItemIndex].customerId = newCustomer._id;
        setInvoiceItems(updatedItems);
      }
      
      // Reset form and close modal
      setNewCustomerData({
        customerName: '',
        phoneNumber: '',
        balance: 0
      });
      setShowAddCustomerModal(false);
      setCurrentItemIndex(null);
      
      showSuccess('Customer Created', `${customerToCreate.customerName} has been created and selected!`);
      
    } catch (error) {
      console.error('❌ Error creating customer:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addInvoiceItem = () => {
    if (invoiceItems.length < 10) {
      setInvoiceItems([...invoiceItems, {
        id: invoiceItems.length + 1,
        itemId: '',
        customerId: '',
        description: '',
        quantity: 1,
        price: 0,
        total: 0,
        leftAmount: 0,
        paymentMethod: 'cash'
      }]);
      showSuccess('Item Added', 'New invoice item added successfully');
    } else {
      showWarning('Item Limit', 'Maximum 10 items allowed per invoice');
    }
  };

  const removeInvoiceItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
      showSuccess('Item Removed', 'Invoice item removed successfully');
    } else {
      showWarning('Cannot Remove', 'At least one item is required');
    }
  };

  const calculateTotals = () => {
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const totalLeft = invoiceItems.reduce((sum, item) => sum + item.leftAmount, 0);
    
    return { total, totalLeft };
  };

  const validateForm = () => {
    if (!formData.carId) {
      showError('Validation Error', 'Please select a car');
      return false;
    }
    
    if (!formData.invoiceDate) {
      showError('Validation Error', 'Please select invoice date');
      return false;
    }
    
    if (!formData.invoiceNo) {
      showError('Validation Error', 'Please enter invoice number');
      return false;
    }
    
    const hasValidItems = invoiceItems.some(item => 
      item.itemId && item.customerId && item.quantity > 0 && item.price > 0
    );
    
    if (!hasValidItems) {
      showError('Validation Error', 'Please add at least one valid item with item, customer, quantity and price');
      return false;
    }
    
    return true;
  };

  // NEW: Simplified amount distribution function (NO PROFIT CALCULATION)
  const distributeAmounts = async (invoiceData) => {
    try {
      const selectedCar = cars.find(car => car._id === formData.carId);
      
      console.log('🔄 Starting simplified amount distribution...');
      
      // 1. Update Car Balance (add total only)
      if (selectedCar) {
        const { total } = invoiceData;
        const newCarBalance = (selectedCar.balance || 0) + total;
        await carsAPI.update(formData.carId, { 
          balance: newCarBalance 
        });
        console.log(`✅ Car ${selectedCar.carName} balance updated: +$${total} = $${newCarBalance}`);
      }

      // 2. Update Car Left Amount (add totalLeft)
      if (selectedCar && invoiceData.totalLeft > 0) {
        const newCarLeft = (selectedCar.left || 0) + invoiceData.totalLeft;
        await carsAPI.update(formData.carId, { 
          left: newCarLeft 
        });
        console.log(`✅ Car ${selectedCar.carName} left amount updated: +$${invoiceData.totalLeft} = $${newCarLeft}`);
      }

      // 3. Process each item for customer balances
      for (const item of invoiceData.items) {
        const selectedCustomer = customers.find(cust => cust._id === item.customerId);
        
        // Update customer balance based on payment method
        if (selectedCustomer) {
          if (item.paymentMethod === 'credit') {
            // Add to customer balance (debt)
            const newCustomerBalance = (selectedCustomer.balance || 0) + item.total;
            await customersAPI.update(item.customerId, { 
              balance: newCustomerBalance 
            });
            console.log(`✅ Customer ${selectedCustomer.customerName} credit balance updated: +$${item.total} = $${newCustomerBalance}`);
          } else {
            // Cash payment - just record the transaction (no balance change)
            console.log(`✅ Customer ${selectedCustomer.customerName} paid cash: $${item.total} (no balance change)`);
          }
        }
      }
      
      console.log('🎉 Simplified amount distribution completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in amount distribution:', error);
      showError('Distribution Error', 'Error distributing amounts. Please check manually.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { total, totalLeft } = calculateTotals();
      const invoiceData = {
        invoiceNo: formData.invoiceNo,
        carId: formData.carId,
        invoiceDate: formData.invoiceDate,
        items: invoiceItems.map(item => ({
          itemId: item.itemId,
          customerId: item.customerId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          leftAmount: item.leftAmount,
          paymentMethod: item.paymentMethod
        })),
        total,
        totalLeft,
        totalProfit: 0
      };
      
      // Create invoice first
      const response = await invoicesAPI.create(invoiceData);
      console.log('✅ Invoice created:', response.data);
      
      // Then distribute amounts
      await distributeAmounts(invoiceData);
      
      // Remove from localStorage after successful submission
      localStorage.removeItem(`invoice_${formData.invoiceNo}`);
      
      showSuccess(
        'Invoice Created & Ready for Another', 
        `Invoice ${formData.invoiceNo} created successfully! Ready to create another invoice.`
      );
      
      // Reset form for next invoice instead of navigating
      const nextInvoiceNo = currentInvoice + 1;
      setCurrentInvoice(nextInvoiceNo);
      
      // Update invoice number
      const newInvoiceNo = `INV-${String(nextInvoiceNo).padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        invoiceNo: newInvoiceNo
      }));
      
      // Reset form
      resetForm(newInvoiceNo);
      
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoiceAndAnother = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { total, totalLeft } = calculateTotals();
      
      const invoiceData = {
        invoiceNo: formData.invoiceNo,
        carId: formData.carId,
        invoiceDate: formData.invoiceDate,
        items: invoiceItems.map(item => ({
          itemId: item.itemId,
          customerId: item.customerId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          leftAmount: item.leftAmount,
          paymentMethod: item.paymentMethod
        })),
        total,
        totalLeft,
        totalProfit: 0
      };
      
      // Create invoice first
      const response = await invoicesAPI.create(invoiceData);
      console.log('✅ Invoice created:', response.data);
      
      // Then distribute amounts
      await distributeAmounts(invoiceData);
      
      // Remove from localStorage after successful submission
      localStorage.removeItem(`invoice_${formData.invoiceNo}`);
      
      showSuccess(
        'Invoice Created & Ready for Another', 
        `Invoice ${formData.invoiceNo} created and distributed successfully! Ready to create another invoice.`
      );
      
      // Reset form for next invoice instead of navigating
      const nextInvoiceNo = currentInvoice + 1;
      setCurrentInvoice(nextInvoiceNo);
      
      // Update invoice number
      const newInvoiceNo = `INV-${String(nextInvoiceNo).padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        invoiceNo: newInvoiceNo
      }));
      
      // Reset form
      resetForm(newInvoiceNo);
      
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handlePreviousInvoice = () => {
    if (currentInvoice > 1) {
      const prevInvoiceNo = currentInvoice - 1;
      setCurrentInvoice(prevInvoiceNo);
      
      // Update invoice number
      const newInvoiceNo = `INV-${String(prevInvoiceNo).padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        invoiceNo: newInvoiceNo
      }));
      
      // Reset form
      resetForm(newInvoiceNo);
      showSuccess('Previous Invoice', `Switched to invoice ${newInvoiceNo}`);
    } else {
      showWarning('First Invoice', 'You are already at the first invoice');
    }
  };

  const handleNextInvoice = () => {
    const nextInvoiceNo = currentInvoice + 1;
    setCurrentInvoice(nextInvoiceNo);
    
    // Update invoice number
    const newInvoiceNo = `INV-${String(nextInvoiceNo).padStart(3, '0')}`;
    setFormData(prev => ({
      ...prev,
      invoiceNo: newInvoiceNo
    }));
    
    // Reset form
    resetForm(newInvoiceNo);
    showSuccess('Next Invoice', `Switched to invoice ${newInvoiceNo}`);
  };

  const resetForm = (invoiceNo) => {
    setFormData({
      carId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      invoiceNo: invoiceNo
    });
    
    setInvoiceItems([{
      id: 1,
      itemId: '',
      customerId: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      leftAmount: 0,
      paymentMethod: 'cash'
    }]);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  const { total, totalLeft } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            to="/invoices"
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-gray-600">Generate new invoice for transactions</p>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePreviousInvoice}
            disabled={currentInvoice <= 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Invoice"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              Invoice {currentInvoice}
            </span>
          </div>
          
          <button 
            onClick={handleNextInvoice}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next Invoice"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Company Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Haype System</h2>
                <p className="text-gray-600">Business Management System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-semibold">{new Date(formData.invoiceDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormSelect
              label="Select Car"
              name="carId"
              value={formData.carId}
              onChange={handleFormChange}
              options={[
                { value: '', label: 'Choose a car' },
                ...cars.map(car => ({ value: car._id, label: car.carName }))
              ]}
              required
            />

            <FormInput
              label="Invoice Date"
              name="invoiceDate"
              type="date"
              value={formData.invoiceDate}
              onChange={handleFormChange}
              required
            />

            <FormInput
              label="Invoice No"
              name="invoiceNo"
              value={formData.invoiceNo}
              onChange={handleFormChange}
              required
              Enapble
            />
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
            <Button
              onClick={addInvoiceItem}
              variant="outline"
              size="sm"
              disabled={invoiceItems.length >= 10}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Qty</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Left</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {/* Searchable Item Dropdown - Like the image */}
                      <div>
                        <SearchableDropdown
                        placeholder="Search & select item..."
                        value={(() => {
                          const selectedItem = items.find(i => i._id === item.itemId);
                          return selectedItem ? selectedItem.itemName : '';
                        })()}
                        options={items.map(itm => ({
                          id: itm._id,
                          label: itm.itemName,
                          subtitle: `Available in inventory`
                        }))}
                        onSelect={(selectedItem) => {
                          if (selectedItem) {
                            handleItemChange(index, 'itemId', selectedItem.id);
                          } else {
                            handleItemChange(index, 'itemId', '');
                          }
                        }}
                        onAddNew={(searchTerm) => {
                          setNewItemData(prev => ({ ...prev, itemName: searchTerm }));
                          setCurrentItemIndex(index);
                          setShowAddItemModal(true);
                        }}
                        addNewText="Add New Item"
                        width="200px"
                      />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Searchable Customer Dropdown - Like the image */}
                      <div>
                        <SearchableDropdown
                        placeholder="Search & select customer..."
                        value={(() => {
                          const selectedCustomer = customers.find(c => c._id === item.customerId);
                          return selectedCustomer ? selectedCustomer.customerName : '';
                        })()}
                        options={customers.map(customer => ({
                          id: customer._id,
                          label: customer.customerName,
                          subtitle: `Balance: $${(customer.balance || 0).toLocaleString()}`
                        }))}
                        onSelect={(selectedCustomer) => {
                          if (selectedCustomer) {
                            handleItemChange(index, 'customerId', selectedCustomer.id);
                          } else {
                            handleItemChange(index, 'customerId', '');
                          }
                        }}
                        onAddNew={(searchTerm) => {
                          setNewCustomerData(prev => ({ ...prev, customerName: searchTerm }));
                          setCurrentItemIndex(index);
                          setShowAddCustomerModal(true);
                        }}
                        addNewText="Add New Customer"
                        width="220px"
                      />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="bg-blue-50 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-blue-600">${item.total.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.leftAmount}
                        onChange={(e) => handleItemChange(index, 'leftAmount', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.paymentMethod}
                        onChange={(e) => handleItemChange(index, 'paymentMethod', e.target.value)}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeInvoiceItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={invoiceItems.length === 1}
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals - Simplified without profit */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Calculation Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">💰 Invoice Summary</h4>
                
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-600">Left Amount:</span>
                  <span className="text-lg font-bold text-red-600">${totalLeft.toFixed(2)}</span>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Profit calculation will be done during monthly account closing, not during invoice creation.
                  </p>
                </div>
              </div>
              
              {/* Right Column - Action Buttons */}
              <div className="flex flex-col justify-center space-y-4">
                <Button
                  onClick={handleCreateInvoiceAndAnother}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Create Invoice & Another Invoice & Distribute
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Item</h3>
              <p className="text-sm text-gray-600">Create a new item and add it to the invoice</p>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  name="itemName"
                  value={newItemData.itemName}
                  onChange={handleNewItemChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Cement, Sand, Gravel"
                  required
                />
              </div>

              

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddItemModal(false);
                    setCurrentItemIndex(null);
                    setNewItemData({ itemName: ''});
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create & Select'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
              <p className="text-sm text-gray-600">Create a new customer and add them to the invoice</p>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={newCustomerData.customerName}
                  onChange={handleNewCustomerChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={newCustomerData.phoneNumber}
                  onChange={handleNewCustomerChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Balance</label>
                <input
                  type="number"
                  name="balance"
                  value={newCustomerData.balance}
                  onChange={handleNewCustomerChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setCurrentItemIndex(null);
                    setNewCustomerData({ customerName: '', phoneNumber: '', balance: 0 });
                  }}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create & Select'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 New Invoice System</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• <strong>Auto Invoice Number:</strong> Invoice numbers are automatically generated (+1 from last invoice)</li>
          <li>• <strong>No Search in Tables:</strong> Items and customers are shown as simple dropdowns</li>
          <li>• <strong>No Profit Calculation:</strong> Profit will be calculated only during monthly account closing</li>
          <li>• <strong>Simple Distribution:</strong> Invoice total → car balance, left amount → car left</li>
          <li>• <strong>Customer Credit:</strong> If payment method is "Credit", amount added to customer balance</li>
          <li>• <strong>Customer Cash:</strong> If payment method is "Cash", recorded as transaction only</li>
          <li>• <strong>Monthly Closing:</strong> Profit calculation happens when account is closed at month end</li>
        </ul>
      </div>

      <Footer/>
    </div>
  );
};

export default CreateInvoice;