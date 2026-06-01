# 🚀 Fuliza M-Pesa Limit Check Application

A secure, modern web application for checking and upgrading Fuliza M-Pesa limits with integrated payment processing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.6-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-green.svg)

---

## ⚠️ IMPORTANT LEGAL NOTICE

**This is a demonstration application. Before deploying to production:**
1. ✅ Read and comply with [COMPLIANCE.md](./COMPLIANCE.md)
2. ✅ Obtain necessary licenses from Central Bank of Kenya
3. ✅ Register with Office of Data Protection Commissioner
4. ✅ Complete payment provider KYC processes
5. ✅ Consult with legal counsel on regulatory requirements

---

## 🌟 Features

### 💳 **Payment Integration**
- **M-Pesa STK Push**: Direct mobile money payments
- **Paystack Gateway**: Cards, bank transfers, and mobile money
- Real-time payment verification
- Secure transaction processing

### 🔒 **Enterprise Security**
- Input validation and sanitization
- Rate limiting and anti-bot protection
- Content Security Policy (CSP)
- PCI-DSS compliant card handling
- Comprehensive audit logging
- Session management and encryption

### 🎨 **User Experience**
- Responsive design for all devices
- Real-time form validation
- Interactive payment flow
- Clear error messaging
- Accessibility compliant (WCAG)

### 📊 **Tier System**
- 8 upgrade tiers from KES 1,000 to KES 250,000
- Progressive fee structure
- Clear tier benefits and features
- Popular tier highlighting

---

## 🛠️ Tech Stack

- **Frontend**: React 19.2.6 + TypeScript
- **Styling**: Tailwind CSS 4.1.17
- **Build Tool**: Vite 7.3.2
- **Payment**: Paystack + M-Pesa Daraja API
- **Security**: Custom security layer with encryption

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fuliza-limit-check.git
cd fuliza-limit-check
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- Paystack public key
- M-Pesa credentials
- Other configuration values

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

---

## 🔐 Security Configuration

### Environment Variables

**CRITICAL**: Never commit `.env` file to version control!

Required environment variables:
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
VITE_MPESA_BUSINESS_SHORTCODE=174379
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
```

See [.env.example](./.env.example) for complete configuration.

### Security Features

1. **Input Security**
   - Real-time validation
   - XSS prevention
   - SQL injection protection
   - CSRF protection

2. **Payment Security**
   - PCI-DSS compliance
   - No card data storage
   - Secure token generation
   - Encrypted transactions

3. **Access Control**
   - Rate limiting
   - Bot detection
   - Session management
   - Audit logging

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

---

## 💳 Payment Integration

### M-Pesa STK Push

1. **Get Daraja API credentials**
   - Visit: https://developer.safaricom.co.ke
   - Create an app
   - Get Consumer Key and Secret

2. **Configure M-Pesa**
   - Update `.env` with credentials
   - Set callback URLs
   - Test in sandbox environment

### Paystack

1. **Create Paystack account**
   - Visit: https://paystack.com
   - Complete KYC verification
   - Get API keys

2. **Configure Paystack**
   - Update `.env` with public key
   - Set webhook URL
   - Test with test cards

See [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) for detailed guide.

---

## 📋 Compliance & Regulations

### Required Licenses (Kenya)

1. **Central Bank of Kenya**
   - Payment Service Provider License
   - Digital Credit Provider License

2. **Data Protection**
   - Register with ODPC
   - Implement GDPR-like controls

3. **AML/CTF**
   - KYC procedures
   - Transaction monitoring
   - Suspicious activity reporting

See [COMPLIANCE.md](./COMPLIANCE.md) for complete regulatory guide.

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Update environment variables for production
- [ ] Enable HTTPS/SSL
- [ ] Configure security headers
- [ ] Set up monitoring and logging
- [ ] Test all payment flows
- [ ] Review and publish legal documents
- [ ] Complete compliance requirements
- [ ] Set up backup systems

### Deployment Options

**Vercel** (Recommended)
```bash
npm install -g vercel
vercel --prod
```

**Netlify**
```bash
npm run build
# Deploy dist folder
```

**Custom Server**
```bash
npm run build
# Serve dist folder with nginx/apache
```

---

## 📁 Project Structure

```
fuliza-limit-check/
├── src/
│   ├── components/          # React components
│   │   ├── PaymentModal.tsx
│   │   ├── SecureInput.tsx
│   │   └── SecurityProvider.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── usePayment.ts
│   │   └── useSecurity.ts
│   ├── services/           # Business logic
│   │   └── paymentService.ts
│   ├── utils/              # Utility functions
│   │   ├── security.ts
│   │   └── cn.ts
│   ├── config/             # Configuration
│   │   └── payment.ts
│   ├── App.tsx             # Main application
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── COMPLIANCE.md          # Regulatory guide
├── SECURITY.md            # Security documentation
├── PAYMENT_INTEGRATION.md # Payment guide
└── README.md              # This file
```

---

## 🧪 Testing

### Test Payment Methods

**M-Pesa Sandbox**
- Phone: `254708374149`
- Any amount for testing

**Paystack Test Cards**
- Success: `4084084084084081`
- Decline: `4000000000000002`
- Insufficient: `4000000000009995`

### Run Tests
```bash
npm run test
```

---

## 📊 Monitoring & Analytics

### Audit Logs

All security events are logged:
- Payment initiations
- Failed attempts
- Suspicious activities
- User sessions

Access logs in browser console (development) or configure external logging service (production).

### Performance Monitoring

Recommended tools:
- Sentry for error tracking
- Google Analytics for user analytics
- LogRocket for session replay

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Security-first approach

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimers

1. **Not Official Safaricom Service**: This is an independent application
2. **Demonstration Purpose**: Current implementation is for demonstration
3. **No Financial Advice**: Does not provide financial advice
4. **Regulatory Compliance**: Deployer responsible for all compliance
5. **No Warranty**: Provided "as-is" without warranties

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/fuliza-limit-check/issues)
- **Documentation**: See docs folder
- **Security Issues**: security@yourdomain.com

---

## 🙏 Acknowledgments

- Safaricom for M-Pesa API
- Paystack for payment gateway
- React and TypeScript communities
- Open source contributors

---

## 📚 Additional Resources

- [Safaricom Daraja API Docs](https://developer.safaricom.co.ke)
- [Paystack Documentation](https://paystack.com/docs)
- [Central Bank of Kenya](https://www.centralbank.go.ke)
- [Kenya Data Protection Act](https://www.odpc.go.ke)

---

**Built with ❤️ for the Kenyan fintech ecosystem**

**Last Updated**: June 2, 2026