import axios from 'axios'

import dotenv from 'dotenv'
import {connect, digestGenerateHeader, schemaCheck} from './utils'
import { resolveSoa } from 'dns';
dotenv.config()

let calls = 0

const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
const userSchema = {
    username: true,
    password: true,
    email: true
}
const adminData = {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_APIKEY
}
async function getClientAndCollection(user,dbName,colName) {
    let client = await connect(user)
    let db = await client.db(dbName)
    let collection = await db.collection(colName)
    return {client, collection}
}
export async function createUser(userData) {
    let schema = schemaCheck(userSchema,userData)
    if (!(schema.correct)) throw new Error(schema.message)


    const baseURL = `${process.env.MONGO_API_BASEURL}`
    const url = `/api/atlas/v1.0/groups/${process.env.MONGO_PROJECT_ID}/databaseUsers`
    const roles = [
        {
            roleName: 'readWrite',
            databaseName: process.env.MONGO_DBNAME,
            collectionName: process.env.MONGO_ACTIVITY_COL
        },
        {
            roleName: 'readWrite',
            databaseName: process.env.MONGO_DBNAME,
            collectionName: process.env.MONGO_RESULTS_COL
        }
    ]
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
    calls = calls + 1
    const authHeader = await digestGenerateHeader(options,adminData,calls)
    return axios(
        Object.assign({},options,
        {
            headers: {
                'Authorization': authHeader
            }
        })).then(async res => {
            calls = 0
            return  {
                adminUpdate: res.data,
                userUpdate: await postUserData(userData, adminUser)
            }
        })
}
export async function updateUser(options) {

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
                userUpdate: await updateUserData(options)
            }
        }).catch(err => {
            console.log(err.response.data)
            throw(err)
        })
}
async function postUserData(userData,adminUser) {
    let client = await connect(adminUser)
    let db = await client.db(process.env.MONGO_DBUSERS)
    let collection = await db.collection(process.env.MONGO_USER_DBNAME)
    const { password, ...itemWithNoPassword} = userData
    let result = await collection.insertOne(itemWithNoPassword)
    await client.close()
    return Object.assign({},result.ops,{id: result.insertedId})
}
async function updateUserData(options) {
    let client = await connect(adminUser)
    let db = await client.db(process.env.MONGO_DBUSERS)
    let collection = await db.collection(process.env.MONGO_USER_DBNAME)
    let userData = options.data
    userData.username = options.user.username
    let result = await collection.updateOne({'username': userData.username}, {$set: userData})
    await client.close()
    return result
}
export async function getUserByUsername(user){
    let {client, collection } = await getClientAndCollection(user,process.env.MONGO_DBUSERS, process.env.MONGO_USER_DBNAME)
    let result = await collection.findOne({username: user.username})
    await client.close()
    return result
}


