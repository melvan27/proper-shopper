'use client'

import React, { useState } from "react"
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast, useColorMode, Divider } from "@chakra-ui/react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, AuthError } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/firebase"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { GoogleIcon } from "./GoogleIcon"
interface UserData {
  email: string
  displayName: string
  phoneNumber: string
  firstName: string
  lastName: string
  photoURL: string
  darkMode: boolean
  monthlyBudget: number
}

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [displayName, setDisplayName] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")

  const toast = useToast()
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const userData: UserData = {
        email,
        displayName,
        phoneNumber,
        firstName,
        lastName,
        photoURL: "",
        darkMode: colorMode === "dark",
        monthlyBudget: 0,
      }
      // Add this console.log to check if the user object is created correctly
      console.log("User created:", user.uid, userData)
      await setDoc(doc(db, "users", user.uid), userData)
      // Add this console.log to confirm the Firestore document was created
      console.log("Firestore document created for user:", user.uid)
      toast({
        title: "Account created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Error creating account",
        description: authError.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      console.log(user)
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) {
        const userData: UserData = {
          email: user.email || "",
          displayName: user.email ? user.email.split('@')[0] : "",
          phoneNumber: user.phoneNumber || "",
          firstName: user.displayName ? user.displayName.split(" ")[0] : "",
          lastName: user.displayName ? user.displayName.split(" ").slice(1).join(" ") : "",
          photoURL: user.photoURL || "",
          darkMode: colorMode === "dark",
          monthlyBudget: 0,
        }
        await setDoc(doc(db, "users", user.uid), userData)
        console.log("Firestore document created for Google user:", user.uid)
      }

      toast({
        title: "Signed up successfully with Google",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      router.push("/dashboard")
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Error signing up with Google",
        description: authError.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="form" onSubmit={handleSignUp} width="100%">
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Username</FormLabel>
          <Input value={displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Phone Number</FormLabel>
          <Input type="tel" value={phoneNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>First Name</FormLabel>
          <Input value={firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Last Name</FormLabel>
          <Input value={lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <Input type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} />
        </FormControl>
        <Button type="submit" colorScheme="green" width="100%">Sign Up</Button>
        <Divider />
        <Button 
          onClick={handleGoogleSignUp} 
          width="100%" 
          leftIcon={<GoogleIcon />}
        >
          Sign Up with Google
        </Button>
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === "light" ? "Dark" : "Light"} Mode
        </Button>
        <Text>
          Already have an account? <Button as={NextLink} href="/login" variant="link" colorScheme="blue">Log in here</Button>
        </Text>
      </VStack>
    </Box>
  )
}

export default Signup