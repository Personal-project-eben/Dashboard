import { useState } from 'react'
import { updatePassword, type User } from '../api/client'

export function ProfilePage({ currentUser }: { currentUser: User }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await updatePassword(currentPassword, newPassword)
      setSuccess('Mot de passe mis à jour avec succès.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.')
    }
  }

  return (
    <div className="layout-content profile-page">
      <div className="page-header">
        <p className="page-surtitle">Mon compte</p>
        <h2>Profil</h2>
        <p>Gérez vos informations personnelles.</p>
      </div>

      <div style={{ maxWidth: '400px', marginTop: '2rem' }}>
        <h3>Informations</h3>
        <p style={{ margin: '1rem 0' }}><strong>Email :</strong> {currentUser?.email}</p>
        
        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Changer le mot de passe</h3>
        {error && <div className="error-alert" role="alert" aria-live="assertive">{error}</div>}
        {success && <div className="success-alert" role="alert" aria-live="assertive" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mot de passe actuel</label>
            <input
              id="currentPassword"
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nouveau mot de passe</label>
            <input
              id="newPassword"
              type="password"
              className="input-field"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="button primary-button" style={{ alignSelf: 'flex-start' }}>
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  )
}
