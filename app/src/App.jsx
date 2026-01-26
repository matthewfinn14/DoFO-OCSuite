import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, AUTH_STATES } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import {
  LoginScreen,
  AccessRequestForm,
  PendingApprovalScreen,
  SchoolOnboardingWizard
} from './components/auth';
import { MainLayout } from './components/layout';
import {
  Dashboard,
  Playbook,
  GamePlan,
  DepthCharts,
  WristbandBuilder,
  PracticeScriptBuilder,
  Staff,
  Admin,
  PrintCenter,
  Templates,
  Setup,
  Offseason,
  Summer,
  Preseason,
  Season,
  InstallManager,
  Pregame,
  NotFound,
  // Offseason pages
  OffseasonReports,
  OffseasonSwot,
  OffseasonMeetings,
  OffseasonResearch,
  // Week-specific pages
  CoachesNotes,
  PracticePlans,
  // Sub-level pages
  SubLevelView,
  SubLevelSchedule,
  SubLevelDepth,
  SubLevelPractice,
  // Bottom nav pages
  AccountSettings,
  Roadmap,
  Help
} from './pages';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

// Auth router - shows appropriate screen based on auth state
function AuthRouter() {
  const { authState } = useAuth();

  switch (authState) {
    case AUTH_STATES.LOADING:
      return <LoadingScreen />;

    case AUTH_STATES.UNAUTHENTICATED:
      return <LoginScreen />;

    case AUTH_STATES.PENDING_REQUEST:
      return <AccessRequestForm />;

    case AUTH_STATES.AWAITING_APPROVAL:
      return <PendingApprovalScreen />;

    case AUTH_STATES.NEEDS_SCHOOL:
      return <SchoolOnboardingWizard />;

    case AUTH_STATES.READY:
      return (
        <SchoolProvider>
          <AppRoutes />
        </SchoolProvider>
      );

    default:
      return <LoadingScreen />;
  }
}

// Protected routes for authenticated users
function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Core Features */}
        <Route path="/playbook" element={<Playbook />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/setup/:phase" element={<Setup />} />
        <Route path="/setup/:phase/:tab" element={<Setup />} />
        <Route path="/print" element={<PrintCenter />} />
        <Route path="/templates" element={<Templates />} />

        {/* Staff & Roster */}
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:tab" element={<Staff />} />

        {/* Phases */}
        <Route path="/offseason" element={<Offseason />} />
        <Route path="/summer" element={<Summer />} />
        <Route path="/preseason" element={<Preseason />} />
        <Route path="/season" element={<Season />} />

        {/* Offseason sub-routes */}
        <Route path="/offseason/reports" element={<OffseasonReports />} />
        <Route path="/offseason/swot" element={<OffseasonSwot />} />
        <Route path="/offseason/meetings" element={<OffseasonMeetings />} />
        <Route path="/offseason/research" element={<OffseasonResearch />} />

        {/* Week-specific routes (new URL structure) */}
        <Route path="/:year/:phase/:week/practice" element={<PracticePlans />} />
        <Route path="/:year/:phase/:week/practice/:day" element={<PracticePlans />} />
        <Route path="/:year/:phase/:week/notes" element={<CoachesNotes />} />
        <Route path="/:year/:phase/:week/install" element={<InstallManager />} />
        <Route path="/:year/:phase/:week/depth-charts" element={<DepthCharts />} />
        <Route path="/:year/:phase/:week/game-plan" element={<GamePlan />} />
        <Route path="/:year/:phase/:week/wristband" element={<WristbandBuilder />} />
        <Route path="/:year/:phase/:week/practice-scripts" element={<PracticeScriptBuilder />} />
        <Route path="/:year/:phase/:week/pregame" element={<Pregame />} />

        {/* Legacy week routes (for backwards compatibility) */}
        <Route path="/week/:weekId/notes" element={<CoachesNotes />} />
        <Route path="/week/:weekId/practice" element={<PracticePlans />} />
        <Route path="/week/:weekId/install" element={<InstallManager />} />
        <Route path="/week/:weekId/depth-charts" element={<DepthCharts />} />
        <Route path="/week/:weekId/game-plan" element={<GamePlan />} />
        <Route path="/week/:weekId/wristband" element={<WristbandBuilder />} />
        <Route path="/week/:weekId/practice-scripts" element={<PracticeScriptBuilder />} />
        <Route path="/week/:weekId/pregame" element={<Pregame />} />

        {/* Legacy weekly tools (non-week-specific) */}
        <Route path="/game-plan" element={<GamePlan />} />
        <Route path="/wristband" element={<WristbandBuilder />} />
        <Route path="/practice" element={<PracticeScriptBuilder />} />
        <Route path="/depth-charts" element={<DepthCharts />} />
        <Route path="/install-manager" element={<InstallManager />} />
        <Route path="/pregame" element={<Pregame />} />

        {/* Sub-levels routes */}
        <Route path="/sublevel/:levelId" element={<SubLevelView />} />
        <Route path="/sublevel/:levelId/schedule" element={<SubLevelSchedule />} />
        <Route path="/sublevel/:levelId/depth" element={<SubLevelDepth />} />
        <Route path="/sublevel/:levelId/practice/:weekId" element={<SubLevelPractice />} />

        {/* Bottom nav routes */}
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/help" element={<Help />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// Main App component
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
