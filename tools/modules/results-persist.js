import {MongoClient, ObjectID} from  'mongodb'
import axios from 'axios'
import status from 'http-status-codes'
import dotenv from 'dotenv'
import {connect, capitalize, schemaCheck} from './utils'
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

    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_RESULTS_COL)

    let result = await collection.insertOne(data, dbOptions)
    await client.close()
    return { id: result.insertedId }

}
