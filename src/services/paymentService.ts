/**
 * Payment Service - Handles all payment integrations
 * Supports M-Pesa STK Push, Paystack, and Card payments
 */

import { auditLog } from '../utils/security';

// Payment configuration
const PAYMENT_CONFIG = {
  PAYSTACK_PUBLIC_KEY: 'pk_test_your_paystack_public_key', // Replace with actual key
  MPESA_SHORTCODE: '174379', // Safaricom test shortcode
  CALLBACK_URL: window.location.origin + '/payment-callback',
  SUCCESS_URL: window.location.origin + '/payment-success',
  CANCEL_URL: window.location.origin + '/payment-cancel',
};

export interface PaymentData {
  amount: number;
  currency: string;
  email: string;
  phone: string;
  fullName: string;
  reference: string;
  metadata: {
    tier: number;
    tierAmount: number;
    upgradeType: string;
    userId?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  error?: string;
  paymentMethod?: string;
}

export interface MpesaSTKResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

/**
 * M-Pesa STK Push Integration
 */
export class MpesaPaymentService {
  private static instance: MpesaPaymentService;
  
  static getInstance(): MpesaPaymentService {
    if (!MpesaPaymentService.instance) {
      MpesaPaymentService.instance = new MpesaPaymentService();
    }
    return MpesaPaymentService.instance;
  }

  async initiateSTKPush(paymentData: PaymentData): Promise<MpesaSTKResponse> {
    try {
      auditLog.log('mpesa_stk_initiate', {
        amount: paymentData.amount,
        phone: paymentData.phone.slice(-4),
        reference: paymentData.reference
      });

      // Format phone number for M-Pesa (254XXXXXXXXX)
      const formattedPhone = this.formatPhoneNumber(paymentData.phone);
      
      const stkPayload = {
        BusinessShortCode: PAYMENT_CONFIG.MPESA_SHORTCODE,
        Password: this.generatePassword(),
        Timestamp: this.generateTimestamp(),
        TransactionType: 'CustomerPayBillOnline',
        Amount: paymentData.amount,
        PartyA: formattedPhone,
        PartyB: PAYMENT_CONFIG.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: PAYMENT_CONFIG.CALLBACK_URL,
        AccountReference: paymentData.reference,
        TransactionDesc: `Fuliza Upgrade - ${paymentData.metadata.upgradeType}`
      };

      // In production, this would call the actual M-Pesa API
      // For demo purposes, we'll simulate the response
      const response = await this.simulateSTKPush(stkPayload);
      
      if (response.success) {
        auditLog.log('mpesa_stk_success', {
          checkoutRequestId: response.checkoutRequestId,
          reference: paymentData.reference
        });
      } else {
        auditLog.log('mpesa_stk_failed', {
          error: response.error,
          reference: paymentData.reference
        });
      }

      return response;
    } catch (error) {
      auditLog.log('mpesa_stk_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reference: paymentData.reference
      });
      
      return {
        success: false,
        error: 'Failed to initiate M-Pesa payment'
      };
    }
  }

  async checkSTKStatus(checkoutRequestId: string): Promise<{
    success: boolean;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    resultCode?: string;
    resultDesc?: string;
  }> {
    try {
      // In production, this would query the M-Pesa API for transaction status
      // For demo purposes, we'll simulate a successful payment after delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        status: 'completed',
        resultCode: '0',
        resultDesc: 'The service request is processed successfully.'
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        resultDesc: 'Failed to check payment status'
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to 254XXXXXXXXX format
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    
    return cleaned;
  }

  private generatePassword(): string {
    const shortcode = PAYMENT_CONFIG.MPESA_SHORTCODE;
    const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox passkey
    const timestamp = this.generateTimestamp();
    
    // In production, use proper base64 encoding
    return btoa(shortcode + passkey + timestamp);
  }

  private generateTimestamp(): string {
    const now = new Date();
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0');
  }

  private async simulateSTKPush(payload: any): Promise<MpesaSTKResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful STK push
    return {
      success: true,
      checkoutRequestId: 'ws_CO_' + Date.now(),
      merchantRequestId: 'mr_' + Date.now(),
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing',
      customerMessage: 'Success. Request accepted for processing'
    };
  }
}

