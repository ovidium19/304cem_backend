const dbs = {
    users: {
        index: 0,
        key: 'username'
    },
    activities: {
        index: 1,
        key: '_id'
    }
}
export class ObjectID {
    constructor(id) {
        this.id = id
    }
    static createFromHexString(id) {
        return id
    }
}
const users = [
    {
        username: 'test',
        password: 'test'
    },
    {
        username: 'ovidium19',
        password: '304CemWork'
    }
]
const data = [
    {
        s: {
            name: 'users',
            documents: [{
                _id: 1,
                username: 'test',
                email: 'test@test.com'
            }]
        }

    },
    {
        s: {
            name: 'activities',
            documents: [{
                _id: 1,
                name: 'Git',
                username: 'test'
            }]
        }
    }
]


class Collection {
    constructor(name) {
        this.data = Object.assign({},data[dbs[name].index])
        this.key = dbs[name].key
    }

    insertOne(newData){
        if (this.data.s.documents.find(c => c[this.key] == newData[this.key])) throw new Error('Already exists')
        return new Promise((resolve) => {
            this.data.s.documents.push(Object.assign({},newData,{_id: newData['_id'].id}))
            resolve(this.data.s.documents.find(c => c[this.key] == newData[this.key]))
        })
    }
    findOne(value){
        return new Promise((resolve,reject) => {
            let user = this.data.s.documents.find(u => u[this.key] == value[this.key])
            resolve(user)
        })
    }
}

class MongoDB {
    constructor(name) {
        this.name = name
        this.forceError = false
    }

    collection(name) {
        return new Promise((resolve,reject) => {
            try{
                let collection = new Collection(name)
                resolve(collection)
            }
            catch(err){
                reject(err)
            }
        })
    }
}
class MongoDBClient {
    constructor() {
        this.mocked = true
        this.dbInstance = null
    }
    isConnected() {
        return this.mocked
    }

    db(name) {
        if (!this.dbInstance)
            this.dbInstance = new MongoDB(name)

        return this.dbInstance
    }

    close() {
        return new Promise((resolve,reject) => {
            resolve('closed')
        })
    }
}
export class MongoClient {
    static connect(con,options) {
        return new Promise((resolve,reject) => {
            console.log(options)
            if (options.auth.user == 'forceError') reject(new Error('Connection not established'))
            let user = users.find(u => u.username == options.auth.user)
            if (user && user.password == options.auth.password) resolve(new MongoDBClient())
            reject(new Error('Authentication failed'))
        })
    }
    static addUser(userData) {
        return new Promise((resolve,reject) => {

            let user = users.find(u => u.username == userData.username)
            if (user) reject('Username already in use')
            users.push(userData)
            resolve({status: 'CREATED'})
        })

    }
}

//for testing purposes
export function getData() {
    return data
}
