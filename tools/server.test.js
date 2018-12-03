jest.mock('mongodb')
jest.mock('./modules/db-persist')
jest.mock('./modules/activity-persist')
import server from './server'
import status from 'http-status-codes'
import request from 'supertest'
import btoa from 'btoa'
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
describe('Test unauthorized access to /users', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
		//expect.assertions(2)
        const response = await request(server).get('/api/v1/users')
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		expect(response.header['content-type']).toContain('application/json')
		done()
    })
    test('Check that route is restricted by lack of Authorization header', async done => {
        const response = await request(server).get('/api/v1/users')
        expect(response.status).toEqual(status.UNAUTHORIZED)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('Authorization header is not present')
		done()
    })
})
describe('GET /api/v1/users authenticated', () => {
    let authHeader
    let authHeaderWrongUser
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        authHeaderWrongUser = 'Basic ' + btoa('wrong:wrong')
    })
    afterAll(runAfterAll)


    test('check for NOT_FOUND status if database down', async done => {
		const response = await request(server).get('/api/v1/users')
			.set('error', 'foo').set('Authorization',authHeader)
        expect(response.status).toEqual(status.NOT_FOUND)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('check body for api/v1/users', async done => {
        const response = await request(server).get('/api/v1/users').set('Authorization', authHeader)
        expect(response.body).toEqual(expect.objectContaining({
            path: '/api/v1/user - path'
        }))
        done()
    })
})
describe('POST /api/v1/users/signup', () => {
    let authHeader
    let newUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        newUserHeader = 'Basic ' + btoa('wrong:wrong')
    })
    afterAll(runAfterAll)

    test('Check common headers' , async done => {
        //expect.assertions(2)
        const response = await request(server).post('/api/v1/users/signup')
                            .expect(status.UNAUTHORIZED)
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('If the schema is not correct, return error', async done => {
        const response = await request(server).post('/api/v1/users/signup')
                            .set('Accept', 'application/json')
                            .set('Authorization', authHeader)
                            .expect(status.UNPROCESSABLE_ENTITY)
        expect(response.body.message).toEqual('Missing fields: email')
        done()
    })
    test('If username already exists, we get error', async done => {
        const response = await request(server).post('/api/v1/users/signup')
                                .set('Accept', 'application/json')
                                .set('Authorization', authHeader)
                                .send({email: 'ovidium10@yahoo.com'})
                                .expect(status.UNPROCESSABLE_ENTITY)
        expect(response.body.message).toEqual('Username already exists')
        done()
    })
    test('If successful, user should be added to the database and returned', async done => {
        const response = await request(server).post('/api/v1/users/signup')
                                .set('Accept', 'application/json')
                                .set('Authorization', newUserHeader)
                                .send({email: 'ovidium10@yahoo.com'})
                                .expect(status.CREATED)
        expect(response.body).toEqual(expect.objectContaining({username: 'wrong'}))
        done()
    })
})

