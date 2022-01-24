import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import './App.css'
import Chatbot from './Chatbot'

function App() {
  return (
    <ChakraProvider>
      {/* Makes all iframe links open in iframe instead of new window */}
      {/* <base target="_parent" /> 
      <iframe src="https://brocku.ca/" height="100%" width="100%" title="Brock University" style={{ border: 'none' }}></iframe> */}
      <Chatbot />
    </ChakraProvider>
  );
}

export default App;
