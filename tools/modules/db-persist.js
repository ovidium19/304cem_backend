import {MongoClient} from  'mongodb'
import axios from 'axios'
import md5 from 'md5'

let calls = 0
let db

async function connect(user) {
    let conString = process.env.MONGO_CONNECTION_STRING
    let options = {
        ssl: true,
        authSource: 'admin',
        auth: {
            user: user.username,
            password: user.password
        },
        useNewUrlParser: true
    }
    return MongoClient.connect(conString,options).then(client => {
        console.log(`Connected to the database: ${client.isConnected()}`)
        return client
    })
}
export async function digestGenerateHeader(options,user) {
    return await axios(options).catch(err => {
        calls = calls + 1
        const realm = /realm="([\w+!?'\ \/\\-]+)"/g.exec(err.response.headers['www-authenticate'])[1]
        const nonce = /nonce="([\w+!?'\/\\-]+)"/g.exec(err.response.headers['www-authenticate'])[1]
        const nc = calls.toString(16).padStart(16,0)
        const obj = {
            realm,
            nonce,
            nc,
            uri: options.url,
            method: options.method,
            username: user.username,
            password: user.password
        }
        const ha1 = md5(`${user.username}:${realm}:${user.password}`)
        const ha2 = md5(`${options.method}:${options.url}`)
        const response = md5(`${ha1}:${nonce}:${nc}:${nonce}:auth:${ha2}`)

        let authHeader = `Digest username=\"${obj.username}\", realm=\"${obj.realm}\", nonce=\"${obj.nonce}\", uri=\"${obj.uri}\", algorithm=\"MD5\", qop=auth, nc=${obj.nc}, cnonce=\"${obj.nonce}\", response=\"${response}\"`

        return authHeader
    })

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
    const adminUser = {
        username: process.env.MONGO_ADMIN_USERNAME,
        password: process.env.MONGO_ADMIN_PASS
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
    const authHeader = await digestGenerateHeader(options,adminData)
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
    let result = await collection.insertOne({username: userData.username, email: userData.email})
    await client.close()
    return result
}
