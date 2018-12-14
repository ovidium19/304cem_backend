/** @module users */
import koa from 'koa'
import koaBP from 'koa-bodyparser'
import Router from 'koa-router'
import status from 'http-status-codes'
/**
 * Closely related to [db-persist]{@link db-persist}.
 */
import * as db from '../../../modules/db-persist'


/*
POST /signup
GET /login
PATCH /user/:username
*/


const app = new koa()
app.use(koaBP())

const router = new Router()

/**
 * GET /api/v1/users
 * At the moment this function is just for testing purposes, it returns nothing valuable.
 */
router.get('/',async ctx => {
    ctx.set('Allow','GET')

    try{
        if (ctx.get('error')) throw new Error(ctx.get('error'))
        ctx.status = status.OK
        ctx.body = {
        path: '/api/v1/user - path',
        state: ctx.state.user
        }
    }
    catch(err) {
        ctx.status = status.NOT_FOUND
        ctx.body = {status: status.NOT_FOUND, message: err.message}
    }
})

/**
 * Route: GET /api/v1/users/login
 * No params or queries expected.
 * No body expected.
 * Takes the user corresponding to the Authorization header and calls [getUserByUsername]{@link db-persist#getUserByUsername}
 * Does not return an error if user is not found.
 * Responses:
 *  200: User object is retrieved.
 *  401: User has no access to the database.
 * Returns:
 * See [getUserByUsername]{@link db-persist#getUserByUsername} for a look at result shape.
 */
router.get('/login',async ctx => {
    ctx.set('Allow','GET, HEAD, OPTIONS')
    const user = ctx.state.user
    try{
        let res = await db.getUserByUsername(user)
        console.log(res)
        ctx.body = res
        ctx.status = status.OK
    }
    catch(err) {
        ctx.status = status.UNAUTHORIZED
        ctx.body = {status: status.UNAUTHORIZED, message: err.message}
    }
})
/**
 * Route: POST /api/v1/users/signup
 * No params or queries expected.
 * Body - User data: {email, roles}
 * Takes the user corresponding to the Authorization header and calls [createUser]{@link db-persist#createUser}
 * Does not return an error if user is not found.
 * Responses:
 *  200: User object is retrieved.
 *  401: User has no access to the database.
 * Returns:
 * See [createUser]{@link db-persist#createUser} for a look at result shape.
 */
router.post('/signup', async ctx => {
    ctx.set('Allow','POST, OPTIONS')
    const userData = ctx.request.body
    const userLoginDetails = ctx.state.user
    const user = {...userData, ...userLoginDetails}
    try{
        let res = await db.createUser(user)
        ctx.body = res
        ctx.status = status.CREATED
    }
    catch(err) {
        ctx.status = status.UNPROCESSABLE_ENTITY
        console.log(err)
        ctx.body = {status: err.response.status, message: err.response.data}
    }
})
/**
 * Route: PATCH /api/v1/users/user/:username
 * No params or queries expected.
 * Body: Should include details about the updated roles of the user: {string} roles
 * Takes the user corresponding to the Authorization header and calls [updateUser]{@link db-persist#updateUser}
 *
 * Responses:
 *  200: User object is retrieved and updated.
 *  422: User data is not valid (wrong schema).
 * Returns:
 * See [updateUser]{@link db-persist#updateUser} for a look at result shape.
 */
router.patch('/user/:username', async ctx => {
    ctx.set('Allow','PATCH, OPTIONS')
    const options = {
        user: ctx.state.user,
        data: ctx.request.body,
        ...ctx.params
    }
    try{
        let res = await db.updateUser(options)
        ctx.body = res
        ctx.status = status.OK
    }
    catch(err) {
        if (err.message == 'authentication fail') ctx.status = status.UNAUTHORIZED
        else  ctx.status = status.UNPROCESSABLE_ENTITY

        ctx.body = {status: ctx.status, message: err.message}
    }
})


app.use(router.routes())
app.use(router.allowedMethods())

export default app
