// Compute media/image URL cleanly in both local development and production
const apiBase = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api')
const origin = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : ''

export const mediaUrl = (src) => {
  if (!src) return ''
  // Strip hardcoded localhost:5000 from image URLs saved in development
  if (/^https?:\/\/localhost:5000\//i.test(src)) {
    src = src.replace(/^https?:\/\/localhost:5000/i, '')
  }
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return origin ? `${origin}${src}` : src
  return src
}
