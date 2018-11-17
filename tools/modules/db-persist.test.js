let axios = require('axios')
jest.mock('mongodb')
jest.mock('axios')
import * as db from './db-persist'
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
db-persist should have the following API:
    createUser(userData,userLogin) -> returns user if successful, error message if not
*/
describe('Testing connection', () => {
    const correctUser = {
        username: 'test',
        password: 'test'
    }
    const wrongUser = {
        username: 'wrong',
        password: 'wrong'
    }
    test('If authentication succeeds, user should be available', async done => {
        const result = await db.getUserByUsername('test')
        expect(result['username']).toBe('test')
        done()
    })

    test('If wrong user, authentication fails', async done => {
        try{
            const result = await db.getUserByUsername('test',wrongUser)
        }
        catch(err){
            expect(err.message).toBe('Authentication failed')
        }
        done()
    })
})
describe('Testing createUser', () => {
    beforeAll(() => {
        axios.mockImplementation((options) => {
            return new Promise((resolve,reject) => {
                if (options.hasOwnProperty('headers')){
                    resolve({data: options.headers['Authorization']})
                }
                else{
                    reject({
                        response: {
                            headers: {
                                'www-authenticate': 'Digest realm="MMS Public API", domain="", nonce="testnonce", algorithm=MD5, qop="auth", stale=false'
                            }
                        }
                    })
                }
            })
        })
    })
    test('If successfull, result should contain user information stored in public db', async done => {
        const userData = {
            username: 'test2',
            password: 'test'
        }
        const result = await db.createUser(userData)
        console.log(result)
        expect(result).toEqual(expect.objectContaining({username: 'test2'}))
        done()
    })
    test('if userData does not have the right schema, provide error message', async done => {
        const userData = {
            nofields: true
        }
        try{
            const result = await db.createUser(userData)
        }
        catch(result){
            expect(result.message).toBe('Not the right data')
        }
        done()
    })
})






