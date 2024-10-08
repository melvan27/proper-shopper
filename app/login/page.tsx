import { Container, Heading, VStack, Button, useColorMode } from "@chakra-ui/react"
import Login from "@/components/Login"

export default function LoginPage() {
  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Log In to Proper Shopper</Heading>
        <Login />
      </VStack>
    </Container>
  )
}