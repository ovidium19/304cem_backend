import axios from 'axios'

import dotenv from 'dotenv'
import {connect, digestGenerateHeader, schemaCheck} from './utils'
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
async function getClientAndCollection(user,dbName,colName) {
    let client = await connect(user)
    let db = await client.db(dbName)
    let collection = await db.collection(colName)
    return {client, collection}
}
export async function createUser(userData) {
    if (!schemaCheck(userSchema, userData)) return Promise.reject({message: 'Missing fields'})
    const adminData = {
        username: process.env.MONGO_USERNAME,
        password: process.env.MONGO_APIKEY
    }

    const baseURL = `${process.env.MONGO_API_BASEURL}`
    const url = `/api/atlas/v1.0/groups/${process.env.MONGO_PROJECT_ID}/databaseUsers`
    const opt = {
        roles: [
            {
                roleName: 'readWrite',
                databaseName: process.env.MONGO_DBNAME
            }
        ]
    }
    const options = {
        method: 'POST',
        url,
        baseURL,
        data: {
            databaseName: 'admin',
            username: userData.username,
            password: userData.password,
            roles: opt.roles,
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
            return await postUserData(userData,adminUser)
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
export async function getUserByUsername(user){
    let {client, collection } = await getClientAndCollection(user,process.env.MONGO_DBUSERS, process.env.MONGO_USER_DBNAME)
    let result = await collection.findOne({username: user.username})
    await client.close()
    return result
}

export async function headlessConnection(user){
    let { client } = await getClientAndCollection(user,process.env.MONGO_DBUSERS, process.env.MONGO_DBUSERS_COLLECTION)
    await client.close()
    return true
}