/**
 * Paystack Payment Integration
 */
export class PaystackPaymentService {
  private static instance: PaystackPaymentService;
  
  static getInstance(): PaystackPaymentService {
    if (!PaystackPaymentService.instance) {
      PaystackPaymentService.instance = new PaystackPaymentService();
    }
    return PaystackPaymentService.instance;
  }

  async initializePayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      auditLog.log('paystack_initialize', {
        amount: paymentData.amount,
        email: paymentData.email,
        reference: paymentData.reference
      });

      // Load Paystack script if not already loaded
      await this.loadPaystackScript();

      const paystackData = {
        key: PAYMENT_CONFIG.PAYSTACK_PUBLIC_KEY,
        email: paymentData.email,
        amount: paymentData.amount * 100, // Paystack expects amount in kobo
        currency: paymentData.currency,
        ref: paymentData.reference,
        callback: (response: any) => {
          this.handlePaystackCallback(response, paymentData);
        },
        onClose: () => {
          auditLog.log('paystack_cancelled', {
            reference: paymentData.reference
          });
        },
        metadata: {
          custom_fields: [
            {
              display_name: 'Full Name',
              variable_name: 'full_name',
              value: paymentData.fullName
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone_number',
              value: paymentData.phone
            },
            {
              display_name: 'Tier',
              variable_name: 'tier',
              value: paymentData.metadata.tier.toString()
            }
          ]
        }
      };

      // Initialize Paystack popup
      const handler = (window as any).PaystackPop.setup(paystackData);
      handler.openIframe();

      return {
        success: true,
        paymentMethod: 'paystack'
      };
    } catch (error) {
      auditLog.log('paystack_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reference: paymentData.reference
      });

      return {
        success: false,
        error: 'Failed to initialize Paystack payment'
      };
    }
  }

  async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: string;
    amount?: number;
    currency?: string;
    paidAt?: string;
  }> {
    try {
      // In production, this would call Paystack's verification API
      // For demo purposes, we'll simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        status: 'success',
        amount: 100, // Amount in major currency unit
        currency: 'KES',
        paidAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed'
      };
    }
  }

  private async loadPaystackScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }

  private handlePaystackCallback(response: any, paymentData: PaymentData): void {
    if (response.status === 'success') {
      auditLog.log('paystack_success', {
        reference: response.reference,
        amount: paymentData.amount,
        trxref: response.trxref
      });

      // Trigger success callback
      window.dispatchEvent(new CustomEvent('paymentSuccess', {
        detail: {
          method: 'paystack',
          reference: response.reference,
          trxref: response.trxref
        }
      }));
    } else {
      auditLog.log('paystack_failed', {
        reference: response.reference,
        message: response.message
      });

      // Trigger failure callback
      window.dispatchEvent(new CustomEvent('paymentFailed', {
        detail: {
          method: 'paystack',
          reference: response.reference,
          message: response.message
        }
      }));
    }
  }
}

/**
 * Card Payment Service (Direct Integration)
 */
export class CardPaymentService {
  private static instance: CardPaymentService;
  
  static getInstance(): CardPaymentService {
    if (!CardPaymentService.instance) {
      CardPaymentService.instance = new CardPaymentService();
    }
    return CardPaymentService.instance;
  }

