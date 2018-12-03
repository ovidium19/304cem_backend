import { capitalize, schemaCheck } from '../utils'
const users = [
    {
        username: 'ovidium19',
        password: '304CEMWork'
    }
]
const activities =  [
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
            }]
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
const activitySchema = {
    username: '',
    name: ''
}
export async function getActivityById(id,user){
    return new Promise((resolve,reject) => {
        resolve(activities.find(a => a['_id'] == id))
    })
}
export async function getActivitiesByCategory(cat,page = 1,perPage = 5, user){

    return new Promise((resolve,reject) => {
        let results = activities.filter((elem,index) => {
            return (index >= ((page-1) * perPage) && index<=(page*perPage-1) && elem.category == capitalize(cat))
        })
        resolve(results)
    })
}
export async function getActivitiesAnsweredByUser(username,page = 1,perPage = 5, user, options){

    return new Promise((resolve,reject) => {
        let results = activities.reduce((p,c,i) => {
            let cond = c.answers.find(a => a.username == username )
            if ( i >= ((page-1) * perPage) && i <= (page*perPage-1) && cond ) {
                return p.concat(Object.assign({},c,{answers: [cond]}))
            }
            return p
        }, [])
        resolve(results)
    })
}
export async function getFiveRandomActivities(user,options){
    return new Promise((resolve,reject) => {
        let results = activities.slice(0,5)
        resolve(results)
    })
}

export async function postActivity(activity,user) {
    if (!(schemaCheck(activitySchema,activity))) throw new Error('Activity doesn\'t match schema')
    return new Promise((resolve,reject) => {
         resolve({ id: activities.length + 1})
    })
}
export async function updateActivity(options) {
    return new Promise((resolve,reject) => {
         let elem = activities.find(a => a['_id'] == options.id)
         elem['published'] = false
         resolve(Object.assign({}, elem))
    })
}
export async function publishActivity(options) {
    return new Promise((resolve,reject) => {
        let elem = Object.assign({},activities.find(a => a['_id'] == options.id))
        elem['under_review'] = false
        resolve(elem)
   })
}
export async function getActivitiesByUsername(options) {
    return new Promise((resolve,reject) => {
        let elems = activities.filter(a => a['username'] == options.username)
        let count = elems.length
        resolve({
            count,
            data: elems
        })
   })
}
export async function postAnswer(answer,id,user) {
    return new Promise((resolve,reject) => {
         let elem = activities.find(a => a['_id'] == id)
         if (!elem) reject('Not found')
         let res = Object.assign({},elem)
         res.answers.push(answer)
         resolve(res)
    })
}
