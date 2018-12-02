import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import * as db from '../../../modules/db-persist'
import basicAuth from './basicAuth'

/*
POST /signup
HEAD /login
GET /login
PUT /:username
*/


const app = new koa()
app.use(koaBP())
app.use( async(ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    ctx.set('Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS')
    ctx.set('content-type','application/json')
	await next()
})
const port = 3030
const router = new Router()
router.use(async (ctx,next) => {
    await next().catch(err => {
        ctx.status = status.UNAUTHORIZED
        ctx.body = {status: status.UNAUTHORIZED, message: err.message}
    })
})
router.use(basicAuth)

router.get('/',async ctx => {
    ctx.set('Allow','GET')

    try{
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.status = status.OK
        ctx.body = {
        path: '/api/v1/user - path',
        state: ctx.state.user
        }
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
        ctx.body = {status: status.NOT_FOUND, message: err.message}
    }
})

router.head('/login',async ctx => {
    ctx.set('Allow','GET, HEAD, OPTIONS')
    const user = ctx.state.user
    try{

        let res = await db.headlessConnection(user)
        ctx.status = status.OK
    }
    catch(err) {
        ctx.status = status.UNAUTHORIZED
    }
})
router.get('/login',async ctx => {
    ctx.set('Allow','GET, HEAD, OPTIONS')
    const user = ctx.state.user
    try{
        let res = await db.getUserByUsername(user)
        ctx.body = res
        ctx.status = status.OK
    }
    catch(err) {
        ctx.status = status.UNAUTHORIZED
        ctx.body = {status: status.UNAUTHORIZED, message: err.message}
    }
})

router.post('/signup', async ctx => {
    const userData = ctx.request.body
    const userLoginDetails = ctx.state.user
    const user = {...userData, ...userLoginDetails}
    try{
        let res = await db.createUser(user)
        ctx.body = res
        ctx.status = status.CREATED
    }
    catch(err) {
        console.log(err.response)
        ctx.status = err.response.status
        ctx.body = {status: err.response.status, data: err.response.data}
    }
})


app.use(router.routes())
app.use(router.allowedMethods())

export default app
