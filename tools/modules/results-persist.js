import {MongoClient, ObjectID} from  'mongodb'

import dotenv from 'dotenv'
import {connect, schemaCheck} from './utils'
dotenv.config()
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
let resultSchema = {
    username: '',
    category: '',
    answers: '',
    passed: ''
}
export async function postResults(options) {

    let { user, data, ...dbOptions } = options

    let schema = schemaCheck(resultSchema,data)
    if (!(schema.correct)) throw new Error(schema.message)
    let correctAnswers = data.answers.map( a => {
        a.question_id = ObjectID.createFromHexString(a.question_id)
        return a
    })
    data.answers = correctAnswers

    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_RESULTS_COL)

    let result = await collection.insertOne(data, dbOptions)
    await client.close()
    return { id: result.insertedId }

}

export async function getResults(options) {
    let { user,  ...dbOptions } = options
    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_RESULTS_COL)
    let query = {'username': options.user.username}
    let total_count = await collection.countDocuments(query)
    let aggPipe =  [
        {
            $match: query
        },
        {
            $lookup: {
                from: 'activities',
                localField: 'answers.question_id',
                foreignField: '_id',
                as: 'questions'
            }
        },
        {
            $project: {
                'questions.answers': 0,
                'questions.feedback': 0,
                'questions.styles': 0,
                'questions.music': 0,
                'questions.correctSound': 0,
                'questions.incorrectSound': 0,
                'questions.under_review': 0
            }
        }

        ]

    if (dbOptions.hasOwnProperty('page') && dbOptions.hasOwnProperty('limit')){
        aggPipe.splice(1,0,{$skip: (dbOptions.page-1) * parseInt(dbOptions.limit)},{$limit: parseInt(options.limit)})
    }

    let cursor = await collection.aggregate(aggPipe,dbOptions)
    let results = await cursor.toArray()
    await cursor.close()
    await client.close()
    return {
        count: total_count,
        data: results
    }
}
