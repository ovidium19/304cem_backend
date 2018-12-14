import koa from 'koa'
/** @module results */
import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'
/**
 * Closely related to [results-persist]{@link results-persist}
 */
import * as dbr from '../../../modules/results-persist'

const app = new koa()
app.use(koabp())
const router = new Router()
/**
 * Handled routes:
 * GET /
 * POST /
 */


/**
 * Route: GET /api/v1/results
 * @param page - Speccify which page
 * @param limit - Specify how many items
 * No body expected.
 * Takes the user corresponding to the Authorization header and calls [getResults]{@link results-persist#getResults} for that user.
 *
 * Responses:
 *  200: List of results is retrieved. Can be empty
 *  401: User has no access to the database.
 *  400: Params are not good or the request is wrong.
 * Returns:
 * See [getResults]{@link results-persist#getResults} for a look at result shape.
 */
router.get('/', async ctx => {
    /*
    query:
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
       let res = await dbr.getResults(options)
       ctx.status = status.OK
       ctx.body = res
   }
   catch(err) {
       ctx.status = status.BAD_REQUEST
       ctx.body = {status: status.BAD_REQUEST, message: err.message}
   }
})

/**
 * Route: POST /api/v1/results
 * Body: See [Result Shape]{@link results-persist}
 * Takes the user corresponding to the Authorization header and calls [postResult]{@link results-persist#postResults} for that user.
 *
 * Responses:
 *  200: The id of the newly inserted result is retrieved
 *  401: User has no access to the database.
 *  422: Result body is not correct
 * Returns:
 * See [postResults]{@link results-persist#postResults} for a look at result shape.
 */
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
       ctx.status = status.UNPROCESSABLE_ENTITY
       ctx.body = {status: status.UNPROCESSABLE_ENTITY, message: err.message}
   }
})
app.use(router.routes())
app.use(router.allowedMethods())

export default app
