# Project Analyzer Backend

This is the backend server for the Project Analyzer application that uses Rev21 Labs Vision AI to analyze and describe images.

## Features

- Image upload and processing
- Vision AI analysis using Rev21 Labs API
- RESTful API endpoints
- File validation and error handling
- Real-time image analysis

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Multer** - File upload middleware
- **Rev21 Labs Vision AI** - Image analysis service
- **Axios** - HTTP client for API requests
- **Form-data** - Multipart form data handling

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Rev21 Labs Vision AI Configuration
GW_API_KEY=your_rev21_labs_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Get Your Rev21 Labs API Key

1. Contact Rev21 Labs or check your ByteForward Hackathon materials
2. You should have received a `GW_API_KEY` for the Vision AI service
3. The API key format: `ZWM5NTVmZTctNTZhZi00ZDBiLWI3MTUtZTEzYzhhMDhhMTRh`

### 4. Run the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check

- **GET** `/health`
- Returns server status and service information

### Image Analysis

- **POST** `/api/vision/describe-image`
- Upload an image file and get AI-generated description
- **Body**: `multipart/form-data` with `file` field
- **Supported formats**: PNG, JPEG, JPG, WebP
- **Max file size**: 10MB

**Example Response:**

```json
{
  "text": "The image shows a modern web application interface with a clean design..."
}
```

## Rev21 Labs Vision AI Service

- **Provider**: Rev21 Labs (ByteForward Hackathon)
- **Endpoint**: `https://ai-tools.rev21labs.com/api/v1/vision/describe-image`
- **Authentication**: API Key via `x-api-key` header
- **Rate Limits**: Check with Rev21 Labs for current limits

## Error Handling

The API includes comprehensive error handling for:

- Invalid file types
- File size limits
- Missing API keys
- Network errors
- API rate limits
- Service unavailability

## Development

### File Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env              # Environment variables
├── README.md         # This file
└── uploads/          # Temporary file storage
```

### Adding New Features

1. Image analysis endpoints
2. Additional file format support
3. Image preprocessing
4. Response caching
5. User authentication

## Troubleshooting

### Common Issues

1. **API Key Not Configured**

   - Error: "Rev21 Labs API key not configured"
   - Solution: Add `GW_API_KEY` to your `.env` file

2. **Authentication Failed**

   - Error: "Invalid API key or insufficient permissions"
   - Solution: Verify your API key with Rev21 Labs

3. **Service Unavailable**

   - Error: "Could not connect to Rev21 Labs Vision API"
   - Solution: Check internet connection and Rev21 Labs service status

4. **File Upload Issues**
   - Error: "File too large" or "Invalid file type"
   - Solution: Ensure file is under 10MB and in supported format

### Testing the API

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test image analysis (replace with actual image file)
curl -X POST -F "file=@path/to/image.jpg" http://localhost:3001/api/vision/describe-image
```

## License

This project is part of the ByteForward Hackathon and uses Rev21 Labs AI services.
