import koa from 'koa'

import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'
import path from 'path'

import * as dba from '../../../modules/activity-persist'

const app = new koa()
app.use(koabp())
const router = new Router()

router.get('/', async ctx => {
    /*
    query:
        random=true .. random courses
        category= .. specify category
        page= .. specify page number
        limit = .. how many items per page
    */
   ctx.set('Allow','GET, POST')
   try {
       if (ctx.get('error')) throw new Error(ctx.get('error'))
        let options = {
            user: ctx.state.user,
            ...ctx.query
        }
       let res = await dba.getActivities(options)
       ctx.status = status.OK
       ctx.body = res
   }
   catch(err) {
       ctx.status = status.BAD_REQUEST
       ctx.body = {status: status.BAD_REQUEST, message: err.message}
   }
})
router.post('/', async ctx => {
    ctx.set('Allow', 'GET, POST')
    let options = {
        data: ctx.request.body,
        user: ctx.state.user,
        ...ctx.query
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await dba.postActivity(options)
        ctx.status = status.CREATED
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.UNPROCESSABLE_ENTITY
		ctx.body = {status: status.UNPROCESSABLE_ENTITY, message: err.message}
    }
})
router.get('/for/:username', async ctx => {
    ctx.set('Allow','GET, POST')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
         let options = {
             user: ctx.state.user,
             ...ctx.query,
             ...ctx.params
         }
        let res = await dba.getActivitiesByUsername(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
        ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})
router.get('/:id', async ctx => {
    ctx.set('Allow','GET PUT')
    let options = {
        user: ctx.state.user,
        ...ctx.query,
        ...ctx.params
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))

        let res = await dba.getActivityById(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})
router.put('/:id', async ctx => {
    ctx.set('Allow','GET PUT')
    let options = {
        data: ctx.request.body,
        user: ctx.state.user,
        ...ctx.query,
        ...ctx.params
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await dba.updateActivity(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})
router.put('/:id/publish', async ctx => {
    ctx.set('Allow','PUT')
    let options = {
        data: ctx.request.body,
        user: ctx.state.user,
        ...ctx.query,
        ...ctx.params
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await dba.publishActivity(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})


router.put('/:id/answer', async ctx => {
    ctx.set('Allow', 'GET, POST')
    let options = {
        data: ctx.request.body,
        user: ctx.state.user,
        ...ctx.params,
        ...ctx.query
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await dba.postAnswer(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})
router.put('/:id/feedback', async ctx => {
    ctx.set('Allow', 'GET, POST')
    let options = {
        data: ctx.request.body,
        user: ctx.state.user,
        ...ctx.params,
        ...ctx.query
    }
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let res = await dba.postFeedback(options)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})

app.use(router.routes())
app.use(router.allowedMethods())

export default app
