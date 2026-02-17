import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from './Button';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const SendMessageModal = ({ isOpen, onClose, recipientType, selectedRecipients, onSendComplete }) => {
  const [message, setMessage] = useState('');
  const [footerTags, setFooterTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFooterTags();
      loadCompanyInfo();
    }
  }, [isOpen]);

  const loadFooterTags = async () => {
    try {
      const response = await api.get('/sms/footer-tags');
      setFooterTags(response.data);
    } catch (error) {
      console.error('Error loading footer tags:', error);
    }
  };

  const loadCompanyInfo = () => {
    setCompanyInfo({ company_name: 'Haype Construction' });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !newTagValue.trim()) return;

    try {
      const response = await api.post('/sms/footer-tags', {
        tag_name: newTagName,
        tag_value: newTagValue
      });
      setFooterTags([...footerTags, response.data]);
      setNewTagName('');
      setNewTagValue('');
      setShowAddTag(false);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.delete(`/sms/footer-tags/${tagId}`);
      setFooterTags(footerTags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const insertTag = (tag, position = 'cursor') => {
    const textarea = document.getElementById('message-input');
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = message.substring(0, cursorPos);
    const textAfter = message.substring(cursorPos);

    if (position === 'end') {
      setMessage(message + (message ? '\n' : '') + tag);
    } else {
      setMessage(textBefore + tag + textAfter);
    }
  };

  const handleSendMessages = async () => {
    if (!message.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    if (selectedRecipients.length === 0) {
      showToast('No recipients selected', 'error');
      return;
    }

    setSending(true);
    try {
      const messages = selectedRecipients.map(recipient => {
        let personalizedMessage = message;

        if (recipientType === 'customer') {
          personalizedMessage = personalizedMessage
            .replace(/{customer_name}/g, recipient.name)
            .replace(/{balance}/g, recipient.balance || 0);
        } else {
          personalizedMessage = personalizedMessage
            .replace(/{employee_name}/g, recipient.name)
            .replace(/{balance}/g, recipient.balance || 0);
        }

        return {
          recipient_type: recipientType,
          recipient_id: recipient.id,
          recipient_name: recipient.name,
          phone_number: recipient.phone,
          message_content: personalizedMessage
        };
      });

      const response = await api.post('/sms/send', { messages });

      console.log('📤 SMS Response:', response.data);

      if (response.data) {
        const { successCount = 0, failedCount = 0, message: responseMessage } = response.data;

        if (successCount > 0 && failedCount === 0) {
          showToast(`${successCount} message(s) sent successfully!`, 'success');
        } else if (successCount > 0 && failedCount > 0) {
          showToast(`${successCount} sent, ${failedCount} failed`, 'warning');
        } else if (failedCount > 0 && successCount === 0) {
          showToast(`All ${failedCount} message(s) failed to send`, 'error');
        } else {
          showToast(responseMessage || 'Messages processed', 'info');
        }

        setMessage('');
        onSendComplete();
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error sending messages:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      showToast(`Error sending messages: ${errorMessage}`, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const headerTags = recipientType === 'customer'
    ? ['{customer_name}', '{balance}']
    : ['{employee_name}', '{balance}'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {companyInfo?.company_name || 'Send Message'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Recipients: {selectedRecipients.length}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Header Tags</h3>
            <div className="flex flex-wrap gap-2">
              {headerTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => insertTag(tag)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to insert at cursor position
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Footer Tags</h3>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            </div>

            {showAddTag && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name (e.g., Phone)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="Tag value (e.g., 615548511)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddTag}
                    variant="primary"
                    size="sm"
                  >
                    Save Tag
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTagName('');
                      setNewTagValue('');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {footerTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm group"
                >
                  <button
                    onClick={() => insertTag(tag.tag_value, 'end')}
                    className="hover:underline"
                  >
                    {tag.tag_name}: {tag.tag_value}
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to insert at end of message
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Message Preview</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {message || 'Your message will appear here...'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendMessages}
            variant="primary"
            disabled={sending || !message.trim()}
          >
            {sending ? 'Sending...' : 'Send Messages'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageModal;
