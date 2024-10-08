'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box,
  Heading,
  Spinner,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Flex,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  FormControl,
  FormLabel,
  Select,
  Container,
} from '@chakra-ui/react'
import { AddIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { MdIosShare } from "react-icons/md"
import { useRouter } from 'next/navigation'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import ShoppingListItem from './ShoppingListItem'

interface ListItem {
  id: string
  name: string
  purchased: boolean
  price?: number
  store?: string
  amount: number
  purchaseDate?: Timestamp
}

interface ShoppingList {
  id: string
  name: string
  items: ListItem[]
  owner: string
  editors: string[]
  viewers: string[]
}

interface User {
  id: string
  displayName: string
  photoURL: string
  color: string
  cursor?: { x: number; y: number }
}

const ShoppingList: React.FC<{ listId: string }> = ({ listId }) => {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({})
  const [nameInputs, setNameInputs] = useState<{ [key: string]: string }>({})
  const [storeInputs, setStoreInputs] = useState<{ [key: string]: string }>({})
  const [amountInputs, setAmountInputs] = useState<{ [key: string]: string }>({})
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userPermission, setUserPermission] = useState<'owner' | 'editor' | 'viewer' | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const router = useRouter()

  const fetchUserData = useCallback(async (currentUser: any) => {
    try {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setUser(userData)
        } else {
          console.warn('No user data found for UID:', currentUser.uid)
        }
      } else {
        setUser(null)
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user data or lists:', error)
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out: ', error)
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      fetchUserData(currentUser)
    })

    return () => {
      unsubscribeAuth()
    }
  }, [fetchUserData])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'shoppingLists', listId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as ShoppingList
        setList(data)
        
        const initialNames: { [key: string]: string } = {}
        const initialStores: { [key: string]: string } = {}
        const initialAmounts: { [key: string]: string } = {}
        const initialPrices: { [key: string]: string } = {}
        data.items.forEach(item => {
          initialNames[item.id] = item.name
          initialStores[item.id] = item.store || ''
          initialAmounts[item.id] = item.amount.toString()
          initialPrices[item.id] = item.price?.toFixed(2) || ''
        })
        setNameInputs(initialNames)
        setStoreInputs(initialStores)
        setAmountInputs(initialAmounts)
        setPriceInputs(initialPrices)

        const userId = auth.currentUser?.uid
        if (userId) {
          if (data.owner === userId) {
            setUserPermission('owner')
          } else if (data.editors.includes(userId)) {
            setUserPermission('editor')
          } else if (data.viewers.includes(userId)) {
            setUserPermission('viewer')
          } else {
            setUserPermission(null)
          }
        }
        setLoading(false)
      } else {
        toast({
          title: 'List not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        router.push('/dashboard')
      }
    })

    return () => unsubscribe()
  }, [listId, router, toast])

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus()
    }
  }, [editingTitle])

  const updateListTitle = async (newTitle: string) => {
    if (!list) return
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { name: newTitle, updatedAt: serverTimestamp() })
    } catch (error) {
      console.error('Error updating list title:', error)
      toast({
        title: 'Failed to update list title',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const addItem = async () => {
    if (!list || !newItemName.trim()) return
    const newItem: ListItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      purchased: false,
      amount: 1,
    }
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: arrayUnion(newItem),
        updatedAt: serverTimestamp()
      })
      setNewItemName('')
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: 'Failed to add item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const updateItem = async (itemId: string, updates: Partial<ListItem>) => {
    if (!list) return
    const updatedItems = list.items.map(item => {
      if (item.id === itemId) {
        if ('purchased' in updates) {
          if (updates.purchased && !item.purchaseDate) {
            return { ...item, ...updates, purchaseDate: Timestamp.now() }
          } else if (!updates.purchased) {
            const { purchaseDate, ...rest } = { ...item, ...updates }
            return rest
          }
        }
        return { ...item, ...updates }
      }
      return item
    })
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { items: updatedItems, updatedAt: serverTimestamp() })
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: 'Failed to update item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const removeItem = async (itemId: string) => {
    if (!list) return
    const itemToRemove = list.items.find(item => item.id === itemId)
    if (!itemToRemove) return
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), {
        items: arrayRemove(itemToRemove),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error removing item:', error)
      toast({
        title: 'Failed to remove item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const shareList = async (email: string, permission: 'editor' | 'viewer') => {
    if (!list) return
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)
  
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userId = userDoc.id
        const updateField = permission === 'editor' ? 'editors' : 'viewers'
        await updateDoc(doc(db, 'shoppingLists', listId), {
          [updateField]: arrayUnion(userId),
          updatedAt: serverTimestamp()
        })
        toast({
          title: 'List shared successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'User not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error sharing list:', error)
      toast({
        title: 'Failed to share list',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const calculateTotalPrice = (): number => {
    if (!list) return 0
    return list.items.reduce((total, item) => total + ((item.price || 0) * item.amount), 0)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    )
  }

  if (userPermission === null) {
    return (
      <Box>
        <Container maxW="container.xl" pt="70px">
          <Box p={5}>
            <Text>You do not have permission to view this list.</Text>
            <Button onClick={() => router.push('/dashboard')} mt={4}>Return to Dashboard</Button>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box>
      <Container maxW="container.xl" pt="70px">
        <Box p={5}>
          <Flex justifyContent="space-between" alignItems="center" mb={5}>
            {editingTitle ? (
              <Input
                ref={titleRef}
                value={list?.name || ''}
                onChange={(e) => updateListTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setEditingTitle(false)
                  }
                }}
              />
            ) : (
              <Heading
                size="lg"
                onClick={() => userPermission !== 'viewer' && setEditingTitle(true)}
                cursor={userPermission !== 'viewer' ? 'pointer' : 'default'}
              >
                {list?.name || 'Untitled List'}
              </Heading>
            )}
            {userPermission === 'owner' && (
              <Popover>
                <PopoverTrigger>
                  <IconButton aria-label="Share list" icon={<MdIosShare />} />
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader>Share List</PopoverHeader>
                  <PopoverBody>
                    <FormControl>
                      <FormLabel>Email address</FormLabel>
                      <Input type="email" id="share-email" />
                    </FormControl>
                    <FormControl mt={4}>
                      <FormLabel>Permission</FormLabel>
                      <Select id="share-permission">
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </Select>
                    </FormControl>
                  </PopoverBody>
                  <PopoverFooter>
                    <Button colorScheme="blue" onClick={() => {
                      const email = (document.getElementById('share-email') as HTMLInputElement).value
                      const permission = (document.getElementById('share-permission') as HTMLSelectElement).value as 'editor' | 'viewer'
                      shareList(email, permission)
                    }}>Share</Button>
                  </PopoverFooter>
                </PopoverContent>
              </Popover>
            )}
          </Flex>
          <VStack spacing={4} align="stretch">
            {list?.items.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                userPermission={userPermission}
                onUpdate={updateItem}
                onRemove={removeItem}
                nameInput={nameInputs[item.id] || ''}
                storeInput={storeInputs[item.id] || ''}
                priceInput={priceInputs[item.id] || ''}
                amountInput={amountInputs[item.id] || ''}
                onNameChange={(value) => setNameInputs(prev => ({ ...prev, [item.id]: value }))}
                onStoreChange={(value) => setStoreInputs(prev => ({ ...prev, [item.id]: value }))}
                onPriceChange={(value) => setPriceInputs(prev => ({ ...prev, [item.id]: value }))}
                onAmountChange={(value) => setAmountInputs(prev => ({ ...prev, [item.id]: value }))}
                onNameBlur={() => updateItem(item.id, { name: nameInputs[item.id] })}
                onStoreBlur={() => updateItem(item.id, { store: storeInputs[item.id] })}
                onPriceBlur={() => updateItem(item.id, { price: parseFloat(priceInputs[item.id]) || 0 })}
                onAmountBlur={() => updateItem(item.id, { amount: parseInt(amountInputs[item.id]) || 1 })}
              />
            ))}
            {userPermission !== 'viewer' && (
              <HStack>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={list?.items.length === 0 ? 'Add to list' : 'Add another item'}
                  size={['sm', 'md']}
                />
                <Button onClick={addItem} leftIcon={<AddIcon />} size={['sm', 'md']} p={[2, 4]}>
                  Add
                </Button>
              </HStack>
            )}
            <Flex justifyContent="flex-end" mt={4}>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                Total: ${calculateTotalPrice().toFixed(2)}
              </Text>
            </Flex>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default ShoppingList