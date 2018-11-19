import {MongoClient, ObjectID} from  'mongodb'
import axios from 'axios'
import dotenv from 'dotenv'
import {connect, capitalize, schemaCheck} from './utils'
dotenv.config()
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
const activitySchema = {
    username: '',
    name: ''
}
export async function getActivityById(id,user = adminUser) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let result = await collection.findOne({'_id': ObjectID.createFromHexString(id)})
    await client.close()
    return result

}
export async function getActivitiesByCategory(cat,page = 1,perPage = 5,user = adminUser,test = {on: false}) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const options = {
        limit: perPage,
        skip: (page-1) * perPage,
        projection: {
            'answers': 0
        },
        test
    }

    let cursor = await collection.find({'category': capitalize(cat)},options)
    let result = await cursor.toArray()
    await client.close()
    return result
}
export async function getActivitiesAnsweredByUser(username,page = 1,perPage = 5,user = adminUser,test = {on: false}) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const options = {
        limit: perPage,
        skip: (page-1) * perPage,
        test
    }

    let cursor = await collection.aggregate([
        { $unwind: "$answers"},
        {
            $match: { "answers.username": username}
        },
        {
            $skip: (page-1) * perPage
        },
        {
            $limit: perPage
        }
    ],options)
    let result = await cursor.toArray()
    await client.close()
    return result
}
export async function getFiveRandomActivities(user = adminUser,test = {on: false}) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const options = {
        test
    }
    let cursor = await collection.aggregate([
        { $project: { "answers" : 0 } },
        { $match: { published: true } },
        { $sample: { size: 5 }}
    ],options)
    let results = await cursor.toArray()
    await client.close()
    return results
}
export async function postActivity(activity, user = adminUser){
    if (!(schemaCheck(activitySchema,activity))) throw new Error('Activity doesn\'t match schema')

    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let result = await collection.insertOne(activity)
    await client.close()
    return { id: result.insertedId }
}
export async function updateActivity(partialActivity, id,  user = adminUser){

    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const updateFields = Object.keys(partialActivity).reduce((p,c,i) => {
            if (c == '_id') return p
            if (c == 'styles') {
                Object.keys(partialActivity[c]).map(prop => {
                    p[`styles.${prop}`] = partialActivity[c][prop]
                })
                return p
            }
            p[c] = partialActivity[c]
            return p
    }, {})
    const updates = { $set: updateFields}
    const filter = {'_id': ObjectID.createFromHexString(id)}
    let result = await collection.updateOne(filter,updates)
    await client.close()
    return result['result']
}
export async function postAnswer(answer, activityId, user = adminUser) {
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const filter = {'_id': ObjectID.createFromHexString(activityId)}
    const updates = { $push: {"answers" : answer}}
    let result = await collection.updateOne(filter,updates)
    await client.close()
    return result['result']
}
