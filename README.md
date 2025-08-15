# Finance Tracker Mobile PWA

A comprehensive Progressive Web App (PWA) for tracking daily expenses and income, built with Next.js and MongoDB.

## Features

- 📱 **Mobile-First Design** - Optimized for mobile devices with PWA support
- 💰 **Expense Tracking** - Track daily expenses with payment modes (Cash, UPI, Credit Card)
- 💳 **Payment Accounts** - Manage multiple cards and UPI IDs
- 📊 **Income Tracking** - Monitor income sources and calculate profit/loss
- 📅 **Calendar Views** - Monthly and yearly calendar views for expenses and income
- 📈 **Reports & Analytics** - Comprehensive charts and financial insights
- 🏦 **EMI Tracker** - Track loans, credit cards, vehicles, and other EMIs
- ⚙️ **Settings** - Customize categories, backup, and currency preferences
- 🔄 **PWA Support** - Install as a mobile app with offline functionality

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **PWA**: Service Worker, Web App Manifest

## Project Structure

```
finance-tracker-pwa/
├── components/          # Reusable UI components
├── lib/                # Database connection and utilities
├── pages/              # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   ├── index.tsx      # Dashboard
│   ├── calendar.tsx   # Calendar view
│   ├── reports.tsx    # Analytics
│   ├── accounts.tsx   # Payment accounts
│   └── settings.tsx   # App settings
├── public/            # Static assets and PWA files
├── styles/           # Global styles
└── package.json
```

## Database Schema

### Collections

1. **users** - User authentication and profiles
2. **expenses** - Daily expense records
3. **income** - Income tracking
4. **payment_accounts** - Credit cards, UPI IDs, etc.
5. **emi** - EMI tracking for loans
6. **categories** - Expense and income categories
7. **settings** - User preferences

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker-pwa
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

### Income
- `POST /api/income/add` - Add new income
- `GET /api/income/list` - List income with filters

### Payment Accounts
- `POST /api/accounts/add` - Add payment account
- `GET /api/accounts/list` - List user accounts

### EMI Tracking
- `POST /api/emi/add` - Add EMI record
- `GET /api/emi/list` - List EMI records

## Mobile-First Design

The app is designed with mobile users in mind:

- **Responsive Layout** - Adapts to different screen sizes
- **Touch-Friendly** - Large buttons and touch targets
- **Bottom Navigation** - Easy thumb navigation
- **Fast Loading** - Optimized for mobile networks
- **Offline Capable** - Works without internet connection

## Features in Detail

### Dashboard
- Monthly income/expense overview
- Quick action buttons
- Recent transactions
- Expense breakdown chart

### Calendar View
- Monthly calendar with expense indicators
- Daily expense details
- Quick add expense functionality

### Reports & Analytics
- Category-wise expense breakdown
- Payment mode distribution
- Monthly trends
- Custom date range selection

### Account Management
- Multiple payment accounts
- EMI tracking with due dates
- Upcoming payment alerts

### Settings
- Currency preferences
- Notification settings
- Theme customization
- Data export/backup

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
