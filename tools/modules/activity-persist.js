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
const activitySchema = {
    username: '',
    name: '',
    category: '',
    blanks: '',
    options: '',
    text: '',
    styles: '',
    music: '',
    correctSound: '',
    incorrectSound: '',
    allow_feedback: '',
    allow_anon: '',
    published: '',
    under_review: ''
}
export async function getActivities(options) {
    let client =  await connect(options.user)

    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let aggPipe =  [
        { $match: { published: true } }
        ]
    if (options.hasOwnProperty('random')){
        aggPipe.push({$sample: {size: 5}})
    }
    else {
        if (options.hasOwnProperty('category')){
            aggPipe[0].$match.category = options.category
        }

        if (options.hasOwnProperty('page') && options.hasOwnProperty('limit')){
            aggPipe.push({$skip: (options.page-1) * parseInt(options.limit)})
            aggPipe.push({$limit: parseInt(options.limit)})
        }
    }
    let cursor = await collection.aggregate(aggPipe,options)
    let results = await cursor.toArray()
    await cursor.close()
    await client.close()
    return results
}
export async function getActivityById(options) {
    let { user, id, ...dbOptions } = options
    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let query = {'_id': ObjectID.createFromHexString(id)}
    let aggPipe =  [
        {
            $match: query
        },
        {
            $addFields: {
            'avg_rating': { $avg: '$feedback.rating' },
            'avg_time': { $avg: '$answers.time'},
            'avg_passrate': { $multiply: [{ $avg: '$answers.correctAll'}, 100]},
            'total_answers': { $size: '$answers'}
            }
        },
        {
            $project: {
                answers: 0
            }
        }]

    let cursor = await collection.aggregate(aggPipe,dbOptions)
    let results = await cursor.toArray()
    await cursor.close()
    await client.close()
    return results


}
export async function getActivitiesByCategory(cat,page = 1,perPage = 5,user = adminUser) {
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
export async function getActivitiesByUsername(options) {
    let { user, username, ...dbOptions } = options
    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let query = {'username': username}
    let total_count = await collection.countDocuments(query)
    let aggPipe =  [
        {
            $match: query
        },
        {
            $addFields: {
            'avg_rating': { $avg: '$feedback.rating' },
            'avg_time': { $avg: '$answers.time'},
            'avg_passrate': { $multiply: [{ $avg: '$answers.correctAll'}, 100]},
            'total_answers': { $size: '$answers'}
            }
        },
        {
            $project: {
                answers: 0
            }
        }]

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
export async function postActivity(options){
    let { user, data, ...dbOptions } = options

    let schema = schemaCheck(activitySchema,data)
    if (!(schema.correct)) throw new Error(schema.message)

    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let result = await collection.insertOne(data, dbOptions)
    await client.close()
    return { id: result.insertedId }
}
async function putActivityUnderReview(options) {
    let { user, data, ...dbOptions } = options

    let client = await connect(adminUser)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_REVIEW_ACTIVITIES_COL)
    let ready_data = Object.assign({},data,
        {
            _id: ObjectID.createFromHexString(data['_id']),
            answers: [],
            feedback: []
        })
    let deleteResult = await collection.deleteOne({_id: ready_data['_id']}, dbOptions)
    let insert_result = await collection.insertOne(ready_data, dbOptions)
    await client.close()
    return  { id: insert_result.insertedId }

}
export async function updateActivity(options){
    let { user, data, ...dbOptions } = options
    let schema = schemaCheck(activitySchema,data)
    let review_result
    let result = {}
    if (!(schema.correct)) throw new Error(schema.message)

    if (data.under_review) {
        data.published = false
        review_result = await putActivityUnderReview(options)
        result.review = review_result
    }
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const updateFields = Object.keys(data).reduce((p,c,i) => {
            if (c == '_id') return p
            if (c == 'styles') {
                Object.keys(data[c]).map(prop => {
                    p[`styles.${prop}`] = data[c][prop]
                })
                return p
            }
            p[c] = data[c]
            return p
    }, {})
    const updates = { $set: updateFields}
    const filter = {'_id': ObjectID.createFromHexString(data['_id'])}
    let activity_result = await collection.updateOne(filter,updates, dbOptions)
    result.activity = activity_result['result']
    await client.close()
    return result
}
export async function publishActivity(options) {
    let {data, user, id, ...dbOptions} = options
    let oid = ObjectID.createFromHexString(id)
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_REVIEW_ACTIVITIES_COL)
    let result = {}

    result.delete_result = await collection.deleteOne({_id: oid}, dbOptions)
    let newdata = Object.assign({},data,{
        under_review: false,
        published: true
    })
    result.update_result = await updateActivity(Object.assign({},options,{data: newdata}))
    return result
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
