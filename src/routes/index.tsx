import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import AppShell from '@/components/layout/AppShell'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

// Admin pages
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const CustomersPage = lazy(() => import('@/pages/admin/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/pages/admin/CustomerDetailPage'))
const EmployeesPage = lazy(() => import('@/pages/admin/EmployeesPage'))
const VisitsPage = lazy(() => import('@/pages/admin/VisitsPage'))
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'))
const MapViewPage = lazy(() => import('@/pages/admin/MapViewPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))

// Sales pages
const MyCustomersPage = lazy(() => import('@/pages/sales/MyCustomersPage'))
const SalesCustomerDetailPage = lazy(() => import('@/pages/sales/SalesCustomerDetailPage'))
const AddVisitPage = lazy(() => import('@/pages/sales/AddVisitPage'))
const FollowUpsPage = lazy(() => import('@/pages/sales/FollowUpsPage'))
const MapNavPage = lazy(() => import('@/pages/sales/MapNavPage'))

const ChunkFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const wrap = (element: React.ReactNode) => (
  <Suspense fallback={<ChunkFallback />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: wrap(<LoginPage />),
  },
  {
    path: '/',
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      // Admin routes
      {
        path: 'dashboard',
        element: <RoleRoute role="admin">{wrap(<DashboardPage />)}</RoleRoute>,
      },
      {
        path: 'customers',
        element: <RoleRoute role="admin">{wrap(<CustomersPage />)}</RoleRoute>,
      },
      {
        path: 'customers/:id',
        element: <RoleRoute role="admin">{wrap(<CustomerDetailPage />)}</RoleRoute>,
      },
      {
        path: 'employees',
        element: <RoleRoute role="admin">{wrap(<EmployeesPage />)}</RoleRoute>,
      },
      {
        path: 'visits',
        element: <RoleRoute role="admin">{wrap(<VisitsPage />)}</RoleRoute>,
      },
      {
        path: 'reports',
        element: <RoleRoute role="admin">{wrap(<ReportsPage />)}</RoleRoute>,
      },
      {
        path: 'map',
        element: <RoleRoute role="admin">{wrap(<MapViewPage />)}</RoleRoute>,
      },
      {
        path: 'settings',
        element: <RoleRoute role="admin">{wrap(<SettingsPage />)}</RoleRoute>,
      },
      // Sales routes
      {
        path: 'my-customers',
        element: <RoleRoute role="sales">{wrap(<MyCustomersPage />)}</RoleRoute>,
      },
      {
        path: 'my-customers/:id',
        element: <RoleRoute role="sales">{wrap(<SalesCustomerDetailPage />)}</RoleRoute>,
      },
      {
        path: 'add-visit',
        element: <RoleRoute role="sales">{wrap(<AddVisitPage />)}</RoleRoute>,
      },
      {
        path: 'follow-ups',
        element: <RoleRoute role="sales">{wrap(<FollowUpsPage />)}</RoleRoute>,
      },
      {
        path: 'map-nav',
        element: <RoleRoute role="sales">{wrap(<MapNavPage />)}</RoleRoute>,
      },
      // Default redirect
      {
        index: true,
        element: <RoleRedirect />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

function RoleRedirect() {
  // Handled by AppShell once profile loads
  return null
}
