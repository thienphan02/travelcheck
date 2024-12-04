import React, { useState, useEffect  } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/style.css';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    // Adds a CSS class to the body element for styling purposes and removes it on component unmount.
    useEffect(() => {
        document.body.classList.add('auth-body');
        return () => {
            document.body.classList.remove('auth-body');
        };
    }, []);

    // Handles form submission. Prevents the default form submission behavior, validates inputs, and sends a POST request to the signup API.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const signupData = { username, password, email };

        try {
            const response = await fetch('https://travelcheck-1016857315f8.herokuapp.com/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData),
            });

            if (response.ok) {
                console.log('User signed up successfully');
                navigate('/login'); // Redirect to login page
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to sign up');
            }
        } catch (error) {
            setError('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handles email input changes. Validates the email format using a regular expression and updates the emailError state if invalid.
    const handleEmailChange = (e) => {
        setEmail(e.target.value);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(e.target.value)) {
            setEmailError('Invalid email format'); // Set error message if email is invalid
        } else {
            setEmailError(''); // Clear error message if email is valid
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Email"
                    required
                />
                {emailError && <p className="error">{emailError}</p>}

                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
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
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
            <div className="link-text">
                Already have an account? <Link to="/login">Login</Link>
            </div>
        </div>
    );
};

export default SignUpPage;
