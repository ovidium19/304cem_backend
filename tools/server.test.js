jest.mock('mongodb')
jest.mock('./modules/db-persist')
import * as db from './modules/db-persist'
import server from './server'
import status from 'http-status-codes'
import request from 'supertest'
/*
Normally I would have a test file for each different module, but because in each other module I would
have to import the server script, then the server script will attempt to listen on the same port every time.
Because of race conditions between server.close() and server.listen(), it is unpredictable if we will get a
EADDRINUSE error in our tests.
In order to avoid this, we test all our modules in this one script, and close the server only after the last
test suite has been executed
*/
async function runBeforeAll() {
    console.log('Testing server')
}
async function runAfterAll() {
    await server.close()
    console.log('Server closed')
}

describe('GET /api', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check body for api', async done => {
        const response = await request(server).get('/api')
        const expected = [{name: 'users'},{name: 'courses'}]
        expect(response.body).toEqual(expect.objectContaining({
            currentVersion: expect.any(String),
            routes: expect.any(Array)
        }))
        done()
    })

    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
	})
})
describe('GET /api/v1', () => {
    beforeAll(runBeforeAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('check body for api/v1', async done => {
        const response = await request(server).get('/api/v1')
        expect(response.body).toEqual(expect.objectContaining({path: expect.any(String)}))
        done()
    })
})

describe('GET /api/v1/user', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/user')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/user')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('check body for api/v1', async done => {
        const response = await request(server).get('/api/v1/user')
        expect(response.body).toEqual(expect.objectContaining({
            path: '/api/v1/user - path'
        }))
        done()
    })
})
describe('POST /api/v1/user/create', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('Check common headers' , async done => {
        //expect.assertions(2)
        const response = await request(server).post('/api/v1/user/create')
                            .expect(status.NOT_MODIFIED)
        //expect(response.status).toBe(status.OK)
        console.log(response.header)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })

    test('If successful, user should be added to the database and returned', async done => {
        const response = await request(server).post('/api/v1/user/create')
                            .set('Accept', 'application/json')
                            .send({username: 'test',password: 'test'})
                            .expect(status.CREATED)
        expect(response.body).toEqual(expect.objectContaining({username: 'test'}))
        done()
    })
})
