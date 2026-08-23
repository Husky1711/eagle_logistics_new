import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UnsavedChangesContext = createContext(null)

export function UnsavedChangesProvider({ children }) {
  const [dirty, setDirty] = useState(false)

  const setHasUnsavedChanges = useCallback((value) => {
    setDirty(Boolean(value))
  }, [])

  const confirmLeave = useCallback(() => {
    if (!dirty) return true
    return window.confirm('You have unsaved changes. Leave this page without saving?')
  }, [dirty])

  const value = useMemo(
    () => ({
      hasUnsavedChanges: dirty,
      setHasUnsavedChanges,
      confirmLeave,
    }),
    [dirty, setHasUnsavedChanges, confirmLeave],
  )

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider')
  }
  return context
}
