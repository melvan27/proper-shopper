'use client'

import React, { useState } from "react"
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast, useColorMode, Divider } from "@chakra-ui/react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, AuthError } from "firebase/auth"
import { auth } from "@/firebase"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { GoogleIcon } from "./GoogleIcon"

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")

  const toast = useToast()
  const router = useRouter()
  const { colorMode, toggleColorMode } = useColorMode()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Logged in successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      router.push("/dashboard")
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Error logging in",
        description: authError.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      toast({
        title: "Logged in successfully with Google",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      router.push("/dashboard")
    } catch (error) {
      const authError = error as AuthError
      toast({
        title: "Error logging in with Google",
        description: authError.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="form" onSubmit={handleLogin} width="100%">
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Email or Username</FormLabel>
          <Input value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
        </FormControl>
        <Button type="submit" colorScheme="green" width="100%">Log In</Button>
        <Divider />
        <Button onClick={handleGoogleLogin} width="100%" leftIcon={<GoogleIcon />}>Log In with Google</Button>
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === "light" ? "Dark" : "Light"} Mode
        </Button>
        <Text>
          Don't have an account? <Button as={NextLink} href="/signup" variant="link" colorScheme="blue">Sign up here</Button>
        </Text>
      </VStack>
    </Box>
  )
}

export default Login