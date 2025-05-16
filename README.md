# Product Roadmap Tool

A comprehensive product roadmap management application with both backend and frontend components. This tool helps product owners and managers plan, visualize, and manage product features and releases.

## Features

- **Multiple Views**: Gantt chart and Kanban board views
- **Drag and Drop**: Intuitive interface for managing tasks and timelines
- **Feature Management**: Create, edit, and organize product features
- **Release Planning**: Group features into releases for better planning
- **SQLite Database**: Lightweight database for storing all roadmap data

## Screenshots

### Releases Overview
![Releases Page](/screenshots/releases-overview.png)

### Release Details with Features
![Release Details](/screenshots/release-details.png)

### Kanban Board View
![Kanban Board](/screenshots/kanban-view.png)

### Gantt Chart View
![Gantt Chart](/screenshots/gantt-chart.png)

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React with modern UI libraries
- **Database**: SQLite
- **Styling**: CSS with Tailwind CSS
- **Drag and Drop**: React DnD
- **Charts**: react-gantt-chart

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   cd src/backend
   npm install

   cd ../frontend
   npm install
   ```
3. Start the backend server:
   ```
   npm run start:backend
   ```
4. Start the frontend development server:
   ```
   npm run start:frontend
   ```
5. Access the application at `http://localhost:3000`

## Project Structure

- `/src/backend`: Backend Express server and API endpoints
- `/src/frontend`: React frontend application
- `/src/backend/database`: SQLite database setup and models
