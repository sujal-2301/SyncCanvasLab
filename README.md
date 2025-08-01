# 🎨 SyncCanvasLab

A real-time collaborative canvas application built with React, Node.js, and Socket.IO. Create rooms, invite others, and draw together in real-time!

![Demo](https://img.shields.io/badge/Status-Live-green) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-21.0.0-green) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7.2-lightblue)

## ✨ Features

### 🏠 **Room Management**
- **Create Rooms**: Generate unique 6-character room codes
- **Join Rooms**: Easy room joining with validation
- **Room Sharing**: Copy room codes and share with one click
- **Participant Management**: See who's online with colored indicators

### 🎨 **Drawing Tools**
- **Pen Tool**: Free-hand drawing with adjustable brush size
- **Eraser Tool**: Remove parts of drawings
- **Shape Tools**: Draw lines, rectangles, and circles
- **Color Picker**: Choose from presets or custom colors
- **Brush Sizes**: Adjustable from 1px to 50px with presets

### 👥 **Real-time Collaboration**
- **Live Cursors**: See other users' cursors in real-time
- **Instant Sync**: All drawings appear immediately for all users
- **User Presence**: Know who's in your room
- **Auto-generated Usernames**: Creative names with unique colors

### 🔧 **Technical Features**
- **Real-time Communication**: WebSocket-based with Socket.IO
- **Canvas Persistence**: Drawings saved during session
- **Responsive Design**: Works on desktop and tablet
- **Professional UI**: Beautiful gradient landing page and clean interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sujal-2301/SyncCanvasLab.git
   cd SyncCanvasLab
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the frontend server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` and start collaborating!

## 🎯 Usage

### Creating a Room
1. Click "Create Room" on the homepage
2. Enter an optional room name
3. Get your unique 6-character room code
4. Share the code with collaborators

### Joining a Room
1. Click "Join Room" on the homepage
2. Enter the 6-character room code
3. Start drawing together!

### Drawing Tools
- **Pen**: Click and drag to draw
- **Eraser**: Remove parts of drawings
- **Shapes**: Click and drag to create lines, rectangles, or circles
- **Colors**: Choose from presets or use the color picker
- **Brush Size**: Adjust with the slider or preset buttons

## 🏗️ Architecture

### Backend (`/backend`)
- **Express.js** server with REST API endpoints
- **Socket.IO** for real-time communication
- **In-memory storage** for rooms and canvas data
- **Room management** with unique code generation

### Frontend (`/frontend`)
- **React 18** with modern hooks
- **Vite** for fast development and building  
- **Fabric.js** for advanced canvas manipulation
- **Socket.IO Client** for real-time features

### Key Components
- **RoomManager**: Landing page for creating/joining rooms
- **RoomInfo**: Room details and participant list
- **SimpleCanvas**: Main drawing canvas with tools
- **DrawingToolbar**: Tool selection and options
- **Cursor**: Real-time cursor tracking

## 🔧 API Endpoints

### Room Management
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:code/validate` - Validate room code
- `GET /api/rooms/:code` - Get room information

### Socket Events
- `join-room` - Join a room
- `leave-room` - Leave a room
- `drawing` - Send drawing data
- `cursor-move` - Send cursor position
- `cursor-leave` - Hide cursor

## 🎨 Tech Stack

### Frontend
- React 18.2.0
- Fabric.js 5.3.0
- Socket.IO Client 4.7.2
- Vite 4.5.0

### Backend
- Node.js 21.0.0
- Express.js 4.18.2
- Socket.IO 4.7.2
- CORS 2.8.5

## 📁 Project Structure

```
synccanvaslab/
├── backend/
│   ├── index.js              # Main server file
│   ├── package.json          # Backend dependencies
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── SimpleCanvas.jsx
│   │   │   ├── RoomManager.jsx
│   │   │   ├── RoomInfo.jsx
│   │   │   ├── DrawingToolbar.jsx
│   │   │   ├── Cursor.jsx
│   │   │   └── components.css
│   │   ├── hooks/            # Custom hooks
│   │   │   └── useThrottle.js
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Frontend dependencies
│   └── ...
├── .gitignore
└── README.md
```

## 🔄 Development

### Adding New Features
1. Backend: Add routes in `backend/index.js`
2. Frontend: Create components in `frontend/src/components/`
3. Real-time: Add socket events in both client and server

### Environment Variables
Create `.env` files in backend directory if needed:
```env
PORT=3001
NODE_ENV=development
```

## 🚀 Deployment

### Backend Deployment
- Deploy to services like Heroku, Railway, or DigitalOcean
- Update CORS settings for production domain
- Set environment variables

### Frontend Deployment
- Build with `npm run build`
- Deploy to Vercel, Netlify, or similar
- Update API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Fabric.js** for powerful canvas manipulation
- **Socket.IO** for seamless real-time communication
- **React** for the amazing frontend framework
- **Vite** for lightning-fast development experience

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub or reach out!

---

**Built with ❤️ for collaborative creativity**