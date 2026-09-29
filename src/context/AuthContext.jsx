import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('valdora_auth_token') || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)

  // Verifikasi token saat inisialisasi aplikasi
  useEffect(() => {
    async function verifyExistingSession() {
      const savedToken = localStorage.getItem('valdora_auth_token')
      if (!savedToken) {
        setIsVerifying(false)
        return
      }

      try {
        const response = await fetch('/api/player/me', {
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.profile) {
            setUser(data.profile)
            setToken(savedToken)
          } else {
            logout()
          }
        } else {
          logout()
        }
      } catch (err) {
        console.warn('Gagal memverifikasi sesi petualang:', err)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyExistingSession()
  }, [])

  // Fungsi Login
  const login = async (username, password) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('valdora_auth_token', data.token)
        setToken(data.token)
        setUser(data.profile)
        setLoginModalOpen(false)
        return { success: true }
      } else {
        return {
          success: false,
          message: data.message || 'Login gagal. Periksa kembali username dan password.'
        }
      }
    } catch (err) {
      return {
        success: false,
        message: 'Koneksi ke server auth Valdora terputus. Silakan coba beberapa saat lagi.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi Logout
  const logout = () => {
    localStorage.removeItem('valdora_auth_token')
    setToken(null)
    setUser(null)
    setDashboardOpen(false)
  }

  const openLoginModal = () => setLoginModalOpen(true)
  const closeLoginModal = () => setLoginModalOpen(false)

  const openDashboard = () => setDashboardOpen(true)
  const closeDashboard = () => setDashboardOpen(false)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: Boolean(user),
        isLoading,
        isVerifying,
        loginModalOpen,
        dashboardOpen,
        login,
        logout,
        openLoginModal,
        closeLoginModal,
        openDashboard,
        closeDashboard
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }
  return context
}
