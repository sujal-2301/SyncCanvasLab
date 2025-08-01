# 🎨 SyncCanvasLab

A real-time, collaborative whiteboard application built with React, Node.js, Socket.IO, and Fabric.js. This project features an infinite canvas, a responsive design for both desktop and mobile, and a modern, intuitive user interface.

## ✨ Features

-   **♾️ Infinite Canvas**: A pannable and zoomable workspace that gives users unlimited space to create. Viewports are synchronized across all clients.
-   **📱 Mobile-First Design**: The interface is fully responsive and optimized for touch devices. It includes intuitive gestures like one-finger drawing and two-finger panning/zooming.
-   **👥 Real-Time Collaboration**: Cursors and drawings are updated instantly for all users in a room, with a clean UI for viewing online participants.
-   **🎨 Modern Drawing Tools**: Includes a pen, eraser, and shape tools (line, rectangle, circle), along with an easy-to-use color picker and brush size adjuster.
-   **📥 Save & Export**: Users can save their work as high-quality PNG or JPG files.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18 or later is recommended)
-   npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sujal-2301/SyncCanvasLab.git
    cd SyncCanvasLab
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the backend server:**
    -   In a terminal, navigate to the `backend` directory:
    ```bash
    npm run dev
    ```
    -   The backend will start on `http://localhost:3001`.

2.  **Start the frontend development server:**
    -   In a **new terminal**, navigate to the `frontend` directory:
    ```bash
    npm run dev
    ```
    -   The application will be available at `http://localhost:5173`.

### 📱 Testing on Mobile Devices

To access the. application from a phone or another device on your local network:

1.  **Start the frontend server with the `--host` flag:**
    ```bash
    cd frontend
    npm run dev -- --host
    ```
2.  The terminal will provide a "Network" URL (e.g., `http://192.168.1.10:5173`).
3.  Open this URL in the browser on your mobile device.

## 🛠️ Tech Stack

-   **Frontend**: React, Fabric.js, Tailwind CSS, Socket.IO Client
-   **Backend**: Node.js, Express, Socket.IO
-   **Development**: Vite, Nodemon

## 🤝 Contributing

Contributions are always welcome. If you have an idea for a new feature or find a bug, feel free to fork the repository, make your changes, and open a pull request.
