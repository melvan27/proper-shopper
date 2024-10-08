'use client'

import React, { useState, useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import Navbar from '@/components/Navbar'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { useRouter } from 'next/navigation'
import { Box } from '@chakra-ui/react'
import { doc, getDoc } from 'firebase/firestore'

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<{ displayName: string; photoURL: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUser({
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || '',
          })
        }
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Box>
      <Navbar 
        isAuthenticated={!!user} 
        user={user || undefined} 
        handleLogout={handleLogout}
      />
      <Dashboard />
    </Box>
  )
}

export default DashboardPage