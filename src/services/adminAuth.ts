// 管理员认证服务

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'kimiclaw1';
const AUTH_KEY = 'admin_authenticated';

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
}

/**
 * 管理员登录
 */
export function loginAdmin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

/**
 * 检查是否已登录
 */
export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

/**
 * 管理员登出
 */
export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * 修改管理员密码
 */
export function changeAdminPassword(oldPassword: string, _newPassword: string): boolean {
  if (oldPassword === ADMIN_PASSWORD) {
    // 实际应用中应该更新服务器端的密码
    // 这里仅做演示
    return true;
  }
  return false;
}
