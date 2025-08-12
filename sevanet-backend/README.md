# SevaNet Issue Reporting API Backend

A FastAPI backend service for AI-powered civic issue reporting with Supabase integration.

## Features

- 🤖 **AI Image Analysis**: Google Gemini 1.5 Flash for civic issue detection
- 🗄️ **Supabase Integration**: REST API client for database operations
- 🌐 **RESTful API**: Clean and documented endpoints
- 🔄 **Graceful Fallbacks**: Works with mock data if database unavailable
- 📱 **CORS Enabled**: Frontend integration ready

## Tech Stack

- **Framework**: FastAPI
- **AI Service**: Google Gemini 1.5 Flash with LangChain
- **Database**: Supabase (via REST API)
- **Image Processing**: Pillow
- **HTTP Client**: httpx

## Prerequisites

- Python 3.8+
- Google Gemini API key
- Supabase project (optional - works with mock data)

## Quick Start

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
python start_dev.py
```

### Environment Variables
```bash
# Google Gemini API (required for AI analysis)
GOOGLE_API_KEY=your-gemini-api-key

# Supabase (optional - falls back to mock data)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
PROJECT_NAME=SevaNet Issue Reporting API
DEBUG=True
```

### 3. Database Migration

Run the migration script to add issue reporting tables to your existing database:

**Option A: Using psql command line**
```bash
psql "postgresql://postgres:Zaqwer1234@db.ileyyewqhyfclcfdlisg.supabase.co:5432/postgres" -f database_migration.sql
```

**Option B: Using Supabase Dashboard**
1. Open https://supabase.com/dashboard
2. Go to your project → SQL Editor
3. Copy and paste the contents of `database_migration.sql`
4. Run the query

**Option C: Using Python script**
```bash
python -c "
import psycopg2
from decouple import config

conn = psycopg2.connect(config('DATABASE_URL'))
cur = conn.cursor()
with open('database_migration.sql', 'r') as f:
    cur.execute(f.read())
conn.commit()
conn.close()
print('Migration completed successfully!')
"
```

### 4. Start the Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## 📚 API Documentation

Once the server is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔧 API Endpoints

### Issue Reporting
- `POST /api/v1/issues/report` - Report a new issue
- `GET /api/v1/issues/my-reports/{user_id}` - Get user's reported issues
- `GET /api/v1/issues/categories` - Get available issue categories
- `POST /api/v1/issues/{issue_id}/analyze` - AI analysis of issue (dummy)
- `GET /api/v1/issues/{issue_id}/status` - Get detailed issue status
- `PUT /api/v1/issues/{issue_id}/update` - Update issue status (for officers)

### Authorities
- `GET /api/v1/authorities` - Get list of government authorities
- Filter by category: `GET /api/v1/authorities?category=roads`

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Get Issue Categories
```bash
curl http://localhost:8000/api/v1/issues/categories
```

### 3. Report an Issue (with image)
```bash
curl -X POST "http://localhost:8000/api/v1/issues/report" \
  -H "Content-Type: multipart/form-data" \
  -F "category=roads" \
  -F "description=Large pothole on Main Street causing traffic issues" \
  -F "location=Main Street, Colombo 03" \
  -F "user_id=your-user-id" \
  -F "severity_level=2" \
  -F "image=@photo.jpg"
```

### 4. Get User Reports
```bash
curl "http://localhost:8000/api/v1/issues/my-reports/your-user-id"
```

### 5. Get Authorities
```bash
curl "http://localhost:8000/api/v1/issues/authorities"
curl "http://localhost:8000/api/v1/issues/authorities?category=roads"
```

## 🗄️ Database Schema

The migration adds two main tables to your existing database:

### `issues` Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to profiles)
- category (VARCHAR) - roads, electricity, water, etc.
- title (VARCHAR, Optional)
- description (TEXT, Required)
- location (VARCHAR, Required)
- image_url (VARCHAR, Optional)
- status (VARCHAR) - pending, under_review, assigned, in_progress, resolved, closed
- severity_level (INTEGER) - 1-4 (Low to Critical)
- assigned_authority_id (UUID, Foreign Key to authorities)
- created_at, updated_at (TIMESTAMP)
```

