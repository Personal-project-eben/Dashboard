import { useEffect, useState } from 'react'
import { getAdminUsers, deleteAdminUser, toggleAdminRole, confirmAdminUser, type AdminUser, type User } from '../api/client'

export function AdminPage({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await getAdminUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return
    }

    try {
      await deleteAdminUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression")
    }
  }

  async function handleToggleRole(id: string, currentIsAdmin: boolean) {
    try {
      const updatedUser = await toggleAdminRole(id, !currentIsAdmin)
      setUsers(users.map(u => u.id === id ? { ...u, isAdmin: updatedUser.isAdmin } : u))
    } catch (err: any) {
      alert(err.message || "Erreur lors du changement de rôle")
    }
  }

  async function handleConfirm(id: string) {
    try {
      const updatedUser = await confirmAdminUser(id)
      setUsers(users.map(u => u.id === id ? { ...u, confirmed: updatedUser.confirmed } : u))
    } catch (err: any) {
      alert(err.message || "Erreur lors de la confirmation")
    }
  }

  if (loading) {
    return (
      <div className="layout-content">
        <div className="page-header">
          <h2>Administration</h2>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="layout-content admin-page">
      <div className="page-header">
        <p className="page-surtitle">Gérer les accès</p>
        <h2>Administration</h2>
        <p>Gérez les rôles et les utilisateurs de la plateforme.</p>
      </div>

      {error && <div className="error-alert" role="alert" aria-live="assertive">{error}</div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Statut</th>
              <th>Rôle</th>
              <th>Inscription</th>
              <th>Widgets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="user-email">
                  {user.email}
                  {currentUser?.id === user.id && <span className="status-badge" style={{ marginLeft: '8px' }}>Vous</span>}
                </td>
                <td>
                  {user.confirmed ? (
                    <span className="status-badge success">Confirmé</span>
                  ) : (
                    <span className="status-badge warning">En attente</span>
                  )}
                </td>
                <td>
                  {user.isAdmin ? (
                    <span className="status-badge">Admin</span>
                  ) : (
                    <span className="status-badge outline">Utilisateur</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user._count.widgets}</td>
                <td>
                  <div className="admin-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!user.confirmed && (
                      <button 
                        className="button secondary-button" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => handleConfirm(user.id)}
                      >
                        Confirmer
                      </button>
                    )}
                    
                    {currentUser?.id !== user.id && (
                      <button 
                        className="button secondary-button" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => handleToggleRole(user.id, user.isAdmin)}
                      >
                        {user.isAdmin ? 'Retirer Admin' : 'Rendre Admin'}
                      </button>
                    )}
                    
                    {currentUser?.id !== user.id && (
                      <button
                        className="danger-button-text"
                        onClick={() => handleDelete(user.id)}
                        aria-label={`Supprimer l'utilisateur ${user.email}`}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
