import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';
import { Dashboard } from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Finance from './pages/Finance.tsx';
import Inbox from './pages/Inbox.tsx';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';

import './styles/global.css';
import './styles/auth.css';
import './styles/Dashboard/Dashboard.css';

function ProtectedPage({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <Layout>{children}</Layout>
        </ProtectedRoute>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Стартова сторінка React-проєкту */}
                    <Route path="/" element={<Welcome />} />
                    <Route path="/welcome" element={<Welcome />} />

                    <Route
                        path="/login"
                        element={
                            <PublicOnlyRoute>
                                <Login />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicOnlyRoute>
                                <Register />
                            </PublicOnlyRoute>
                        }
                    />

                    <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
                    <Route path="/inventory" element={<ProtectedPage><Inventory /></ProtectedPage>} />
                    <Route path="/products" element={<ProtectedPage><Inventory /></ProtectedPage>} />
                    <Route path="/clients" element={<ProtectedPage><Clients /></ProtectedPage>} />
                    <Route path="/finance" element={<ProtectedPage><Finance /></ProtectedPage>} />
                    <Route path="/inbox" element={<ProtectedPage><Inbox /></ProtectedPage>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
