const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');
const axios = require('axios');

/**
 * Phone Number Tracker
 * Validates and extracts information from phone numbers
 */
class PhoneTracker {
  /**
   * Track phone number and get detailed information
   * @param {string} phoneNumber - Phone number to track (with country code)
   * @returns {Object} Phone number information
   */
  async trackPhone(phoneNumber) {
    try {
      // Validate phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Parse phone number
      const parsed = parsePhoneNumber(phoneNumber);

      const info = {
        success: true,
        phoneNumber: parsed.number,
        nationalNumber: parsed.nationalNumber,
        countryCode: parsed.countryCallingCode,
        country: parsed.country,
        countryName: this.getCountryName(parsed.country),
        type: parsed.getType(),
        isValid: parsed.isValid(),
        isPossible: parsed.isPossible(),
        uri: parsed.getURI(),
        e164Format: parsed.format('E.164'),
        internationalFormat: parsed.format('INTERNATIONAL'),
        nationalFormat: parsed.format('NATIONAL'),
        rfc3966Format: parsed.format('RFC3966')
      };

      // Add carrier information if available
      const carrierInfo = await this.getCarrierInfo(parsed);
      if (carrierInfo) {
        info.carrier = carrierInfo;
      }

      return info;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get country name from country code
   * @param {string} countryCode - ISO country code
   * @returns {string} Country name
   */
  getCountryName(countryCode) {
    const countries = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'IN': 'India',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'JP': 'Japan',
      'CN': 'China',
      'RU': 'Russia',
      'ZA': 'South Africa',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'EG': 'Egypt',
      'PK': 'Pakistan',
      'BD': 'Bangladesh'
    };
    return countries[countryCode] || countryCode;
  }

  /**
   * Get carrier information (placeholder - requires paid API)
   * @param {Object} parsed - Parsed phone number
   * @returns {Object|null} Carrier information
   */
  async getCarrierInfo(parsed) {
    // This would require a paid API service like Twilio, Numverify, etc.
    // For demonstration, returning basic info
    return {
      name: 'Unknown',
      type: parsed.getType() || 'Unknown',
      note: 'Carrier lookup requires paid API service'
    };
  }

  /**
   * Validate multiple phone numbers
   * @param {Array} phoneNumbers - Array of phone numbers
   * @returns {Array} Validation results
   */
  validateBatch(phoneNumbers) {
    return phoneNumbers.map(phone => ({
      phoneNumber: phone,
      isValid: isValidPhoneNumber(phone)
    }));
  }

  /**
   * Format phone number to specific format
   * @param {string} phoneNumber - Phone number to format
   * @param {string} format - Format type (E164, INTERNATIONAL, NATIONAL, RFC3966)
   * @returns {string} Formatted phone number
   */
  formatPhone(phoneNumber, format = 'INTERNATIONAL') {
    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        return 'Invalid phone number';
      }
      const parsed = parsePhoneNumber(phoneNumber);
      return parsed.format(format);
    } catch (error) {
      return error.message;
    }
  }
}

module.exports = new PhoneTracker();
