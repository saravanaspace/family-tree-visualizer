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

### Demo mode (no database)
```bash
npm run dev:demo
```
Serves a small in-memory sample family (8 members, 3 generations, relationships and events) with no
database. Changes are not saved; restart, or call `POST /api/demo/reset` from the same machine
(loopback only), to restore the original data. Demo mode refuses to start when `NODE_ENV=production`.
Staging and production keep using Postgres via `npm run dev` / `npm start`.

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

- **TreeWorkspace** (`client/src/features/tree-canvas`): React Flow canvas with floating chrome (top bar, left toolbar, zoom panel, inspector, command palette)
- **PersonNode / UnionNode / RelationshipEdge**: Canvas visuals with zoom-based detail levels
- **TimelineView**: Alternative chronological view of family events
- **AddMemberModal / EditMemberModal / ConnectMembersModal**: Forms for members and relationships

## Features in Detail

### Canvas
- Couples are linked side to side through a junction dot between the partners; children drop from it
- Drag cards (or a Shift+drag marquee selection) to move them; each gesture is saved as one batch
- Drag from a card's handle to another card to connect (bottom handle suggests parent, top child, sides partner); release on empty canvas to add a person there
- Undo/redo for moves, connects, link edits, adds and deletes (up to 100 steps)
- Auto-arrange (children always below parents; also runs once on first load if cards overlap), align and distribute, optional snap-to-grid (hold Shift to invert)
- Semantic zoom (name only, name + dates, full details), minimap, collapse branches, focus on a branch
- Search, living/deceased and gender filters; export the whole tree as PNG or SVG
- View, zoom and settings persist per browser

### Shortcuts
| Key | Action |
| --- | --- |
| Ctrl/Cmd+K or `/` | Command palette |
| `F` / `0` | Fit tree / reset zoom to 100% |
| Enter | Open details for the selected person |
| Delete | Delete selection (with Undo toast) |
| Arrows (Shift = 10px) | Nudge selection |
| Ctrl/Cmd+Z, Shift+Z | Undo / redo |
| Scroll wheel | Zoom at the pointer (switch to "Scroll pans" in Canvas settings) |
| Drag on empty canvas, Space + drag, middle mouse | Pan |
| Shift + drag on empty canvas | Marquee select |

### Timeline View
- Chronological display of family events

### Mobile Support
- Bottom toolbar, bottom-sheet details, 44px touch handles, dialogs that scroll within the viewport

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