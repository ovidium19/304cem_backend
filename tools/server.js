import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import mount from 'koa-mount'
import morgan from 'koa-morgan'
import cors from 'koa-cors'
import v1 from './versions/v1/v1'

//Set environment variables
require('dotenv').config()

//current api version
const currentVersion = "v1"

//api schema.retrieved by accessing baseurl/api
const api_schema = {
    base: 'http://localhost:3030/',
    currentVersion: currentVersion,
    routes: [
        {
            path: '/api',
            description: 'Documentation for this api',
            methods : 'GET'
        },
        {
            path: `/api/${currentVersion}/user/create`,
            methods: 'POST',
            description: 'Create user in MongoDB with readWrite permission on database courses'
        },
        {
            path: `/api/${currentVersion}/courses`,
            method: 'POST',
            description: 'Create a course and add it to MongoDB "courses" database'
        },
        {
            path: `/api/${currentVersion}/courses/:id`,
            method: 'PUT',
            description: 'Update course with specified id'
        },
        {
            path: `/api/${currentVersion}/courses/:id`,
            method: 'GET',
            description: 'Get course with specified id'
        }

    ]
}
const app = new koa()
const port = 3030
app.use(koaBP())
//for debuggin requests
app.use(morgan('tiny'))

//cors setup
app.use(cors({
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
    origin: true,
    headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true
}))
const router = new Router()
//all responses are json
app.use( async(ctx, next) => {
    ctx.set('content-type','application/json')
    await next()
})
/**
 * On this route, we return the api_schema declared above
 */
router.get('/api', async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    try{
        /**
         * This line is in every route. It is there for testing purposes
         * I can force the catch block to execute by just passing a custom error called 'error'
         */
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.body = JSON.stringify(api_schema)
    }
    catch(err){
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
//use router
app.use(router.routes())
app.use(router.allowedMethods())

//mount version 1 of the api on the path /api/v1
app.use(mount('/api/v1',v1))
const server = app.listen(process.env.PORT || port, () => {
    console.log(`Listening on ${port}`)
})


export default server
