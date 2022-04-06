import React from 'react'
import { Box, Button, ChakraProvider, Checkbox, Flex, FormControl, FormLabel, Heading, IconButton, Input, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, OrderedList, Switch, UnorderedList, useDisclosure } from '@chakra-ui/react'
import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import Chatbot from './Chatbot'
import { AutoResizeTextarea } from './AutoResizeTextArea'
import greet from './Greetings.json'

export type Message = {
  type: 'question' | 'response'
  message: string
}

type Answer = {
  text: string
  startIndex: number
  endIndex: number
  score: number
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
  findAnswer: boolean
  context: string
  subCategories: Category[]
}

type CategoryNameEdit = {
  categoryIndex: number
  subCategoryIndex: number | undefined
  name: string
}

type ContextEdit = {
  index: number
  subIndex?: number
  findAnswer: boolean
  context: string
}

const serverAddress = 'https://fiveguys.chat'
// const serverAddress = 'http://localhost:3001'

const queryTimeout = 15000

const fileToJSON = async (file: File) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = event => {
      const result = event.target?.result
      if (result) {
        resolve(JSON.parse(result.toString()))
      } else {
        reject('Result unknown')
      }
    }
    fileReader.onerror = error => reject(error)
    fileReader.readAsText(file)
  })
}

const fetchTimeout = (url: string, ms: number, { signal, ...options }: RequestInit | undefined = {}) => {
  const controller = new AbortController()
  const promise = fetch(url, { signal: controller.signal, ...options })

  if (signal) signal.addEventListener('abort', () => controller.abort())

  const timeout = setTimeout(() => controller.abort(), ms)

  return promise.finally(() => clearTimeout(timeout))
}

const compareCategories = (categoryA: Category, categoryB: Category): number => {
  if (categoryA.name.toLowerCase() < categoryB.name.toLowerCase()) {
    return -1
  } else if(categoryA.name.toLowerCase() > categoryB.name.toLowerCase()) {
    return 1
  } else {
    return 0
  }
}

// const greeting = greet.greetings;
let greetings = greet.response;
let welcome = greetings[Math.floor(Math.random() * greet.response.length)];
// console.log(greetings);

