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
        console.log(result)
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
