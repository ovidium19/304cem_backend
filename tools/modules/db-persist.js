/** @module db-persist */
import axios from 'axios'

import dotenv from 'dotenv'
import {connect, digestGenerateHeader, schemaCheck} from './utils'
dotenv.config()

//we need this for the digest authentication request to the Mongo Atlas API
let calls = 0

//admin credentials
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}

//schema that must match the new user
const userSchema = {
    username: true,
    password: true,
    email: true,
    roles: true
}

//mongo atlas api credentials
const adminData = {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_APIKEY
}
/**
 * Fetches the mongo client and the User collection
 * @param {*} user - user credentials to authenticate to Mongo
 * @param {*} dbName - Database name
 * @param {*} colName - Collection name to fetch
 * @returns {Object} - client and collection
 */
async function getClientAndCollection(user,dbName,colName) {
    let client = await connect(user)
    let db = await client.db(dbName)
    let collection = await db.collection(colName)
    return {client, collection}
}
/**
 * Create a user. First, a digest authentication request to MongoDB Atlas API is made to create a new user in the admin database.
 * Second, the user data is posted in the User collection with the password field omitted.
 * Mongo Atlas API allows the use of the admin database on the cloud instance of MongoDB, which provides password hashing and a lot of security for user data.
 * @param {Object} userData - The user information to be posted to MongoDB
 * @param {string} userData.roles - The roles of the new user. Can be 'user' or 'user reviewer'. Based on this field, user permissions are set
 * @returns {Object.adminUpdate} - The result from the Mongo Atlas API call
 * @returns {Object.userUpdate} - The result from inserting the user data in the Mongo db User database
 *
 */
export async function createUser(userData) {

    //if the user schema does not match the user data, an error is thrown
    let schema = schemaCheck(userSchema,userData)
    if (!(schema.correct)) throw new Error(schema.message)

    //setting the URl and URI for the Mongo Atlas API connection
    const baseURL = `${process.env.MONGO_API_BASEURL}`
    const url = `/api/atlas/v1.0/groups/${process.env.MONGO_PROJECT_ID}/databaseUsers`

    //setting the user roles based on the userData.roles field
    let roles = []

    //a basic user can read and write to activities and results, but only read user database
    if (/user/.test(userData.roles)) {
        roles = roles.concat([
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_ACTIVITY_COL
            },
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_RESULTS_COL
            },
            {
                roleName: 'read',
                databaseName: process.env.MONGO_DBUSERS,
                collectionName: process.env.MONGO_USER_DBNAME
            }
        ])
    }

    //a reviewer user can also read and write to the review_activities collection
    if (/reviewer/.test(userData.roles)) {
        roles.push(
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_REVIEW_ACTIVITIES_COL
            })
    }

    //set the options for the axios call to the Mongo Atlas API
    const options = {
        method: 'POST',
        url,
        baseURL,
        data: {
            databaseName: 'admin',
            username: userData.username,
            password: userData.password,
            roles,
            groupId: process.env.MONGO_PROJECT_ID
        },
    }

    //this is needed for the digest authentication algorithm
    calls = calls + 1

    //create the digest header
    /** see {@link utils#digestGenerateHeader} */
    const authHeader = await digestGenerateHeader(options,adminData,calls)

    //we make an axios call to post the new user
    return axios(
        Object.assign({},options,
        {
            headers: {
                'Authorization': authHeader
            }
        })).then(async res => {
            //this is needed for the digest authentication to work
            calls = 0
            //returns the result from the Mongo Atlas post request and the result from inserting the new user data in the User collection
            return  {
                adminUpdate: res.data,
                /** see {@link db-persist#postUserData} */
                userUpdate: await postUserData(userData, adminUser)
            }
        })
}
/**
 * Using Mongo Atlas API, we update the user's permissions to our collections.
 * @param {Object} options - The information needed to perform this db operation.
 * @param {Object} options.user - The user credentials
 * @param {string} options.data.roles - The new user roles. Can be 'user' or 'user reviewer'
 * @returns {Object.adminUpdate} - The result from the Mongo Atlas API call
 * @returns {Object.userUpdate} - The result from updating the user data in the Mongo db User database
 */
