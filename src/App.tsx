import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { GuestOnlyRoute, ProtectedRoute } from "./components/auth-guard"
import Page from "./pages/Page"
import ChatsStagePage from "./pages/ChatsStagePage"
import DashboardPage from "./pages/DashboardPage"
import LoginPage from "./pages/LoginPage"
import RequirementsPage from "./pages/RequirementsPage"
import SignupPage from "./pages/SignupPage"
import SuppliersPage from "./pages/SuppliersPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Page />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="requirements" element={<RequirementsPage />} />
            <Route
              path="chats/discovery"
              element={<ChatsStagePage stage="discovery" />}
            />
            <Route
              path="chats/outreach"
              element={<ChatsStagePage stage="outreach" />}
            />
            <Route
              path="chats/negotiation"
              element={<ChatsStagePage stage="negotiation" />}
            />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route
              path="suppliers/directory"
              element={<Navigate to="/suppliers" replace />}
            />
            <Route
              path="suppliers/contacting"
              element={<Navigate to="/suppliers" replace />}
            />
            <Route
              path="suppliers/awaiting-response"
              element={<Navigate to="/suppliers" replace />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
