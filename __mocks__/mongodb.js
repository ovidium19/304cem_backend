const dbs = {
    users: 0,
    courses:1
}
export class ObjectID {
    constructor(id) {
        this.id = id
    }
}
const data = [
    {
        s: {
            name: 'users',
            documents: [{
                _id: 1,
                username: 'test',
                password: 'test'
            }]

            }

    },
    {
        s: {
            name: 'courses',
            documents: [{
                _id: 1,
                name: 'Git'
            }]
        }
    }
]


class Collection {
    constructor(name) {
        this.data = Object.assign({},data[dbs[name]])
    }

    findOne(query) {
        return new Promise((resolve) => {
            let result = this.data.s.documents.find(d => d.hasOwnProperty('_id') && d['_id'] == query['_id'])
            resolve(result)
        })
    }
    insertOne(course){
        if (this.data.s.documents.find(c => c['_id'] == course['_id'])) throw new Error('Course ID already exists')
        return new Promise((resolve) => {
            this.data.s.documents.push(course)
            resolve(this.data.s.documents.find(c => c['_id'] == course['_id']))
        })
    }
    replaceOne(filter,course) {
        if (!this.data.s.documents.find(c => c['_id'] == course['_id'])) throw new Error('Course doesn\'t exist')
        return new Promise((resolve) => {
            const index = this.data.s.documents.findIndex(c => c['_id']== course['_id'])
            if (index >= 0){
                const removed = this.data.s.documents.splice(index,1,course)
            }
            const result = this.data.s.documents.find(c => c.name == course.name)

            resolve(result)
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

    collections() {
        return new Promise((resolve,reject) => {
            !this.forceError ? resolve(data) : reject({message: 'No data'})
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
            if (options.auth.user == 'forceError') reject(new Error('Connection not established'))
            if (options.auth.user !== 'test' && options.auth.password !== 'test') reject(new Error('Authentication failed'))
            resolve(new MongoDBClient())
        })
    }
}


//for testing purposes
export function getData() {
    return data
}
