# PureFrame

An AI-powered background removal tool that automatically removes backgrounds from images.

## Project Structure

```
pure-frame/
├── frontend/          # Next.js React application
├── backend/           # Python Flask/FastAPI server
├── README.md         
└── docker-compose.yml # For local development
```

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Python with FastAPI
- **Background Removal**: rembg library with U2Net model
- **Image Processing**: PIL, OpenCV, numpy

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Features

- Drag and drop image upload
- Automatic background removal using AI
- Download processed images
- Support for PNG, JPG, JPEG formats
- Responsive design