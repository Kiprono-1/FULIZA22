/**
 * Payment Configuration
 * Update these values with your actual payment provider credentials
 */

export const PAYMENT_CONFIG = {
  // Paystack Configuration
  PAYSTACK: {
    PUBLIC_KEY: 'pk_test_your_paystack_public_key_here', // Replace with your Paystack public key
    SECRET_KEY: 'sk_test_your_paystack_secret_key_here', // Replace with your Paystack secret key (backend only)
    CALLBACK_URL: `${window.location.origin}/payment-callback`,
    SUCCESS_URL: `${window.location.origin}/payment-success`,
    CANCEL_URL: `${window.location.origin}/payment-cancel`,
  },

  // M-Pesa Configuration (Safaricom)
  MPESA: {
    BUSINESS_SHORT_CODE: '174379', // Safaricom test shortcode (replace with your shortcode)
    PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Sandbox passkey
    CONSUMER_KEY: 'your_consumer_key_here', // Replace with your consumer key
    CONSUMER_SECRET: 'your_consumer_secret_here', // Replace with your consumer secret
    CALLBACK_URL: `${window.location.origin}/mpesa-callback`,
    TIMEOUT_URL: `${window.location.origin}/mpesa-timeout`,
    RESULT_URL: `${window.location.origin}/mpesa-result`,
  },

  // General Configuration
  GENERAL: {
    CURRENCY: 'KES',
    ENVIRONMENT: 'sandbox', // 'sandbox' or 'production'
    WEBHOOK_SECRET: 'your_webhook_secret_here', // For verifying webhooks
  },

  // Security Configuration
  SECURITY: {
    ENCRYPTION_KEY: 'your_encryption_key_here', // For encrypting sensitive data
    JWT_SECRET: 'your_jwt_secret_here', // For JWT tokens
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  }
};

/**
 * Environment-specific configuration
 */
export const getPaymentConfig = () => {
  const isProduction = PAYMENT_CONFIG.GENERAL.ENVIRONMENT === 'production';
  
  return {
    ...PAYMENT_CONFIG,
    PAYSTACK: {
      ...PAYMENT_CONFIG.PAYSTACK,
      PUBLIC_KEY: isProduction 
        ? 'pk_live_your_live_public_key_here' 
        : PAYMENT_CONFIG.PAYSTACK.PUBLIC_KEY,
    },
    MPESA: {
      ...PAYMENT_CONFIG.MPESA,
      BUSINESS_SHORT_CODE: isProduction 
        ? 'your_live_shortcode_here' 
        : PAYMENT_CONFIG.MPESA.BUSINESS_SHORT_CODE,
    }
  };
};

/**
 * Validation functions for payment configuration
 */
export const validatePaymentConfig = () => {
  const config = getPaymentConfig();
  const errors: string[] = [];

  // Validate Paystack configuration
  if (!config.PAYSTACK.PUBLIC_KEY || config.PAYSTACK.PUBLIC_KEY.includes('your_')) {
    errors.push('Paystack public key is not configured');
  }

  // Validate M-Pesa configuration
  if (!config.MPESA.CONSUMER_KEY || config.MPESA.CONSUMER_KEY.includes('your_')) {
    errors.push('M-Pesa consumer key is not configured');
  }

  if (!config.MPESA.CONSUMER_SECRET || config.MPESA.CONSUMER_SECRET.includes('your_')) {
    errors.push('M-Pesa consumer secret is not configured');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default PAYMENT_CONFIG;