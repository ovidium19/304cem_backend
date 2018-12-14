/** @module utils */
import {MongoClient} from 'mongodb'
import axios from 'axios'
import md5 from 'md5'
/**
 * This function connects the user to MongoDB and returns a client
 * @param {Object} user - User data to connect to mongo, must contain a username and password.
 * @returns {MongoClient} client - The MongoClient instance.
 */
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
        return client
    })
}
/**
 * Performs a request to MongoDB to get back the WWW-Authenticate header.
 * Uses the information retrieved to has the username and password.
 * Returns the new header.
 *
 * @param {Object} options - This is an option required by axios to know the details of the request.
 * @param {Object} user - User credentials. Must contain username and password
 * @param {number} calls -  A number to monitor the number of calls made to Mongo Atlas API, it is required in the digest authentication algorithm
 * @returns {string} - The generated header by Digest authentication method.
 */
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
/**
 * Performs a check between two objects to establish if they have the same keys.
 * @param {Object} schema - An object schema.
 * @param {Object} data - The object to be checked
 * @returns { Object.correct} - a boolean to establish if the data matches the schema
 * @returns {Object.message} - a string that contains all the fields that didn't match
 */
export function schemaCheck(schema,data) {
    let error = false
    //We perform the key check with a reduce
    //every key in schema must be found in data, otherwise the error flag is set to true.
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
