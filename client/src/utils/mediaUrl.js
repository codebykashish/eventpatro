// Compute media/image URL cleanly in both local development and production
const apiBase = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api')
const origin = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : ''

export const mediaUrl = (src) => {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return origin ? `${origin}${src}` : src
  return src
}
