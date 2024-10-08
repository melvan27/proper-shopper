'use client'

import { Box, Button, Container, Heading, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import Navbar from "@/components/Navbar"

export default function LandingPage() {
  return (
    <Box>
      <Navbar isAuthenticated={false} />
      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="center" justify="center" minHeight="calc(100vh - 64px)">
          <Heading as="h2" size="2xl" textAlign="center">
            Simplify Your Shopping Experience
          </Heading>
          <Text fontSize="xl" textAlign="center">
            Create and manage multiple shopping lists, share with friends, and get live prices from local stores.
          </Text>
          <Button as={NextLink} href="/signup" size="lg" colorScheme="green">
            Get Started
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}