let axios = require('axios')
jest.mock('mongodb')
jest.mock('axios')
import * as db from './activity-persist'
import dotenv from 'dotenv'
import { getData } from 'mongodb'
const course = {
    _id: 432343,
    name: 'TestCourse'
}
dotenv.config()
let adminUser = {
    username: process.env.MONGO_ADMIN_USERNAME,
    password: process.env.MONGO_ADMIN_PASSWORD
}
let correctActivity = {
    username: '',
    name: '',
    category: '',
    blanks: '',
    options: '',
    text: '',
    styles: '',
    music: '',
    correctSound: '',
    incorrectSound: '',
    allow_feedback: '',
    allow_anon: '',
    published: '',
    under_review: ''
}
/*
activity-persist should have the following API:
    createUser(userData,userLogin) -> returns user if successful, error message if not
*/



describe("Testing db.getActivitiesByUsername",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        },

        options = {
            user,
            username: 'test',
            test: {
                func: 'getActivitiesByUsername'
            }
        }
    })
    test('If connection doesn\'t go through, get error', async done => {
        const user = {
            username: 'forceError',
            password: 'any'
        }

        const newOptions = Object.assign({},options,{user})
        try{
            const result = await db.publishActivity(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, result should be a list of activities", async done => {
        let result = await db.getActivitiesByUsername(options)
        expect(result.data[0].username).toBe('test')
        expect(result.count).toBe(7)
        done()
    })

    test("If page and limit are specified, expect results to have pagination", async done => {
        let newOptions = Object.assign({},options,{
            page: 2,
            limit: 3
        })
        let result = await db.getActivitiesByUsername(newOptions)
        expect(result.data[0]['_id']).toBe(4)
        done()
    })
})
describe("Testing db.getActivityById",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        },

        options = {
            user,
            id: 1,
            test: {
                func: 'getActivityById',
                id: 1
            }
        }
    })
    test('If connection doesn\'t go through, get error', async done => {
        const user = {
            username: 'forceError',
            password: 'any'
        }

        const newOptions = Object.assign({},options,{user})
        try{
            const result = await db.publishActivity(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, result should be an activity with the id specified", async done => {
        let result = await db.getActivityById(options)
        expect(result[0]['_id']).toBe(1)
        done()
    })

})


describe("Testing db.postActivity",() => {
    let user
    let activity
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        activity = {
            name: "Test Activity",
            username: "test"
        }
        options = {
            user,
            data: activity,
            test: {
                func: 'postActivity'
            }
        }
    })
    test('If schema doesn\'t match, expect error',async done => {
        try{
            const result = await db.postActivity(options)
        }
        catch(err){
            expect(err.message).toBe('Missing fields: category blanks options text styles music correctSound incorrectSound allow_feedback allow_anon published under_review')
        }
        done()
    })
    test('If connection doesn\'t go through, get error', async done => {
        const user = {
            username: 'forceError',
            password: 'any'
        }

        const newOptions = Object.assign({},options,{user, data: correctActivity})
        try{
            const result = await db.postActivity(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })


    test("If successful, activity should be inserted in the db", async done => {

        let newOptions = Object.assign({},options,{data: correctActivity})
        let result = await db.postActivity(newOptions)
        expect(result.id).toBe(8)
        done()
    })

})
describe("Testing db.updateActivity",() => {
    let user
    let activity
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        activity = {
            name: "Test Activity",
            username: "test",
            published: false,
            under_review: true
        }
        options = {
            user,
            data: activity,
            test: {
                func: 'updateActivity'
            }
        }
    })
    test('If schema doesn\'t match, expect error',async done => {
        try{
            const result = await db.updateActivity(options)
        }
        catch(err){
            expect(err.message).toBe('Missing fields: category blanks options text styles music correctSound incorrectSound allow_feedback allow_anon')
        }
        done()
    })
    test('If connection doesn\'t go through, get error', async done => {
        const user = {
            username: 'forceError',
            password: 'any'
        }

        const newOptions = Object.assign({},options,{user, data: correctActivity})
        try{
            const result = await db.postActivity(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })
    test('A republished activity will be re-inserted in review_activities db and updated in activities colection', async done => {
       let data = Object.assign({},correctActivity,options.data, {_id: 1})

       options.data = data
       const result = await db.updateActivity(options)

       expect(result.review.id).toBe(1)
       expect(result.activity['_id']).toBe(1)
       expect(result.activity.published).toBe(false)
       done()
    })
    test('An unpublished activity is updated without being put in the review_activities collection', async done => {
        let data = Object.assign({},correctActivity,options.data, {_id: 1})
        data.under_review = false
        options.data = data
        const result = await db.updateActivity(options)
        expect(result.hasOwnProperty('review')).toBe(false)
        expect(result.activity['_id']).toBe(1)
        expect(result.activity.published).toBe(false)
        done()
    })
})
describe("Testing db.publishActivity",() => {
    //it deletes the activity from review_activities
    //it updates the activity with published: true in activities db
    let user
    let activity
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        activity = {
            name: "Test Activity",
            username: "test",
            published: false,
            under_review: true,
            styles: {
                backgroundColor: 'blue'
            }
        }
        options = {
            user,
            data: activity,
            test: {
                func: 'publishActivity'
            }
        }
    })
    test('If schema doesn\'t match, expect error',async done => {
        try{
            const result = await db.publishActivity(options)
        }
        catch(err){
            expect(err.message).toBe('Missing fields: category blanks options text music correctSound incorrectSound allow_feedback allow_anon')
        }
        done()
    })
    test('If connection doesn\'t go through, get error', async done => {
        const user = {
            username: 'forceError',
            password: 'any'
        }

        const newOptions = Object.assign({},options,{user, data: correctActivity})
        try{
            const result = await db.publishActivity(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })
    test('If successful, expect result to contain properties delete_result and update_result', async done => {
       let data = Object.assign({},correctActivity,options.data, {_id: 1})

        options.data = data
        const result = await db.publishActivity(options)
        expect(result.delete_result.deletedCount).toBe(1)
        expect(result.update_result.activity['_id']).toBe(1)
        expect(result.update_result.activity.published).toBe(true)
        done()
    })

})
describe('Testing db.getActivitiesByUsername', () => {

})
describe("Testing db.postAnswer",() => {
    let user
    let answer
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        answer = {
           username: 'testuser',
           anon: false,
           time: 12,
           finished: true
        }
        options = {
            user,
            data: answer,
            id: 1,
            test: {
                func: 'postAnswer'
            }
        }
    })
    test("If successful, answer should be pushed to the array", async done => {
        let result = await db.postAnswer(options)
        expect(result.answers.length).toBe(3)
        done()
    })
})
