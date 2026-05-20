import { useState, useEffect } from 'react'

// Detecta si la app puede instalarse como PWA
// y expone el prompt de instalación
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [isIOS,         setIsIOS]         = useState(false)

  useEffect(() => {
    // Detectar iOS (Safari no dispara beforeinstallprompt)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Detectar si ya está instalada (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsInstalled(standalone)

    // Capturar el prompt de instalación (Chrome/Android)
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
  }

  const canInstall = !isInstalled && (!!installPrompt || isIOS)

  return { canInstall, isInstalled, isIOS, install }
}