### `authorities` Table
```sql
- id (UUID, Primary Key)
- name (VARCHAR) - Authority name
- department (VARCHAR) - Department name
- category (VARCHAR) - Service category
- contact_phone (VARCHAR)
- contact_email (VARCHAR)
- emergency_contact (VARCHAR)
- is_emergency_service (BOOLEAN)
- coverage_area (VARCHAR)
- created_at (TIMESTAMP)
```

## 🔒 Security Features

- **CORS**: Configured for frontend (http://localhost:3000)
- **Row Level Security**: Database-level access control
- **Input Validation**: Pydantic models for request validation
- **File Upload Security**: Type and size validation
- **Error Handling**: Comprehensive error responses

## 🏃‍♂️ Running Both Frontend and Backend

1. **Terminal 1 - Backend**:
```bash
cd sevanet-backend
python -m uvicorn app.main:app --reload --port 8000
```

2. **Terminal 2 - Frontend**:
```bash
cd SevaNet
npm run dev
```

3. **Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎯 Integration with Frontend

The React components are configured to call these API endpoints:

```typescript
// Report issue
fetch('http://localhost:8000/api/v1/issues/report', {
  method: 'POST',
  body: formData // Contains image, category, description, etc.
})

// Get user reports  
fetch(`http://localhost:8000/api/v1/issues/my-reports/${userId}`)

// Get categories
fetch('http://localhost:8000/api/v1/issues/categories')
```

## 🔧 Development Notes

### Current Implementation Status
- ✅ **Complete**: Database models, API endpoints, file upload handling
- ✅ **Dummy Implementation**: All endpoints return mock/placeholder data
- ⏳ **Future**: Real AI analysis, actual image storage, notification system

### Mock Data
The API currently returns realistic mock data for:
- Issue submission confirmations
- User report listings  
- AI analysis results
- Authority contact information

### File Upload
- Currently returns mock URLs for uploaded images
- In production, implement actual cloud storage (AWS S3, Google Cloud, etc.)

## 📊 Monitoring and Logs

### Development Logs
```bash
# View real-time logs
python -m uvicorn app.main:app --reload --log-level info
```

### Health Monitoring
```bash
curl http://localhost:8000/health
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: could not connect to server
   ```
   **Solution**: Verify your database URL in `.env` file

2. **CORS Error in Frontend**
   ```
   Access to fetch at 'localhost:8000' from origin 'localhost:3000' has been blocked by CORS
   ```
   **Solution**: Verify CORS configuration in `app/main.py`

3. **Port Already in Use**
   ```
   Error: [Errno 48] Address already in use
   ```
   **Solution**: Use a different port or kill existing process
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

4. **Module Not Found**
   ```
   ModuleNotFoundError: No module named 'app'
   ```
   **Solution**: Run from the correct directory
   ```bash
   cd sevanet-backend
   python -m uvicorn app.main:app --reload
   ```

### Database Issues

1. **Migration Failed**
   - Check database connectivity
   - Verify user permissions
   - Ensure no conflicting table names

2. **RLS Policies Not Working**
   - Verify Supabase auth is properly configured
   - Check if user IDs match between tables

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Use production database URL
2. **CORS**: Update allowed origins for production domain
3. **File Storage**: Implement cloud storage for images
4. **Monitoring**: Add proper logging and monitoring
5. **Security**: Enable HTTPS and additional security headers

### Docker Deployment
```dockerfile
# Dockerfile (create this for containerized deployment)
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📞 Support

For issues and questions:
- Check the [troubleshooting section](#-troubleshooting)
- Review API documentation at http://localhost:8000/docs
- Check database migration logs
- Verify frontend-backend connectivity

## 🎉 Success Verification

If everything is working correctly, you should be able to:
1. ✅ Start backend server without errors
2. ✅ Access API documentation at http://localhost:8000/docs
3. ✅ Submit test requests to endpoints
4. ✅ See new tables in your Supabase dashboard
5. ✅ Use the "Report Issue" feature in the frontend
6. ✅ View reported issues in "My Reports" section

---

**Note**: This is a foundation implementation with dummy endpoints. The structure is ready for you to implement full functionality including real AI analysis, proper file storage, and notification systems.