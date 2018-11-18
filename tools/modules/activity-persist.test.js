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
