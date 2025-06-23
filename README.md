# Family Tree Visualizer

An interactive web application for creating, visualizing, and managing family trees with a modern, user-friendly interface.

## Features

- **Interactive Tree View**: Drag-and-drop interface to arrange family members with automatic relationship lines
- **Timeline View**: Chronological visualization of family events including births and marriages
- **Member Management**:
  - Add family members with details like name, birth date, and location
  - Connect family members through relationships (spouse, parent-child)
  - Various member types (father, mother, spouse, child)
- **Visualization Controls**:
  - Zoom in/out functionality
  - Pan across the family tree
  - Auto-align feature for better organization
- **Responsive Design**: Works on both desktop and mobile devices
- **Real-time Updates**: Changes are reflected immediately using React Query

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - TanStack Query for data fetching
  - Tailwind CSS for styling
  - Shadcn UI components
  - Lucide icons

- **Backend**:
  - Node.js server
  - RESTful API endpoints
  - In-memory storage with TypeScript interfaces

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   └── pages/      # Page components
├── server/             # Backend server
│   ├── routes.ts       # API routes
│   └── storage.ts      # Data storage implementation
└── shared/             # Shared TypeScript schemas
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5000 in your browser

## Key Components

- **FamilyTreeCanvas**: Main visualization component for the tree view
- **TimelineView**: Alternative chronological view of family events
- **SidebarControls**: Control panel for managing family members and relationships
- **ZoomControls**: Interface for controlling the tree view zoom level
- **AddMemberModal**: Form for adding new family members
- **ConnectMembersModal**: Interface for creating relationships between members

## Features in Detail

### Member Management
- Add new family members with details
- Specify member types (father, mother, spouse, child)
- Connect members through relationships
- Delete existing members

### Visualization
- Interactive drag-and-drop positioning
- Automatic relationship line drawing
- Zoom and pan controls
- Auto-align feature for better organization

### Timeline View
- Chronological display of family events
- Birth and marriage event tracking
- Visual representation of family history

### Mobile Support
- Responsive design
- Touch-friendly controls
- Collapsible sidebar for mobile devices