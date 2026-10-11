import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Vérifier si déjà en mode autonome (PWA installée)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)

    if (isStandalone) {
      setIsInstalled(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowInstructions(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (isInstalled) {
    return null
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      setShowInstructions(true)
    }
  }

  return (
    <div className="install-app-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="install-app-btn"
        onClick={handleInstallClick}
        title="Installer Orbit comme application sur votre appareil"
      >
        <span className="install-icon">📲</span>
        <span>Installer l'app</span>
      </button>

      {showInstructions && (
        <div className="install-instructions-popover">
          <div className="install-instructions-header">
            <strong>Installer Orbit</strong>
            <button
              type="button"
              className="close-popover-btn"
              onClick={() => setShowInstructions(false)}
            >
              ✕
            </button>
          </div>
          <p>
            Pour installer l'application sur cet appareil :
          </p>
          <ul>
            <li>
              <strong>Chrome / Edge :</strong> Cliquez sur l'icône d'installation 📥 située dans la barre d'adresse.
            </li>
            <li>
              <strong>Sur mobile (iOS) :</strong> Appuyez sur le bouton Partager ⎋ puis sélectionnez <em>« Sur l'écran d'accueil »</em>.
            </li>
            <li>
              <strong>Sur Android :</strong> Menu ⋮ &gt; <em>« Installer l'application »</em> ou <em>« Ajouter à l'écran d'accueil »</em>.
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
