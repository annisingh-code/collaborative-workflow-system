import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../utils/api';

const Auth = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [formData, setFormData] =
    useState({
      name: '',
      email: '',
      password: ''
    });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    setLoading(true);

    try {
      const endpoint = isLogin
        ? '/auth/login'
        : '/auth/signup';

      const { data } = await api.post(
        endpoint,
        formData
      );

      // Store auth data
      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: ''
      });

      // Redirect to dashboard
      navigate('/projects');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '60px auto',
        padding: '24px',
        border: '1px solid #ccc',
        borderRadius: '10px'
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}
      >
        {isLogin ? 'Login' : 'Sign Up'}
      </h2>

      {error && (
        <p
          style={{
            color: 'red',
            marginBottom: '15px'
          }}
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Enter name"
            required
            value={formData.name}
            onChange={handleChange}
            style={{
              padding: '10px'
            }}
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Enter email"
          required
          value={formData.email}
          onChange={handleChange}
          style={{
            padding: '10px'
          }}
        />

        <input
          type="password"
          name="password"
          placeholder="Enter password"
          required
          value={formData.password}
          onChange={handleChange}
          style={{
            padding: '10px'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            cursor: 'pointer'
          }}
        >
          {loading
            ? 'Please wait...'
            : isLogin
            ? 'Login'
            : 'Sign Up'}
        </button>
      </form>

      <p
        style={{
          marginTop: '20px',
          textAlign: 'center'
        }}
      >
        {isLogin
          ? "Don't have an account?"
          : 'Already have an account?'}

        <button
          onClick={() =>
            setIsLogin(!isLogin)
          }
          style={{
            marginLeft: '5px',
            background: 'none',
            border: 'none',
            color: 'blue',
            cursor: 'pointer'
          }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
};

export default Auth;