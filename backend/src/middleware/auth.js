import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'strelok-secret-key'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Не авторизован' })
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Невалидный или просроченный токен' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён: требуется роль admin' })
  }
  next()
}

export { JWT_SECRET }
