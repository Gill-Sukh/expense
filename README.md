# Finance Tracker PWA

A comprehensive Progressive Web App for tracking personal finances, expenses, income, and EMI payments with modern UI and powerful analytics.

## Features

### 📊 **Enhanced Reports & Analytics**
- **Multi-period Analysis**: Monthly, Quarterly, and Yearly financial reports
- **Comprehensive Data**: Expenses, Income, and EMI tracking with visual charts
- **Smart Insights**: AI-powered financial recommendations and budget analysis
- **Modern Charts**: Interactive pie charts, bar charts, and line charts using Recharts
- **Financial Metrics**: Savings rate, expense ratios, and 50/30/20 budget rule analysis
- **EMI Management**: Track loan payments, due dates, and payment status
- **Trend Analysis**: Visual trend charts showing income vs expenses over time

### 💰 **Core Financial Features**
1. **expenses** - Daily expense records with categories and payment modes
2. **income** - Income tracking from multiple sources
3. **payment_accounts** - Credit cards, UPI IDs, bank accounts
4. **emi** - EMI tracking for loans with due date management
5. **categories** - Expense and income categories
6. **settings** - User preferences and app configuration

### 📱 **Mobile-First Design**
- **Responsive Layout** - Adapts to different screen sizes
- **Touch-Friendly** - Large buttons and touch targets
- **Bottom Navigation** - Easy thumb navigation
- **Fast Loading** - Optimized for mobile networks
- **Modern UI** - Gradient backgrounds, rounded corners, and shadows

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expense-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/finance_app
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## PWA Features

### Installation
- Open the app in Chrome mobile
- Tap "Add to Home Screen" from the browser menu
- The app will install as a native mobile app

### Offline Support
- Service worker caches essential resources
- Basic functionality works offline
- Data syncs when connection is restored

## API Endpoints

### Expenses
- `POST /api/expenses/add` - Add new expense
- `GET /api/expenses/list` - List expenses with filters
- `PUT /api/expenses/edit/[id]` - Edit expense
- `DELETE /api/expenses/delete/[id]` - Delete expense

### Income
- `POST /api/income/add` - Add new income
- `GET /api/income/list` - List income with filters

### Payment Accounts
- `POST /api/accounts/add` - Add payment account
- `GET /api/accounts/list` - List user accounts

### EMI Tracking
- `POST /api/emi/add` - Add EMI record
- `GET /api/emi/list` - List EMI records
- `PUT /api/emi/edit/[id]` - Edit EMI record
- `DELETE /api/emi/delete/[id]` - Delete EMI record

## Reports & Analytics

### Financial Insights
- **Savings Rate Analysis**: Track your savings percentage
- **Expense Ratios**: Monitor spending patterns
- **EMI Health**: Track loan payment status
- **Budget Analysis**: 50/30/20 rule implementation
- **Smart Recommendations**: AI-powered financial advice

### Chart Types
- **Pie Charts**: Category-wise expense breakdown
- **Bar Charts**: Payment method distribution
- **Line Charts**: Income vs expenses trends
- **Dual Line Charts**: Comparative analysis

### Period Selection
- **Monthly**: Detailed month-by-month analysis
- **Quarterly**: Quarterly financial overview
- **Yearly**: Annual financial summary

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **Charts**: Recharts (React charting library)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **PWA**: Service Worker, Manifest

## Project Structure

```
expense-mobile/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── lib/               # Utility functions and types
├── pages/             # Next.js pages and API routes
├── public/            # Static assets and PWA files
├── styles/            # Global CSS and Tailwind config
└── README.md          # Project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
