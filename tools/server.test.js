jest.mock('mongodb')
jest.mock('./modules/db-persist')
jest.mock('./modules/activity-persist')
import * as db from './modules/db-persist'
import * as dba from './modules/activity-persist'
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
                            .expect(status.UNPROCESSABLE_ENTITY)
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('If the schema is not correct, return error', async done => {
        const response = await request(server).post('/api/v1/user/create')
                            .set('Accept', 'application/json')
                            .send({username: 'testUser'})
                            .expect(status.UNPROCESSABLE_ENTITY)
        expect(response.body.message).toEqual('Not the right data')
        done()
    })
    test('If successful, user should be added to the database and returned', async done => {
        const response = await request(server).post('/api/v1/user/create')
                            .set('Accept', 'application/json')
                            .send({username: 'testUser2',password: 'test'})
                            .expect(status.CREATED)
        expect(response.body).toEqual(expect.objectContaining({username: 'testUser2'}))
        done()
    })
})
describe('GET /api/v1/user/:name', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/user/ovidium19')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/user/ovidium19')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('check body for api/v1/user/:name', async done => {
        const response = await request(server).get('/api/v1/user/ovidium19')
        expect(response.body).toEqual(expect.objectContaining({
            username: 'ovidium19'
        }))
        done()
    })
})

describe('GET /api/v1/activities/:id', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/activities/1')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/activities/1')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('api/v1/activities/1 should return a known value', async done => {
        const response = await request(server).get('/api/v1/activities/1')
        expect(response.body).toEqual(expect.objectContaining({
            username: 'test'
        }))
        done()
    })
})
describe('GET /api/v1/activities/catgory/:cat', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/activities/category/history')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/activities/category/history')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('Successfully calling should return a known value', async done => {
        const response = await request(server).get('/api/v1/activities/category/geography')
        expect(response.body[0]).toEqual(expect.objectContaining({
            category: 'Geography'
        }))
        expect(response.body.length).toBe(5)
        done()
    })
    test('Pagination works', async done => {
        const response = await request(server).get('/api/v1/activities/category/geography?page=2')
        expect(response.body[0]['_id']).toBe(6)
        done()
    })
})

describe('GET /api/v1/activities/answered/:username', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/activities/answered/test')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/activities/answered/test')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('Successfully calling should return a known value', async done => {
        const response = await request(server).get('/api/v1/activities/answered/test')
        console.log(response.body)
        expect(response.body.length).toBe(5)
        done()
    })
    test('Pagination works', async done => {
        const response = await request(server).get('/api/v1/activities/answered/test?page=2')

        expect(response.body[0]['_id']).toBe(6)
        done()
    })
})
describe('GET /api/v1/activities/randomset', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/activities/randomset')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/activities/randomset')
			.set('error', 'foo')
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('Successfully calling should return a known value', async done => {
        const response = await request(server).get('/api/v1/activities/randomset')
        expect(response.body.length).toBe(5)
        done()
    })
})

