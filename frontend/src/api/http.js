// The real data source: Express + MySQL. Endpoints and row shapes are in docs/api.md.
import { api } from './client';

// Dashboard
export const getDashboardKpis = () => api.get('/dashboard/kpis');
export const getCalendar = (month) => api.get('/dashboard/calendar', { month });

// Operations
export const getOperations = (filters = {}) => api.get('/operations', filters);
export const getOperation = (id) => api.get(`/operations/${id}`);
export const createOperation = (input) => api.post('/operations', input);
export const updateOperation = (id, input) => api.put(`/operations/${id}`, input);
export const confirmOperation = (id) => api.post(`/operations/${id}/confirm`);
export const checkOperation = (id) => api.post(`/operations/${id}/check`);
export const pickOperation = (id) => api.post(`/operations/${id}/pick`);
export const packOperation = (id) => api.post(`/operations/${id}/pack`);
export const validateOperation = (id) => api.post(`/operations/${id}/validate`);
export const cancelOperation = (id) => api.post(`/operations/${id}/cancel`);
export const createAdjustment = (input) => api.post('/adjustments', input);

// Products, categories, reorder rules, alerts
export const getProducts = (filters = {}) => api.get('/products', filters);
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (input) => api.post('/products', input);
export const updateProduct = (id, input) => api.put(`/products/${id}`, input);
export const getCategories = () => api.get('/categories');
export const createCategory = (name) => api.post('/categories', { name });
export const updateCategory = (id, name) => api.put(`/categories/${id}`, { name });
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const getReorderRules = () => api.get('/reorder-rules');
export const saveReorderRuleFor = (productId, rule) => api.put(`/reorder-rules/${productId}`, rule);
export const getLowStock = () => api.get('/alerts/low-stock');

// Ledger
export const getMoves = (filters = {}) => api.get('/moves', filters);

// Warehouses, locations, profile
export const getWarehouses = () => api.get('/warehouses');
export const createWarehouse = (input) => api.post('/warehouses', input);
export const updateWarehouse = (id, input) => api.put(`/warehouses/${id}`, input);
export const getLocations = (type) => api.get('/locations', { type });
export const createLocation = (input) => api.post('/locations', input);
export const updateLocation = (id, input) => api.put(`/locations/${id}`, input);
export const updateProfile = async (name) => (await api.put('/auth/me', { name })).user;

// The server knows the user from the JWT.
export function setCurrentUser() {}