describe('GET /login', () => {
    let authHeader
    let wrongUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        wrongUserHeader = 'Basic ' + btoa('wrong2:wrong2')
    })
    afterAll(runAfterAll)

    test('Check common headers' , async done => {
        //expect.assertions(2)
        const response = await request(server).get('/api/v1/users/login')
                            .expect(status.UNAUTHORIZED)
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('If successful, user exists and we get its data back', async done => {
        const response = await request(server).get('/api/v1/users/login')
                                .set('Accept', 'application/json')
                                .set('Authorization', authHeader)
                                .expect(status.OK)
        expect(response.body).toEqual(expect.objectContaining({email: 'test'}))
        done()
    })
    test('If user doesn\'t exist, expect UNAUTHORIZED', async done => {
        const response = await request(server).get('/api/v1/users/login')
                                .set('Accept', 'application/json')
                                .set('Authorization', wrongUserHeader)
                                .expect(status.UNAUTHORIZED)
        expect(response.body.message).toEqual('Username not found')
        done()
    })
})
describe('HEAD /login', () => {
    let authHeader
    let wrongUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        wrongUserHeader = 'Basic ' + btoa('wrong3:wrong3')
    })
    afterAll(runAfterAll)

    test('Check common headers' , async done => {
        //expect.assertions(2)
        const response = await request(server).head('/api/v1/users/login')
                            .expect(status.UNAUTHORIZED)
        //expect(response.status).toBe(status.OK)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('If successful, user exists and we get confirmation', async done => {
        const response = await request(server).head('/api/v1/users/login')
                                .set('Accept', 'application/json')
                                .set('Authorization', authHeader)
                                .expect(status.OK)
        done()
    })
    test('If user doesn\'t exist, expect UNAUTHORIZED', async done => {
        const response = await request(server).head('/api/v1/users/login')
                                .set('Accept', 'application/json')
                                .set('Authorization', wrongUserHeader)
                                .expect(status.UNAUTHORIZED)
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
        expect(response.body.length).toBe(5)
        done()
    })
    test('Pagination works', async done => {
        const response = await request(server).get('/api/v1/activities/answered/test?page=2')

        expect(response.body[0]['_id']).toBe(6)
        done()
    })
})
describe('GET /activities/for/:username', () => {
    let authHeader
    let wrongUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        wrongUserHeader = 'Basic ' + btoa('wrong2:wrong2')
    })
    afterAll(runAfterAll)

    test('check common response headers', async done => {
        const response = await request(server).get('/api/v1/activities/for/test').set('Authorization', authHeader)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
        const response = await request(server).get('/api/v1/activities/for/test')
                                                .set('Authorization', authHeader)
                                                .set('error','foo')
        expect(response.status).toEqual(status.BAD_REQUEST)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('This is a protected resource', async done => {
        const response = await request(server).get('/api/v1/activities/for/test').expect(status.UNAUTHORIZED)
        done()
    })
    test('if successful, return value should be a list of activities and a count', async done => {
        const response = await request(server).get('/api/v1/activities/for/test')
                                            .set('Authorization', authHeader)
                                            .expect(status.OK)
        console.log(response.body)
        expect(response.body.count).toBeGreaterThanOrEqual(1)
        expect(response.body.data.length).toEqual(response.body.count)
        done()
    })
})
describe('PUT /api/v1/activities/:id', () => {
    let authHeader
    let wrongUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        wrongUserHeader = 'Basic ' + btoa('wrong2:wrong2')
    })
    afterAll(runAfterAll)

    test('check common response headers', async done => {
        const response = await request(server).put('/api/v1/activities/1').set('Authorization', authHeader)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
        const response = await request(server).put('/api/v1/activities/1')
                                                .set('Authorization', authHeader)
                                                .set('error','foo')
        expect(response.status).toEqual(status.BAD_REQUEST)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('This is a protected resource', async done => {
        const response = await request(server).put('/api/v1/activities/1').expect(status.UNAUTHORIZED)
        done()
    })
    test('if successful, return value should be the activity changed', async done => {
        let partialActivity = {
            published: false
        }
        const response = await request(server).put('/api/v1/activities/1')
                                            .set('Authorization', authHeader)
                                            .send(partialActivity)
                                            .expect(status.OK)
        expect(response.body.published).toEqual(false)
        done()
    })
})
describe('PUT /activities/:id/publish', () => {
    let authHeader
    let wrongUserHeader
    beforeAll(() => {
        authHeader = 'Basic ' + btoa('test:test')
        wrongUserHeader = 'Basic ' + btoa('wrong2:wrong2')
    })
    afterAll(runAfterAll)

    test('check common response headers', async done => {
        const response = await request(server).put('/api/v1/activities/1/publish').set('Authorization', authHeader)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('check for NOT_FOUND status if database down', async done => {
        const response = await request(server).put('/api/v1/activities/1/publish')
                                                .set('Authorization', authHeader)
                                                .set('error','foo')
        expect(response.status).toEqual(status.BAD_REQUEST)
		const data = JSON.parse(response.text)
		expect(data.message).toBe('foo')
		done()
    })
    test('This is a protected resource', async done => {
        const response = await request(server).put('/api/v1/activities/1/publish').expect(status.UNAUTHORIZED)
        done()
    })
    test('if successful, return value should be the activity with under_review set to false', async done => {
        let partialActivity = {
            published: false
        }
        const response = await request(server).put('/api/v1/activities/1/publish')
                                            .set('Authorization', authHeader)
                                            .send(partialActivity)
                                            .expect(status.OK)
        expect(response.body.under_review).toEqual(false)
        done()
    })
})
describe('PUT /api/v1/activities/:id/answer', () => {
    beforeAll(runBeforeAll)
    afterAll(runAfterAll)

    test('check common response headers', async done => {
        const response = await request(server).put('/api/v1/activities/10/answer').expect(status.NOT_FOUND)
		expect(response.header['access-control-allow-origin']).toBe('*')
		done()
    })
    test('If activity is not found, error must be returned', async done => {
        let answer = {
            correct: true
        }
        const response = await request(server).put('/api/v1/activities/10/answer')
                                            .send(answer)
                                            .expect(status.NOT_FOUND)
        done()

    })
    test('if successful, return value should be the activity with the answer pushed', async done => {
        let answer = {
            correct: true
        }
        const response = await request(server).put('/api/v1/activities/1/answer')
                                            .send(answer)
                                            .expect(status.OK)
        console.log(response.body)
        expect(response.body.answers.length).toEqual(3)
        done()
    })
})

