import {MongoClient, ObjectID} from  'mongodb'
import axios from 'axios'
import dotenv from 'dotenv'
import {connect, capitalize} from './utils'
dotenv.config()
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
export async function getActivityById(id,user = adminUser) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let result = await collection.findOne({'_id': ObjectID.createFromHexString(id)})
    await client.close()
    return result

}
export async function getActivitiesByCategory(cat,page = 1,perPage = 5,user = adminUser) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const options = {
        limit: 5,
        skip: (page-1) * perPage
    }

    let cursor = await collection.find({'category': capitalize(cat)},options)
    let result = await cursor.toArray()
    await client.close()
    return result
}
