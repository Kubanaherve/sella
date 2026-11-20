import { isCloudMode, hasSupabaseConfig } from "@/integrations/supabase/client";
import * as local from "@/db/localApi";
import * as cloud from "@/db/cloudApi";

const isCloudBackend = () => isCloudMode() && hasSupabaseConfig();

// Auth / local-only helpers (always Dexie for local mode; cloud uses Supabase Auth)
export const getSessionProfile = local.getSessionProfile;
export const setSession = local.setSession;
export const signupLocal = local.signupLocal;
export const loginLocal = local.loginLocal;
export const logoutLocal = local.logoutLocal;
export const verifyProfilePin = local.verifyProfilePin;
export const changePin = local.changePin;
export const isShopNameAvailableLocal = local.isShopNameAvailableLocal;

export async function getAppSetting(key: string) {
  return isCloudBackend() ? cloud.getAppSetting(key) : local.getAppSetting(key);
}
export async function setAppSetting(key: string, value: string) {
  return isCloudBackend() ? cloud.setAppSetting(key, value) : local.setAppSetting(key, value);
}
export async function updateClientContact(
  clientId: string,
  patch: { name?: string; phone?: string | null }
) {
  return isCloudBackend()
    ? cloud.updateClientContact(clientId, patch)
    : local.updateClientContact(clientId, patch);
}
export async function recordCashSale(
  ...args: Parameters<typeof local.recordCashSale>
) {
  return isCloudBackend() ? cloud.recordCashSale(...args) : local.recordCashSale(...args);
}
export async function findOrCreateClient(name: string, phone?: string | null) {
  return isCloudBackend()
    ? cloud.findOrCreateClient(name, phone)
    : local.findOrCreateClient(name, phone);
}
export async function listClients() {
  return isCloudBackend() ? cloud.listClients() : local.listClients();
}
export async function deleteClient(clientId: string) {
  return isCloudBackend() ? cloud.deleteClient(clientId) : local.deleteClient(clientId);
}
export async function listActiveDebts() {
  return isCloudBackend() ? cloud.listActiveDebts() : local.listActiveDebts();
}
export async function listDebtsForReport() {
  return isCloudBackend() ? cloud.listDebtsForReport() : local.listDebtsForReport();
}
export async function createSaleOrder(...args: Parameters<typeof local.createSaleOrder>) {
  return isCloudBackend() ? cloud.createSaleOrder(...args) : local.createSaleOrder(...args);
}
export async function createDebt(...args: Parameters<typeof local.createDebt>) {
  return isCloudBackend() ? cloud.createDebt(...args) : local.createDebt(...args);
}
export async function recordPayment(...args: Parameters<typeof local.recordPayment>) {
  return isCloudBackend() ? cloud.recordPayment(...args) : local.recordPayment(...args);
}
export async function listRecentSales(...args: Parameters<typeof local.listRecentSales>) {
  return isCloudBackend() ? cloud.listRecentSales(...args) : local.listRecentSales(...args);
}
export async function deleteDebt(...args: Parameters<typeof local.deleteDebt>) {
  return isCloudBackend() ? cloud.deleteDebt(...args) : local.deleteDebt(...args);
}
export async function listInventory() {
  return isCloudBackend() ? cloud.listInventory() : local.listInventory();
}
export async function addInventoryItem(...args: Parameters<typeof local.addInventoryItem>) {
  return isCloudBackend() ? cloud.addInventoryItem(...args) : local.addInventoryItem(...args);
}
export async function updateInventoryItem(
  ...args: Parameters<typeof local.updateInventoryItem>
) {
  return isCloudBackend()
    ? cloud.updateInventoryItem(...args)
    : local.updateInventoryItem(...args);
}
export async function deleteInventoryItem(id: string) {
  return isCloudBackend() ? cloud.deleteInventoryItem(id) : local.deleteInventoryItem(id);
}
export async function findInventoryMatch(
  ...args: Parameters<typeof local.findInventoryMatch>
) {
  return isCloudBackend()
    ? cloud.findInventoryMatch(...args)
    : local.findInventoryMatch(...args);
}
export async function getDashboardStats() {
  return isCloudBackend() ? cloud.getDashboardStats() : local.getDashboardStats();
}
export async function getDailyReports() {
  return isCloudBackend() ? cloud.getDailyReports() : local.getDailyReports();
}
export async function resetSalesMoney(ownerPin: string) {
  return isCloudBackend()
    ? cloud.resetSalesMoney(ownerPin)
    : local.resetSalesMoney(ownerPin);
}
export async function factoryResetKeepClients(ownerPin: string) {
  return isCloudBackend()
    ? cloud.factoryResetKeepClients(ownerPin)
    : local.factoryResetKeepClients(ownerPin);
}
export async function wipeAllBusinessData(ownerPin: string) {
  return isCloudBackend()
    ? cloud.wipeAllBusinessData(ownerPin)
    : local.wipeAllBusinessData(ownerPin);
}
export async function getOwnerPhone() {
  return isCloudBackend() ? cloud.getOwnerPhone() : local.getOwnerPhone();
}
export async function setOwnerPhone(phone: string) {
  return isCloudBackend() ? cloud.setOwnerPhone(phone) : local.setOwnerPhone(phone);
}

// ---------------------------------------------------------------------------
// Universal Marketplace & Store Management Functions
// ---------------------------------------------------------------------------

export async function updateStoreProfile(
  ...args: Parameters<typeof local.updateStoreProfile>
) {
  return isCloudBackend()
    ? cloud.updateStoreProfile(...args)
    : local.updateStoreProfile(...args);
}

export async function createMarketplaceOrder(
  ...args: Parameters<typeof local.createMarketplaceOrder>
) {
  return isCloudBackend()
    ? cloud.createMarketplaceOrder(...args)
    : local.createMarketplaceOrder(...args);
}

export async function listMarketplaceOrders(
  ...args: Parameters<typeof local.listMarketplaceOrders>
) {
  return isCloudBackend()
    ? cloud.listMarketplaceOrders(...args)
    : local.listMarketplaceOrders(...args);
}

export async function getMarketplaceOrder(
  ...args: Parameters<typeof local.getMarketplaceOrder>
) {
  return isCloudBackend()
    ? cloud.getMarketplaceOrder(...args)
    : local.getMarketplaceOrder(...args);
}

export async function updateMarketplaceOrderStatus(
  ...args: Parameters<typeof local.updateMarketplaceOrderStatus>
) {
  return isCloudBackend()
    ? cloud.updateMarketplaceOrderStatus(...args)
    : local.updateMarketplaceOrderStatus(...args);
}

export async function listMarketplaceProducts(
  ...args: Parameters<typeof local.listMarketplaceProducts>
) {
  return isCloudBackend()
    ? cloud.listMarketplaceProducts(...args)
    : local.listMarketplaceProducts(...args);
}

export async function listMarketplaceStores(
  ...args: Parameters<typeof local.listMarketplaceStores>
) {
  return isCloudBackend()
    ? cloud.listMarketplaceStores(...args)
    : local.listMarketplaceStores(...args);
}

export type { DailyReport } from "@/db/cloudApi";
