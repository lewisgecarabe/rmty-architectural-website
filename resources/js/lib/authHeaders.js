/** Auth header for admin API requests (Bearer token from login) */
export function getAuthHeaders() {
  const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
