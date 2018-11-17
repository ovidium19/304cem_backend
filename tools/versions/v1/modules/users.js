import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'
import path from 'path'
import * as db from '../../../modules/db-persist'

const app = new koa()
app.use(koaBP())
app.use( async(ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('content-type','application/json')
	await next()
})
const port = 3030
const router = new Router()
router.get('/',async ctx => {
    ctx.set('Allow','GET')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.status = status.OK
        ctx.body = {path: '/api/v1/user - path'}
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.get('/:id', async ctx => {
    ctx.set('Allow', 'GET')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await db.getUserByUsername(ctx.params.id)
        console.log(res)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.post('/create', async ctx => {
    const user = ctx.request.body
    try{
        let res = await db.createUser(user)
        ctx.body = res
        ctx.status = status.CREATED
    }
    catch(err) {
        ctx.status = status.UNPROCESSABLE_ENTITY
        ctx.body = {status: status.UNPROCESSABLE_ENTITY, message: err.message}
    }
})
app.use(router.routes())
app.use(router.allowedMethods())

export default app
