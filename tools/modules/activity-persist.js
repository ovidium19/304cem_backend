import {MongoClient, ObjectID} from  'mongodb'
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
    let collection
    let aggPipe = []
    collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    aggPipe.push({ $match: {
         published: true,
         username: { $ne: options.user.username}
        } })
    if (options.hasOwnProperty('allow_anon')) {
        aggPipe[0].$match.allow_anon = true
    }
    if (options.hasOwnProperty('category')) {
        aggPipe[0].$match.category = options.category
    }
    aggPipe.push({$sample: {size: 5}})

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
        }]

    let cursor = await collection.aggregate(aggPipe,dbOptions)
    let results = await cursor.toArray()
    await cursor.close()
    await client.close()
    return results

}
export async function getReviewActivities(options) {
    let {user, ...dbOptions} = options
    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_REVIEW_ACTIVITIES_COL)
    let total_count = await collection.countDocuments()
    let aggPipe = [
        {
            $sort: { timestamp: -1}
        },
        {
        $project: {
            answers: 0,
            feedback: 0
        },

    }]
    if (options.hasOwnProperty('page') && options.hasOwnProperty('limit')){
        aggPipe.push({$skip: (options.page-1) * parseInt(options.limit)})
        aggPipe.push({$limit: parseInt(options.limit)})
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
export async function getActivitiesByUsername(options) {

    let { user, username, ...dbOptions } = options
    let client = await connect(options.user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let query = {'username': username}
    if (dbOptions.hasOwnProperty('category')) query.category = dbOptions.category
    if (dbOptions.hasOwnProperty('published')) query.published = dbOptions.published == 'true' ? true : false
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
    if (dbOptions.hasOwnProperty('sort')) {
        let c = dbOptions.sort
        let sortQuery = {}
        sortQuery[c] = -1
        aggPipe.splice(aggPipe.length-1,0,({$sort: sortQuery}))
    }
    if (dbOptions.hasOwnProperty('page') && dbOptions.hasOwnProperty('limit')){
        aggPipe.splice(aggPipe.length-1,0,{$skip: (dbOptions.page-1) * parseInt(dbOptions.limit)},{$limit: parseInt(options.limit)})
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


export async function postActivity(options){
    let { user, data, ...dbOptions } = options
    let schema = schemaCheck(activitySchema,data)
    if (!(schema.correct)) throw new Error(schema.message)
    data.answers = []
    data.feedback = []
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
    if (dbOptions.modifyState) {
        if (data.under_review) {
            console.log('Publishing activity -- put under_review')
            data.published = false
            review_result = await putActivityUnderReview(options)
            result.review = review_result
        }
        else{
            if (data.published == false) {
                console.log('Unpublishing activity')
                review_result = await removeActivityFromReview(options)
                data.under_review = false
            }
        }
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
export async function removeActivityFromReview(options) {
    let {user, id, data, ...dbOptions} = options
    let oid = ObjectID.createFromHexString(id)
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_REVIEW_ACTIVITIES_COL)
    let result = await collection.deleteOne({_id: oid}, dbOptions)
    await client.close()
    return result
}
export async function declineActivity(options) {
    let {user, id, data, ...dbOptions} = options
    let result = {}
    result.delete_result = await removeActivityFromReview(options)
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    let filter = {'_id': ObjectID.createFromHexString(id)}
    let update = { $set: {under_review: false}}
    result.update_result = await collection.updateOne(filter,update,dbOptions)
    await client.close()
    return result
}
export async function publishActivity(options) {
    let {data, user, id, ...dbOptions} = options
    let result = {}
    result.delete_result = await removeActivityFromReview(options)
    let newdata = Object.assign({},data,{
        under_review: false,
        published: true
    })
    result.update_result = await updateActivity(Object.assign({},options,{data: newdata}, {modifyState: true}))
    return result
}

export async function postAnswer(options) {
    let {data, user, id, ...dbOptions} = options
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const filter = {'_id': ObjectID.createFromHexString(id)}
    const updates = { $push: {"answers" : data}}
    let result = await collection.updateOne(filter,updates,dbOptions)
    await client.close()
    return result['result']
}
export async function postFeedback(options) {
    let {data, user, id, ...dbOptions} = options
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_ACTIVITY_COL)
    const filter = {'_id': ObjectID.createFromHexString(id)}
    const updates = { $push: {"feedback" : data}}
    let result = await collection.updateOne(filter,updates,dbOptions)
    await client.close()
    return result['result']
}
