import React from 'react'
import { Box, Button, ChakraProvider, Flex, Heading, IconButton, Input, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, OrderedList, UnorderedList, useDisclosure } from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import Chatbot from './Chatbot'
import { AutoResizeTextarea } from './AutoResizeTextArea'

export type Message = {
  type: 'question' | 'response'
  message: string
}

type Answer = {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

type CategoryResult = {
  category: Category,
  score: number
}

type QueryResponse = {
  categoryResults: CategoryResult[]
  subCategoryResults?: CategoryResult[]
  answers: Answer[]
}

type Category = {
  name: string
  context: string
  subCategories: Category[]
}

type ContextEdit = {
  index: number
  subIndex?: number
  context: string
}

const serverAddress = 'https://fiveguys.chat'
// const serverAddress = 'http://localhost:3001'

const defaultCategories: Category[] = [
  {
    name: 'Canada Games',
    context: 'The Canada Games is a multi-sport event held every two years, alternating between the Canada Winter Games and the Canada Summer Games. They represent the highest level of national competition for Canadian athletes.\n\nThe (Canada) games are from August 6th to 21st, 2022.\n\nThe Canada Games events include basketball, soccer, baseball, and hockey.',
    subCategories: []
  },
  {
    name: 'Parking',
    context: 'Parking costs $200.\n\nParking is available at Brock University.',
    subCategories: []
  }
]

const App = () => {
  const [categories, setCategories] = React.useState<Category[]>(defaultCategories)
  const [newCategory, setNewCategory] = React.useState('')
  const [newSubCategories, setNewSubCategories] = React.useState<string[]>([])
  const [queryResults, setQueryResults] = React.useState<QueryResponse>()
  const [waitingForResponse, setWaitingForResponse] = React.useState(false)
  const [chatLog, setChatLog] = React.useState<Message[]>([{ type: 'response', message: 'How can we help you today?'}])
  const [edittingCategory, setEdittingCategory] = React.useState<ContextEdit | undefined>()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleNewCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(event.target.value)
  }

  const handleNewSubCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const subCategories = [...newSubCategories]
    subCategories[index] = event.target.value
    setNewSubCategories(subCategories)
  }

  const handleContextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (edittingCategory) {
      const newEdittingCategory: ContextEdit = { ...edittingCategory, context: event.target.value }
      setEdittingCategory(newEdittingCategory)
    }
  }

  const addCategory = () => {
    if (newCategory) {
      setCategories(categories => categories.concat({ name: newCategory, context: '', subCategories: [] }))
      setNewCategory('')
    }
  }
  
  const addSubCategory = (index: number) => {
    const newCategories = [...categories]

    newCategories[index].subCategories.push({ name: newSubCategories[index], context: '', subCategories: [] })
    setCategories(newCategories)
    
    const subCategories = [...newSubCategories]

    subCategories[index] = ''
    setNewSubCategories(subCategories)
  }

  const openEdittingContextModal = (index: number, subIndex?: number) => {
    if (subIndex !== undefined) {
      setEdittingCategory({
        index,
        subIndex,
        context: categories[index].subCategories[subIndex].context
      })
    } else {
      setEdittingCategory({
        index,
        context: categories[index].context
      })
    }
    onOpen()
  }

  const assignContext = () => {
    if (!edittingCategory) return
    if (edittingCategory.subIndex !== undefined) {
      const subIndex = edittingCategory.subIndex

      setCategories(categories => {
        let newCategories = [...categories]
  
        newCategories[edittingCategory.index].subCategories[subIndex].context = edittingCategory.context
  
        return newCategories
      })
    } else {
      setCategories(categories => {
        let newCategories = [...categories]
  
        newCategories[edittingCategory.index].context = edittingCategory.context
  
        return newCategories
      })
    }
    onClose()
  }

  const removeCategory = (index: number) => {
    setEdittingCategory(undefined)
    setCategories(categories => categories.filter((_category, i) => index !== i))
  }

  const removeSubCategory = (index: number, subIndex: number) => {
    const newSubCategories = categories[index].subCategories.filter((_subCategory, i) => subIndex !== i)
    const newCategories = [...categories]

    newCategories[index].subCategories = newSubCategories
    setEdittingCategory(undefined)
    setCategories(newCategories)
  }

  const query = async (input: string) => {
    setWaitingForResponse(true)
    setQueryResults(undefined)
    try {
      const response = await fetch(`${serverAddress}/query`, {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input, categories })
      })

      if (response.status !== 200) throw new Error('Error in server response')

      const data = await response.json()

      setQueryResults(data)
      setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: data.answers[0].text }]))
      setWaitingForResponse(false)
    } catch (err) {
      console.warn(err)
      setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: 'An error occured' }]))
      setWaitingForResponse(false)
    }
  }

  return (
    <ChakraProvider>
      <Box p='10'>
        <Box mb='10'>
          <Heading p='1' size='lg'>Categories</Heading>
          <Flex p='1'>
            <Input ml='2' maxW='250' value={newCategory} onChange={handleNewCategoryInputChange} placeholder='New Category' />
            <Button ml='2' aria-label='Add category' onClick={addCategory}>Add Category</Button>
          </Flex>
          <UnorderedList>
            {categories.map((category, index) => (
              <div key={index}>
                <Flex p='1' alignItems='center'>
                  <ListItem pr='5'>{category.name}</ListItem>
                  {category.subCategories.length === 0 && <Button mr='1' aria-label='Assign context' onClick={() => openEdittingContextModal(index)}>Context</Button>}
                  <Input mx='1' maxW='250' value={newSubCategories[index] || ''} onChange={(e) => handleNewSubCategoryInputChange(e, index)} placeholder='New Sub Category' />
                  <Button mr='1' aria-label='Add Sub Category' onClick={() => addSubCategory(index)}>Add Sub Category</Button>
                  <IconButton aria-label='Delete category' icon={<DeleteIcon />} onClick={() => removeCategory(index)} />
                </Flex>
                {category.subCategories.map((subCategory, subCategoryIndex) => (
                  <Flex key={subCategoryIndex} p='1' ml='5' alignItems='center'>
                    <ListItem as='p' pr='5'>{subCategory.name}</ListItem>
                    <Button mr='1' aria-label='Assign context' onClick={() => openEdittingContextModal(index, subCategoryIndex)}>Context</Button>
                    <IconButton aria-label='Delete sub category' icon={<DeleteIcon />} onClick={() => removeSubCategory(index, subCategoryIndex)} />
                  </Flex>
                ))}
              </div>
            ))}
          </UnorderedList>
        </Box>
        {queryResults && 
          <div>
            <Heading size='md' mb='2'>Category Predictions</Heading>
            <OrderedList>
              {queryResults.categoryResults.map((result, index) => (
                <ListItem key={index}>{`${result.category.name}: ${result.score}`}</ListItem>
              ))}
            </OrderedList>
            {queryResults.subCategoryResults &&
              <Box ml='5'>
                <Heading size='md' mb='2'>Sub Category Predictions</Heading>
                <OrderedList>
                  {queryResults.subCategoryResults.map((result, index) => (
                    <ListItem key={index}>{`${result.category.name}: ${result.score}`}</ListItem>
                  ))}
                </OrderedList>
              </Box>
            }
            <Heading size='md' mt='4' mb='2'>Answers from {queryResults.categoryResults[0].category.name} {queryResults.subCategoryResults && `/ ${queryResults.subCategoryResults[0].category.name}`} context</Heading>
            {queryResults.answers.length === 0 && <Heading size='sm' pl='5'>No answers found</Heading>}
            <OrderedList>
              {queryResults.answers.map((answer, index) => (
                <ListItem key={index}>{answer.score ? `${answer.text}: ${Math.round(answer.score * 100) / 100}` : answer.text}</ListItem>
              ))}
            </OrderedList>
          </div>
        }
      </Box>
      <Chatbot chatLog={chatLog} setChatLog={setChatLog} query={query} waitingForResponse={waitingForResponse} />
      <Modal size='xl' scrollBehavior='inside' isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{`${edittingCategory !== undefined && (edittingCategory.subIndex !== undefined ? categories[edittingCategory.index].subCategories[edittingCategory.subIndex].name : categories[edittingCategory.index].name)} context`}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AutoResizeTextarea value={edittingCategory ? edittingCategory.context : ''} onChange={handleContextInputChange} placeholder='Context'/>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={assignContext}>Set context</Button>
            <Button variant='ghost' onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  )
}

export default App
