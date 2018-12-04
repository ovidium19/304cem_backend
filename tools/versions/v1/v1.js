import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import path from 'path'
import users from './modules/users'
import activities from './modules/activities'
import results from './modules/results'
import mount from 'koa-mount'
import basicAuth from './modules/basicAuth'
const app = new koa()
const router = new Router()

app.use(async (ctx,next) => {
    await next().catch(err => {
        ctx.status = status.UNAUTHORIZED
        ctx.body = {status: status.UNAUTHORIZED, message: err.message}
    })
})
app.use(basicAuth)
app.use(mount('/users',users))
app.use(mount('/activities',activities))
app.use(mount('/results', results))
app.use(router.routes())
app.use(router.allowedMethods())

export default app
