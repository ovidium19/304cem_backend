import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import path from 'path'

const app = new koa()
const port = 3030
const router = new Router()
router.get('/',async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    ctx.body = "/api/user - path"
})
app.use(router.routes())
app.use(router.allowedMethods())

export default app
