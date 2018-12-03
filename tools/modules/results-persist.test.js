
jest.mock('mongodb')
jest.mock('axios')
import * as db from './results-persist'
import dotenv from 'dotenv'

dotenv.config()
const correctResult = {
    username: 'test',
    category: 'random',
    answers: [
        {
            _id: 1,
            correct: true
        }
    ],
    passed: 1
}
describe("Testing db.postResults",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        },

        options = {
            user,
            data: correctResult,
            test: {
                func: 'postResults',
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
            const result = await db.postResults(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, receive the inserted id", async done => {
        let result = await db.postResults(options)
        expect(result.id).toBe(5)
        done()
    })
    test('If not the right schema, receive error', async done => {
        try{
            let result = await db.postResults(Object.assign({},options,{data: {}}))
        }
        catch(err){
            expect(err.message).toBe('Missing fields: username category answers passed')
        }
        done()
    })
})
describe("Testing db.getResults",() => {
    let user
    let options
    beforeAll(() => {
        user = {
            username: 'test',
            password: 'test'
        },

        options = {
            user,
            test: {
                func: 'getResults'
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
            const result = await db.getResults(newOptions)
        }
        catch(err){
            expect(err.message).toBe('Connection not established')
        }
        done()
    })

    test("If successful, result should be a list of activities", async done => {
        let result = await db.getResults(options)
        expect(result.data[0].username).toBe('test')
        expect(result.count).toBe(4)
        done()
    })

    test("If page and limit are specified, expect results to have pagination", async done => {
        let newOptions = Object.assign({},options,{
            page: 2,
            limit: 3
        })
        let result = await db.getResults(newOptions)
        expect(result.data[0]['_id']).toBe(4)
        done()
    })
})
