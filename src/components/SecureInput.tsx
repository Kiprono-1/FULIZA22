import { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '../icons';
import { cn } from '../utils/cn';

interface SecureInputProps {
  type: 'phone' | 'id' | 'email' | 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
}

export const SecureInput = ({
  type,
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  maxLength,
  autoComplete = 'off',
  className
}: SecureInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Security measures
  const [inputStartTime] = useState(Date.now());
  const [keystrokes, setKeystrokes] = useState(0);
  
  // Input sanitization based on type
  const sanitizeInput = useCallback((inputValue: string): string => {
    switch (type) {
      case 'phone':
        return inputValue.replace(/[^\d+]/g, '').slice(0, 13);
      case 'id':
        return inputValue.replace(/\D/g, '').slice(0, 8);
      case 'email':
        return inputValue.toLowerCase().trim().slice(0, 100);
      case 'text':
        return inputValue.trim().slice(0, maxLength || 100);
      case 'password':
        return inputValue.slice(0, maxLength || 128);
      default:
        return inputValue;
    }
  }, [type, maxLength]);

  // Handle input change with sanitization
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(e.target.value);
    setKeystrokes(prev => prev + 1);
    onChange(sanitized);
  }, [sanitizeInput, onChange]);

  // Handle paste events securely
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const sanitized = sanitizeInput(pastedText);
    onChange(sanitized);
  }, [sanitizeInput, onChange]);

  // Prevent drag and drop for security
  const handleDragOver = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
  }, []);

  // Get input type for rendering
  const getInputType = (): string => {
    if (type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    if (type === 'phone' || type === 'id') {
      return 'tel';
    }
    if (type === 'email') {
      return 'email';
    }
    return 'text';
  };

  // Get input mode for mobile keyboards
  const getInputMode = (): string => {
    if (type === 'phone' || type === 'id') {
      return 'numeric';
    }
    if (type === 'email') {
      return 'email';
    }
    return 'text';
  };

  // Format display value for certain types
  const getDisplayValue = (): string => {
    if (type === 'phone' && value) {
      // Format Kenyan phone numbers
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.startsWith('254')) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      }
      if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
      }
    }
    return value;
  };

  // Security monitoring
  useEffect(() => {
    if (keystrokes > 100) {
      // Potential bot behavior - too many keystrokes
      console.warn('Suspicious input behavior detected');
    }
  }, [keystrokes]);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type={getInputType()}
          inputMode={getInputMode() as any}
          value={isFocused ? value : getDisplayValue()}
          onChange={handleChange}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true" // Prevent LastPass autofill
          data-form-type="other" // Prevent browser autofill
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200',
            'focus:outline-none focus:ring-0',
            'placeholder:text-slate-400',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            error
              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500'
              : isFocused
              ? 'border-safaricom-300 bg-safaricom-50/50 focus:border-safaricom-500'
              : 'border-slate-200 bg-white hover:border-slate-300',
            type === 'password' && 'pr-12'
          )}
        />
        
        {/* Password visibility toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <Icon.EyeOff className="w-5 h-5 text-slate-500" />
            ) : (
              <Icon.Eye className="w-5 h-5 text-slate-500" />
            )}
          </button>
        )}
        
        {/* Security indicator for sensitive fields */}
        {(type === 'password' || type === 'id') && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon.Shield className="w-4 h-4 text-safaricom-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <Icon.AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Security info for sensitive fields */}
      {(type === 'phone' || type === 'id') && !error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Icon.ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Your information is encrypted and secure</span>
        </div>
      )}
    </div>
  );
};

// Honeypot component for bot detection
export const HoneypotField = ({ onChange }: { onChange: (value: string) => void }) => {
  return (
    <input
      type="text"
      name="website"
      value=""
      onChange={(e) => onChange(e.target.value)}
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none'
      }}
      tabIndex={-1}
      autoComplete="off"
    />
  );
};