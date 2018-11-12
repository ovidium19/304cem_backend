import {MongoClient} from  'mongodb'

let db
let db_client

export async function connect(dbName) {
    let conString = process.env.MONGO_CONNECTION_STRING
    let options = {
        ssl: true,
        authSource: "admin",
        auth: {
            user: process.env.MONGO_ADMIN_USERNAME,
            password: process.env.MONGO_ADMIN_PASS
        },
        useNewUrlParser: true
    }
    return MongoClient.connect(conString,options).then(client => {
        console.log(`Connected to the database: ${client.isConnected()}`)
        db = client.db(dbName)
        db_client = client
    })
}
export function fetchCollections() {
    return db.collections().then(res => res).catch(err => err.message)
}
export function close() {
    console.log("Closing DB Connection")
    return db_client.close().then(() => {console.log("Db Closed")})
}
