/** @module v1 */
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

//If an unhandled error exists, we catch it here.
//This usually catches errors thrown by the basicAuth function
//basicAuth only throws one error, which is if Authorization header is not valid.
/** see {@link basicAuth} */
app.use( async (ctx,next) => {
    await next().catch(err => {
        ctx.status = status.UNAUTHORIZED
        ctx.body = {status: status.UNAUTHORIZED, message: err.message}
    })
})

/** this middleware analyzes the Authorization header, fetches the information from it and sets it
 * in ctx.state . Routes don't have to analyze this header now and can use ctx.state directly
 * If the Authorization header does not exist, this middleware will throw an error, which will be
 * handled in v1.js( see {@link v1}).
 */
app.use(basicAuth)

/**
 * This is where we mount the actual routes.
 * We are currently at /api/v1 and here we mount the following routes.
 * Route /users - handled by {@link users}
 * Route /activities - handled by {@link activities}
 * Route /results - handled by {@link results}
 */
app.use(mount('/users',users))
app.use(mount('/activities',activities))
app.use(mount('/results', results))
app.use(router.routes())
app.use(router.allowedMethods())

export default app
