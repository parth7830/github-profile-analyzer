import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000,
});

export const fetchProfile = (username) => API.get(`/profile/${username}`);
export const fetchLanguages = (username) => API.get(`/profile/${username}/languages`);
export const fetchContributions = (username) => API.get(`/profile/${username}/contributions`);
export const fetchRepos = (username) => API.get(`/profile/${username}/repos`);
