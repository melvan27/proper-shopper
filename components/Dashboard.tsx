'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  InputGroup,
  InputLeftElement,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Container,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Divider,
} from '@chakra-ui/react'
import { SearchIcon, AddIcon, DeleteIcon, SettingsIcon } from '@chakra-ui/icons'
import { MdMoreVert } from "react-icons/md"
import { IoPeopleCircleOutline } from "react-icons/io5"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, updateDoc, deleteDoc, Timestamp, QuerySnapshot, serverTimestamp, getDocs } from 'firebase/firestore'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { useRouter } from 'next/navigation'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)


interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  monthlyBudget: number;
  monthlyBudgets: { [key: string]: number };
}

interface ShoppingListItem {
  id: string;
  name: string;
  purchased: boolean;
  price?: number;
  store?: string;
  amount: number;
  purchaseDate?: Timestamp;
}

interface ShoppingList {
  id: string;
  name: string;
  description: string;
  items: ShoppingListItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  owner: string;
  editors: string[];
  viewers: string[];
  pinned: boolean;
  role?: 'owner' | 'editor' | 'viewer'; // Optional: track user's role
}

const Dashboard: React.FC = () => {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [newBudget, setNewBudget] = useState('')
  const initialFocusRef = useRef(null)
  const [monthlySpending, setMonthlySpending] = useState(0)
  const [yearlySpending, setYearlySpending] = useState(0)
  const [monthlyBudgets, setMonthlyBudgets] = useState<{ [key: string]: number }>({})
  const [spendingData, setSpendingData] = useState<{ labels: string[], datasets: any[] }>({
    labels: [],
    datasets: []
  })
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure()
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure()
  const toast = useToast()
  const router = useRouter()

  const fetchUserData = useCallback((currentUser: any) => {
    if (!currentUser) {
      setLists([])
      setUser(null)
      router.push('/login')
      return
    }

    const userDocRef = doc(db, 'users', currentUser.uid)
    onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'uid'>
        setUser({ uid: userDoc.id, ...userData })

        // Set monthly budgets
        setMonthlyBudgets(userData.monthlyBudgets || {})
      } else {
        console.warn('No user data found for UID:', currentUser.uid)
      }
    }, (error) => {
      console.error('Error fetching user data:', error)
    })

    // Define queries for owned, edited, and viewed lists
    const ownedListsQuery = query(collection(db, 'shoppingLists'), where('owner', '==', currentUser.uid))
    const editorListsQuery = query(collection(db, 'shoppingLists'), where('editors', 'array-contains', currentUser.uid))
    const viewerListsQuery = query(collection(db, 'shoppingLists'), where('viewers', 'array-contains', currentUser.uid))

    // Listen to owned lists
    const unsubscribeOwned = onSnapshot(ownedListsQuery, (snapshot) => {
      handleListSnapshot(snapshot, 'owner')
    }, (error) => {
      console.error('Error listening to owned lists:', error)
    })

    // Listen to editor lists
    const unsubscribeEditors = onSnapshot(editorListsQuery, (snapshot) => {
      handleListSnapshot(snapshot, 'editor')
    }, (error) => {
      console.error('Error listening to editor lists:', error)
    })

    // Listen to viewer lists
    const unsubscribeViewers = onSnapshot(viewerListsQuery, (snapshot) => {
      handleListSnapshot(snapshot, 'viewer')
    }, (error) => {
      console.error('Error listening to viewer lists:', error)
    })

    // Cleanup listeners on unmount
    return () => {
      unsubscribeOwned()
      unsubscribeEditors()
      unsubscribeViewers()
    }
  }, [router])

  // Helper function to handle snapshots and update lists
  const handleListSnapshot = (snapshot: QuerySnapshot, role: 'owner' | 'editor' | 'viewer') => {
    const fetchedLists: ShoppingList[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role, // Optional: track the user's role for each list
    } as ShoppingList))

    setLists(prevLists => {
      // Merge previous lists with fetched Lists based on their IDs to avoid duplicates
      const merged = [...prevLists.filter(list => !fetchedLists.some(fetched => fetched.id === list.id)), ...fetchedLists]
      // Remove any lists that no longer exist
      const uniqueIds = new Set(merged.map(list => list.id))
      return merged.filter(list => uniqueIds.has(list.id))
    })
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      const unsubscribeLists = fetchUserData(currentUser)
      // If fetchUserData returns a cleanup function, call it on unmount
      return () => {
        if (unsubscribeLists) unsubscribeLists()
      }
    })

    return () => {
      unsubscribeAuth()
    }
  }, [fetchUserData])

  // useEffect to fetch spending data when user and monthlyBudgets are available
  useEffect(() => {
    if (user && Object.keys(monthlyBudgets).length > 0) {
      fetchSpendingData(user.uid)
    }
  }, [user, monthlyBudgets])

  const fetchSpendingData = async (userId: string) => {
    try {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const ownedListsQuery = query(
        collection(db, 'shoppingLists'),
        where('owner', '==', userId),
        where('updatedAt', '>=', startOfYear)
      )
      const editorListsQuery = query(
        collection(db, 'shoppingLists'),
        where('editors', 'array-contains', userId),
        where('updatedAt', '>=', startOfYear)
      )
      const [ownedListsDocs, editorListsDocs] = await Promise.all([
        getDocs(ownedListsQuery),
        getDocs(editorListsQuery)
      ])
      const lists = [
        ...ownedListsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingList)),
        ...editorListsDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingList))
      ]

      const monthlyData: { [key: number]: number } = {}
      let yearTotal = 0

      lists.forEach(list => {
        list.items.forEach(item => {
          if (item.purchased && item.purchaseDate) {
            const month = item.purchaseDate.toDate().getMonth()
            const cost = (item.price || 0) * item.amount
            monthlyData[month] = (monthlyData[month] || 0) + cost
            yearTotal += cost
          }
        })
      })

      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const data = labels.map((_, index) => monthlyData[index] || 0)
      const currentYear = new Date().getFullYear()
      const budgetData = labels.map((_, index) => {
        const monthKey = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`
        return monthlyBudgets[monthKey] || 0
      })

      setSpendingData({
        labels,
        datasets: [
          {
            label: 'Monthly Spending',
            data,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Monthly Budget',
            data: budgetData,
            borderColor: 'rgb(255, 99, 132)',
            borderDash: [5, 5],
            fill: false
          }
        ]
      })

      setMonthlySpending(monthlyData[now.getMonth()] || 0)
      setYearlySpending(yearTotal)
    } catch (error) {
      console.error('Error fetching spending data:', error)
    }
  }

  const handleCreateList = async () => {
    if (auth.currentUser) {
      const newList: Omit<ShoppingList, 'id'> = {
        name: '',
        description: '',
        items: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        owner: auth.currentUser.uid,
        editors: [],
        viewers: [],
        pinned: false
      }
      try {
        const docRef = await addDoc(collection(db, 'shoppingLists'), newList)
        router.push(`/list/${docRef.id}`)
      } catch (error) {
        console.error('Error creating new list:', error)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out: ', error)
    }
  }

  const handleDeleteList = async () => {
    if (selectedListId) {
      try {
        await deleteDoc(doc(db, 'shoppingLists', selectedListId))
        setLists(lists.filter(list => list.id !== selectedListId))
        onModalClose()
        toast({
          title: 'List deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (error) {
        console.error('Error deleting list:', error)
        toast({
          title: 'Error deleting list',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const handlePinList = async (listId: string, pinned: boolean) => {
    try {
      await updateDoc(doc(db, 'shoppingLists', listId), { pinned })
      setLists(lists.map(list => 
        list.id === listId ? { ...list, pinned } : list
      ))
    } catch (error) {
      console.error('Error updating list pin status:', error)
    }
  }

  const handleUpdateMonthlyBudget = async (newBudget: number) => {
    if (auth.currentUser && newBudget) {
      const budgetValue = newBudget
      if (!isNaN(budgetValue)) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid)
          const now = new Date()
          const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
          await updateDoc(userRef, {
            monthlyBudget: budgetValue,
            [`monthlyBudgets.${monthKey}`]: budgetValue
          })
          setUser(prevUser => prevUser ? { 
            ...prevUser, 
            monthlyBudget: budgetValue, 
            monthlyBudgets: { ...prevUser.monthlyBudgets, [monthKey]: budgetValue } 
          } : null)
          setMonthlyBudgets(prevBudgets => ({ ...prevBudgets, [monthKey]: budgetValue }))
          setNewBudget('')
          onPopoverClose()
        } catch (error) {
          console.error('Error updating monthly budget:', error)
        }
      }
    }
  }

  const getRelativeTimeGroup = (date: Date): string => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return 'Previous 7 Days'
    if (diffDays < 30) return 'Previous 30 Days'
  
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  
    if (date.getFullYear() === now.getFullYear()) {
      return monthNames[date.getMonth()]
    }
  
    return date.getFullYear().toString()
  }

  const getRelativeTimeString = (date: Date): string => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
  }

  const groupedLists = lists
    .sort((a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime()) // Sort all lists by updatedAt
    .reduce((acc, list) => {
      if (list.pinned) {
        if (!acc['Pinned']) acc['Pinned'] = []
        acc['Pinned'].push(list)
      } else {
        const date = list.updatedAt.toDate()
        const key = getRelativeTimeGroup(date)
        if (!acc[key]) acc[key] = []
        acc[key].push(list)
      }
      return acc
    }, {} as { [key: string]: ShoppingList[] })
    
  const sortedGroups = Object.entries(groupedLists).sort(([a], [b]) => {
    if (a === 'Pinned') return -1
    if (b === 'Pinned') return 1

    const order = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days']
    const monthOrder = ['December', 'November', 'October', 'September', 'August', 'July', 'June', 'May', 'April', 'March', 'February', 'January']
    
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    const aMonthIndex = monthOrder.indexOf(a)
    const bMonthIndex = monthOrder.indexOf(b)

    if (aMonthIndex !== -1 && bMonthIndex !== -1) {
      return aMonthIndex - bMonthIndex
    }

    if (aMonthIndex !== -1) return -1
    if (bMonthIndex !== -1) return 1

    // If both are years, sort in descending order
    return parseInt(b) - parseInt(a)
  })

  const filteredLists = sortedGroups.map(([group, lists]) => ({
    group,
    lists: lists.filter(list =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.lists.length > 0)

  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
  const currentYear = currentDate.getFullYear()
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate()

  return (
    <Box>
      <Container maxW="container.xl" pt="70px">
        <Box p={[3, 4, 5]}>
          <VStack align="stretch" spacing={6}>
            <Box>
              <Flex justifyContent="space-between" alignItems="center" mb={5}>
                <Heading size="md">Your Shopping Lists</Heading>
                <Button leftIcon={<AddIcon />} colorScheme="green" onClick={handleCreateList}>
                  Create New List
                </Button>
              </Flex>
              <InputGroup mb={5}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search lists"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <VStack align="stretch" spacing={4}>
                {filteredLists.length > 0 ? (
                  filteredLists.map(({ group, lists }) => (
                    <Box key={group}>
                      <Heading size="sm" mb={2}>{group}</Heading>
                      {lists.map((list) => (
                        <Box
                          key={list.id}
                          p={5}
                          shadow="md"
                          borderWidth="1px"
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                          onClick={() => router.push(`/list/${list.id}`)}
                        >
                          <Flex justifyContent="space-between" alignItems="center">
                            <HStack spacing={2}>
                              {((list.editors && list.editors.length > 0) || (list.viewers && list.viewers.length > 0)) && (
                                <IoPeopleCircleOutline size={20} />
                              )}
                              <VStack align="start" spacing={1}>
                                <Heading size="sm">{list.name || 'Untitled List'}</Heading>
                                <Text fontSize="sm">{list.description}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {getRelativeTimeString(list.updatedAt.toDate())}
                                </Text>
                              </VStack>
                            </HStack>
                            <HStack>
                              <Text>{list.items.length} items</Text>
                              <Text color="green.500">
                                ${list.items.reduce((total, item) => total + (item.price || 0) * item.amount, 0).toFixed(2)}
                              </Text>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  aria-label="List options"
                                  icon={<MdMoreVert />}
                                  variant="ghost"
                                  onClick={(e) => e.stopPropagation()} // Prevent the box click event from firing
                                />
                                <MenuList onClick={(e) => e.stopPropagation()}>
                                  <MenuItem onClick={(e) => {
                                    e.stopPropagation(); // Prevent the box click event from firing
                                    handlePinList(list.id, !list.pinned);
                                  }}>
                                    {list.pinned ? 'Unpin' : 'Pin'}
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem onClick={(e) => {
                                    e.stopPropagation(); // Prevent the box click event from firing
                                    setSelectedListId(list.id);
                                    onModalOpen();
                                  }}>
                                    Delete
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </HStack>
                          </Flex>
                        </Box>
                      ))}
                    </Box>
                  ))
                ) : (
                  <Box textAlign="center" py={10}>
                    <Text fontSize="xl" mb={4}>You don't have any shopping lists yet.</Text>
                  </Box>
                )}
              </VStack>
            </Box>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <GridItem colSpan={[3, 3, 1]}>
                <Stat>
                  <StatLabel>Monthly Spending</StatLabel>
                  <StatNumber>${monthlySpending.toFixed(2)}</StatNumber>
                  <StatHelpText>{`${currentMonth} 1 - ${currentMonth} ${daysInMonth}, ${currentYear}`}</StatHelpText>
                </Stat>
                <Progress value={(monthlySpending / (user?.monthlyBudget || 1)) * 100} colorScheme="green" mt={2} />
              </GridItem>
              <GridItem colSpan={[3, 3, 1]}>
                <Stat>
                  <StatLabel>Yearly Spending</StatLabel>
                  <StatNumber>${yearlySpending.toFixed(2)}</StatNumber>
                  <StatHelpText>{`Jan 1 - Dec 31, ${currentYear}`}</StatHelpText>
                </Stat>
              </GridItem>
              <GridItem colSpan={[3, 3, 1]}>
                <Stat>
                  <StatLabel>Monthly Budget</StatLabel>
                  <Popover
                    isOpen={isPopoverOpen}
                    onOpen={onPopoverOpen}
                    onClose={onPopoverClose}
                    initialFocusRef={initialFocusRef}
                    placement="bottom"
                    closeOnBlur={false}
                  >
                    <PopoverTrigger>
                      <StatNumber cursor="pointer">
                        ${user?.monthlyBudget.toFixed(2)}
                      </StatNumber>
                    </PopoverTrigger>
                    <PopoverContent p={5}>
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverHeader>Edit Monthly Budget</PopoverHeader>
                      <PopoverBody>
                        <Input
                          ref={initialFocusRef}
                          placeholder="Enter new budget"
                          value={newBudget}
                          onChange={(e) => setNewBudget(e.target.value)}
                        />
                      </PopoverBody>
                      <PopoverFooter>
                        <Button colorScheme="blue" onClick={() => handleUpdateMonthlyBudget(Number(newBudget))}>
                          Update
                        </Button>
                      </PopoverFooter>
                    </PopoverContent>
                  </Popover>
                  <StatHelpText>
                    {monthlySpending <= (user?.monthlyBudget || 0) ? 'On track' : 'Over budget'}
                  </StatHelpText>
                </Stat>
              </GridItem>
            </Grid>
            <Box>
              <Heading size="md" mb={3}>Spending Trends</Heading>
              <Box height="300px">
                <Line
                  data={spendingData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </VStack>
        </Box>
      </Container>
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete List</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this list?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleDeleteList}>
              Delete
            </Button>
            <Button variant="ghost" onClick={onModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Dashboard