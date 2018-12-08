import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import mount from 'koa-mount'
import morgan from 'koa-morgan'
import cors from 'koa-cors'
import path from 'path'
import * as db from './modules/db-persist'

import v1 from './versions/v1/v1'
require('dotenv').config()
const currentVersion = "v1"
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
app.use(morgan('tiny'))
app.use(cors({
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
    origin: true,
    headers: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true
}))
const router = new Router()
app.use( async(ctx, next) => {
    // ctx.set('Access-Control-Allow-Origin', '*')
    // ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    // ctx.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    ctx.set('content-type','application/json')
    await next()
})
router.get('/api', async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    try{
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.body = JSON.stringify(api_schema)
    }
    catch(err){
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
app.use(router.routes())
app.use(router.allowedMethods())
app.use(mount('/api/v1',v1))
const server = app.listen(port, () => {
    console.log(`Listening on ${port}`)
})


export default server
