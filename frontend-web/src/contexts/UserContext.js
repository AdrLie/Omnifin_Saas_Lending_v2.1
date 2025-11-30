import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { userService } from '../services/userService';

const UserContext = createContext(null);

export const UserProvider = ({ children, initialUser = null }) => {
    const [currentUser, setCurrentUser] = useState(initialUser);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialUser) setCurrentUser(initialUser);
    }, [initialUser]);

    const getAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
            setError(null);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // backward-compatible alias
    const loadAllUsers = getAllUsers;

    const getUserById = useCallback(async (id) => {
        setLoading(true);
        try {
            const data = await userService.getUserById(id);
            if (currentUser && currentUser.id === data.id) setCurrentUser(data);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const createUser = useCallback(async (userData) => {
        setLoading(true);
        try {
            const data = await userService.createUser(userData);
            setUsers(prev => (prev ? [data, ...prev] : [data]));
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (id, userData) => {
        setLoading(true);
        try {
            const data = await userService.updateUser(id, userData);
            setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
            if (currentUser && currentUser.id === data.id) setCurrentUser(data);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const deleteUser = useCallback(async (id) => {
        setLoading(true);
        try {
            const data = await userService.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            if (currentUser && currentUser.id === id) setCurrentUser(null);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const updateProfile = useCallback(async (userData) => {
        setLoading(true);
        try {
            const data = await userService.updateProfile(userData);
            setCurrentUser(data);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const changePassword = useCallback(async (passwordData) => {
        setLoading(true);
        try {
            const data = await userService.changePassword(passwordData);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const sendPasswordReset = useCallback(async (email) => {
        setLoading(true);
        try {
            const data = await userService.sendPasswordReset(email);
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getUserStats();
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo(() => ({
        currentUser,
        users,
        loading,
        error,
        loadAllUsers,
        getAllUsers,
        getUserById,
        createUser,
        updateUser,
        deleteUser,
        updateProfile,
        changePassword,
        sendPasswordReset,
        getUserStats,
        setCurrentUser,
        setUsers,
    }), [currentUser, users, loading, error, loadAllUsers, getUserById, createUser, updateUser, deleteUser, updateProfile, changePassword, sendPasswordReset, getUserStats]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};

UserProvider.propTypes = {
    children: PropTypes.node.isRequired,
    initialUser: PropTypes.object,
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within a UserProvider');
    return ctx;
};

export default UserContext;
