import {MongoClient, ObjectID} from  'mongodb'
import axios from 'axios'
import md5 from 'md5'
import dotenv from 'dotenv'
import {connect, digestGenerateHeader} from './utils'
import * as activities from './activity-persist'
dotenv.config()

let calls = 0
let db
const adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASS
}
export async function createUser(userData) {
    if (!(userData.hasOwnProperty('username')) || !(userData.hasOwnProperty('password'))){
        return Promise.reject({message: 'Not the right data'})
    }
    let client
    let result
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
    let item = Object.assign({},userData,{_id: new ObjectID(userData.username.padStart(12,'0'))})
    delete item.password
    let result = await collection.insertOne(item)
    await client.close()
    return result
}
export async function getUserByUsername(username,user){
    if (!user) user = adminUser
    let client = await connect(user)
    let db = await client.db(process.env.MONGO_DBUSERS)
    let collection = await db.collection(process.env.MONGO_USER_DBNAME)
    let result = await collection.findOne({username})
    await client.close()
    return result
}
