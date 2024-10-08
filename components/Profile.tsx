'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  useToast,
  Spinner,
  HStack,
} from '@chakra-ui/react'
import { auth, db } from '@/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

interface UserProfile {
  displayName: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  photoURL: string
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
  })
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile
            setProfile({
              displayName: userData.displayName || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phoneNumber: userData.phoneNumber || '',
              photoURL: userData.photoURL || '',
              email: userData.email || '',
            })
          } else {
            // If no user data exists, initialize with empty fields
            setProfile({
              displayName: '',
              firstName: '',
              lastName: '',
              phoneNumber: '',
              photoURL: '',
              email: '',
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          toast({
            title: 'Error',
            description: 'Failed to load profile.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!user) return
    setUpdating(true)
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      })
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    )
  }

  return (
    <Box p={5}>
      <Heading mb={6}>Profile</Heading>
      <VStack spacing={4} align="stretch" maxW="400px" mx="auto">
        <HStack spacing={4}>
          <Avatar size="xl" src={profile.photoURL || undefined} name={profile.displayName} />
          <Button onClick={() => setProfile((prev) => ({ ...prev, photoURL: '' }))} colorScheme="green">
            Remove Photo
          </Button>
        </HStack>
        <FormControl id="displayName" isRequired>
          <FormLabel>Display Name</FormLabel>
          <Input
            name="displayName"
            value={profile.displayName}
            onChange={handleChange}
            placeholder="Enter your display name"
          />
        </FormControl>
        <FormControl id="firstName" isRequired>
          <FormLabel>First Name</FormLabel>
          <Input
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
          />
        </FormControl>
        <FormControl id="lastName">
          <FormLabel>Last Name</FormLabel>
          <Input
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
          />
        </FormControl>
        <FormControl id="email" isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="Enter your email"
            type="email"
          />
        </FormControl>
        <FormControl id="phoneNumber">
          <FormLabel>Phone Number</FormLabel>
          <Input
            name="phoneNumber"
            value={profile.phoneNumber}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />
        </FormControl>
        <FormControl id="photoURL">
          <FormLabel>Photo URL</FormLabel>
          <Input
            name="photoURL"
            value={profile.photoURL}
            onChange={handleChange}
            placeholder="Enter your photo URL"
          />
        </FormControl>
        <Button
          colorScheme="green"
          onClick={handleSubmit}
          isLoading={updating}
          loadingText="Updating"
        >
          Save Changes
        </Button>
      </VStack>
    </Box>
  )
}

export default Profile