# Backend Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Vision AI API Configuration
VISION_API_BASE_URL=https://ai-tools.rev21labs.com
GW_API_KEY=your-api-key-here

# Optional: File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Optional: CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Required Variables:

- **PORT**: Port number for the backend server (default: 3001)
- **VISION_API_BASE_URL**: Base URL for the Rev21 Labs Vision AI API
- **GW_API_KEY**: Your API key for the ByteForward Hackathon from Rev21 Labs

## Optional Variables:

- **NODE_ENV**: Environment mode (development/production)
- **MAX_FILE_SIZE**: Maximum file size for uploads in bytes (default: 10MB)
- **UPLOAD_DIR**: Directory for storing uploaded files (default: uploads)
- **ALLOWED_ORIGINS**: Comma-separated list of allowed CORS origins

## Setup Instructions:

1. Copy the example above to a file named `.env` in the `backend/` directory
2. Replace `your-api-key-here` with your actual API key
3. Adjust other values as needed for your environment
