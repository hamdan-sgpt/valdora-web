import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'
import { 
  IconSpark, 
  IconClose, 
  IconAlert, 
  IconUser, 
  IconKey, 
  IconShield 
} from './Icons'

export default function AuthModal() {
  const { loginModalOpen, closeLoginModal, login, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Reset form saat modal dibuka/tutup
  useEffect(() => {
    if (loginModalOpen) {
      setErrorMessage('')
    }
  }, [loginModalOpen])

  // Menutup dengan tombol ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && loginModalOpen) {
        closeLoginModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loginModalOpen, closeLoginModal])

  if (!loginModalOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.')
      return
    }

    const res = await login(username.trim(), password)
    if (!res.success) {
      setErrorMessage(res.message)
    }
  }


  return (
    <div className="auth-overlay" onClick={closeLoginModal}>
      <div
        className="auth-modal-chassis"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Sudut Dekoratif RPG Plaque */}
        <div className="plaque-corner corner-tl"></div>
        <div className="plaque-corner corner-tr"></div>
        <div className="plaque-corner corner-bl"></div>
        <div className="plaque-corner corner-br"></div>

        {/* Header Modal */}
        <div className="auth-modal-header">
          <div className="auth-header-tag">
            <span className="auth-rune"><IconSpark size={12} /></span> LOGIN AKUN VALDORA <span className="auth-rune"><IconSpark size={12} /></span>
          </div>
          <h2 id="auth-modal-title" className="auth-modal-title">Masuk ke Akun</h2>
          <p className="auth-modal-subtitle">
            Gunakan akun in-game yang telah kamu daftarkan saat mengetik <code>/register</code> atau <code>/login</code> di server.
          </p>
          <button
            type="button"
            className="auth-close-btn"
            onClick={closeLoginModal}
            aria-label="Tutup modal login"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="auth-alert-box error" role="alert">
            <span className="alert-icon"><IconAlert size={16} /></span>
            <div className="alert-content">{errorMessage}</div>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username" className="form-label">
              Username Minecraft (IGN)
            </label>
            <div className="input-wrapper">
              <span className="input-icon"><IconUser size={16} /></span>
              <input
                id="auth-username"
                type="text"
                className="auth-input"
                placeholder="Contoh: Hamdun_ham"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">
              Password In-Game
            </label>
            <div className="input-wrapper">
              <span className="input-icon"><IconKey size={16} /></span>
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="Password /login kamu di server"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <span className="form-hint">
              <IconShield size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
              Keamanan: Password kamu diverifikasi secara terenkripsi (BCrypt) dan tidak disimpan dalam teks biasa.
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="auth-actions">
            <button
              type="button"
              className="auth-btn btn-cancel"
              onClick={closeLoginModal}
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="auth-btn btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-state">
                  <span className="medieval-spinner"></span> Menghubungkan...
                </span>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </div>
        </form>

        {/* Footer Info */}
        <div className="auth-modal-footer">
          <p>
            Belum punya akun? Buka Minecraft, sambungkan ke <code>play.valdora.my.id</code> dan ketik <code>/register &lt;password&gt; &lt;password&gt;</code> di dalam game.
          </p>
        </div>
      </div>
    </div>
  )
}