const App = () => {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [newCategory, setNewCategory] = React.useState('')
  const [newSubCategories, setNewSubCategories] = React.useState<string[]>([])
  const [queryResults, setQueryResults] = React.useState<QueryResponse>()
  const [waitingForResponse, setWaitingForResponse] = React.useState(false)
  const [chatLog, setChatLog] = React.useState<Message[]>([{ type: 'response', message: welcome}])
  const [edittingCategoryName, setEdittingCategoryName] = React.useState<CategoryNameEdit>()
  const [edittingCategory, setEdittingCategory] = React.useState<ContextEdit | undefined>()
  const [showCategories, setShowCategories] = React.useState(true)
  const [showPredictions, setShowPredictions] = React.useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const categoryImportRef = React.useRef<HTMLInputElement>(null)
  const categoryAppendImportRef = React.useRef<HTMLInputElement>(null)

  // when this component loads, check to see if localStorage contains categories and if so, use them
  React.useEffect(() => {
    const categoriesStorageValue = localStorage.getItem('categories')
    
    if (categoriesStorageValue) {
      setCategories(JSON.parse(categoriesStorageValue))
    }
  }, [])

  // everytime categories changes, save state to localStorage
  React.useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories))
  }, [categories])

  const handleShowCategoriesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCategories(event.target.checked)
  }

  const handleShowPredictionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowPredictions(event.target.checked)
  }

  const handleNewCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(event.target.value)
  }

  const handleNewSubCategoryInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const subCategories = [...newSubCategories]
    subCategories[index] = event.target.value
    setNewSubCategories(subCategories)
  }

  const handleContextAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (edittingCategory) {
      const newEdittingCategory: ContextEdit = { ...edittingCategory, findAnswer: event.target.checked }
      setEdittingCategory(newEdittingCategory)
    }
  }

  const handleContextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (edittingCategory) {
      const newEdittingCategory: ContextEdit = { ...edittingCategory, context: event.target.value }
      setEdittingCategory(newEdittingCategory)
    }
  }

  const handleEdittingCategoryNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (edittingCategoryName) {
      const newEdittingCategoryName: CategoryNameEdit = { ...edittingCategoryName, name: event.target.value }
      setEdittingCategoryName(newEdittingCategoryName)
    }
  }

  const addCategory = () => {
    if (newCategory) {
      setCategories(categories => categories.concat({ name: newCategory, findAnswer: false, context: '', subCategories: [] }))
      setNewCategory('')
    }
  }
  
  const addSubCategory = (index: number) => {
    if (!newSubCategories[index]) return

    const newCategories = [...categories]

    newCategories[index].subCategories.push({ name: newSubCategories[index], findAnswer: false, context: '', subCategories: [] })
    setCategories(newCategories)
    
    const subCategories = [...newSubCategories]

    subCategories[index] = ''
    setNewSubCategories(subCategories)
  }

  const editCategoryName = (categoryIndex: number, subCategoryIndex?: number) => {
    setEdittingCategoryName({ name: subCategoryIndex !== undefined ? categories[categoryIndex].subCategories[subCategoryIndex].name : categories[categoryIndex].name, categoryIndex, subCategoryIndex })
  }

  const openEdittingContextModal = (index: number, subIndex?: number) => {
    if (subIndex !== undefined) {
      setEdittingCategory({
        index,
        subIndex,
        findAnswer: categories[index].subCategories[subIndex].findAnswer,
        context: categories[index].subCategories[subIndex].context
      })
    } else {
      setEdittingCategory({
        index,
        findAnswer: categories[index].findAnswer,
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

        newCategories[edittingCategory.index].subCategories[subIndex].findAnswer = edittingCategory.findAnswer
        newCategories[edittingCategory.index].subCategories[subIndex].context = edittingCategory.context
  
        return newCategories
      })
    } else {
      setCategories(categories => {
        let newCategories = [...categories]
  
        newCategories[edittingCategory.index].findAnswer = edittingCategory.findAnswer
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

  const saveCategoryNameChange = () => {
    if (edittingCategoryName) {
      setCategories(categories => {
        const newCategories = [...categories]

        if (edittingCategoryName.subCategoryIndex === undefined) {
          newCategories[edittingCategoryName.categoryIndex].name = edittingCategoryName.name
        } else {
          newCategories[edittingCategoryName.categoryIndex].subCategories[edittingCategoryName.subCategoryIndex].name = edittingCategoryName.name
        }

        return newCategories
      })
      setEdittingCategoryName(undefined)
    }
  }

  const cancelCategoryNameChange = () => {
    setEdittingCategoryName(undefined)
  }

  const query = async (input: string) => {
    setWaitingForResponse(true)
    setQueryResults(undefined)
   
    try {
      const response = await fetchTimeout(`${serverAddress}/query`, queryTimeout, {
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
    } catch (err: any) {
      console.warn(err)
      if (err.name === 'AbortError') {
        setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: 'The server is taking too long to respond right now' }]))
      } else {
        setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: 'An error occured' }]))
      }
    } finally {
      setWaitingForResponse(false)
    }
  }

  const exportCategories = () => {
    const a = document.createElement('a')
    // a.href = URL.createObjectURL(new Blob([JSON.stringify(categories, null, 2)], { type: 'text/plain' }))
    // a.setAttribute('download', 'categories.txt')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(categories, null, 2)], { type: 'application/json' }))
    a.setAttribute('download', 'categories.json')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const importCategories = async (event: React.ChangeEvent<HTMLInputElement>, append: boolean) => {
    const files = event.target.files

    if (!files) return
    
    try {
      const importedCategories = await fileToJSON(files[0])
  
      if (!Array.isArray(importedCategories)) {
        throw new Error('Input file format incorrect. The input should be an array.')
      }
  
      for (let i = 0; i < importedCategories.length; i++) {
        if (importedCategories[i].name === undefined) {
          throw new Error('Input file format incorrect. Each element should have a name property.')
        }
    
        // if (importedCategories[i].findAnswer === undefined) {
        //   throw new Error('Input file format incorrect. Each element should have a findAnswer property that must be true or false.')
        // }

        if (importedCategories[i].context === undefined) {
          throw new Error('Input file format incorrect. Each element should have a context property, even if it is blank.')
        }
    
        if (importedCategories[i].subCategories === undefined || !Array.isArray(importedCategories[i].subCategories)) {
          throw new Error('Input file format incorrect. Each element should have a subCategories property that contains an array (use an empty array if it has none).')
        }

        for (let j = 0; j < importedCategories[i].subCategories.length; j++) {
          if (importedCategories[i].subCategories[j].name === undefined) {
            throw new Error('Input file format incorrect. Each subCategory array element should have a name property.')
          }

          // if (importedCategories[i].subCategories[j].findAnswer === undefined) {
          //   throw new Error('Input file format incorrect. Each subCategory array element should have a findAnswer property that must be true or false.')
          // }
      
          if (importedCategories[i].subCategories[j].context === undefined) {
            throw new Error('Input file format incorrect. Each subCategory array element should have a context property, even if it is blank.')
          }
      
          if (importedCategories[i].subCategories[j].subCategories === undefined || !Array.isArray(importedCategories[i].subCategories[j].subCategories)) {
            throw new Error('Input file format incorrect. Each subCategory array element should have a subCategories property that contains an array (use an empty array if it has none).')
          }
        }
      }

      if (append) {
        setCategories(categories => categories.concat(importedCategories))
      } else {
        setCategories(importedCategories)
      }

    } catch (err) { 
      console.warn(err)
      alert(err)
    } finally {
      event.target.value = ''
    }
  }

  const importDefaults = async () => {
    try {
      const response = await fetchTimeout('https://raw.githubusercontent.com/Muqtha/COSC-4P02-Project/main/categories.json', queryTimeout)

      if (response.status !== 200) throw new Error('Error in GitHub response')

      const data = await response.json()

      setCategories(data)
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Query timeout')
      } else {
        console.warn(err)
      }
    } 
  }

  return (
    <ChakraProvider>
      <Box p='10'>
        <Box mb='10'>
          <FormControl display='flex' alignItems='center' mb='2'>
            <FormLabel htmlFor='showCategories' style={{ cursor: 'pointer', userSelect: 'none' }} mb='0'>
              Show Categories
            </FormLabel>
            <Switch id='showCategories' isChecked={showCategories} onChange={handleShowCategoriesChange} />
          </FormControl>
          <FormControl display='flex' alignItems='center' mb='4'>
            <FormLabel htmlFor='showPredictions' style={{ cursor: 'pointer', userSelect: 'none' }} mb='0'>
              Show Predictions
            </FormLabel>
            <Switch id='showPredictions' isChecked={showPredictions} onChange={handleShowPredictionsChange} />
          </FormControl>
          {showCategories &&
          <>
            <Button ml='2' aria-label='Export' onClick={exportCategories}>Export</Button>
            <Button ml='2' aria-label='Import (Replace)' onClick={() => categoryImportRef.current?.click()}>Import (Replace)</Button>
            <Button ml='2' aria-label='Import (Append)' onClick={() => categoryAppendImportRef.current?.click()}>Import (Append)</Button>
            <Button ml='2' aria-label='Import (Replace) from GitHub' onClick={importDefaults}>Import (Replace) from GitHub</Button>
            <input type='file' accept='.json, .txt' style={{ display: 'none' }} ref={categoryImportRef} onChange={(e) => importCategories(e, false)} />
            <input type='file' accept='.json, .txt' style={{ display: 'none' }} ref={categoryAppendImportRef} onChange={(e) => importCategories(e, true)} />
            <Heading p='1' size='lg'>Categories</Heading>
            <Flex p='1'>
              <Input ml='2' maxW='250' value={newCategory} onChange={handleNewCategoryInputChange} placeholder='New Category' />
              <Button ml='2' aria-label='Add category' onClick={addCategory}>Add Category</Button>
            </Flex>
            <UnorderedList>
              {categories.sort(compareCategories).map((category, index) => (
                <div key={index}>
                  <Flex p='1' alignItems='center'>
                    {edittingCategoryName?.categoryIndex === index && edittingCategoryName?.subCategoryIndex === undefined ? 
                      <>
                        <Input mx='1' maxW='250' value={edittingCategoryName?.name || ''} onChange={handleEdittingCategoryNameInputChange} placeholder='New Category Name' />
                        <IconButton mr='1' aria-label='Save category name' icon={<CheckIcon />} onClick={saveCategoryNameChange} />
                        <IconButton mr='1' aria-label='Cancel category name edit' icon={<CloseIcon />} onClick={cancelCategoryNameChange} />
                      </>
                    :
                      <>
                        <ListItem pr='5'>{category.name}</ListItem>
                        <IconButton mr='1' aria-label='Edit category' icon={<EditIcon />} onClick={() => editCategoryName(index)} />
                      </>
                    }
                    {category.subCategories.length === 0 && <Button mr='1' aria-label='Assign context' onClick={() => openEdittingContextModal(index)}>Context</Button>}
                    <Input ml='1' maxW='250' value={newSubCategories[index] || ''} onChange={(e) => handleNewSubCategoryInputChange(e, index)} placeholder='New Sub Category' />
                    <Button mx='2' aria-label='Add Sub Category' onClick={() => addSubCategory(index)}>Add Sub Category</Button>
                    <IconButton aria-label='Delete category' icon={<DeleteIcon />} onClick={() => removeCategory(index)} />
                  </Flex>
                  {category.subCategories.sort(compareCategories).map((subCategory, subCategoryIndex) => (
                    <Flex key={subCategoryIndex} p='1' ml='5' alignItems='center'>
                      {edittingCategoryName?.categoryIndex === index && edittingCategoryName?.subCategoryIndex === subCategoryIndex ?
                        <>
                          <Input mx='1' maxW='250' value={edittingCategoryName?.name || ''} onChange={handleEdittingCategoryNameInputChange} placeholder='New Sub Category Name' />
                          <IconButton mr='1' aria-label='Save category name' icon={<CheckIcon />} onClick={saveCategoryNameChange} />
                          <IconButton mr='1' aria-label='Cancel category name edit' icon={<CloseIcon />} onClick={cancelCategoryNameChange} />
                        </> 
                        :
                        <>
                          <ListItem as='p' pr='5'>{subCategory.name}</ListItem>
                          <IconButton mr='1' aria-label='Edit sub category' icon={<EditIcon />} onClick={() => editCategoryName(index, subCategoryIndex)} />
                        </>
                      }
                      <Button mr='1' aria-label='Assign context' onClick={() => openEdittingContextModal(index, subCategoryIndex)}>Context</Button>
                      <IconButton aria-label='Delete sub category' icon={<DeleteIcon />} onClick={() => removeSubCategory(index, subCategoryIndex)} />
                    </Flex>
                  ))}
                </div>
              ))}
            </UnorderedList>
          </>
          }
        </Box>
        {showPredictions && queryResults && 
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
            <Heading size='xs'>If unchecked, the entire context will be the answer for this category</Heading>
            <Checkbox mb='2' isChecked={edittingCategory ? edittingCategory.findAnswer : false} onChange={handleContextAnswerChange}>Use model to search for answer in context</Checkbox>
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
