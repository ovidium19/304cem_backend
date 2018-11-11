import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import mount from 'koa-mount'
import path from 'path'
import users from './modules/users'

const app = new koa()
const port = 3030
app.use(koaBP())
const router = new Router()
app.use( async(ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Content-Type','application/json')
    ctx.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	await next()
})
router.get('/api', async ctx => {
    ctx.set('Allow','GET')
    ctx.status = status.OK
    ctx.body = "304CEM Api"
})
app.use(router.routes())
app.use(router.allowedMethods())
app.use(mount('/api/users',users))
const server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
export default server
