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
/*
activity-persist should have the following API:
    createUser(userData,userLogin) -> returns user if successful, error message if not
*/

describe("Testing db.getActivityById",() => {
    test("If successful, result should be the activity", async done => {
        let result = await db.getActivityById(1)
        expect(result.username).toBe('test')
        done()
    })
    test("If wrong user, result should be error", async done => {

        try{
            let result = await db.getActivityById(1,{username: 'wrong',password: 'wrong'})
        }
        catch(err){
            expect(err.message).toBe('Authentication failed')
        }
        done()
    })
})
describe("Testing db.getActivitiesByCategory",() => {
    test("If successful, result should be a list of activities", async done => {
        let result = await db.getActivitiesByCategory('geography')
        expect(result[0].category).toBe('Geography')
        expect(result.length).toBe(5)
        done()
    })
    test("If page is specified, expect results to have pagination", async done => {
        let result = await db.getActivitiesByCategory('geography',2)
        expect(result[0]['_id']).toBe(6)
        done()
    })
})
describe("Testing db.getActivitiesByUsername",() => {
    test("If successful, result should be a list of activities", async done => {
        let result = await db.getActivitiesByUsername('test')
        expect(result[0].username).toBe('test')
        expect(result.length).toBe(5)
        done()
    })
    test("If page is specified, expect results to have pagination", async done => {
        let result = await db.getActivitiesByUsername('test',2)
        expect(result[0]['_id']).toBe(6)
        done()
    })
})
describe("Testing db.getActivitiesAnsweredByUser",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        options = {on: true, case: 'getActivitiesAnsweredByUser', username: 'test'}
    })
    test("If successful, result should be a list of activities", async done => {
        let result = await db.getActivitiesAnsweredByUser('test',1,5,user,options)
        expect(result.length).toBe(5)
        expect(result[0].answers.length).toBe(1)
        done()
    })
    test("If page is specified, expect results to have pagination", async done => {
        let result = await db.getActivitiesAnsweredByUser('test',2,5,user,options)
        expect(result.length).toBe(1)
        expect(result[0]['_id']).toBe(6)
        done()
    })
})
describe("Testing db.getFiveRandomActivities",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        options = {on: true, case: 'getFiveRandomActivities'}
    })
    test("If successful, result should be a list of  5 activities", async done => {
        let result = await db.getFiveRandomActivities(user,options)
        expect(result.length).toBe(5)
        done()
    })
})
describe("Testing db.postActivity",() => {
    let user
    let activity
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        activity = {
            name: "Test Activity",
            username: "test"
        }
    })
    test("If successful, activity should be inserted in the db", async done => {
        let result = await db.postActivity(activity,user)
        expect(result.id).toBe(8)
        done()
    })
})
describe("Testing db.updateActivity",() => {
    let user
    let partialActivity
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        }
        partialActivity = {
            _id: 1,
            styles: {
                backgroundColor: 'green'
            },
            published: false
        }
    })
    test("If successful, activity should be updated in the db", async done => {
        let result = await db.updateActivity(partialActivity,1,user)
        expect(result.published).toBe(false)
        done()
    })
})
describe("Testing db.postAnswer",() => {
    let user
    let answer
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
    })
    test("If successful, answer should be pushed to the array", async done => {
        let result = await db.postAnswer(answer,1,user)
        expect(result.answers.length).toBe(3)
        done()
    })
})
