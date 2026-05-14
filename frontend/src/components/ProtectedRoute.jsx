import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({
  children
}) => {
  const token =
    localStorage.getItem('token');

  // Redirect if not authenticated
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;