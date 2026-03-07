import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const login = (email, password) => API.post('/auth/login', { email, password });
export const register = (email, password, name) => API.post('/auth/register', { email, password, name });
export const getMe = () => API.get('/auth/me');

// Public
export const getTournaments = () => API.get('/public/tournaments');
export const getTournamentMatches = (tournamentId) => API.get(`/public/tournament/${tournamentId}/matches`);
export const getMatch = (matchId) => API.get(`/public/match/${matchId}`);
export const getTeams = (tournamentId) => API.get(`/public/tournament/${tournamentId}/teams`);
export const getAllMatches = () => API.get('/public/matches');
export const getPlayerStats = (matchId) => API.get(`/public/match/${matchId}/stats`);
export const getPointsTable = (tournamentId) => API.get(`/public/tournament/${tournamentId}/points`);
export const getPlayersByTeam = (teamId) => API.get(`/public/team/${teamId}/players`);

// Manager
export const createTournament = (data) => API.post('/manager/tournament', data);
export const createTeam = (data) => API.post('/manager/team', data);
export const createPlayer = (data) => API.post('/manager/player', data);
export const createMatch = (data) => API.post('/manager/match', data);
export const startMatch = (matchId) => API.patch(`/manager/match/${matchId}/start`);
export const endMatch = (matchId, result, manOfTheMatch) => 
  API.patch(`/manager/match/${matchId}/end`, { result, manOfTheMatch });
export const addBall = (matchId, ballData) => API.post(`/manager/match/${matchId}/ball`, ballData);

// Admin
export const getAdminUsers = () => API.get('/admin/users');
export const updateUserRole = (userId, role) => API.patch(`/admin/user/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/admin/user/${userId}`);
export const inviteUser = (email) => API.post('/admin/invite', { email });
export const createAdminUser = (userData) => API.post('/admin/users', userData);
export const deleteTournament = (tournamentId) => API.delete(`/admin/tournament/${tournamentId}`);

export default API;