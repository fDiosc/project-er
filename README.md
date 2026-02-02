# ER Review System

A comprehensive Enhancement Request (ER) management system built with Next.js 15, designed to streamline the review, scoring, and tracking of product enhancement requests across multiple companies.

## 🚀 Features

### Core Functionality
- **ER Management**: Create, view, update, and track enhancement requests
- **Interactive Data Table**: Advanced sortable, filterable table with inline editing
- **Smart Scoring System**: 5-point scale scoring across 5 dimensions (Strategic, Impact, Technical, Resource, Market)
- **Status Workflow**: Track ERs through OPEN → IN_REVIEW → ACCEPTED/REJECTED lifecycle
- **Bulk Operations**: CSV import/export with intelligent data mapping
- **Real-time Dashboard**: Analytics, metrics, and performance insights
-   **Comments & History**: Internal internal team discussions and automatic audit trails
-   **Zendesk Sync**: Robust integration syncing ticket metadata and **full item histories**
-   **AI Decision Support**: GPT-generated ticket summaries and prioritization score suggestions
-   **Conversation Story**: Visual chronological thread of all synced Zendesk comments
- **Intelligent Dashboard**: AI Chat interface for direct backlog interrogation and custom analysis reports
- **Automated PRDs**: One-click consolidation of multiple similar ERs into a single technical PRD

### Advanced Features
- **Authentication**: JWT-based security with role management
- **Search & Filter**: Full-text search with advanced filtering options
- **Responsive Design**: Mobile-friendly interface with dark/light theme support
- **Real-time Updates**: Optimistic UI updates with automatic error handling
- **Data Export**: One-click CSV export of filtered results

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with modern features
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **TanStack Table** - Advanced data table functionality
- **TanStack Query** - Server state management
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless backend
- **Prisma ORM** - Type-safe database operations
- **SQLite** - Development database (PostgreSQL for production)
- **JWT (Jose)** - Authentication tokens
- **Zod** - Runtime validation

## 📊 Dashboard & Analytics

The system includes a comprehensive dashboard featuring:
- **KPI Cards**: Total ERs, completion rates, average scores
- **Status Distribution**: Visual breakdown of ER statuses
- **Company Performance**: Rankings and metrics by company
- **Score Analysis**: Distribution of scores across dimensions
- **Trend Charts**: Progress over time

## 🔐 Authentication

Currently implements hardcoded authentication for testing:
- **Admin**: username: `admin`, password: `admin123`
- **Reviewer**: username: `reviewer`, password: `review123`

## 📈 Scoring System

Each ER is evaluated across 5 dimensions:
- **Strategic** (0-5): Alignment with business strategy
- **Impact** (0-5): Expected business impact
- **Technical** (0-5): Technical complexity/feasibility
- **Resource** (0-5): Resource requirements (inverted: 5 = low resources)
- **Market** (0-5): Market demand/opportunity

**Total Score Formula**: `Strategic + Impact + Market + Technical + (5 - Resource)`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd er-review
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secure-jwt-secret-here"
   ```

4. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
er-review/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── integrations/  # Zendesk sync logic
│   │   │   ├── ers/           # ER management
│   │   │   └── ...
│   │   ├── dashboard/         # Dashboard page
│   │   ├── settings/          # Configuration pages
│   │   ├── login/            # Authentication
│   │   └── page.tsx          # Home (ER list)
│   ├── components/           # React components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── er-table/         # ER table components
│   │   ├── er-detail/        # ER detail dialog (Story, Scoring, etc.)
│   │   ├── ui/               # UI components
│   │   └── ...
│   ├── lib/                  # Utilities and configurations
│   ├── types/               # TypeScript definitions
│   └── middleware.ts        # Authentication middleware
├── prisma/                  # Database schema
└── public/                  # Static assets
```

## 📊 Data Import

The system supports CSV import with automatic field mapping:

1. **Navigate to the main table**
2. **Click "Import CSV"**
3. **Upload your CSV file**
4. **Map columns to ER fields**
5. **Review and confirm import**

### Supported CSV Fields
- Basic info: Subject, Description, Company
- Scores: Strategic, Impact, Technical, Resource, Market
- Status: Open/In Review/Accepted/Rejected
- Dates: Requested date, committed version

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/verify` - Token verification

### ER Management
- `GET /api/ers` - List ERs with filtering/pagination
- `POST /api/ers` - Create new ER
- `GET /api/ers/[id]` - Get ER details
- `PUT /api/ers/[id]` - Update ER
- `PUT /api/ers/[id]/scores` - Update scores

### Data Operations
- `POST /api/import/csv` - Import from CSV
- `GET /api/export/csv` - Export to CSV
- `GET /api/dashboard/summary` - Dashboard data

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI

### Database Commands
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run migrations
- `npx prisma studio` - Database GUI
- `npx prisma reset` - Reset database

## 🚀 Deployment

### Production Setup
1. **Update environment variables for production**
2. **Use PostgreSQL instead of SQLite**
3. **Update JWT_SECRET to a secure random string**
4. **Run database migrations**
5. **Build and deploy**

See [ec2deploy.md](./ec2deploy.md) for detailed AWS EC2 deployment instructions.

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/er_review_prod"
JWT_SECRET="your-super-secure-production-jwt-secret"
NODE_ENV="production"
```

## 📝 Current Status

### ✅ Completed Features
- Complete ER CRUD operations
- Advanced data table with inline editing
- CSV import/export functionality
- Real-time dashboard analytics
- Intelligent Dashboard with AI Chat & Reports
- Scoring system with configurable weights
- Status workflow management
- Authentication system
- Comment and audit systems
- Robust Zendesk synchronization with full conversation history
- GPT-5.2 powered analysis and PRD consolidation

### 🚧 In Progress
- Advanced filtering UI
- User management system
- Enhanced mobile experience

### 🔮 Planned Features
- Email notifications
- Advanced reporting
- File attachments
- Enhanced permissions system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📜 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
1. Check existing issues in the repository
2. Review the troubleshooting section in [ec2deploy.md](./ec2deploy.md)
3. Create a new issue with detailed information

---

**Built with ❤️ using Next.js 15, React 19, and modern web technologies.**