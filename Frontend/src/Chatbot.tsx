import React from 'react'
import './Chatbot.css'
import { ChatIcon } from '@chakra-ui/icons'
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
  VStack,
} from '@chakra-ui/react'

type Message = {
  type: 'question' | 'response'
  message: string
}

function Chatbot() {
  const initialFocusRef = React.useRef<HTMLInputElement>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [chatLog, setChatLog] = React.useState<Message[]>([{ type: 'response', message: 'How can we help you today?'}])
  const [inputValue, setInputValue] = React.useState('')
  const [waitingForResponse, setWaitingForResponse] = React.useState(false)

  // Sends response if the user is waiting for one
  React.useEffect(() => {
    if (waitingForResponse) {
      setTimeout(() => {
        setChatLog(oldChatLog => oldChatLog.concat([{ type: 'response', message: 'A very well thought out answer that is definitely correct.' }]))
        setWaitingForResponse(false)
      }, 3000)
    }
  }, [waitingForResponse])

  // Keeps chatbox window scrolled to the bottom to show the most recent texts
  React.useEffect(() => {
    scrollToBottom()
  }, [chatLog])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  // Adds a question to the chatlog, clears the question input, and waits for a response
  const addQuestion = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (inputValue) {
        setChatLog(oldChatLog => oldChatLog.concat([{ type: 'question', message: inputValue }]))
        setInputValue('')
        setWaitingForResponse(true)
      }
    }
  }

  return (
    <Popover
      initialFocusRef={initialFocusRef}
      closeOnBlur={false}
      placement='top'
    >
      <PopoverTrigger>
        <Button 
          colorScheme='blue'
          leftIcon={<ChatIcon />} 
          pos='fixed'
          bottom='40px'
          right='2%'
        >Chatbot</Button>
      </PopoverTrigger>
      <PopoverContent mr='8' w='lg'>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Chatbot</PopoverHeader>
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
              // bg: 'gray.700',
              borderRadius: '20px',
            },
          }}>
          <VStack>
            {chatLog.map((chat, index) => (
              <Tag colorScheme={chat.type === 'question' ? 'blue': 'gray'} variant={chat.type === 'question' ? 'solid': 'subtle'} size='lg' key={index} alignSelf={chat.type === 'question' ? 'flex-end' : 'flex-start'}>
                <TagLabel isTruncated={false}>{chat.message}</TagLabel>
              </Tag>
            ))}
            {waitingForResponse && 
              <Tag className="container" alignSelf='flex-start'>
                <TagLabel>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </TagLabel>
              </Tag>
            }
            <div ref={messagesEndRef}></div>
          </VStack>
        </PopoverBody>
        <PopoverFooter>
          <Input 
            ref={initialFocusRef}
            variant='filled'
            placeholder='Type your questions here'
            onKeyPress={(e) => addQuestion(e)} 
            onChange={handleInputChange} 
            value={inputValue} 
          />
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  )
}

export default Chatbot
