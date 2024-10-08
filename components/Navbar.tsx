import React from 'react'
import {
  Box,
  Flex,
  Heading,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  useColorModeValue,
  Avatar,
  HStack,
  Container,
} from '@chakra-ui/react'
import { ChevronDownIcon, MoonIcon, SettingsIcon, SunIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase'

interface NavbarProps {
  isAuthenticated: boolean
  user?: {
    displayName: string
    photoURL: string
  }
  handleLogout?: () => Promise<void>
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, user, handleLogout }) => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode()
  const router = useRouter()
  const bgColor = useColorModeValue('green.500', 'green.800')
  const buttonColor = useColorModeValue('green.300', 'green.200')
  const buttonColor2 = useColorModeValue('whiteAlpha', 'green')
  const textColor = useColorModeValue('white', 'gray.800')

  const onLogout = () => {
    if (handleLogout) {
      handleLogout()
    } else {
      router.push('/logout')
    }
  }

  const handleColorModeChange = async (newMode: 'light' | 'dark' | 'system') => {
    setColorMode(newMode)
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          darkMode: newMode === 'dark'
        })
      } catch (error) {
        console.error('Error updating darkMode preference:', error)
      }
    }
  }

  return (
    <Box bg={bgColor} px={4} position="fixed" width="full" zIndex="sticky" top={0}>
      <Container maxW="container.xl">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>          
          <HStack spacing={8} alignItems={'center'}>
            <Link href={isAuthenticated ? "/dashboard" : "/"} passHref>
              <Heading as="h1" size="lg" cursor="pointer" color="white">
                Proper Shopper
              </Heading>
            </Link>
          </HStack>

          <Flex alignItems={'center'} justifyContent={'flex-end'}>
            {isAuthenticated ? (
              <>
                <Avatar 
                  size={'sm'} 
                  src={user?.photoURL} 
                  mr={2}
                />
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Color mode"
                    icon={colorMode === 'light' ? <SunIcon /> : <MoonIcon />}
                    variant="outline"
                    color={buttonColor}
                    borderColor={buttonColor}
                    _hover={{ bg: 'green.600' }}
                    mr={2}
                  />
                  <MenuList>
                    <MenuItem onClick={() => handleColorModeChange('light')}>Light Mode</MenuItem>
                    <MenuItem onClick={() => handleColorModeChange('dark')}>Dark Mode</MenuItem>
                    <MenuItem onClick={() => handleColorModeChange('system')}>System</MenuItem>
                  </MenuList>
                </Menu>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Settings"
                    icon={<SettingsIcon />}
                    variant="outline"
                    color={buttonColor}
                    borderColor={buttonColor}
                    _hover={{ bg: 'green.600' }}
                  >
                    Settings
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
                    <MenuItem onClick={() => router.push('/settings')}>Settings</MenuItem>
                    <MenuItem onClick={onLogout}>Log Out</MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Button onClick={() => router.push('/login')} colorScheme={buttonColor2} textColor={textColor} mr={4}>
                  Log In
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Color mode"
                    icon={colorMode === 'light' ? <SunIcon /> : <MoonIcon />}
                    variant="outline"
                    color={buttonColor}
                    borderColor={buttonColor}
                    _hover={{ bg: 'green.600' }}
                  />
                  <MenuList>
                    <MenuItem onClick={() => handleColorModeChange('light')}>Light Mode</MenuItem>
                    <MenuItem onClick={() => handleColorModeChange('dark')}>Dark Mode</MenuItem>
                    <MenuItem onClick={() => handleColorModeChange('system')}>System</MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Navbar