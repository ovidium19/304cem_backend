import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import path from 'path'
import users from './modules/users'
import activities from './modules/activities'
import mount from 'koa-mount'

const app = new koa()
const router = new Router()
router.get('/',async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    try{
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.body = {path: "/api/v1 - path"}
    }
    catch(err){
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }

})
app.use(mount('/users',users))
app.use(mount('/activities',activities))
app.use(router.routes())
app.use(router.allowedMethods())

export default app
