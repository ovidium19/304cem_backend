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


describe("Testing db.getActivities", () => {
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
            allow_anon: true,
            category: 'Geography',
            test: {
                func: 'getActivities'
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
            const result = await db.getActivities(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, result should be a list of activities", async done => {
        let result = await db.getActivities(options)
        expect(result[0].allow_anon).toBe(true)
        expect(result.length).toBe(5)
        done()
    })
    test("If successful, result should be a list of activities -- no params", async done => {
        const {allow_anon, category, ...newOptions} = options
        let result = await db.getActivities(newOptions)
        expect(result[0].allow_anon).toBe(true)
        expect(result.length).toBe(5)
        done()
    })
})
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

    test("If successful, result should be a list of activities, with paramn", async done => {
        let newOptions = Object.assign({},options,{
            category: 'Geography',
            published: 'true'
        })
        let result = await db.getActivitiesByUsername(newOptions)
        expect(result.data[0].username).toBe('test')
        expect(result.count).toBe(7)
        done()
    })
    test("If successful, result should be a list of activities, with paramn", async done => {
        let newOptions = Object.assign({},options,{
            category: 'Geography',
            published: 'false'
        })
        let result = await db.getActivitiesByUsername(newOptions)
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
    test('If sort is specified, expect results to be sorted', async done => {
        let newOptions = Object.assign({},options,{
            sort: 'id'
        })
        let results = await db.getActivitiesByUsername(newOptions)
        console.log(results)
        expect(results.data[0]['_id']).toBe(1)
        done()
    })
})
describe("Testing db.getReviewActivities", () => {
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
                func: 'getReviewActivities'
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
            const result = await db.getReviewActivities(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, result should be a list of activities", async done => {
        let result = await db.getReviewActivities(options)
        expect(result.data[0].username).toBe('test')
        expect(result.count).toBe(7)
        done()
    })

    test("If page and limit are specified, expect results to have pagination", async done => {
        let newOptions = Object.assign({},options,{
            page: 2,
            limit: 3
        })
        let result = await db.getReviewActivities(newOptions)
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
            under_review: true,
            category: '',
            blanks: [],
            options: [],
            text: '',
            styles: {
                backgroundColor: '',
                color: ''
            },
            music: '',
            correctSound: '',
            incorrectSound: '',
            allow_feedback: true,
            allow_anon: true
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
       let newOptions = Object.assign({},options,{modifyState: true})
       options.data = data
       const result = await db.updateActivity(newOptions)
       expect(result.activity.under_review).toBe(true)
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
    test('Unpublishing an activity that is already under review will delete the activity from under_review and set the proper boolean for under_review field', async done => {
        let data = Object.assign({},correctActivity,options.data, {_id: 1})
        data.under_review = false
        data.published = false
        let newOptions = Object.assign({},options,{modifyState: true})
        newOptions.data = data
        let result = await db.updateActivity(newOptions)
        console.log(result)
        expect(result.activity.under_review).toBe(false)
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
describe('Testing db.declineActivity', () => {
    let user
    let id
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        options = {
            user,
            id: 1,
            test: {
                func: 'declineActivity'
            }
        }
    })

    test("If successful, activity should have under_review set to false and be deleted from review table", async done => {
        let result = await db.declineActivity(options)
        expect(result.delete_result.deletedCount).toBe(1)
        expect(result.update_result['result'].under_review).toBe(false)
        done()
    })
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
describe("Testing db.postFeedback",() => {
    let user
    let feedback
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        feedback = {
            text: '',
            rating: 2,
            username: ''
        }
        options = {
            user,
            data: feedback,
            id: 1,
            test: {
                func: 'postFeedback'
            }
        }
    })
    test("If successful, feedback should be pushed to the array", async done => {
        let result = await db.postFeedback(options)
        console.log(result)
        expect(result.feedback.length).toBe(1)
        done()
    })
})
