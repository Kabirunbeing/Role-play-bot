import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateCharacter from './pages/CreateCharacter';
import CharacterList from './pages/CharacterList';
import Chat from './pages/Chat';
import CharacterProfile from './pages/CharacterProfile';
import GenerateAnime from './pages/GenerateAnime';
import Gallery from './pages/Gallery';
import Badges from './pages/Badges';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
              <Layout><CreateCharacter /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/generate-anime" element={
            <ProtectedRoute>
              <Layout><GenerateAnime /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute>
              <Layout><Gallery /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/badges" element={
            <ProtectedRoute>
              <Layout><Badges /></Layout>
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
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

