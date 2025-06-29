# Family Tree Visualizer

An interactive web application for creating, visualizing, and managing family trees with a modern, user-friendly interface and persistent storage.

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
- **Persistent Storage**: PostgreSQL database for reliable data storage
- **Data Seeding**: Sample family data available for testing and demonstration

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
  - PostgreSQL database with Drizzle ORM
  - TypeScript for type safety

- **Testing**:
  - Vitest for unit testing
  - Test database support
  - Comprehensive storage layer tests

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
│   ├── storage.ts      # PostgreSQL storage implementation
│   ├── seed.ts        # Database seeding script
│   └── __tests__/     # Test files
├── shared/            # Shared TypeScript schemas
└── migrations/        # Database migrations
```

## Getting Started

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up PostgreSQL:
   - Install PostgreSQL if not already installed
   - Create a database named 'familytree'
   - Set up environment variables in .env:
     ```
     DATABASE_URL="postgres://postgres:postgres@localhost:5432/familytree"
     ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. (Optional) Seed sample data:
   ```bash
   npx tsx server/seed.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open http://localhost:5000 in your browser

## Development

### Testing
Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

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

## Data Persistence

The application uses PostgreSQL for data storage with the following features:
- Reliable data persistence across server restarts
- Efficient querying with Drizzle ORM
- Automated database migrations
- Test database support for development

### Database Schema Management

The project uses Drizzle ORM for database management. Follow these steps to set up and manage the database:

1. **Create PostgreSQL Database**:
   
   Automated setup:
   ```bash
   npm run db:setup
   ```
   This command will automatically create the database if it doesn't exist.

   Or manually using one of these methods:
   ```bash
   # Using psql
   psql -U postgres -c "CREATE DATABASE familytree;"

   # Or using createdb if you have PostgreSQL tools in your PATH
   createdb familytree
   ```
   Note: If you don't have command line access, you can create the database using pgAdmin or any other PostgreSQL management tool.

2. **Configure Database Connection**:
   Make sure your database connection is configured in your `.env` file:
   ```
   DATABASE_URL="postgres://username:password@localhost:5432/familytree"
   ```

3. **Manage Schema** (choose one approach):

   a. **Direct Schema Push** (Development):
   ```bash
   npm run db:push
   ```
   This command directly pushes schema changes to the database. Best used during development.

   b. **Migration Workflow** (Production):
   ```bash
   # Generate migrations from schema changes
   npm run db:generate

   # Apply migrations to the database
   npm run db:migrate
   ```
   This workflow is recommended for production as it provides better control over database changes and allows for rollbacks.

   Note: The `db:generate` command will create new migration files only when there are schema changes detected. If your schema is already up to date, you'll see a "No schema changes, nothing to migrate" message.

### Database Schema
- Family Members: Stores individual family member information
- Relationships: Manages connections between family members (parent-child, spouse)