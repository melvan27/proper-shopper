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
  InputGroup,
  InputLeftAddon,
  useNumberInput,
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
  const {
    getInputProps: getAmountInputProps,
    getIncrementButtonProps: getAmountIncrementProps,
    getDecrementButtonProps: getAmountDecrementProps,
  } = useNumberInput({
    step: 1,
    defaultValue: parseInt(amountInput) || 1,
    min: 1,
    precision: 0,
    onChange: (valueString) => onAmountChange(valueString),
  })

  const {
    getInputProps: getPriceInputProps,
    getIncrementButtonProps: getPriceIncrementProps,
    getDecrementButtonProps: getPriceDecrementProps,
  } = useNumberInput({
    step: 0.01,
    defaultValue: parseFloat(priceInput) || 0,
    min: 0,
    precision: 2,
    onChange: (valueString) => onPriceChange(valueString),
  })

  const amountInc = getAmountIncrementProps()
  const amountDec = getAmountDecrementProps()
  const amountInputProps = getAmountInputProps()

  const priceInc = getPriceIncrementProps()
  const priceDec = getPriceDecrementProps()
  const priceInputProps = getPriceInputProps()

  return (
    <Grid
      templateColumns={['1fr', '1fr', 'auto 2fr 2fr 1fr 1fr 1fr auto']}
      gap={[2, 2, 4]}
      alignItems={['start', 'start', 'center']}
      borderWidth="1px"
      borderRadius="lg"
      p={4}
    >
      {/* Mobile Layout */}
      <VStack
        spacing={2}
        display={['flex', 'flex', 'none']}
        width="100%"
      >
        <HStack width="100%" spacing={4}>
          <HStack maxW='120px'>
            <Button {...amountDec} size="xs">-</Button>
            <Input {...amountInputProps} onBlur={onAmountBlur} size="sm" width="40px" textAlign="center" />
            <Button {...amountInc} size="xs">+</Button>
          </HStack>
          <Input
            value={nameInput}
            variant='flushed'
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            isDisabled={userPermission === 'viewer'}
            placeholder="Item name"
            size="sm"
            flex={1}
          />
        </HStack>
        <HStack width="100%" justifyContent="space-between" alignItems="center">
          <Checkbox
            isChecked={item.purchased}
            onChange={(e) => onUpdate(item.id, { purchased: e.target.checked })}
            isDisabled={userPermission === 'viewer'}
          />
          <Input
            value={storeInput}
            variant='flushed'
            onChange={(e) => onStoreChange(e.target.value)}
            onBlur={onStoreBlur}
            placeholder="Store"
            isDisabled={userPermission === 'viewer'}
            size="sm"
            flex={1}
            mx={2}
          />
          {userPermission !== 'viewer' && (
            <IconButton
              aria-label="Remove item"
              icon={<DeleteIcon />}
              onClick={() => onRemove(item.id)}
              size="sm"
            />
          )}
        </HStack>
        <HStack width="100%" justifyContent="space-between" alignItems="center">
          <HStack spacing={2}>
            <Button {...priceDec} size="xs">-</Button>
            <InputGroup size="sm">
              <InputLeftAddon children="$" />
              <Input {...priceInputProps} onBlur={onPriceBlur} size="sm" width="60px" textAlign="center" />
            </InputGroup>
            <Button {...priceInc} size="xs">+</Button>
          </HStack>
          <Text fontSize="sm" fontWeight="bold" color="green.500">
            ${((parseFloat(priceInputProps.value) || 0) * (parseInt(amountInputProps.value) || 1)).toFixed(2)}
          </Text>
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