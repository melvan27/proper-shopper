import { Container, Heading, VStack } from "@chakra-ui/react"
import Signup from "@/components/Signup"

export default function SignupPage() {
  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Sign Up for Proper Shopper</Heading>
        <Signup />
      </VStack>
    </Container>
  )
}