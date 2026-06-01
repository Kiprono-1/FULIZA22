import { useState, useCallback, useEffect } from 'react';
import PaymentService, { PaymentData, PaymentResult } from '../services/paymentService';
import { auditLog } from '../utils/security';

export interface PaymentState {
  isProcessing: boolean;
  isVerifying: boolean;
  error: string | null;
  success: boolean;
  reference: string | null;
  paymentMethod: string | null;
  checkoutRequestId: string | null;
}

export interface CardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin?: string;
}

export const usePayment = () => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    isVerifying: false,
    error: null,
    success: false,
    reference: null,
    paymentMethod: null,
    checkoutRequestId: null,
  });

  const paymentService = new PaymentService();

  // Reset payment state
  const resetPayment = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      isVerifying: false,
      error: null,
      success: false,
      reference: null,
      paymentMethod: null,
      checkoutRequestId: null,
    });
  }, []);

  // Process M-Pesa STK Push payment
  const processMpesaPayment = useCallback(async (paymentData: PaymentData): Promise<boolean> => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.processPayment('mpesa', paymentData);
      
      if (result.success) {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          reference: result.reference || null,
          paymentMethod: 'mpesa',
          checkoutRequestId: (result as any).checkoutRequestId || null,
        }));

        // Start verification process
        if ((result as any).checkoutRequestId) {
          await verifyMpesaPayment((result as any).checkoutRequestId);
        }

        return true;
      } else {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'M-Pesa payment failed'
        }));
        return false;
      }
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }));
      return false;
    }
  }, [paymentService]);

  // Verify M-Pesa payment status
  const verifyMpesaPayment = useCallback(async (checkoutRequestId: string): Promise<void> => {
    setPaymentState(prev => ({ ...prev, isVerifying: true }));

    try {
      // Poll for payment status
      const maxAttempts = 30; // 30 attempts = 1 minute
      let attempts = 0;

      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          setPaymentState(prev => ({
            ...prev,
            isVerifying: false,
            error: 'Payment verification timeout. Please check your M-Pesa messages.'
          }));
          return;
        }

        attempts++;
        
        try {
          const status = await paymentService.verifyPayment('mpesa', '', { checkoutRequestId });
          
          if (status.status === 'completed') {
            setPaymentState(prev => ({
              ...prev,
              isVerifying: false,
              success: true
            }));
            
            auditLog.log('mpesa_payment_verified', {
              checkoutRequestId,
              resultCode: status.resultCode
            });
          } else if (status.status === 'failed' || status.status === 'cancelled') {
            setPaymentState(prev => ({
              ...prev,
              isVerifying: false,
              error: status.resultDesc || 'Payment failed or was cancelled'
            }));
          } else {
            // Still pending, continue polling
            setTimeout(pollStatus, 2000); // Poll every 2 seconds
          }
        } catch (error) {
          setTimeout(pollStatus, 2000); // Retry on error
        }
      };

      pollStatus();
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isVerifying: false,
        error: 'Failed to verify payment status'
      }));
    }
  }, [paymentService]);

  // Process Paystack payment
  const processPaystackPayment = useCallback(async (paymentData: PaymentData): Promise<boolean> => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.processPayment('paystack', paymentData);
      
      if (result.success) {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          reference: result.reference || null,
          paymentMethod: 'paystack'
        }));
        return true;
      } else {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'Paystack payment failed'
        }));
        return false;
      }
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }));
      return false;
    }
  }, [paymentService]);

  // Process card payment
  const processCardPayment = useCallback(async (
    paymentData: PaymentData,
    cardData: CardData
  ): Promise<boolean> => {
    setPaymentState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.processPayment('card', paymentData, { cardData });
      
      if (result.success) {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          success: true,
          reference: result.reference || null,
          paymentMethod: 'card'
        }));
        return true;
      } else {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'Card payment failed'
        }));
        return false;
      }
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }));
      return false;
    }
  }, [paymentService]);

  // Generate payment reference
  const generateReference = useCallback((): string => {
    return paymentService.generateReference();
  }, [paymentService]);

  // Listen for Paystack events
  useEffect(() => {
    const handlePaymentSuccess = (event: CustomEvent) => {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        success: true,
        reference: event.detail.reference
      }));
    };

    const handlePaymentFailed = (event: CustomEvent) => {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: event.detail.message || 'Payment failed'
      }));
    };

    window.addEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
    window.addEventListener('paymentFailed', handlePaymentFailed as EventListener);

    return () => {
      window.removeEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
      window.removeEventListener('paymentFailed', handlePaymentFailed as EventListener);
    };
  }, []);

  return {
    paymentState,
    processMpesaPayment,
    processPaystackPayment,
    processCardPayment,
    verifyMpesaPayment,
    generateReference,
    resetPayment,
  };
};