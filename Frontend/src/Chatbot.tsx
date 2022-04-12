import React from 'react'
import './Chatbot.css'
import { ChatIcon, EmailIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import {
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Tag,
  TagLabel,
  Text,
  VStack,
  useColorMode,
  IconButton,
  chakra
} from '@chakra-ui/react'
import Linkify from 'linkify-react'
import { Message } from './App'

type ChatbotProps = {
  chatLog: Message[]
  setChatLog: React.Dispatch<React.SetStateAction<Message[]>>
  query: (input: string) => void
  waitingForResponse: boolean
}

const Chatbot = ({ chatLog, setChatLog, query, waitingForResponse }: ChatbotProps) => {

  const initialFocusRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = React.useState('')
  const { colorMode, toggleColorMode } = useColorMode()
  
  // Keeps chatbox window scrolled to the bottom to show the most recent texts
  React.useEffect(() => {
    scrollToBottom()
  }, [chatLog])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addQuestion();
    }
    if (event.key === 'ArrowUp' && event.altKey) {
      const userMessages = chatLog.filter(message => message.type === 'question')
      setInputValue(userMessages[userMessages.length - 1].message)
    }
  }

  // Adds a question to the chatlog, clears the question input, and waits for a response
  const addQuestion = async () => {
    if (inputValue) {
      setChatLog(oldChatLog => oldChatLog.concat([{ type: 'question', message: inputValue }]))
      setInputValue('')
      query(inputValue)
    }
  }

  return (
    <Popover
      initialFocusRef={initialFocusRef}
      // closeOnBlur={false}
      placement='top'
    >
      <PopoverTrigger>
        <Button 
          colorScheme='blue'
          leftIcon={<ChatIcon />} 
          pos='fixed'
          bottom='40px'
          right='2%'
        >{`Chatbot (v${process.env.REACT_APP_VERSION})`}</Button>
      </PopoverTrigger>
      <PopoverContent mr='8' w={['sm', 'lg']}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader display='flex' justifyContent='space-around'>
          <IconButton size='xs' onClick={toggleColorMode} variant='ghost' aria-label='Toggle lighting mode' icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} />
          <Text w='100%' mr='22' align='center'>Chatbot</Text>
        </PopoverHeader>
        <PopoverBody 
          maxH='60vh' 
          overflowY='auto'
          sx={{
            '&::-webkit-scrollbar-track': {
              bg: 'transparent',
            },
            '&::-webkit-scrollbar': {
              width: '7px',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: 'blue.600',
              borderRadius: '20px',
            },
          }}>
          <VStack>
            {chatLog.map((chat, index) => (
              <Tag colorScheme={chat.type === 'question' ? 'blue': 'gray'} variant={chat.type === 'question' ? 'solid': 'subtle'} size='lg' key={index} alignSelf={chat.type === 'question' ? 'flex-end' : 'flex-start'}>
                <TagLabel maxWidth='100%' isTruncated={false}><Linkify options={{ className: colorMode === 'light' ? 'text-link' : 'text-link-dark', target: '_blank' }}>{chat.message}</Linkify></TagLabel>
              </Tag>
            ))}
            {waitingForResponse && 
              <Tag className='container' alignSelf='flex-start'>
                <TagLabel>
                  <chakra.span className='dot' bg={colorMode === 'light' ? 'gray.800' : 'gray.200'}></chakra.span>
                  <chakra.span className='dot' bg={colorMode === 'light' ? 'gray.800' : 'gray.200'}></chakra.span>
                  <chakra.span className='dot' bg={colorMode === 'light' ? 'gray.800' : 'gray.200'}></chakra.span>
                </TagLabel>
              </Tag>
            }
            <div ref={messagesEndRef}></div>
          </VStack>
        </PopoverBody>
        <PopoverFooter display='flex'>
          <Input 
            ref={initialFocusRef}
            variant='filled'
            placeholder='Type your questions here'
            onKeyDown={handleKeyDown}
            onChange={handleInputChange} 
            value={inputValue} 
          />
          <IconButton onClick={addQuestion} aria-label='Send question' icon={<EmailIcon />} ml='2' />
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  )
}

export default Chatbot
