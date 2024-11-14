import React, { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUser, setEditUser] = useState(null); // Track user being edited
  const [newUser, setNewUser] = useState({ username: '', email: '', userType: 'member', password: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchUsers = async () => {
      try {
        const response = await fetch('https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user and all their posts?');

    if (!confirmDelete) {
      return; // Exit if admin cancels the deletion
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== id));
        alert('User and all associated posts deleted successfully');
      } else {
        console.error('Failed to delete user');
        alert('Error: Unable to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error: Unable to delete user');
    }
  };


  const handleEdit = (user) => {
    setEditUser(user);
  };

  const handleSaveEdit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      alert('Invalid email format');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editUser),
      });

      if (response.ok) {
        await fetchUsers();
        setEditUser(null);
        alert('User updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update user:', errorData.message);
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };


  const handleCreateUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert('Invalid email format');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        await fetchUsers();
        setNewUser({ username: '', email: '', userType: 'member', password: '' }); // Reset form
        setShowCreateForm(false);
        alert('User created successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to create user:', errorData.message);
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://travelcheck-hzdwesazbcead2bm.canadacentral-01.azurewebsites.net/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
  
      const data = await response.json();
      const formattedUsers = data.map(user => ({
        ...user,
        userType: user.user_type,  // Map `user_type` from backend to `userType` in frontend
        created_at: user.created_at ? new Date(user.created_at) : null,
      }));
      setUsers(formattedUsers);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  
  


  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="manage-users-container">
      <h1>Manage Users</h1>

      {/* Toggle Create User Form */}
      <button className="toggle-create-button" onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Close Create User Form' : 'Create User'}
      </button>

      {showCreateForm && (
        <div className="create-user-form">
          <h2>Create New User</h2>
          <input
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <select
            value={newUser.userType}
            onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreateUser}>Create User</button>
        </div>
      )}

      {/* Edit user form */}
      {editUser && (
        <div className="edit-user-form">
          <h2>Edit User</h2>
          <input
            type="text"
            value={editUser.username}
            onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
          />
          <input
            type="email"
            value={editUser.email}
            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
          />
          <select
            value={editUser.userType}
            onChange={(e) => setEditUser({ ...editUser, userType: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleSaveEdit}>Save Changes</button>
        </div>
      )}

      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>User Type</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.user_type}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td className="action-buttons">
                <button className="edit-button" onClick={() => handleEdit(user)}>Edit</button>
                <button className="delete-button" onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
