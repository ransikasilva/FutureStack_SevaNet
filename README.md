# 🏛️ SevaNet - Government Services Portal

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://python.org/)

## 🎯 Project Overview

**SevaNet** is a comprehensive Government Services Portal developed for the **Tech-Triathlon Hackathon by Rootcode**. It streamlines how Sri Lankan citizens access government services by eliminating physical queues and providing a seamless digital experience with integrated civic issue reporting.

## 📂 Repository Information

**GitHub Repository**: [https://github.com/ransikasilva/SevaNet.git](https://github.com/ransikasilva/SevaNet.git)  
**Working Branch**: `feature/portal-v1`  
**Clone Command**: 
```bash
git clone https://github.com/ransikasilva/SevaNet.git
cd SevaNet
git checkout feature/portal-v1
```

## 🏗️ System Architecture

SevaNet consists of two main components:

### **Frontend (Next.js)**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Features**: Appointment booking, document management, officer dashboard

### **Backend (FastAPI)**
- **Framework**: FastAPI
- **Language**: Python 3.8+
- **AI Integration**: Google Gemini 1.5 Flash
- **Features**: Civic issue reporting, AI-powered analysis, REST API

---

## ✨ Complete Feature Set

### 🏛️ **Core Hackathon Requirements (100% Complete)**

1. **✅ Unified Appointment Booking System**
   - Service directory with all government departments
   - Interactive calendar interface with real-time availability
   - QR code generation with unique booking references
   - Time slot management and scheduling

2. **✅ Citizen Dashboard & Document Pre-submission**
   - Secure user registration and personal dashboard
   - Document upload with validation and categorization
   - Appointment management and status tracking
   - Document wallet for storing uploaded files

3. **✅ Government Officer Interface**
   - Officer dashboard for department appointment management
   - Document review and approval workflow
   - Real-time status updates and citizen communication
   - Schedule calendar and workload management

4. **✅ Automated Notification System**
   - SMS notifications via Text.lk integration
   - Email confirmations and reminders via Gmail SMTP
   - 24-hour appointment reminders with document checklists
   - Status update notifications

5. **✅ Analytics for Optimization**
   - Real-time analytics dashboard
   - Peak hours analysis and department performance metrics
   - No-show rates and processing time tracking
   - Data export functionality

6. **✅ Integrated Feedback System**
   - 5-star rating system for completed appointments
   - Feedback collection and sentiment tracking
   - Service quality monitoring

### 🚀 **Additional Advanced Features**

#### **Frontend Features**
- **QR Code Integration**: Generate, display, download, and print QR codes
- **Real-time Updates**: Live appointment status changes via WebSockets
- **Role-based Access**: Citizen, Officer, and Admin interfaces
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Debug Tools**: Comprehensive debugging and testing interface

#### **Backend Features**
- **Civic Issue Reporting**: AI-powered issue classification and analysis
- **Image Analysis**: Google Gemini AI for automatic issue categorization
- **Authority Management**: Government department and contact management
- **REST API**: Comprehensive API for issue reporting and management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **Git**
- **Supabase** account
- **Google Gemini API** key (for AI features)
- **Text.lk** account (for SMS)
- **Gmail account** with App Password (for emails)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/ransikasilva/SevaNet.git
   cd SevaNet
   git checkout feature/portal-v1
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API credentials
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Option 2: Manual Setup

#### **Setup Frontend**

1. **Clone and setup repository**
   ```bash
   git clone https://github.com/ransikasilva/SevaNet.git
   cd SevaNet
   git checkout feature/portal-v1
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Run database setup**
   ```bash
   npm run db:setup
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

#### **Setup Backend**

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your API keys and database credentials
   ```

4. **Start backend server**
   ```bash
   python start_dev.py
   ```

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# SMS Service (Text.lk)
TEXT_LK_API_TOKEN=your_text_lk_api_token
TEXT_LK_SENDER_ID=TextLKDemo

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=SevaNet <your_email@gmail.com>
SMTP_SECURE=false

# Cron Job Configuration
CRON_SECRET=your_cron_secret

# Google Gemini AI (for backend)
GOOGLE_API_KEY=your_google_gemini_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Backend Environment Variables

Create `backend/.env`:

```env
# Google Gemini API (required for AI analysis)
GOOGLE_API_KEY=your-gemini-api-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
PROJECT_NAME=SevaNet Issue Reporting API
DEBUG=True
ENVIRONMENT=development
```

---

## 📊 Database Schema

### Core Tables

- **profiles**: User accounts with role-based access (citizen, officer, admin)
- **departments**: Government departments and their information
- **services**: Services offered by each department
- **time_slots**: Available appointment time slots
- **appointments**: Citizen appointment bookings with status tracking
- **documents**: File uploads and document review system
- **notifications**: SMS/email notification logs
- **feedback**: Service ratings and citizen feedback

### Issue Reporting Tables

- **issues**: Civic issue reports with AI analysis
- **issue_updates**: Status change tracking
- **issue_attachments**: Photo and document attachments
- **authorities**: Government authorities and contact information

---

## 🎭 User Roles & Workflows

### **Citizens**
```
Register → Browse Services → Book Appointment → Upload Documents → 
Receive Notifications → Attend Appointment → Provide Feedback
```

**Features Available:**
- Service discovery and appointment booking
- Document upload and tracking
- Real-time appointment status updates
- QR code access for appointments
- Civic issue reporting with photo upload
- Feedback and rating system

### **Officers**
```
Login → View Dashboard → Review Appointments → Approve Documents → 
Update Status → Send Notifications → Manage Schedule
```

**Features Available:**
- Department-specific appointment management
- Document review and approval workflow
- Real-time status updates
- Schedule calendar management
- Citizen communication tools
- Issue assignment and tracking

### **Admins**
```
Login → System Overview → Manage Departments → View Analytics → 
Export Reports → Monitor Performance
```

**Features Available:**
- System-wide analytics and reporting
- Department and service management
- User account administration
- Performance monitoring
- Data export capabilities

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access Control**: Granular permissions by user type
- **File Upload Security**: Type validation and size limits
- **Input Sanitization**: XSS and SQL injection prevention
- **Rate Limiting**: API endpoint protection
- **HTTPS Enforcement**: End-to-end encryption
- **CORS Configuration**: Secure cross-origin requests

---

## 🧪 Testing & Development

### Demo Data Setup

1. **Visit the debug page**: http://localhost:3000/debug
2. **Check system status**: Verify Supabase connection
3. **Create demo data**: Generate sample appointments and time slots
4. **Test user flows**: Use provided test accounts

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Type checking

# Backend
python start_dev.py  # Start development server
python -m pytest    # Run tests (if configured)
```

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📱 API Endpoints

### Appointment System
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment status
- `GET /api/appointments/:id/qr` - Generate QR code

### Document Management
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document
- `PUT /api/documents/:id/review` - Review document

### Issue Reporting
- `POST /api/v1/issues/report` - Report civic issue
- `GET /api/v1/issues/my-reports/:userId` - Get user's reports
- `GET /api/v1/issues/categories` - Get issue categories
- `PUT /api/v1/issues/:id/update` - Update issue status

### Analytics
- `GET /api/analytics` - System analytics
- `GET /api/analytics/export` - Export data

---

## 🚀 Deployment

### Production Deployment

**Frontend (Recommended: Vercel)**
```bash
# Build and deploy
npm run build
vercel --prod
```

**Backend (Recommended: Docker)**
```bash
# Build Docker image
docker build -t sevanet-backend ./backend

# Run container
docker run -p 8000:8000 sevanet-backend
```

### Environment Setup for Production

1. **Update CORS origins** in backend configuration
2. **Configure production database** URLs
3. **Set up SSL certificates** for HTTPS
4. **Configure monitoring** and logging
5. **Set up automated backups**

---

## 📈 Performance & Monitoring

### Key Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Mobile Performance**: 90+ Lighthouse score
- **Database Queries**: Optimized with indexes
- **Real-time Updates**: WebSocket connections

### Monitoring Tools
- **Frontend**: Vercel Analytics
- **Backend**: FastAPI built-in monitoring
- **Database**: Supabase dashboard
- **Logs**: Console and file logging

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check Supabase URL and keys in .env.local
# Verify network connectivity
curl -I https://your-project.supabase.co
```

**Port Already in Use**
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

**Module Not Found (Backend)**
```bash
# Ensure you're in the correct directory
cd backend
python -m uvicorn app.main:app --reload
```

**CORS Errors**
- Verify backend CORS configuration includes frontend URL
- Check that both frontend and backend are running
- Ensure environment variables are properly set

---

## 🎯 Success Verification

Verify your setup is working correctly:

- [ ] ✅ Frontend loads at http://localhost:3000
- [ ] ✅ Backend API responds at http://localhost:8000
- [ ] ✅ User registration and login works
- [ ] ✅ Appointment booking creates database entries
- [ ] ✅ Document upload and review workflow functions
- [ ] ✅ Notifications are sent successfully
- [ ] ✅ Issue reporting with AI analysis works
- [ ] ✅ Analytics dashboard displays data
- [ ] ✅ Officer dashboard shows department appointments
- [ ] ✅ QR code generation and display works

---

## 🔮 Future Enhancements

### Short-term Improvements
- **Multi-language Support**: Sinhala and Tamil interfaces
- **Mobile Applications**: Native iOS and Android apps
- **Advanced Analytics**: Predictive modeling and insights
- **Payment Integration**: Online fee collection system

### Long-term Vision
- **AI Enhancements**: Advanced document processing
- **Blockchain Integration**: Secure record verification
- **Smart City Features**: IoT integration for civic monitoring
- **Voice Interface**: Accessibility and convenience features

---

## 👥 Development Team

**Project**: SevaNet Government Services Portal  
**Competition**: Tech-Triathlon by Rootcode  
**Development Period**: August 2025  

### Tech Stack Credits
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Supabase
- **Backend**: FastAPI, Python, Google Gemini AI
- **Database**: PostgreSQL (Supabase)
- **Infrastructure**: Docker, Vercel

---

## 📞 Support & Resources

**Documentation**
- Frontend: http://localhost:3000/debug
- Backend API: http://localhost:8000/docs
- Database: Supabase Dashboard

**Resources**
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com/)

**Issues & Support**
- Create issues on [GitHub repository](https://github.com/ransikasilva/SevaNet/issues)
- Check troubleshooting section above
- Review API documentation for endpoint details

---

## 🚀 Deployment Guide

### **Quick Deploy to Vercel (Frontend)**

1. **Via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and sign up with GitHub
   - Click "New Project" → "Import Git Repository"
   - Enter: `https://github.com/ransikasilva/SevaNet.git`
   - **Important**: Select branch `feature/portal-v1` (not main)
   - Configure:
     - **Framework**: Next.js
     - **Root Directory**: `./`
     - **Build Command**: `npm run build`

2. **Via Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   git clone https://github.com/ransikasilva/SevaNet.git
   cd SevaNet
   git checkout feature/portal-v1
   vercel --prod
   ```

### **Deploy Backend to Railway**

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: `https://github.com/ransikasilva/SevaNet.git`
4. Choose branch: `feature/portal-v1`
5. Set root directory to: `backend`
6. Railway auto-detects Python and deploys

### **Environment Variables**

Set these in your deployment platform:

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TEXT_LK_API_TOKEN=your-text-lk-token
TEXT_LK_SENDER_ID=TextLKDemo
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=SevaNet <your-email@gmail.com>
SMTP_SECURE=false
CRON_SECRET=your-cron-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=your-database-url
POSTGRES_PASSWORD=your-postgres-password
```

**Backend (Railway)**:
```env
GOOGLE_API_KEY=your-gemini-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📄 License

This project is developed for educational and competition purposes as part of the Tech-Triathlon Hackathon by Rootcode.

---

**Built with ❤️ for the Sri Lankan digital transformation initiative**

*Empowering citizens with seamless access to government services while leveraging AI for smart civic management.*