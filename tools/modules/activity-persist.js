import {MongoClient, ObjectID} from  'mongodb'
import axios from 'axios'
import dotenv from 'dotenv'
import {connect} from './utils'
dotenv.config()
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
export async function getActivityById(id,user) {
    if (!user) user = adminUser
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let result = await collection.findOne({'_id': ObjectID.createFromHexString(id)})
    await client.close()
    return result

}
