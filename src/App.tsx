import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { GuestOnlyRoute, ProtectedRoute } from "./components/auth-guard"
import Page from "./pages/Page"
import ChatsStagePage from "./pages/ChatsStagePage"
import DashboardPage from "./pages/DashboardPage"
import LoginPage from "./pages/LoginPage"
import RequirementsPage from "./pages/RequirementsPage"
import SignupPage from "./pages/SignupPage"
import SuppliersStagePage from "./pages/SuppliersStagePage"

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
            <Route
              path="suppliers/directory"
              element={<SuppliersStagePage stage="directory" />}
            />
            <Route
              path="suppliers/contacting"
              element={<SuppliersStagePage stage="contacting" />}
            />
            <Route
              path="suppliers/awaiting-response"
              element={<SuppliersStagePage stage="awaiting-response" />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
