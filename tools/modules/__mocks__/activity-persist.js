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
            }],
        feedback: []
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
    name: '',
    published: ''
}
export async function getActivityById(options){
    return new Promise((resolve,reject) => {
        resolve([activities.find(a => a['_id'] == options.id)])
    })
}

export async function getActivities(options) {
    return new Promise((resolve,reject) => {

        let count = activities.length
        resolve({
            count,
            data: activities
        })
   })
}
export async function getReviewActivities(options) {
    return new Promise((resolve,reject) => {

        let count = activities.length
        resolve({
            count,
            data: activities
        })
   })
}

export async function postActivity(options) {
    let schema = schemaCheck(activitySchema,options.data)
    if (!(schema.correct)) throw new Error(schema.message)
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
export async function declineActivity(options) {
    return new Promise((resolve,reject) => {
        let elem = Object.assign({},activities.find(a => a['_id'] == options.id))
        elem['under_review'] = false
        elem['published'] = false
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
export async function postAnswer(options) {
    return new Promise((resolve,reject) => {
         let elem = activities.find(a => a['_id'] == options.id)
         let res = Object.assign({},elem)
         res.answers.push(options.data)
         resolve(res)
    })
}
export async function postFeedback(options) {
    return new Promise((resolve,reject) => {
         let elem = activities.find(a => a['_id'] == options.id)
         let res = Object.assign({},elem)
         res.feedback.push(options.data)
         resolve(res)
    })
}
