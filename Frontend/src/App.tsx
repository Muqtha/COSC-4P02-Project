import React from 'react'
import { ChakraProvider, Flex, Heading, Skeleton, Text } from '@chakra-ui/react'
import Chatbot from './Chatbot'
import greet from './Greetings.json'
import background from './background.jpg'

export type Message = {
  type: 'question' | 'response'
  message: string
}

type Category = {
  name: string
  findAnswer: boolean
  context: string
  subCategories: Category[]
}

const serverAddress = 'https://fiveguys.chat'
// const serverAddress = 'http://localhost:3001'

const queryTimeout = 15000

const fetchTimeout = (url: string, ms: number, { signal, ...options }: RequestInit | undefined = {}) => {
  const controller = new AbortController()
  const promise = fetch(url, { signal: controller.signal, ...options })

  if (signal) signal.addEventListener('abort', () => controller.abort())

  const timeout = setTimeout(() => controller.abort(), ms)

  return promise.finally(() => clearTimeout(timeout))
}

// const greeting = greet.greetings;
let greetings = greet.response;
let welcome = greetings[Math.floor(Math.random() * greet.response.length)];
// console.log(greetings);

const App = () => {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [waitingForResponse, setWaitingForResponse] = React.useState(false)
  const [chatLog, setChatLog] = React.useState<Message[]>([{ type: 'response', message: welcome }])

  // when this component loads, check to see if localStorage contains categories and if so, use them
  React.useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async() => {
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

  const query = async (input: string) => {
    setWaitingForResponse(true)

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

  return (
    <ChakraProvider>
      <Flex justifyContent='center' alignItems='flex-start' h='100%' direction='column' bgImage={background} color='black'>
        <div style={{ marginLeft: '20px' }}>
          <Heading size='4xl'>Five Guys Chatbot</Heading>        
          <Text pt='5'>Al-Muqthadir Ajiboye (Team Leader) - 6148068</Text>
          <Text>Noestama Imoisili - 6568588</Text>
          <Text>Zach Yerrill - 6589451</Text>
          <Text>Michael Woody - 6369201</Text>
          <Text>Jordan Chilcott - 6271357</Text>
          <Text>Yanis Souiki - 6284392</Text>
          <Text>Kam Sadiq - 6365548</Text>
          <Text>Christian Perdigao - 6223283</Text>
        </div>
      </Flex>
      <Skeleton isLoaded={categories.length > 0}>
        <Chatbot chatLog={chatLog} setChatLog={setChatLog} query={query} waitingForResponse={waitingForResponse} />
      </Skeleton>
    </ChakraProvider>
  )
}

export default App
