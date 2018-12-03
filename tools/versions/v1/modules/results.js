import koa from 'koa'

import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'

import * as dbr from '../../../modules/results-persist'

const app = new koa()
app.use(koabp())
const router = new Router()

router.get('/:username', async ctx => {
    /*
    query:
        random=true .. random courses
        category= .. specify category
        page= .. specify page number
        limit = .. how many items per page
    */
   ctx.set('Allow','GET')
   try {
       if (ctx.get('error')) throw new Error(ctx.get('error'))
        let options = {
            user: ctx.state.user,
            ...ctx.query
        }
       let res = await dbr.getActivities(options)
       ctx.status = status.OK
       ctx.body = res
   }
   catch(err) {
       ctx.status = status.BAD_REQUEST
       ctx.body = {status: status.BAD_REQUEST, message: err.message}
   }
})
router.post('/', async ctx => {
    ctx.set('Allow','POST')
   try {
       if (ctx.get('error')) throw new Error(ctx.get('error'))
        let options = {
            user: ctx.state.user,
            data: ctx.request.body,
            ...ctx.query,

        }
       let res = await dbr.postResults(options)
       ctx.status = status.CREATED
       ctx.body = res
   }
   catch(err) {
        console.log(err)
       ctx.status = status.UNPROCESSABLE_ENTITY
       ctx.body = {status: status.UNPROCESSABLE_ENTITY, message: err.message}
   }
})
app.use(router.routes())
app.use(router.allowedMethods())

export default app
