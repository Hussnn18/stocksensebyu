// The one module pages import data from. It forwards to the real Express + MySQL API
// (./http.js, the default) or, with VITE_DATA_SOURCE=mock in frontend/.env, to a browser-only
// copy of the seed data (./mock.js) for working without a database. Row shapes: docs/api.md.

import * as http from './http';
import * as mock from './mock';

export const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE === 'mock' ? 'mock' : 'api';
const source = DATA_SOURCE === 'mock' ? mock : http;

const listeners = new Set();

/** Called after every successful write so open pages, the sidebar and the alert bell refresh. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const read = (name) => (...args) => source[name](...args);
const write = (name) => async (...args) => {
  const result = await source[name](...args);
  listeners.forEach((listener) => listener());
  return result;
};

export const setCurrentUser = (user) => source.setCurrentUser(user);

// Dashboard
export const getDashboardKpis = read('getDashboardKpis');
export const getCalendar = read('getCalendar');

// Operations
export const getOperations = read('getOperations');
export const getOperation = read('getOperation');
export const createOperation = write('createOperation');
export const updateOperation = write('updateOperation');
export const confirmOperation = write('confirmOperation');
export const checkOperation = write('checkOperation');
export const pickOperation = write('pickOperation');
export const packOperation = write('packOperation');
export const validateOperation = write('validateOperation');
export const cancelOperation = write('cancelOperation');
export const createAdjustment = write('createAdjustment');

// Products, categories, reorder rules, alerts
export const getProducts = read('getProducts');
export const getProduct = read('getProduct');
export const createProduct = write('createProduct');
export const updateProduct = write('updateProduct');
export const getCategories = read('getCategories');
export const createCategory = write('createCategory');
export const updateCategory = write('updateCategory');
export const deleteCategory = write('deleteCategory');
export const getReorderRules = read('getReorderRules');
export const saveReorderRuleFor = write('saveReorderRuleFor');
export const getLowStock = read('getLowStock');

// Ledger
export const getMoves = read('getMoves');

// Warehouses, locations, profile
export const getWarehouses = read('getWarehouses');
export const createWarehouse = write('createWarehouse');
export const updateWarehouse = write('updateWarehouse');
export const getLocations = read('getLocations');
export const createLocation = write('createLocation');
export const updateLocation = write('updateLocation');
export const updateProfile = write('updateProfile');
