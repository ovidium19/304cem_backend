import {MongoClient} from 'mongodb'
import axios from 'axios'
import md5 from 'md5'
export async function connect(user) {
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
export async function digestGenerateHeader(options,user,calls) {
    return await axios(options).catch(err => {

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
export function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1)
}
export function schemaCheck(schema,data) {
    let error = false
    let errors = Object.keys(schema).reduce((p,c,i) => {
        if (!(data.hasOwnProperty(c))) {
            error = true
            p = `${p} ${c}`
        }
        return p
    }, 'Missing fields:')
    return {
        correct: !(error),
        message: errors
    }
}
