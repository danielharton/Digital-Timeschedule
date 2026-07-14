# Digital Timeschedule

Digital Timeschedule is a comprehensive, full-stack web application designed to manage university/school semesters, timetables, active days, and user permissions efficiently. Built as a bachelor's degree project, it features a robust backend for scheduling logic and a dynamic, responsive frontend.

## 🚀 Features

- **Advanced Scheduling & Timetable Management**: Manage semesters, configurable active days, and granular timetable slots.
- **Role-Based Access Control (RBAC)**: Secure user authentication and authorization using JWT, with configurable permissions and roles.
- **Data Import/Export**: Parse and extract data directly from Excel (`.xlsx`) and Word (`.docx` via Mammoth) files.
- **Data Visualization**: View statistics and scheduling data through interactive charts (Recharts).
- **Cloud Storage Integration**: Seamless file and document management with Vercel Blob.

## 🛠️ Tech Stack

### Frontend (`timeschedule-frontend`)

- **React 19**: Modern, fast UI rendering.
- **Material UI (MUI) v7**: Comprehensive and customizable component library.
- **Recharts**: For rich data visualizations and analytics.
- **React Router**: Client-side routing.
- **Day.js**: Lightweight date and time manipulation.

### Backend (`timeschedule-backend`)

- **Node.js & Express**: High-performance server environment and API routing.
- **Knex.js**: Powerful SQL query builder supporting multiple database environments.
- **PostgreSQL / MySQL**: Relational database systems for robust data integrity.
- **JWT (JSON Web Tokens)**: Secure, stateless user authentication.
- **Vercel Blob Storage**: Cloud-native file storage solution.
- **Multer, XLSX, Mammoth**: Powerful utilities for processing file uploads and document parsing.

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL or MySQL database

### Backend Setup

1. Navigate to the backend directory:
   
   ```bash
   cd timeschedule-backend
   ```
2. Install dependencies:
   
   ```bash
   npm install
   ```
3. Set up the environment variables (e.g., database connection string, JWT secrets) in `.env.local`.
4. Run migrations and seed the database:
   
   ```bash
   npm run setup-db
   ```
5. Start the backend development server:
   
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   
   ```bash
   cd timeschedule-frontend
   ```
2. Install dependencies:
   
   ```bash
   npm install
   ```
3. Start the React development server:
   
   ```bash
   npm start
   ```

## 📜 License

This project is open-source and available under the MIT License.
