import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ items: [], config: {} }, null, 2), 'utf-8');
  }
}

export function loadStore() {
  ensure();
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
}

export function saveStore(store) {
  ensure();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

export function addItem(item) {
  const store = loadStore();
  store.items.push(item);
  saveStore(store);
  return item;
}

export function removeItem(id) {
  const store = loadStore();
  const before = store.items.length;
  store.items = store.items.filter(x => x.id !== id);
  saveStore(store);
  return before !== store.items.length;
}

export function listItems() {
  return loadStore().items;
}

export function getItem(id) {
  return loadStore().items.find(x => x.id === id) || null;
}

export function updateItem(id, patch) {
  const store = loadStore();
  const idx = store.items.findIndex(x => x.id === id);
  if (idx === -1) return null;
  store.items[idx] = { ...store.items[idx], ...patch };
  saveStore(store);
  return store.items[idx];
}

export function getConfig() {
  const store = loadStore();
  return store.config || {};
}

export function setConfig(patch) {
  const store = loadStore();
  store.config = { ...(store.config || {}), ...patch };
  saveStore(store);
  return store.config;
}
