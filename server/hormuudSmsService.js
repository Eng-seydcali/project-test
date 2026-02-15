import axios from 'axios';

class HormuudSmsService {
  constructor() {
    this.baseUrl = process.env.HORMUUD_SMS_API_URL || 'https://smsapi.hormuud.com';
    this.username = process.env.HORMUUD_SMS_USERNAME;
    this.password = process.env.HORMUUD_SMS_PASSWORD;
    this.accessToken = null;
    this.tokenExpiry = null;

    console.log('🔧 Hormuud SMS Service initialized');
    console.log('🔧 Username:', this.username);
    console.log('🔧 Password exists:', !!this.password);
    console.log('🔧 API URL:', this.baseUrl);
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('🔑 Attempting to get token with username:', this.username);
      console.log('🔑 Password length:', this.password?.length, 'chars');
      console.log('🔑 API URL:', this.baseUrl);

      const params = new URLSearchParams();
      params.append('Username', this.username);
      params.append('Password', this.password);
      params.append('grant_type', 'password');

      console.log('📤 Request payload:', params.toString());

      const response = await axios.post(`${this.baseUrl}/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      console.log('✅ Hormuud SMS API token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting Hormuud SMS API token:', error.response?.data || error.message);
      console.error('❌ Full error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error('Failed to authenticate with Hormuud SMS API');
    }
  }

  async sendSms(mobile, message, senderid = 'HaypeConst') {
    try {
      const token = await this.getAccessToken();

      const payload = {
        mobile: mobile,
        message: message,
        senderid: senderid,
        refid: `ref_${Date.now()}`,
        validity: 0
      };

      const response = await axios.post(
        `${this.baseUrl}/api/SendSMS`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.ResponseCode === '200') {
        console.log('✅ SMS sent successfully to:', mobile);
        return {
          success: true,
          messageId: response.data.Data?.MessageID,
          status: 'sent',
          details: response.data
        };
      } else {
        console.error('❌ SMS send failed:', response.data.ResponseMessage);
        return {
          success: false,
          status: 'failed',
          error: response.data.ResponseMessage,
          details: response.data
        };
      }
    } catch (error) {
      console.error('❌ Error sending SMS:', error.response?.data || error.message);
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.ResponseMessage || error.message
      };
    }
  }

  async sendBulkSms(messages) {
    const results = [];

    for (const msg of messages) {
      try {
        const result = await this.sendSms(msg.mobile, msg.message, msg.senderid);
        results.push({
          mobile: msg.mobile,
          ...result
        });

        await this.delay(100);
      } catch (error) {
        results.push({
          mobile: msg.mobile,
          success: false,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getResponseCodeDescription(code) {
    const codes = {
      '200': 'SUCCESS',
      '201': 'Authentication Failed',
      '203': 'Invalid Sender ID',
      '204': 'Zero Balance (Prepaid Account)',
      '205': 'Insufficient Balance (Prepaid Account)',
      '206': 'The allowed message parts are exceeded',
      '207': 'Wrong mobile number',
      '500': 'Unknown Error'
    };
    return codes[code] || 'Unknown Error';
  }
}

export default new HormuudSmsService();
