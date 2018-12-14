/**@module results-persist */
import {MongoClient, ObjectID} from  'mongodb'

import dotenv from 'dotenv'
import {connect, schemaCheck} from './utils'
//set environment variables. More info in the .env file
dotenv.config()

//The schema that a result object must match
let resultSchema = {
    username: '',
    category: '',
    answers: '',
    passed: ''
}
/**
 * This function posts one activity to the MONGO_ACTIVITY_COL collection.
 *
 * @param {Object} options - Contains all the information needed to perform this db operation
 * @param {Object} options.user - Contains credential information to connect to the database. If the user doesn't exist, or credentials are invalid, an error will be thrown
 * @param {Object} options.data - The result to be inserted. The id of the result is automatically generated by Mongo
 * @returns {Object} - An object with 1 field id, which represents the id of the inserted result
 *
 */
export async function postResults(options) {
    //You will see dbOptions very often. This is for testing purposes. In my tests I put certain values
    //in the options parameter which are ignored by the function, but are processed by the mongodb mock.
    //dbOptions contains information about which function is being tested, etc.
    let { user, data, ...dbOptions } = options

    //an error is thrown if the options.data object does not match the resultSchema
    let schema = schemaCheck(resultSchema,data)
    if (!(schema.correct)) throw new Error(schema.message)

    //for each answer, we transform the id from a string to an ObjectID, necessary for working with Mongo
    let correctAnswers = data.answers.map( a => {
        a.question_id = ObjectID.createFromHexString(a.question_id)
        return a
    })
    data.answers = correctAnswers

    //Db connection. This is where user authentication takes place. If the user is not valid, this throws an error
    let client = await connect(options.user)

    //fetch the MONGO_RESULTS_COL collection
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_RESULTS_COL)

    //insert and return result
    let result = await collection.insertOne(data, dbOptions)
    await client.close()
    return { id: result.insertedId }

}

/**
 * This function retrieves a list of results from the MONGO_RESULTS_COL collection, owned by options.username
 *
 * @param {Object} options - Contains all the information needed to perform this db operation
 * @param {Object} options.user - Contains credential information to connect to the database. If the user doesn't exist, or credentials are invalid, an error will be thrown
 * @param {string} options.username - It is part of options, because it is a route parameter. It is also available under options.user.username.
 * @param {number} options.page - Specify which page of  results is requested.
 * @param {number} options.limit - Specify how many items per page is required.
 * @param {string} options.stats - Specify whether we should fetch user result stats instead of a list of results. This is useful to get values like user passrate and user average time.
 * @returns {Object.Array[Object]} - If options.stats is undefined - An array with a number of elements equal or less to options.limit. Can be 0. Does not throw an error.
 * @returns {Object.number} - If options.stats is undefined. A count field that contains the total count of results - for pagination purposes.
 * @returns {Object} - If options.stats exists - An object that contains the user username, his passrate and average time.
 *
 */
export async function getResults(options) {
    //You will see dbOptions very often. This is for testing purposes. In my tests I put certain values
    //in the options parameter which are ignored by the function, but are processed by the mongodb mock.
    //dbOptions contains information about which function is being tested, etc.
    let { user,  ...dbOptions } = options

    //for each answer, we transform the id from a string to an ObjectID, necessary for working with Mongo
    let client = await connect(options.user)

    //fetch MONGO_RESULTS_COL collection
    let db = await client.db(process.env.MONGO_DBNAME)
    let collection = await db.collection(process.env.MONGO_RESULTS_COL)

    //We search by username
    let query = {'username': options.user.username}
    //we use this value to assert if this call is looking for a list of results or just the user stats
    //if total_count < 0 when we reach the end of the function, then we return stats, else we return results.
    let total_count = -1
    let aggPipe
    //if we are looking for user stats
    if (options.stats) {
        aggPipe = [
            //match by username
            {
                $match: query
            },
            //add a total_time field to each result that is the sum of each answer.time in that result
            {
                $addFields: {
                    'total_time': { $sum: '$answers.time'}
                }
            },
            //group by username, averaging the passrate and the total_time field added above
            {
                $group: {
                    _id: '$username',
                    passrate: { $avg: '$passed'},
                    avg_time: {$avg: '$total_time'}
                }
            }
        ]
    }
    //if looking for a list of results
    else {
        //get total_count to know how many pages there are.
        total_count = await collection.countDocuments(query)
        aggPipe =  [
            //match by username
            {
                $match: query
            },
            //sort by timestamp descending
            {
                $sort: {'timestamp': -1}
            },
            //insert some activity related information in the result.answers field
            {
                $lookup: {
                    from: 'activities',
                    localField: 'answers.question_id',
                    foreignField: '_id',
                    as: 'questions'
                }
            },
            //eliminate some information from the activity inserted above
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
            },
            //calculate total_time for each result.
            {
                $addFields: {
                    'total_time': { $sum: '$answers.time'}
                }
            }
            ]
        //insert pagination steps if specified
        if (dbOptions.hasOwnProperty('page') && dbOptions.hasOwnProperty('limit')){
            aggPipe.splice(1,0,{$skip: (dbOptions.page-1) * parseInt(dbOptions.limit)},{$limit: parseInt(options.limit)})
        }
    }

    //fetch result and return based on total_count and option.stats
    let cursor = await collection.aggregate(aggPipe,dbOptions)
    let results = await cursor.toArray()
    await cursor.close()
    await client.close()
    if (total_count >= 0) {
        return {
        count: total_count,
        data: results
        }
    }
    else {
        return {
            data: results
        }
    }
}
