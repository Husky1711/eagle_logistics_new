import { useEffect } from 'react'
import { useUnsavedChanges } from '../context/UnsavedChangesContext'

/**
 * Warn on tab close/refresh and register dirty state for in-app nav guards.
 */
export default function useUnsavedChangesGuard(isDirty) {
  const { setHasUnsavedChanges } = useUnsavedChanges()

  useEffect(() => {
    setHasUnsavedChanges(isDirty)
    return () => setHasUnsavedChanges(false)
  }, [isDirty, setHasUnsavedChanges])

  useEffect(() => {
    if (!isDirty) return undefined

    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])
}
