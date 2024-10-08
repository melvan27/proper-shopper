'use client'

import React, { useState, useEffect } from 'react'
import Profile from '@/components/Profile'
import Navbar from '@/components/Navbar'
import { Box } from '@chakra-ui/react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useRouter } from 'next/navigation'

const ProfilePage: React.FC = () => {
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
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out: ', error)
    }
  }

  return (
    <Box>
      <Navbar 
        isAuthenticated={!!user} 
        user={user || undefined}
        handleLogout={handleLogout}
      />
      <Profile />
    </Box>
  )
}

export default ProfilePage