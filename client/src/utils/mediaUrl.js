const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const origin = apiBase.replace(/\/api\/?$/, '')

export const mediaUrl = (src) => {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return `${origin}${src}`
  return src
}
