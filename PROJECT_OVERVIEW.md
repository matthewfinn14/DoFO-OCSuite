# DoFO - Football Coaching Platform Overview

## Project Summary

**DoFO** is a comprehensive web-based football coaching management platform built as a single-page application (SPA). It provides an all-in-one solution for high school and college football programs to manage every aspect of their operation, from playbook management and practice planning to player tracking and game-day execution.

## Technology Stack

### Frontend
- **React 17** (via CDN) - Core UI framework
- **Babel Standalone** - JSX transpilation in-browser
- **Tailwind CSS** - Utility-first styling framework
- **Lucide Icons** - Icon library
- **Framer Motion** - Animation library
- **Recharts** - Data visualization and charting
- **SortableJS** - Drag-and-drop functionality

### Backend & Infrastructure
- **Firebase 8.10.1** - Complete backend solution
  - **Firebase Authentication** - Google Sign-In
  - **Cloud Firestore** - NoSQL database
  - **Firebase Storage** - File storage for images/assets
- **Architecture**: Single HTML file (~50,000 lines, 3.3MB) with embedded React components

### Development Approach
- **No build process** - Everything runs directly in the browser
- **Hot reload** via browser refresh
- **Local development** - Served via `npx serve` or similar

## Core Features & Modules

### 1. **Program Management**
- **Dashboard** - Overview of program metrics, tasks, and key information
- **Season Setup** - Configure weeks, opponents, and season schedule
- **Budget Management** - Track expenditures, fundraisers, and wishlist items
- **Staff Management** - Roster, tasks, duty assignments, and calendar
- **Onboarding** - Track completion of onboarding tasks for players, coaches, and staff

### 2. **Playbook & Game Planning**
- **Master Playbook** - Comprehensive play library with filtering and search
- **Play Editor** - Visual play creation with formation diagrams
- **Formation Manager** - Define and customize offensive/defensive/ST formations
- **Install Manager** - Manage weekly play installations
- **Game Plan Builder** - Create offensive game plans with call sheets
- **Wristband Builder** - Generate printable wristbands (traditional, modular, diagram styles)
- **Smart Call Sheet** - Situation-aware play calling interface
- **Play Call Simulator** - Practice play-calling scenarios

### 3. **Practice Management**
- **Practice Planner** - Daily practice schedule builder
- **Practice Script Builder** - Create detailed practice scripts with reps and hashes
- **Practice Report** - Track practice execution and rep counts
- **Drill Library** - Organize drills by phase (Offense/Defense/ST)
- **Coach App** - Mobile-friendly practice execution interface
- **Pregame Timeline** - Plan pregame warmup sequences

### 4. **Player & Roster Management**
- **Roster Manager** - Player database with positions, grades, and details
- **Player Profiles** - Individual player cards with photos and stats
- **Depth Charts** - Visual depth chart management (Offense/Defense/ST/Scout)
- **Player Metrics** - Track testing results, ironman challenges, and ratings
- **Weight Tracking** - Log and visualize player weight progression
- **Multi-Sport Tracking** - Track players across multiple sports
- **Attendance** - Daily attendance tracking with excused/unexcused absences

### 5. **Equipment Management**
- **Inventory** - Track equipment stock and availability
- **Checkout System** - Manage equipment loans to players
- **Issuance** - Assign permanent equipment to players
- **Jersey Number Lottery** - Gamified jersey selection system
- **Wishlist** - Track desired equipment purchases

### 6. **Game Day & Analytics**
- **Pressbox** - Live game tracking and play logging
- **Game Grading** - Post-game player performance evaluation
- **Self-Scout Analytics** - Analyze tendencies by phase (Offense/Defense/ST)
- **Opponent Scouting** - Scout and track opponent data
- **Reports** - Generate various program reports

### 7. **Player & Staff Apps**
- **Player App** - Player-facing interface with:
  - Daily check-ins
  - Weight logging
  - Task management
  - Culture calibration feedback
  - Depth chart viewing
- **Staff App** - Staff task management and duty tracking
- **Attendance App** - Simplified attendance taking interface

### 8. **Culture & Communication**
- **Cultural Calibration** - Schedule and track team culture initiatives
- **Daily Connections** - Track coach-player interactions
- **Meeting Notes** - (Placeholder for future development)
- **Staff Calendar** - Shared calendar for staff events and deadlines

### 9. **Settings & Configuration**
- **Team Settings** - Logo, colors, theme (light/dark)
- **Position Names** - Customize position terminology
- **Program Levels** - Define program structure (Varsity/JV/etc.)
- **Permissions** - Role-based access control
- **Glossary** - Define terminology by phase
- **Print Hub** - Centralized printing interface

## Data Architecture

### Firebase Collections Structure
```
users/
  {userId}/
    memberships/
      {schoolId}/
        - role
        - joinedAt
        - status

schools/
  {schoolId}/
    - name
    - roster[]
    - plays[]
    - staff[]
    - weeks[]
    - depthChart{}
    - masterTasks[]
    - settings{}
    - memberList[]
```

