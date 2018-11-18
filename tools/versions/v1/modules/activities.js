import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'
import path from 'path'

import * as dba from '../../../modules/activity-persist'

const app = new koa()
app.use(koaBP())
app.use( async(ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('content-type','application/json')
	await next()
})
const router = new Router()
router.post('/create', async ctx => {
    ctx.set('Allow', 'POST')
    try {
        let page = ctx.query['page']
        let res = await dba.postActivity(ctx.request.body)
        ctx.status = status.ACCEPTED
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.UNPROCESSABLE_ENTITY
		ctx.body = {status: 'error', message: err.message}
    }
})
router.get('/randomset', async ctx => {
    ctx.set('Allow','GET')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let page = ctx.query['page']
        let res = await dba.getFiveRandomActivities()
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.get('/:id', async ctx => {
    ctx.set('Allow','GET PUT')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))

        let res = await dba.getActivityById(ctx.params.id)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.put('/:id', async ctx => {
    ctx.set('Allow','GET PUT')
    try {
        let res = await dba.updateActivity(ctx.request.body, ctx.params.id)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.get('/category/:cat', async ctx => {
    ctx.set('Allow','GET')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let page = ctx.query['page']
        let res = await dba.getActivitiesByCategory(ctx.params.cat,page ? page : 1)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})
router.get('/answered/:username', async ctx => {
    ctx.set('Allow','GET')
    try {
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        let page = ctx.query['page']
        let res = await dba.getActivitiesAnsweredByUser(ctx.params.username,page ? page : 1)
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
		ctx.body = {status: 'error', message: err.message}
    }
})

app.use(router.routes())
app.use(router.allowedMethods())

export default app
