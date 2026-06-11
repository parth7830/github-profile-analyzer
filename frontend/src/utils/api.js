import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If running in local development (Vite on port 5173/5174/etc calling Spring Boot on 8080)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080/api';
    }
  }
  // If running on Render (where Spring Boot serves the built static React files on the same host/port)
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

export const fetchProfile = (username) => API.get(`/profile/${username}`);
export const fetchLanguages = (username) => API.get(`/profile/${username}/languages`);
export const fetchContributions = (username) => API.get(`/profile/${username}/contributions`);
export const fetchRepos = (username) => API.get(`/profile/${username}/repos`);
