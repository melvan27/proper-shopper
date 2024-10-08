'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ShoppingList from '@/components/ShoppingList'
import Navbar from '@/components/Navbar'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { useRouter } from 'next/navigation'
import { Box } from '@chakra-ui/react'
import { doc, getDoc } from 'firebase/firestore'

const ListPage: React.FC = () => {
  const params = useParams()
  const listId = params.id as string
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
      <ShoppingList listId={listId} />
    </Box>
  )
}

export default ListPage