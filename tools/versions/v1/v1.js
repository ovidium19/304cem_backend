import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import path from 'path'
import users from './modules/users'
import mount from 'koa-mount'

const app = new koa()
const router = new Router()
router.get('/',async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    ctx.body = "/api/v1 - path"
})
app.use(mount('/user',users))
app.use(router.routes())
app.use(router.allowedMethods())

export default app
