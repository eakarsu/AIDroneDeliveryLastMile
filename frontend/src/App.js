import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 entity CRUD pages
import DronesPage              from './pages/DronesPage';
import BatteriesPage           from './pages/BatteriesPage';
import FlightsPage             from './pages/FlightsPage';
import MissionsPage            from './pages/MissionsPage';
import CustomersPage           from './pages/CustomersPage';
import PackagesPage            from './pages/PackagesPage';
import DepotsPage              from './pages/DepotsPage';
import VertiportsPage          from './pages/VertiportsPage';
import PilotsPage              from './pages/PilotsPage';
import ObserversPage           from './pages/ObserversPage';
import RegulatoryApprovalsPage from './pages/RegulatoryApprovalsPage';
import AirspaceZonesPage       from './pages/AirspaceZonesPage';
import WeatherBriefsPage       from './pages/WeatherBriefsPage';
import MaintenanceLogsPage     from './pages/MaintenanceLogsPage';
import IncidentsPage           from './pages/IncidentsPage';
import RouteCorridorsPage      from './pages/RouteCorridorsPage';
import PayloadSpecsPage        from './pages/PayloadSpecsPage';
import AuditLogPage            from './pages/AuditLogPage';

// 16 AI pages
import AIRouteCorridorPlanPage     from './pages/AIRouteCorridorPlanPage';
import AIWeatherFlightWindowPage   from './pages/AIWeatherFlightWindowPage';
import AIMissionBriefPage          from './pages/AIMissionBriefPage';
import AIAnomalyTriagePage         from './pages/AIAnomalyTriagePage';
import AIExecutiveBriefPage        from './pages/AIExecutiveBriefPage';
import AIPayloadWeightOptimizePage from './pages/AIPayloadWeightOptimizePage';
import AIBatteryCyclePrognosticPage from './pages/AIBatteryCyclePrognosticPage';
import AIRegulatoryChecklistPage   from './pages/AIRegulatoryChecklistPage';
import AIPilotShiftSchedulePage    from './pages/AIPilotShiftSchedulePage';
import AIGroundObserverPlanPage    from './pages/AIGroundObserverPlanPage';
import AIConflictAirspaceDetectPage from './pages/AIConflictAirspaceDetectPage';
import AICustomerCommsDraftPage    from './pages/AICustomerCommsDraftPage';
import AIVertiportCapacityPlanPage from './pages/AIVertiportCapacityPlanPage';
import AIContingencyLandingPlanPage from './pages/AIContingencyLandingPlanPage';
import AIIncidentPostMortemPage    from './pages/AIIncidentPostMortemPage';
import AIVendorQualityScorePage    from './pages/AIVendorQualityScorePage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

// Custom views (Flight Views)
import CustomViewsPage from './pages/CustomViewsPage';

// Apply pass 7 — new pages
import Part135RecordsPage         from './pages/Part135RecordsPage';
import VertiportSlotsPage         from './pages/VertiportSlotsPage';
import AICustomerEtaNarratePage   from './pages/AICustomerEtaNarratePage';
import AIWeightBalanceAdvisePage  from './pages/AIWeightBalanceAdvisePage';
import AIDeliveryWindowPredictPage from './pages/AIDeliveryWindowPredictPage';
import AINotamAwareReroutePage    from './pages/AINotamAwareReroutePage';
import AutonomyAdvisoryPage       from './pages/AutonomyAdvisoryPage';
import FeedsAdminPage             from './pages/FeedsAdminPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

            <Route path="/" element={<Dashboard />} />

            <Route path="/drones"               element={<DronesPage />} />
            <Route path="/batteries"            element={<BatteriesPage />} />
            <Route path="/flights"              element={<FlightsPage />} />
            <Route path="/missions"             element={<MissionsPage />} />
            <Route path="/customers"            element={<CustomersPage />} />
            <Route path="/packages"             element={<PackagesPage />} />
            <Route path="/depots"               element={<DepotsPage />} />
            <Route path="/vertiports"           element={<VertiportsPage />} />
            <Route path="/pilots"               element={<PilotsPage />} />
            <Route path="/observers"            element={<ObserversPage />} />
            <Route path="/regulatory-approvals" element={<RegulatoryApprovalsPage />} />
            <Route path="/airspace-zones"       element={<AirspaceZonesPage />} />
            <Route path="/weather-briefs"       element={<WeatherBriefsPage />} />
            <Route path="/maintenance-logs"     element={<MaintenanceLogsPage />} />
            <Route path="/incidents"            element={<IncidentsPage />} />
            <Route path="/route-corridors"      element={<RouteCorridorsPage />} />
            <Route path="/payload-specs"        element={<PayloadSpecsPage />} />
            <Route path="/audit-log"            element={<AuditLogPage />} />

            <Route path="/ai/route-corridor-plan"      element={<AIRouteCorridorPlanPage />} />
            <Route path="/ai/weather-flight-window"    element={<AIWeatherFlightWindowPage />} />
            <Route path="/ai/mission-brief"            element={<AIMissionBriefPage />} />
            <Route path="/ai/anomaly-triage"           element={<AIAnomalyTriagePage />} />
            <Route path="/ai/executive-brief"          element={<AIExecutiveBriefPage />} />
            <Route path="/ai/payload-weight-optimize"  element={<AIPayloadWeightOptimizePage />} />
            <Route path="/ai/battery-cycle-prognostic" element={<AIBatteryCyclePrognosticPage />} />
            <Route path="/ai/regulatory-checklist"     element={<AIRegulatoryChecklistPage />} />
            <Route path="/ai/pilot-shift-schedule"     element={<AIPilotShiftSchedulePage />} />
            <Route path="/ai/ground-observer-plan"     element={<AIGroundObserverPlanPage />} />
            <Route path="/ai/conflict-airspace-detect" element={<AIConflictAirspaceDetectPage />} />
            <Route path="/ai/customer-comms-draft"     element={<AICustomerCommsDraftPage />} />
            <Route path="/ai/vertiport-capacity-plan"  element={<AIVertiportCapacityPlanPage />} />
            <Route path="/ai/contingency-landing-plan" element={<AIContingencyLandingPlanPage />} />
            <Route path="/ai/incident-post-mortem"     element={<AIIncidentPostMortemPage />} />
            <Route path="/ai/vendor-quality-score"     element={<AIVendorQualityScorePage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />

            <Route path="/custom-views" element={<CustomViewsPage />} />

            {/* Apply pass 7 — new routes (mounted BEFORE the 404 fallback) */}
            <Route path="/part135-records"            element={<Part135RecordsPage />} />
            <Route path="/vertiport-slots"            element={<VertiportSlotsPage />} />
            <Route path="/ai/customer-eta-narrate"    element={<AICustomerEtaNarratePage />} />
            <Route path="/ai/weight-balance-advise"   element={<AIWeightBalanceAdvisePage />} />
            <Route path="/ai/delivery-window-predict" element={<AIDeliveryWindowPredictPage />} />
            <Route path="/ai/notam-aware-reroute"     element={<AINotamAwareReroutePage />} />
            <Route path="/autonomy-advisory"          element={<AutonomyAdvisoryPage />} />
            <Route path="/feeds-admin"                element={<FeedsAdminPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
