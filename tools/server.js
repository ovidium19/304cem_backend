import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
import mount from 'koa-mount'
import path from 'path'
import * as db from './modules/db-persist'

import v1 from './versions/v1/v1'
require('dotenv').config()
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
    try{
        const collections = await db.fetchCollections()
        const names = collections.map(c => {
            return {
                name: c.s.name
            }
        })
        ctx.body = names
    }
    catch(err){
        console.log(err)
    }
})
app.use(router.routes())
app.use(router.allowedMethods())
app.use(mount('/api/v1',v1))
const server = app.listen(port, async() => {
    console.log(`Listening on port ${port}`)
    try{
        await db.connect(process.env.MONGO_DBNAME)
    }
    catch(err) {
        console.log(err.message)
    }
})
// ctrl-c to trigger
process.on('SIGINT', async () => {
    // let's shut everything down!
    console.log("shutting down...")
    try{
        await db.close()
    }
    catch(err) {
        console.log(err.message)
    }
    server.close(function() {
      console.log("shut down!")
      process.exit()
    })
  })


export default server
