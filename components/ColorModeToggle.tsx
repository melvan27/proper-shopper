'use client'

import { Button, useColorMode } from "@chakra-ui/react"

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Button onClick={toggleColorMode}>
      {colorMode === "light" ? "Dark" : "Light"} Mode
    </Button>
  )
}