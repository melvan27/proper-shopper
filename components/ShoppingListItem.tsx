import React from 'react'
import {
  Grid,
  GridItem,
  VStack,
  HStack,
  Input,
  Checkbox,
  Text,
  IconButton,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { Timestamp } from 'firebase/firestore'

interface ListItem {
  id: string
  name: string
  purchased: boolean
  price?: number
  store?: string
  amount: number
  purchaseDate?: Timestamp
}

interface ShoppingListItemProps {
  item: ListItem
  userPermission: 'owner' | 'editor' | 'viewer'
  onUpdate: (itemId: string, updates: Partial<ListItem>) => void
  onRemove: (itemId: string) => void
  nameInput: string
  storeInput: string
  priceInput: string
  amountInput: string
  onNameChange: (value: string) => void
  onStoreChange: (value: string) => void
  onPriceChange: (value: string) => void
  onAmountChange: (value: string) => void
  onNameBlur: () => void
  onStoreBlur: () => void
  onPriceBlur: () => void
  onAmountBlur: () => void
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  userPermission,
  onUpdate,
  onRemove,
  nameInput,
  storeInput,
  priceInput,
  amountInput,
  onNameChange,
  onStoreChange,
  onPriceChange,
  onAmountChange,
  onNameBlur,
  onStoreBlur,
  onPriceBlur,
  onAmountBlur,
}) => {
  const amountValue = parseInt(amountInput) || 1
  const priceValue = parseFloat(priceInput) || 0
  const totalValue = (amountValue * priceValue).toFixed(2)

  const handleAmountDelta = (delta: number) => {
    const next = Math.max(1, amountValue + delta)
    onAmountChange(String(next))
  }

  const handlePriceDelta = (delta: number) => {
    const next = Math.max(0, priceValue + delta)
    const rounded = Math.round(next * 100) / 100
    onPriceChange(rounded.toFixed(2))
  }

  return (
    <Grid
      templateColumns={['1fr', '1fr', 'auto 2fr 2fr 1fr 1fr 1fr auto']}
      gap={[2, 2, 4]}
      alignItems={['start', 'start', 'center']}
      borderWidth="1px"
      borderRadius="lg"
      p={4}
    >
      {/* Mobile Layout - Card style to match desired design */}
      <VStack spacing={2} display={['flex', 'flex', 'none']} width="100%" align="stretch">
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" spacing={3} flex={1}>
            <Checkbox
              isChecked={item.purchased}
              onChange={(e) => onUpdate(item.id, { purchased: e.target.checked })}
              isDisabled={userPermission === 'viewer'}
            />
            <VStack align="stretch" spacing={1} flex={1}>
              <HStack justifyContent="space-between">
                <Input
                  value={nameInput}
                  variant="unstyled"
                  fontWeight="semibold"
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={onNameBlur}
                  isDisabled={userPermission === 'viewer'}
                  placeholder="Item name"
                  size="sm"
                />
                <Text fontSize="sm" fontWeight="bold" color="green.500">${totalValue}</Text>
              </HStack>
              <Input
                value={storeInput}
                variant="unstyled"
                onChange={(e) => onStoreChange(e.target.value)}
                onBlur={onStoreBlur}
                isDisabled={userPermission === 'viewer'}
                placeholder="Store"
                size="sm"
                color="gray.500"
              />
              <HStack spacing={2}>
                <Button size="xs" px={2} onClick={() => handleAmountDelta(-1)}>-</Button>
                <Input
                  value={amountInput}
                  onChange={(e) => onAmountChange(e.target.value)}
                  onBlur={onAmountBlur}
                  isDisabled={userPermission === 'viewer'}
                  variant="unstyled"
                  size="sm"
                  width="24px"
                  textAlign="center"
                  inputMode="numeric"
                  placeholder="1"
                />
                <Button size="xs" px={2} onClick={() => handleAmountDelta(1)}>+</Button>
                <Text color="gray.500" fontSize="sm">×</Text>
                <Text color="gray.500" fontSize="sm">$</Text>
                <Button size="xs" px={2} onClick={() => handlePriceDelta(-0.01)}>-</Button>
                <Input
                  value={priceInput}
                  onChange={(e) => onPriceChange(e.target.value)}
                  onBlur={onPriceBlur}
                  isDisabled={userPermission === 'viewer'}
                  variant="unstyled"
                  size="sm"
                  width="36px"
                  textAlign="center"
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <Button size="xs" px={2} onClick={() => handlePriceDelta(0.01)}>+</Button>
              </HStack>
            </VStack>
          </HStack>
          {userPermission !== 'viewer' && (
            <IconButton
              aria-label="Remove item"
              icon={<DeleteIcon />}
              onClick={() => onRemove(item.id)}
              size="sm"
              alignSelf="center"
            />
          )}
        </HStack>
      </VStack>

      {/* Desktop Layout */}
      <HStack
        spacing={4}
        display={['none', 'none', 'flex']}
        width="100%"
      >
        <GridItem display="flex" alignItems="center">
          <Checkbox
            isChecked={item.purchased}
            onChange={(e) => onUpdate(item.id, { purchased: e.target.checked })}
            isDisabled={userPermission === 'viewer'}
          />
        </GridItem>
        <GridItem flex="2">
          <Input
            value={nameInput}
            variant='flushed'
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            isDisabled={userPermission === 'viewer'}
            placeholder="Item name"
            size="sm"
          />
        </GridItem>
        <GridItem flex="2">
          <Input
            value={storeInput}
            variant='flushed'
            onChange={(e) => onStoreChange(e.target.value)}
            onBlur={onStoreBlur}
            placeholder="Store"
            isDisabled={userPermission === 'viewer'}
            size="sm"
          />
        </GridItem>
        <GridItem>
          <NumberInput
            value={amountInput}
            onChange={(valueString) => onAmountChange(valueString)}
            onBlur={onAmountBlur}
            min={1}
            precision={0}
            step={1}
            isDisabled={userPermission === 'viewer'}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem>
          <NumberInput
            value={priceInput}
            onChange={(valueString) => onPriceChange(valueString)}
            onBlur={onPriceBlur}
            min={0}
            precision={2}
            step={0.01}
            isDisabled={userPermission === 'viewer'}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </GridItem>
        <GridItem>
          <Text fontSize="sm" fontWeight="bold" color="green.500">
            ${((parseFloat(priceInput) || 0) * (parseInt(amountInput) || 1)).toFixed(2)}
          </Text>
        </GridItem>
        <GridItem>
          {userPermission !== 'viewer' && (
            <IconButton
              aria-label="Remove item"
              icon={<DeleteIcon />}
              onClick={() => onRemove(item.id)}
              size="sm"
            />
          )}
        </GridItem>
      </HStack>
    </Grid>
  )
}

export default ShoppingListItem