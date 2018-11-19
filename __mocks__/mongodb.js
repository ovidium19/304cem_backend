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
export class Cursor {
    constructor(list) {
        this.list = list
    }
    toArray() {
        return Promise.resolve(this.list)
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
            documents: [
                {
                _id: 1,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 2,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 3,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 4,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 5,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 6,
                name: 'Git',
                username: 'test',
                category: 'Geography',
                answers: [
                    {
                        username: 'test',
                        correct: true
                    },
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                },
                {
                _id: 7,
                name: 'Git',
                username: 'test',
                answers: [
                    {
                        username: 'ovi',
                        correct: false
                    }
                ]
                }
        ]
        }
    }
]


class Collection {
    constructor(name) {
        this.data = Object.assign({},data[dbs[name].index])
        this.key = dbs[name].key
    }

    insertOne(newData){
        if (newData[this.key] && this.data.s.documents.find(c => c[this.key] == newData[this.key])) throw new Error('Already exists')
        if (!(newData.hasOwnProperty('_id'))) {
            newData['_id'] = new ObjectID(this.data.s.documents.length+1)
        }
        return new Promise((resolve) => {
            this.data.s.documents.push(Object.assign({},newData,{_id: newData['_id'].id}))
            resolve({insertedId: newData['_id'].id})
        })
    }
    findOne(value){
        return new Promise((resolve,reject) => {
            let user = this.data.s.documents.find(u => u[this.key] == value[this.key])
            resolve(user)
        })
    }
    find(query,options) {
        let data = this.data.s.documents.reduce((p,c) => {
            if (p.values.length>=options.limit) return p

            let include = Object.keys(query).reduce((pv,cv) => {
                return pv && c[cv] == query[cv]
            }, true)

            if (include) {
                if (p.skipped < options.skip) return {
                    values: Array.from(p.values),
                    skipped: p.skipped + 1
                }
                return {
                    values: p.values.concat([c]),
                    skipped: p.skipped
                }
            }
            return p
        }, {
            values: [],
            skipped: 0
        })
        return new Cursor(data.values)
    }
    aggregate(pipe,options) {
        let db_data = this.data.s.documents
        if (options.test.on) {
            switch(options.test.case) {
                case 'getActivitiesAnsweredByUser': {
                    let data = db_data.reduce((p,c) => {
                        if (p.values.length>=options.limit) return p //we reached page limit, return

                        let answer = c.answers.find(a => a.username == options.test.username)
                        if (answer){
                            if (p.skipped < options.skip) return {
                                values: Array.from(p.values),
                                skipped: p.skipped + 1
                            }
                            return {
                                values: p.values.concat([Object.assign({},c,{answers: [answer]})]),
                                skipped: p.skipped
                            }
                        }
                        return p
                    },{
                        values: [],
                        skipped: 0
                    })
                    return new Cursor(data.values)
                    break
                }
                case 'getFiveRandomActivities': {
                    let results = db_data.slice(0,5)
                    return new Cursor(results)
                }
                default:
                    return new Cursor([])
            }
        }
    }
    updateOne(filter,updates,options) {
        let db_data = this.data.s.documents
        let elem = db_data.find(e => e['_id'] == filter['_id'])
        let res = Object.assign({},elem)
        Object.keys(updates).forEach( op => {
            switch (op) {
                case '$set': {
                    //only updating the published field
                    res['published'] = updates[op]['published']
                    break
                }
                case '$push': {
                    res.answers.push(updates[op]['answers'])
                    break
                }
                default: break
            }
        })
        return {result: res}
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
