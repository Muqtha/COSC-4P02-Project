import React from 'react'
import { Box, Button, ChakraProvider, Flex, Heading, IconButton, Input, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, OrderedList, Skeleton, UnorderedList, useDisclosure } from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import Chatbot from './Chatbot'
import { Result, Answer } from './TFWorker'
import { AutoResizeTextarea } from './AutoResizeTextArea'
import axios from 'axios'
import { useTransform } from 'framer-motion'

export type Message = {
  type: 'question' | 'response'
  message: string
}

export type ContextType = {
  [key:string]: string
}

const defaultCategories = [
  'Canada Games',
  'Parking',
]

const defaultContext: ContextType = {
  'Canada Games': 'The Canada Games is a multi-sport event held every two years, alternating between the Canada Winter Games and the Canada Summer Games. They represent the highest level of national competition for Canadian athletes.\n\nThe (Canada) games are from August 6th to 21st, 2022.\n\nThe Canada Games events include basketball, soccer, baseball, and hockey.',
  'Parking': 'Parking costs $200.\n\nParking is available at Brock University.',
}

const worker = new Worker(new URL('./TFWorker.ts', import.meta.url))

const App = () => {
  const [categoryModelReady, setCategoryModelReady] = React.useState(false)
  const [contextModelReady, setContextModelReady] = React.useState(false)
  const [categories, setCategories] = React.useState<string[]>(defaultCategories)
  const [context, setContext] = React.useState<ContextType>(defaultContext)
  const [newCategory, setNewCategory] = React.useState('')
  const [categoryResults, setCategoryResults] = React.useState<Result[]>()
  const [queryResults, setQueryResults] = React.useState<Answer[]>()
  const [waitingForResponse, setWaitingForResponse] = React.useState(false)
  const [chatLog, setChatLog] = React.useState<Message[]>([{ type: 'response', message: 'How can we help you today?'}])
  const [edittingIndex, setEdittingIndex] = React.useState<number | undefined>()
  const [edittingText, setEdittingText] = React.useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  // const [categoriesList, setCategoriesList] = React.useState([]); // Stores the categories(Table Names) received from the backend.

  /* This method displays the info in the console and sets the response gotten from the backends result to the CategoriesList. */
  const displayInfo = () => {
    axios.get("http://localhost:3001/answers").then((response)=>{
      const temp =[];
      for(let i=0;i<response.data.length;i++){
        const temp1=String(JSON.stringify(response.data[i]));
        temp[i]=temp1.substring(15,temp1.length-2);
      }
      setCategories(temp);
    });
  }
  
  worker.onmessage = ({ data: { type, value } }) => {
    switch (type) {
      case 'categoryModelLoaded':
        setCategoryModelReady(true)
        break
      case 'contextModelLoaded':
        setContextModelReady(true)
        break
      case 'querying':
        setWaitingForResponse(true)
        setCategoryResults(undefined)
        setQueryResults(undefined)
        break
      case 'categoryResult':
        setCategoryResults(value)
        break
      case 'queryResult':
        setQueryResults(value)
        break
      case 'finalAnswer':
        setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: value }]))
        setWaitingForResponse(false)
        break
    }
  }
  React.useEffect(() => {
    worker.postMessage({ cmd: 'loadModels' })
  }, [])

  const handleNewCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(event.target.value)
  }

  const handleContextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEdittingText(event.target.value)
  }

  const addCategory = () => {
    if (newCategory) {
      setCategories(categories => categories.concat(newCategory))
      setNewCategory('')
    }
  }

  const openEdittingContextModal = (index: number) => {
    setEdittingIndex(index)
    setEdittingText(context[categories[index]])
    onOpen()
  }

  const assignContext = () => {
    if (edittingIndex === undefined) return
    setContext(context => {
      let newContext = {...context}
      let categoryName = categories[edittingIndex]

      newContext[categoryName] = edittingText

      return newContext
    })
    onClose()
  }

  const removeCategory = (index: number) => {
    setCategories(categories => categories.filter((_category, i) => index !== i))
  }

  const query = (input: string) => {
    worker.postMessage({ cmd: 'query', parameters: { input, categories, context }})
  }

  return (
    <ChakraProvider>
      <Box p='10'>
        <Box mb='10'>
          <Heading onLoad={displayInfo} p='1' size='lg'>Categories</Heading>
          <Flex p='1'>
            <Input ml='2' maxW='250' value={newCategory} onChange={handleNewCategoryInputChange} placeholder='New Category' />
            <Button ml='2' aria-label='Add category' onClick={addCategory}>Add Category</Button>
          </Flex>
          <UnorderedList>
            {categories.map((category, index) => (
              <Flex key={index} p='1' alignItems='center'>
                <ListItem pr='5'>{category}</ListItem>
                <Button mr='1' aria-label='Assign context' onClick={() => openEdittingContextModal(index)}>Context</Button>
                {categories.length > 1 && <IconButton aria-label='Delete category' icon={<DeleteIcon />} onClick={() => removeCategory(index)} />}
              </Flex>
            ))}
          </UnorderedList>
        </Box>
        <div>
          {categoryResults && <Heading size='md' mb='2'>Category Predictions</Heading>}
          <OrderedList>
            {categoryResults?.map((result, index) => (
              <ListItem key={index}>{`${result.category}: ${result.score}`}</ListItem>
            ))}
          </OrderedList>
          {queryResults && <Heading size='md' mt='4' mb='2'>Answers from {categoryResults && categoryResults[0].category} context</Heading>}
          {queryResults?.length === 0 && <Heading size='sm' pl='5'>No answers found</Heading>}
          <OrderedList>
            {queryResults?.map((answer, index) => (
              <ListItem key={index}>{`${answer.text}: ${Math.round(answer.score * 100) / 100}`}</ListItem>
            ))}
          </OrderedList>
        </div>
      </Box>
      {(!categoryModelReady || !contextModelReady) &&
        <Box textAlign='right' pos='fixed' bottom='40px' right='2%'>
          <Heading size='lg'>{`Category Model status: ${categoryModelReady ? 'Ready' : 'Loading'}`}</Heading>
          <Heading size='lg'>{`Context Model status: ${contextModelReady ? 'Ready' : 'Loading'}`}</Heading>
        </Box>
      }
      <Skeleton isLoaded={categoryModelReady && contextModelReady}>
        <Chatbot chatLog={chatLog} setChatLog={setChatLog} query={query} waitingForResponse={waitingForResponse} />
      </Skeleton>
      <Modal size='xl' scrollBehavior='inside' isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{`${edittingIndex !== undefined && categories[edittingIndex]} context`}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AutoResizeTextarea value={edittingText} onChange={handleContextInputChange} placeholder='Context'/>
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
