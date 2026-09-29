import React, { createContext, useContext, useState, useEffect } from 'react'

const RouterContext = createContext({
  currentPath: '/',
  navigate: () => {}
})

function normalizePath(path) {
  if (!path) return '/'
  const clean = path.split('?')[0].split('#')[0].toLowerCase()
  const trimmed = clean.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (toPath) => {
    const target = normalizePath(toPath)
    if (target !== currentPath) {
      window.history.pushState({}, '', target)
      setCurrentPath(target)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}

export function Link({ href, className = '', children, onClick, ...props }) {
  const { currentPath, navigate } = useRouter()
  const targetPath = normalizePath(href)
  const isActive = currentPath === targetPath

  const handleClick = (e) => {
    if (onClick) onClick(e)
    if (!e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      navigate(href)
    }
  }

  return (
    <a
      href={href}
      className={`${className} ${isActive ? 'active' : ''}`.trim()}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}
