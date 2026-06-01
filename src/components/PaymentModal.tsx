import { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { SecureInput } from './SecureInput';
import { usePayment, CardData } from '../hooks/usePayment';
import { PaymentData } from '../services/paymentService';
import { cn } from '../utils/cn';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reference: string) => void;
  paymentData: PaymentData;
  selectedMethod: 'mpesa' | 'paystack' | 'card';
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  paymentData,
  selectedMethod
}: PaymentModalProps) => {
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    pin: ''
  });

  const {
    paymentState,
    processMpesaPayment,
    processPaystackPayment,
    processCardPayment,
    resetPayment
  } = usePayment();

  useEffect(() => {
    if (paymentState.success && paymentState.reference) {
      onSuccess(paymentState.reference);
    }
  }, [paymentState.success, paymentState.reference, onSuccess]);

  useEffect(() => {
    if (isOpen) {
      resetPayment();
    }
  }, [isOpen, resetPayment]);

  const handlePayment = async () => {
    switch (selectedMethod) {
      case 'mpesa':
        await processMpesaPayment(paymentData);
        break;
      case 'paystack':
        await processPaystackPayment(paymentData);
        break;
      case 'card':
        await processCardPayment(paymentData, cardData);
        break;
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardType = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    return 'Card';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Complete Payment</h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedMethod === 'mpesa' && 'M-Pesa STK Push'}
                {selectedMethod === 'paystack' && 'Paystack Gateway'}
                {selectedMethod === 'card' && 'Card Payment'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              disabled={paymentState.isProcessing || paymentState.isVerifying}
            >
              <Icon.X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Summary */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-safaricom-50 to-white border border-safaricom-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Amount</span>
              <span className="text-lg font-bold text-slate-900">
                KES {paymentData.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Reference</span>
              <span className="text-sm font-mono text-slate-700">{paymentData.reference}</span>
            </div>
          </div>

          {/* M-Pesa Payment */}
          {selectedMethod === 'mpesa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Icon.Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900">M-Pesa STK Push</div>
                    <div className="text-sm text-emerald-700">Payment prompt sent to your phone</div>
                  </div>
                </div>
                <div className="text-sm text-emerald-800">
                  <p className="mb-2">
                    A payment request has been sent to <span className="font-bold">+254 {paymentData.phone}</span>
                  </p>
                  <p>Please check your phone and enter your M-Pesa PIN to complete the payment.</p>
                </div>
              </div>

              {paymentState.isVerifying && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-800">
                      Waiting for payment confirmation...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paystack Payment */}
          {selectedMethod === 'paystack' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Icon.CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-blue-900">Paystack Gateway</div>
                    <div className="text-sm text-blue-700">Secure card and bank payments</div>
                  </div>
                </div>
                <div className="text-sm text-blue-800">
                  <p>Click the button below to open the secure Paystack payment window.</p>
                </div>
              </div>
            </div>
          )}

          {/* Card Payment */}
          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <SecureInput
                type="text"
                value={cardData.cardNumber}
                onChange={(value) => setCardData(prev => ({ 
                  ...prev, 
                  cardNumber: formatCardNumber(value) 
                }))}
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="relative"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <SecureInput
                      type="text"
                      value={cardData.expiryMonth}
                      onChange={(value) => setCardData(prev => ({ 
                        ...prev, 
                        expiryMonth: value.replace(/\D/g, '').slice(0, 2)
                      }))}
                      placeholder="MM"
                      maxLength={2}
                    />
                    <SecureInput
                      type="text"
                      value={cardData.expiryYear}
                      onChange={(value) => setCardData(prev => ({ 
                        ...prev, 
                        expiryYear: value.replace(/\D/g, '').slice(0, 2)
                      }))}
                      placeholder="YY"
                      maxLength={2}
                    />
                  </div>
                </div>

                <SecureInput
                  type="text"
                  value={cardData.cvv}
                  onChange={(value) => setCardData(prev => ({ 
                    ...prev, 
                    cvv: value.replace(/\D/g, '').slice(0, 4)
                  }))}
                  label="CVV"
                  placeholder="123"
                  maxLength={4}
                />
              </div>

              {/* Card Type Indicator */}
              {cardData.cardNumber && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon.CreditCard className="w-4 h-4" />
                  <span>{getCardType(cardData.cardNumber)} ending in {cardData.cardNumber.slice(-4)}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {paymentState.error && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <Icon.AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-800">{paymentState.error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {paymentState.success && (
            <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <Icon.CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Payment completed successfully!</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={paymentState.isProcessing || paymentState.isVerifying}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            {!paymentState.success && (
              <button
                onClick={handlePayment}
                disabled={
                  paymentState.isProcessing || 
                  paymentState.isVerifying ||
                  (selectedMethod === 'card' && (!cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv))
                }
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold text-white transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedMethod === 'mpesa' && "bg-emerald-500 hover:bg-emerald-600",
                  selectedMethod === 'paystack' && "bg-blue-500 hover:bg-blue-600",
                  selectedMethod === 'card' && "bg-amber-500 hover:bg-amber-600"
                )}
              >
                {paymentState.isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : paymentState.isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  <>
                    <Icon.Lock className="w-4 h-4 inline mr-2" />
                    Pay KES {paymentData.amount.toLocaleString()}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Security Indicators */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Icon.Shield className="w-3 h-3" /> SSL Secured
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Icon.Lock className="w-3 h-3" /> PCI Compliant
            </span>
            <span>•</span>
            <span>256-bit Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};