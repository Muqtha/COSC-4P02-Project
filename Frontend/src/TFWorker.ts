import * as tf from '@tensorflow/tfjs'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import * as qna from './qna'
import { UniversalSentenceEncoderQnA } from '@tensorflow-models/universal-sentence-encoder/dist/use_qna'
import { ContextType } from './App'

export type { Answer } from './qna/question_and_answer'

export type MessageData = {
  cmd: string
  parameters?: QueryParameters
}

type QueryParameters = {
  input: string
  categories: string[]
  context: ContextType
}

export type Result = {
  category: string,
  score: number
}

let categoryModel: UniversalSentenceEncoderQnA | undefined
let contextModel: qna.QuestionAndAnswer | undefined

const loadCategoryModel = async () => {
  categoryModel = await use.loadQnA()
  await dummyQuery(categoryModel)
  postMessage({ type: 'categoryModelLoaded' })
}

// the first query takes longer, so this is called after the model loads to get that out of the way
const dummyQuery = async (m: UniversalSentenceEncoderQnA) => {
  const queryParameters = {
    queries: ['dummyQuestion'],
    responses: ['dummyCategory']
  }
  const embeddings = m.embed(queryParameters)

  await tf.matMul(embeddings['queryEmbedding'], embeddings['responseEmbedding'], false, true).data()
}

const loadContextModel = async () => {
  contextModel = await qna.load()
  postMessage({ type: 'contextModelLoaded' })
}

onmessage = async ({ data: { cmd, parameters } }: MessageEvent<MessageData>) => {
  switch (cmd) {
    case 'loadModels':
      loadCategoryModel()
      loadContextModel()
      break
    case 'query':
      if (!parameters) {
        console.error('Missing query parameters.')
        return
      }
      
      postMessage({ type: 'querying' })
      const { input, categories, context } = parameters
      
      while (!categoryModel) {
        console.log('Loading category model')
        await loadCategoryModel()
      }
      
      while (!contextModel) {
        console.log('Loading context model')
        await loadContextModel()
      }

      const queryParameters = {
        queries: [input],
        responses: categories
      }
      const embeddings = categoryModel.embed(queryParameters)
      const scores = await tf.matMul(embeddings['queryEmbedding'], embeddings['responseEmbedding'], false, true).data()
      const sortedResults: Result[] = Array.from(scores).map((score, index) => ({ category: categories[index], score: Math.round(score * 100) / 100 })).sort((a, b) => b.score - a.score)
      
      // top 5 results only
      postMessage({ type: 'categoryResult', value: sortedResults.slice(0,5) })
   
      const categoryContext = context[sortedResults[0].category]

      if (categoryContext) {
        const answers = await contextModel.findAnswers(input, context[sortedResults[0].category])
  
        postMessage({ type: 'queryResult', value: answers })
        
        if (answers.length > 0) {
          postMessage({ type: 'finalAnswer', value: answers[0].text })
        } else {
          postMessage({ type: 'finalAnswer', value: 'Unfortunately we don\'t have an answer for that question' })
        }
      } else {
        postMessage({ type: 'queryResult', value: [] })
        postMessage({ type: 'finalAnswer', value: `Sorry, we have no information about ${sortedResults[0].category} currently` })
      }

      break
  }
}
