const twilio = require('twilio');
const axios = require('axios');
const logger = require('./logger');

class SMSService {
  constructor() {
    // Initialize Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    }

    // Termii configuration
    this.termiiApiKey = process.env.TERMII_API_KEY;
    this.termiiSenderId = process.env.TERMII_SENDER_ID || 'BrainQuiz';
    this.termiiBaseUrl = 'https://api.ng.termii.com/api';

    this.provider = process.env.SMS_PROVIDER || 'twilio'; // 'twilio' or 'termii'
  }

  // Generate verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Format phone number
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Nigeria +234)
    if (!cleaned.startsWith('234') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    return '+' + cleaned;
  }

  // Send verification code via Twilio
  async sendViaTwilio(phoneNumber, message) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioNumber,
        to: phoneNumber
      });

      logger.info(`SMS sent via Twilio to ${phoneNumber}`, { messageId: result.sid });
      return { success: true, messageId: result.sid, provider: 'twilio' };
    } catch (error) {
      logger.error(`Twilio SMS failed for ${phoneNumber}:`, error);
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  }

  // Send verification code via Termii
  async sendViaTermii(phoneNumber, message) {
    try {
      const payload = {
        to: phoneNumber,
        from: this.termiiSenderId,
        sms: message,
        type: "plain",
        api_key: this.termiiApiKey,
        channel: "generic"
      };

      const response = await axios.post(`${this.termiiBaseUrl}/sms/send`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.message_id) {
        logger.info(`SMS sent via Termii to ${phoneNumber}`, { messageId: response.data.message_id });
        return { success: true, messageId: response.data.message_id, provider: 'termii' };
      } else {
        throw new Error(response.data.message || 'SMS delivery failed');
      }
    } catch (error) {
      logger.error(`Termii SMS failed for ${phoneNumber}:`, error);
      throw new Error(`SMS delivery failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Send verification code
  async sendVerificationCode(phoneNumber, code) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `Your Brain Teaser Quiz verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;

    try {
      if (this.provider === 'termii' && this.termiiApiKey) {
        return await this.sendViaTermii(formattedNumber, message);
      } else if (this.provider === 'twilio' && this.twilioClient) {
        return await this.sendViaTwilio(formattedNumber, message);
      } else {
        throw new Error('No SMS provider configured');
      }
    } catch (error) {
      // Try fallback provider
      try {
        if (this.provider === 'twilio' && this.termiiApiKey) {
          logger.info('Trying Termii as fallback provider');
          return await this.sendViaTermii(formattedNumber, message);
        } else if (this.provider === 'termii' && this.twilioClient) {
          logger.info('Trying Twilio as fallback provider');
          return await this.sendViaTwilio(formattedNumber, message);
        }
      } catch (fallbackError) {
        logger.error('Both SMS providers failed:', fallbackError);
      }
      throw error;
    }
  }

  // Send quiz start notification
  async sendQuizStartNotification(phoneNumber, userName) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `Hi ${userName}! 🧠 Your daily Brain Teaser Quiz is ready! Answer questions on general knowledge, history & current affairs to win amazing prizes! Reply START to begin.`;

    return await this.sendNotification(formattedNumber, message);
  }

  // Send quiz result notification
  async sendQuizResultNotification(phoneNumber, userName, score, totalQuestions, prizeWon = null) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const percentage = Math.round((score / totalQuestions) * 100);
    
    let message = `🎉 Quiz Complete! ${userName}, you scored ${score}/${totalQuestions} (${percentage}%)!`;
    
    if (prizeWon) {
      message += ` 🏆 Congratulations! You've won: ${prizeWon.name}! Claim code: ${prizeWon.claimCode}`;
    } else {
      message += ` Keep playing daily for more chances to win amazing prizes!`;
    }

    return await this.sendNotification(formattedNumber, message);
  }

  // Send prize notification
  async sendPrizeNotification(phoneNumber, userName, prizeName, claimCode) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `🎁 Congratulations ${userName}! You've won: ${prizeName}! Your claim code is: ${claimCode}. Please save this code to claim your prize.`;

    return await this.sendNotification(formattedNumber, message);
  }

  // Send daily reminder
  async sendDailyReminder(phoneNumber, userName) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `🧠 Daily Brain Teaser Quiz Reminder! Hi ${userName}, test your knowledge today and win exciting prizes! New questions available now. Reply PLAY to start!`;

    return await this.sendNotification(formattedNumber, message);
  }

  // Send leaderboard notification
  async sendLeaderboardNotification(phoneNumber, userName, position, totalParticipants) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const message = `📊 Weekly Leaderboard Update! Hi ${userName}, you're ranked #${position} out of ${totalParticipants} players! Keep playing to climb higher!`;

    return await this.sendNotification(formattedNumber, message);
  }

  // Generic notification sender
  async sendNotification(phoneNumber, message) {
    try {
      if (this.provider === 'termii' && this.termiiApiKey) {
        return await this.sendViaTermii(phoneNumber, message);
      } else if (this.provider === 'twilio' && this.twilioClient) {
        return await this.sendViaTwilio(phoneNumber, message);
      } else {
        throw new Error('No SMS provider configured');
      }
    } catch (error) {
      logger.error(`Failed to send notification to ${phoneNumber}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Bulk SMS for announcements
  async sendBulkSMS(phoneNumbers, message) {
    const results = [];
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      const batchPromises = batch.map(async (phoneNumber) => {
        try {
          const result = await this.sendNotification(phoneNumber, message);
          return { phoneNumber, ...result };
        } catch (error) {
          return { phoneNumber, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < phoneNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Check SMS balance (for Termii)
  async checkBalance() {
    if (this.provider === 'termii' && this.termiiApiKey) {
      try {
        const response = await axios.get(`${this.termiiBaseUrl}/get-balance?api_key=${this.termiiApiKey}`);
        return { 
          success: true, 
          balance: response.data.balance,
          currency: response.data.currency || 'NGN',
          provider: 'termii'
        };
      } catch (error) {
        logger.error('Failed to check Termii balance:', error);
        return { success: false, error: error.message };
      }
    } else if (this.provider === 'twilio' && this.twilioClient) {
      try {
        const account = await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        return {
          success: true,
          balance: account.balance,
          currency: 'USD',
          provider: 'twilio'
        };
      } catch (error) {
        logger.error('Failed to check Twilio balance:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'No SMS provider configured' };
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Nigerian phone numbers: 11 digits starting with 0, or 13 digits starting with 234
    return /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleaned);
  }
}

module.exports = new SMSService();