### Key Data Models

**Week Object**:
- `id`, `date`, `opponent`
- `practicePlans{}` - Daily practice schedules
- `offensiveGamePlan{}` - Game plan data
- `wristbands{}` - Wristband configurations
- `installList[]` - Weekly play installations
- `gameLog[]` - Game play-by-play data
- `isLocked` - Prevent editing past weeks

**Play Object**:
- `id`, `name`, `formation`, `concept`
- `tags[]` - Situational tags
- `diagram` - SVG or image data
- `personnel`, `protection`, `route`

**Player Object**:
- `id`, `name`, `number`, `position`, `grade`
- `photo`, `height`, `weight`
- `archived` - For graduated/transferred players

## User Roles & Permissions

- **Site Admin** - Full system access
- **Head Coach** - Program-wide access
- **Coordinator** - Phase-specific access (OC/DC/STC)
- **Assistant Coach** - Limited editing capabilities
- **Manager** - Equipment and administrative tasks
- **Player** - Read-only access via Player App

## Key Technical Patterns

### State Management
- React hooks (`useState`, `useEffect`, `useMemo`)
- Local state for UI interactions
- Firebase Firestore for persistence
- LocalStorage for caching and offline access

### Data Sync
- **Auto-save** - Debounced writes to Firestore
- **Real-time sync** - Firestore listeners for collaborative editing
- **Conflict resolution** - Last-write-wins strategy
- **Migration** - Automatic data structure upgrades

### Print Functionality
- Custom print stylesheets with `@media print`
- Print preview modals
- Landscape/portrait page layouts
- Wristband printing (5x3" cards, 2x2 grid per page)

### Responsive Design
- Mobile-first approach for player/staff apps
- Desktop-optimized for coaching interfaces
- Sidebar navigation with collapsible sections

## Current Development Status

### Recent Work (Based on Conversation History)
- Fixed JSX syntax errors in multiple components
- Repaired corrupted code in `OffensiveGamePlan`, `PracticeScriptBuilder`
- Implemented dynamic game week overview autopopulation
- Refactored Install Manager to three-column layout
- Enhanced wristband builder with modular card support
- Implemented practice plan notes modal with staff grid
- Added hash presets for practice script builder

### Known Issues
- Large file size (50K lines) makes debugging challenging
- Occasional syntax corruption requiring manual repair
- Some placeholder features ("Coming Soon")

## Development Workflow

### Local Development
```bash
# Start local server
npx serve
# or
python -m http.server 8000
```

### Git Workflow
- Repository tracked in `.git/`
- Active branch: `main`
- Recent commits focus on UI refinements and bug fixes

### File Structure
```
/
├── index.html          # Main application (50K lines)
├── style.css           # Global styles
├── firestore.rules     # Firestore security rules
├── storage.rules       # Storage security rules
├── favicon.png         # App icon
└── [various debug/backup files]
```

## Future Enhancements

Based on code comments and placeholders:
- Meeting notes functionality
- Enhanced fundraiser tracking
- Video integration for play diagrams
- Advanced analytics dashboards
- Mobile native apps (currently PWA-capable)
- Multi-school/district management

## Getting Started for Developers

### Prerequisites
- Modern browser (Chrome/Firefox/Safari)
- Google account for authentication
- Firebase project credentials

### First-Time Setup
1. Clone repository
2. Start local web server
3. Navigate to `http://localhost:8000`
4. Sign in with Google
5. Create or join a school

### Key Files to Understand
- **Lines 44688+** - Main `App` component
- **Lines 1-800** - Styles and print layouts
- **Lines 800-1200** - Firebase initialization and auth
- **Component definitions** - Scattered throughout (search for `const [ComponentName] = `)

### Common Tasks
- **Add new view**: Add route in sidebar navigation + component definition
- **Modify data model**: Update Firestore sync functions + local state
- **Add print layout**: Modify `@media print` styles
- **Fix syntax errors**: Use Python debug scripts in root directory

## Support & Documentation

- **User Guide**: Accessible via Help menu in app
- **Code Comments**: Inline documentation throughout
- **Debug Scripts**: Python scripts for syntax validation
- **Backup Files**: Multiple `.bak` files for recovery

### Architectural Guidelines

- **Quick Add / Play Creation**: Any feature that allows users to "Quick Add" a play (Game Planner, Script Builder, Wristband etc.) MUST default to adding that play to the global `plays` list in the Master Playbook. This ensures consistency and prevents "ghost plays" (plays that exist only in a specific script/view but are not reusable or editable). Use `handleQuickAddPlay`, `onQuickAddPlay`, or ensure `onBlur` handlers trigger creation.

---

**Last Updated**: January 2026
**Version**: Active Development
**License**: Proprietary
**Contact**: [Your contact information]