  async processCardPayment(
    paymentData: PaymentData,
    cardData: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      pin?: string;
    }
  ): Promise<PaymentResult> {
    try {
      auditLog.log('card_payment_initiate', {
        amount: paymentData.amount,
        reference: paymentData.reference,
        cardLast4: cardData.cardNumber.slice(-4)
      });

      // Validate card data
      const validation = this.validateCardData(cardData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // In production, this would integrate with a secure payment processor
      // For demo purposes, we'll simulate the payment
      const result = await this.simulateCardPayment(paymentData, cardData);

      if (result.success) {
        auditLog.log('card_payment_success', {
          reference: paymentData.reference,
          amount: paymentData.amount
        });
      } else {
        auditLog.log('card_payment_failed', {
          reference: paymentData.reference,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      auditLog.log('card_payment_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reference: paymentData.reference
      });

      return {
        success: false,
        error: 'Card payment processing failed'
      };
    }
  }

  private validateCardData(cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }): { isValid: boolean; error?: string } {
    // Basic card validation
    const cardNumber = cardData.cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return { isValid: false, error: 'Invalid card number' };
    }

    if (!/^\d{2}$/.test(cardData.expiryMonth) || 
        parseInt(cardData.expiryMonth) < 1 || 
        parseInt(cardData.expiryMonth) > 12) {
      return { isValid: false, error: 'Invalid expiry month' };
    }

    if (!/^\d{2,4}$/.test(cardData.expiryYear)) {
      return { isValid: false, error: 'Invalid expiry year' };
    }

    if (!/^\d{3,4}$/.test(cardData.cvv)) {
      return { isValid: false, error: 'Invalid CVV' };
    }

    // Check if card is expired
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expiryYear = parseInt(cardData.expiryYear);
    const expiryMonth = parseInt(cardData.expiryMonth);

    const fullExpiryYear = expiryYear < 100 ? 2000 + expiryYear : expiryYear;

    if (fullExpiryYear < currentYear || 
        (fullExpiryYear === currentYear && expiryMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }

    return { isValid: true };
  }

  private async simulateCardPayment(
    paymentData: PaymentData,
    cardData: any
  ): Promise<PaymentResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate different outcomes based on card number
    const cardNumber = cardData.cardNumber.replace(/\s/g, '');
    
    if (cardNumber.endsWith('0000')) {
      return {
        success: false,
        error: 'Insufficient funds'
      };
    } else if (cardNumber.endsWith('1111')) {
      return {
        success: false,
        error: 'Card declined by issuer'
      };
    } else {
      return {
        success: true,
        reference: paymentData.reference,
        paymentMethod: 'card'
      };
    }
  }
}

/**
 * Main Payment Service - Orchestrates all payment methods
 */
export class PaymentService {
  private mpesaService: MpesaPaymentService;
  private paystackService: PaystackPaymentService;
  private cardService: CardPaymentService;

  constructor() {
    this.mpesaService = MpesaPaymentService.getInstance();
    this.paystackService = PaystackPaymentService.getInstance();
    this.cardService = CardPaymentService.getInstance();
  }

  generateReference(): string {
    return 'FUL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  async processPayment(
    method: 'mpesa' | 'paystack' | 'card',
    paymentData: PaymentData,
    additionalData?: any
  ): Promise<PaymentResult> {
    auditLog.log('payment_process_start', {
      method,
      amount: paymentData.amount,
      reference: paymentData.reference
    });

    switch (method) {
      case 'mpesa':
        const stkResult = await this.mpesaService.initiateSTKPush(paymentData);
        return {
          success: stkResult.success,
          reference: paymentData.reference,
          error: stkResult.error,
          paymentMethod: 'mpesa'
        };

      case 'paystack':
        return await this.paystackService.initializePayment(paymentData);

      case 'card':
        if (!additionalData?.cardData) {
          return {
            success: false,
            error: 'Card data is required'
          };
        }
        return await this.cardService.processCardPayment(paymentData, additionalData.cardData);

      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  async verifyPayment(
    method: 'mpesa' | 'paystack' | 'card',
    reference: string,
    additionalData?: any
  ): Promise<any> {
    switch (method) {
      case 'mpesa':
        if (!additionalData?.checkoutRequestId) {
          throw new Error('Checkout request ID is required for M-Pesa verification');
        }
        return await this.mpesaService.checkSTKStatus(additionalData.checkoutRequestId);

      case 'paystack':
        return await this.paystackService.verifyPayment(reference);

      case 'card':
        // Card payments are verified immediately
        return { success: true, status: 'completed' };

      default:
        throw new Error('Unsupported payment method for verification');
    }
  }
}

export default PaymentService;