export async function updateUser(options) {
    /**
     * this is very similar to {@link db-persist#createUser}. The only difference is that we are making a PATCH request
     * as it should be according to Mongo Aatlas API
     */
    const baseURL = `${process.env.MONGO_API_BASEURL}`
    const url = `/api/atlas/v1.0/groups/${process.env.MONGO_PROJECT_ID}/databaseUsers/admin/${options.user.username}`
    let roles = []
    if (/user/.test(options.data.roles)) {
        roles = roles.concat([
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_ACTIVITY_COL
            },
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_RESULTS_COL
            },
            {
                roleName: 'read',
                databaseName: process.env.MONGO_DBUSERS,
                collectionName: process.env.MONGO_USER_DBNAME
            }
        ])
    }
    if (/reviewer/.test(options.data.roles)) {
        roles.push(
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME,
                collectionName: process.env.MONGO_REVIEW_ACTIVITIES_COL
            })
    }

    const opt = {
        method: 'PATCH',
        url,
        baseURL,
        data: {
            roles
        }
    }
    calls = calls + 1
    const authHeader = await digestGenerateHeader(opt,adminData,calls)
    return axios(
        Object.assign({},opt,
        {
            headers: {
                'Authorization': authHeader
            }
        })).then(async res => {
            console.log('In then')
            calls = 0
            return {
                adminUpdate: res.data,
                /**see {@link db-persist#updateUserData} */
                userUpdate: await updateUserData(options)
            }
        }).catch(err => {
            throw(err)
        })
}
/**
 * Posts the user data to the User collection. Called by {@link db-persist#createUser}
 * @param {*} userData - The userData to be inserted
 * @param {*} adminUser - The adminUser credentials
 */
async function postUserData(userData,adminUser) {
    //connect as admin
    let client = await connect(adminUser)
    let db = await client.db(process.env.MONGO_DBUSERS)
    //create a timestamp for the user, when it was created
    let timestamp = new Date()
    userData.date_created = timestamp.toDateString()

    //fetch the User collection
    let collection = await db.collection(process.env.MONGO_USER_DBNAME)

    //remove password field from the user data
    const { password, ...itemWithNoPassword} = userData

    //insert data
    let result = await collection.insertOne(itemWithNoPassword)
    await client.close()

    //return the mongodb response object and add a new field id with the new user id
    return Object.assign({},result.ops,{id: result.insertedId})
}
/**
 * Updates the user data to the User collection. Called by {@link db-persist#updateUser}
 * @param {*} userData - The userData to be inserted
 * @param {*} adminUser - The adminUser credentials
 */
async function updateUserData(options) {
    //You will see dbOptions very often. This is for testing purposes. In my tests I put certain values
    //in the options parameter which are ignored by the function, but are processed by the mongodb mock.
    //dbOptions contains information about which function is being tested, etc.
    let {user, data, username, ...dbOptions } = options

    //connect as admin. Users don't have permission to edit the user database.
    let client = await connect(adminUser)
    let db = await client.db(process.env.MONGO_DBUSERS)
    let collection = await db.collection(process.env.MONGO_USER_DBNAME)

    //update the user by setting only its roles.
    let userData = options.data
    userData.username = options.user.username
    let result = await collection.updateOne({'username': userData.username}, {$set: {roles: userData.roles}}, dbOptions)
    await client.close()
    return result
}
/**
 * Fetch a user by his username.
 * @param {Object} user - The user to be fetched
 * @returns {Object} - The User object that matches the input username
 */
export async function getUserByUsername(user){
    let {client, collection } = await getClientAndCollection(user,process.env.MONGO_DBUSERS, process.env.MONGO_USER_DBNAME)
    let result = await collection.findOne({username: user.username})
    await client.close()
    return result
}


