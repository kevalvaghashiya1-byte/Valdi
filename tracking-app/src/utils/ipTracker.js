const geoip = require('geoip-lite');
const axios = require('axios');

/**
 * IP Address Tracker
 * Tracks and geolocates IP addresses
 */
class IPTracker {
  /**
   * Track IP address and get geolocation information
   * @param {string} ipAddress - IP address to track
   * @returns {Object} IP information
   */
  async trackIP(ipAddress) {
    try {
      // Validate IP address format
      if (!this.isValidIP(ipAddress)) {
        return {
          success: false,
          error: 'Invalid IP address format'
        };
      }

      // Get geolocation data using geoip-lite
      const geo = geoip.lookup(ipAddress);

      if (!geo) {
        return {
          success: false,
          error: 'IP address not found in database or is a private IP'
        };
      }

      const info = {
        success: true,
        ip: ipAddress,
        country: geo.country,
        region: geo.region,
        timezone: geo.timezone,
        city: geo.city || 'Unknown',
        coordinates: {
          latitude: geo.ll[0],
          longitude: geo.ll[1]
        },
        range: geo.range,
        eu: geo.eu === '1' ? 'Yes' : 'No',
        area: geo.area || 'Unknown',
        metro: geo.metro || 'Unknown'
      };

      // Try to get additional information from external API
      const additionalInfo = await this.getAdditionalInfo(ipAddress);
      if (additionalInfo) {
        Object.assign(info, additionalInfo);
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
   * Get additional IP information from external API
   * @param {string} ipAddress - IP address
   * @returns {Object|null} Additional information
   */
  async getAdditionalInfo(ipAddress) {
    try {
      // Using ip-api.com (free tier, no API key required)
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 5000
      });

      if (response.data.status === 'success') {
        return {
          isp: response.data.isp,
          org: response.data.org,
          as: response.data.as,
          countryName: response.data.country,
          regionName: response.data.regionName,
          cityName: response.data.city,
          zip: response.data.zip,
          lat: response.data.lat,
          lon: response.data.lon
        };
      }
    } catch (error) {
      // If external API fails, continue with basic info
      console.log('External API unavailable:', error.message);
    }
    return null;
  }

  /**
   * Get current user's IP address
   * @returns {Object} Current IP information
   */
  async getMyIP() {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', {
        timeout: 5000
      });
      const myIP = response.data.ip;
      return await this.trackIP(myIP);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get current IP: ' + error.message
      };
    }
  }

  /**
   * Validate IP address format
   * @param {string} ip - IP address to validate
   * @returns {boolean} True if valid
   */
  isValidIP(ip) {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 validation (basic)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  /**
   * Check if IP is private/local
   * @param {string} ip - IP address
   * @returns {boolean} True if private
   */
  isPrivateIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    // Private IP ranges
    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first === 127 ||
      first === 0
    );
  }

  /**
   * Track multiple IP addresses
   * @param {Array} ipAddresses - Array of IP addresses
   * @returns {Array} Tracking results
   */
  async trackBatch(ipAddresses) {
    const results = [];
    for (const ip of ipAddresses) {
      const result = await this.trackIP(ip);
      results.push(result);
    }
    return results;
  }

  /**
   * Get distance between two IP addresses
   * @param {string} ip1 - First IP address
   * @param {string} ip2 - Second IP address
   * @returns {Object} Distance information
   */
  async getDistance(ip1, ip2) {
    try {
      const info1 = await this.trackIP(ip1);
      const info2 = await this.trackIP(ip2);

      if (!info1.success || !info2.success) {
        return {
          success: false,
          error: 'Failed to track one or both IP addresses'
        };
      }

      const distance = this.calculateDistance(
        info1.coordinates.latitude,
        info1.coordinates.longitude,
        info2.coordinates.latitude,
        info2.coordinates.longitude
      );

      return {
        success: true,
        ip1: ip1,
        ip2: ip2,
        location1: `${info1.city}, ${info1.country}`,
        location2: `${info2.city}, ${info2.country}`,
        distanceKm: distance.toFixed(2),
        distanceMiles: (distance * 0.621371).toFixed(2)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = new IPTracker();
