import React, { useState, useEffect  } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/style.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('auth-body');
        return () => {
            document.body.classList.remove('auth-body'); // Clean up on unmount
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const loginData = { email, password };

        try {
            const response = await fetch('https://travelcheck.azurewebsites.net/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Login successful:', result);
                localStorage.setItem('token', result.token); // Store token in local storage
                navigate('/'); // Redirect to home page or another page
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to log in');
            }
        } catch (error) {
            setError('Error logging in: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
            <div className="link-text">
                Don't have an account? <Link to="/signup">Sign Up!</Link>
            </div>
        </div>
    );
};

export default LoginPage;
