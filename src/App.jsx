import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateCharacter from './pages/CreateCharacter';
import EditCharacter from './pages/EditCharacter';
import CharacterList from './pages/CharacterList';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CharacterProfile from './pages/CharacterProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Home /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <Layout><CreateCharacter /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/edit/:characterId" element={
            <ProtectedRoute>
              <Layout><EditCharacter /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/characters" element={
            <ProtectedRoute>
              <Layout><CharacterList /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/character/:id" element={
            <ProtectedRoute>
              <Layout><CharacterProfile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat/:characterId" element={
            <ProtectedRoute>
              <Layout><Chat /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

