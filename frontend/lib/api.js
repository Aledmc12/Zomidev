const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/public/portfolio',
  '/public/services',
  '/public/about',
  '/public/team',
  '/public/contact-info',
  '/public/contact',
])

function isPublicPath(path) {
  if (PUBLIC_PATHS.has(path)) return true
  return path.startsWith('/public/portfolio/')
}

function shouldRedirectToLogin() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return !['/login', '/olvide-contrasena', '/recuperar-contrasena'].some((p) => path.startsWith(p))
}

async function parseErrorResponse(res) {
  try {
    const data = await res.json()
    const detail = data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg || item?.message || String(item)).join(', ')
    }
    return data?.message || `Error ${res.status}`
  } catch {
    return `Error ${res.status}`
  }
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function request(path, options = {}) {
  const { skipAuth = false, suppressAuthRedirect = false, ...fetchOptions } = options
  const isPublic = skipAuth || isPublicPath(path)

  let res
  try {
    res = await fetch(`/api/v1${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
      },
      ...fetchOptions,
    })
  } catch {
    throw {
      status: 0,
      detail: 'No se pudo conectar con la API. Verifica que el backend este activo.',
    }
  }

  if (res.status === 401 && !isPublic && path !== '/auth/refresh' && !suppressAuthRedirect) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      if (refreshRes.ok) {
        const retry = await fetch(`/api/v1${path}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        })
        if (!retry.ok) throw { status: retry.status, detail: await parseErrorResponse(retry) }
        return retry.status === 204 ? null : retry.json()
      }
    } catch {
      // fall through
    }
    if (typeof window !== 'undefined' && shouldRedirectToLogin()) {
      window.location.href = '/login?session_expired=true'
    }
    throw { status: 401, detail: 'Sesion expirada' }
  }

  if (!res.ok) {
    throw { status: res.status, detail: await parseErrorResponse(res) }
  }
  return res.status === 204 ? null : res.json()
}

async function uploadRequest(path, formData) {
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    body: formData,
  })
  if (!res.ok) {
    throw { status: res.status, detail: await parseErrorResponse(res) }
  }
  return res.json()
}

export function entregableDownloadUrl(id) {
  return `/api/v1/portal/entregables/${id}/download`
}

export async function downloadEntregable(id, filename) {
  const res = await fetch(entregableDownloadUrl(id), {
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!res.ok) {
    throw { status: res.status, detail: await parseErrorResponse(res) }
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'entregable'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  auth: {
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    refresh: () => request('/auth/refresh', { method: 'POST', skipAuth: true }),
    me: () => request('/auth/me', { suppressAuthRedirect: true }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
    resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  },
  public: {
    portfolio: (featured = false) => request(`/public/portfolio${buildQuery({ featured })}`, { skipAuth: true }),
    portfolioItem: (slug) => request(`/public/portfolio/${slug}`, { skipAuth: true }),
    services: () => request('/public/services', { skipAuth: true }),
    about: () => request('/public/about', { skipAuth: true }),
    team: () => request('/public/team', { skipAuth: true }),
    contactInfo: () => request('/public/contact-info', { skipAuth: true }),
    contact: (data) => request('/public/contact', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  },
  portal: {
    dashboard: () => request('/portal/dashboard'),
    projects: () => request('/portal/projects'),
    project: (id) => request(`/portal/projects/${id}`),
    messages: (projectId) => request(`/portal/messages${buildQuery({ project_id: projectId })}`),
    sendMessage: (data) => request('/portal/messages', { method: 'POST', body: JSON.stringify(data) }),
    notifications: () => request('/portal/notifications'),
    markNotificationRead: (id) => request(`/portal/notifications/${id}/read`, { method: 'PATCH' }),
    downloadEntregable,
  },
  admin: {
    stats: () => request('/admin/stats'),
    clients: () => request('/admin/clients'),
    createClient: (data) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
    projects: () => request('/admin/projects'),
    project: (id) => request(`/admin/projects/${id}`),
    createProject: (data) => request('/admin/projects', { method: 'POST', body: JSON.stringify(data) }),
    updateProject: (id, data) => request(`/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    createHito: (projectId, data) => request(`/admin/projects/${projectId}/hitos`, { method: 'POST', body: JSON.stringify(data) }),
    updateHito: (hitoId, data) => request(`/admin/hitos/${hitoId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteHito: (hitoId) => request(`/admin/hitos/${hitoId}`, { method: 'DELETE' }),
    createBitacora: (projectId, data) => request(`/admin/projects/${projectId}/bitacoras`, { method: 'POST', body: JSON.stringify(data) }),
    createEntregable: (projectId, data) => request(`/admin/projects/${projectId}/entregables`, { method: 'POST', body: JSON.stringify(data) }),
    uploadEntregable: (projectId, formData) => uploadRequest(`/admin/projects/${projectId}/entregables/upload`, formData),
    createPreview: (projectId, data) => request(`/admin/projects/${projectId}/previews`, { method: 'POST', body: JSON.stringify(data) }),
  },
}
