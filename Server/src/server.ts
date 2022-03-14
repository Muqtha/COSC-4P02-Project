import express, { Request } from 'express'
// import mysql from 'mysql' //for the database and connection to mysql
import cors from 'cors' //a library that allows a request from my frontend to my api
import * as tf from '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import * as qna from './qna'
import { UniversalSentenceEncoderQnA } from '@tensorflow-models/universal-sentence-encoder/dist/use_qna'

type QueryParameters = {
  input: string
  categories: Category[]
}

type Category = {
  name: string
  context: string
  subCategories: Category[]
}

type Result = {
  category: Category,
  score: number
}

let categoryModel: UniversalSentenceEncoderQnA | undefined
let contextModel: qna.QuestionAndAnswer | undefined

const loadCategoryModel = async () => {
  categoryModel = await use.loadQnA()
  await dummyQuery(categoryModel)
  console.log('categoryModel Loaded')
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
  console.log('contextModel Loaded')
}

const app = express();

app.use(cors());
app.use(express.json());

// const db = mysql.createConnection({
//     user: "root",
//     host: "127.0.0.1",
//     password: "pegasus",
//     database: "db",
// });

// app.post("/keywords", (req,res) => {
//     tablenames = req.body.tablename;
// })

// app.get("/answers", (req,res) => {
//     db.query("SHOW FULL TABLES", 
//     (err,result) => {
//         if(err){
//             console.log(err);
//             res.status(400).send(err);
//         }
//         else{
//             console.log(result);
//             res.send(result);
//         }
//     })
// });

app.post('/query', async (req: Request<{}, {}, QueryParameters>, res) => {
  if (!req.body) {
    res.status(400).json('Missing query parameters.')
    return
  }
  if (!req.body.categories || req.body.categories.length === 0) {
    res.status(400).json('Missing Categories')
    return
  }
  if (!req.body.input) {
    res.status(400).json('Missing Input')
    return
  }
  
  const { input, categories } = req.body
  
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
    responses: categories.map(category => category.name)
  }
  const embeddings = categoryModel.embed(queryParameters)
  const scores = await tf.matMul(embeddings['queryEmbedding'], embeddings['responseEmbedding'], false, true).data()
  const sortedResults: Result[] = Array.from(scores).map((score, index) => ({ category: categories[index], score: Math.round(score * 100) / 100 })).sort((a, b) => b.score - a.score)
  
  const subCategories = sortedResults[0].category.subCategories
  let subSortedResults: Result[] | undefined
  let categoryContext: string | undefined

  if (subCategories.length > 0) {

    const subCategoryQueryParameters = {
      queries: [input],
      responses: subCategories.map(subCategory => subCategory.name)
    }
    const subEmbeddings = categoryModel.embed(subCategoryQueryParameters)
    const subScores = await tf.matMul(subEmbeddings['queryEmbedding'], subEmbeddings['responseEmbedding'],false,true).data()
    subSortedResults = Array.from(subScores).map((score,index) => ({ category: subCategories[index], score: Math.round(score * 100) / 100 })).sort((a, b) => b.score - a.score)

    categoryContext = subCategories[0].context
  }
  else {
    categoryContext = sortedResults[0].category.context
  }
  
  if (categoryContext) {
    const answers = await contextModel.findAnswers(input, categoryContext)
    
    if (answers.length > 0) {
      res.json({ categoryResults: sortedResults.slice(0,5), subCategoryResults: subSortedResults, answers })
    } else {
      res.json({ categoryResults: sortedResults.slice(0,5), subCategoryResults: subSortedResults, answers: [{ text: 'Unfortunately we don\'t have an answer for that question' }] })
    }
  } else {
    res.json({ categoryResults: sortedResults.slice(0,5), subCategoryResults: subSortedResults, answers: [{ text: `Sorry, we do not have enough information about ${sortedResults[0].category.name} currently` }] })
  }

})

app.listen(3001, () => {
  loadCategoryModel()
  loadContextModel()
  console.log('---Backend running on port 3001---')
});