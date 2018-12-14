/**@module activities */
import koa from 'koa'

import Router from 'koa-router'
import koabp from 'koa-bodyparser'
import status from 'http-status-codes'
import path from 'path'

/** closely related to [activity-persist]{@link activity-persist} */
import * as dba from '../../../modules/activity-persist'

const app = new koa()
app.use(koabp())
const router = new Router()
/**
 * Available Routes:
 *
 * GET /
 * POST /
 * GET /for/:username
 * GET /:id
 * PUT /:id
 * PUT /:id/publish
 * PUT /:id/answer
 * PUT /:id/feedback
 */

 /**
 * Route: GET /api/v1/activities
 * @params:
 *  @param category - can be any of the available categories, or random
 *  @param page - specify which page to get
 *  @param limit - specify how many items per page
 *  @param review - if it exists, activities are fetched from the review_activities collection, otherwise from the activities collection
 *  @param allow_anon - if set, only activities that allow anonymous answers will be fetched
 * Body: See [ Shape] [getActivities]{@link activity-persist#getActivities}
 * Body: If review is set, see  [getReviewActivities]{@link activity-persist#getReviewActivities}
 * Takes the user corresponding to the Authorization header and calls [getActivities]{@link activity-persist#getActivities} for that user.
 *
 * Responses:
 *  200: List of activities and a count
 *  401: User has no access to the database.
 *  400: Bad Request, missed some parameters
 * Returns:
 * See [getActivities]{@link activity-persist#getActivities} for a look at result shape.
 * See [getReviewActivities]{@link activity-persist#getReviewActivities} if you pass the review param
 */
router.get('/', async ctx => {
    /*
    query:

        category= .. specify category
        page= .. specify page number
        limit = .. how many items per page
        review = .. gets all review_activities instead
    */
   ctx.set('Allow','GET, POST')
   try {
       if (ctx.get('error')) throw new Error(ctx.get('error'))
        let options = {
            user: ctx.state.user,
            ...ctx.query
        }
        let res
        if (options.review) {
            res = await dba.getReviewActivities(options)
        }
        else {
            res = await dba.getActivities(options)
        }

       ctx.status = status.OK
       ctx.body = res
   }
   catch(err) {
       ctx.status = status.BAD_REQUEST
       ctx.body = {status: status.BAD_REQUEST, message: err.message}
   }
})
/**
 * Route: POST /api/v1/activities
 * Body: See [ Shape] [postActivity]{@link activity-persist#postActivity}
 * Takes the user corresponding to the Authorization header and calls [postActivity]{@link activity-persist#postActivity} for that user.
 *
 * Responses:
 *  201: The id of the newly inserted result is retrieved
 *  401: User has no access to the database.
 *  422: Bad Request, missed some parameters
 * Returns:
 * See [postActivity]{@link activity-persist#postActivity} for a look at result shape.
 */
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
/**
 * Route: GET /api/v1/activities/for/:username
 * :username - what username to fetch activities for
 * @params:
 *  @param category - can be any of the available categories, or random
 *  @param page - specify which page to get
 *  @param limit - specify how many items per page
 *  @param published - set to true or false, retrieves activities which are either published or not. Can be undefined, i which case it doesnt look at published
 *  @param sort - Sort by a certain value. can be any of [avg_time, avg_rating, timestamp, total_answers]
 * Body: See [ Shape] [getActivitiesByUsername]{@link activity-persist#getActivitiesByUsername}
 * Takes the user corresponding to the Authorization header and calls [getActivitiesByUsername]{@link activity-persist#getActivitiesByUsername} for that user.
 *
 * Responses:
 *  200: A list of activities and a count field which represents all activities that match the params.
 *  401: User has no access to the database.
 *  400: Bad Request, missed some parameters
 * Returns:
 * See [getActivitiesByUsername]{@link activity-persist#getActivitiesByUsername} for a look at result shape.
 */
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
/**
 * Route: GET /api/v1/activities/:id
 * :id - ID of activity
 * Body: See [ Shape] [getActivityById]{@link activity-persist#getActivityById}
 * Takes the user corresponding to the Authorization header and calls [getActivityById]{@link activity-persist#getActivityById} for that user.
 *
 * Responses:
 *  200: Array of length 0 or 1
 *  401: User has no access to the database.
 *  400: Bad Request
 * Returns:
 * See [getActivityById]{@link activity-persist#getActivityById} for a look at result shape.
 */
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

/**
 * Route: PUT /api/v1/activities/:id
 * :id - ID of activity
 * Body: See [ Shape] [updateActivity]{@link activity-persist#updateActivity}
 * Takes the user corresponding to the Authorization header and calls [updateActivity]{@link activity-persist#updateActivity} for that user.
 *
 * Responses:
 *  200: The call was successfull
 *  401: User has no access to the database.
 *  400: Bad Request
 * Returns:
 * See [updateActivity]{@link activity-persist#updateActivity} for a look at result shape.
 */
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
/**
 * Route: PUT /api/v1/activities/:id/publish
 * :id - ID of activity
 * No body expected
 * Takes the user corresponding to the Authorization header and calls [publishActivity]{@link activity-persist#publishActivity} for that user.
 *
 * Responses:
 *  200: The call was successfull
 *  401: User has no access to the database.
 *  400: Bad Request
 * Returns:
 * See [publishActivity]{@link activity-persist#publishActivity} for a look at result shape.
 */
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
        let res
        if (options.remove) {
            res = await dba.declineActivity(options)
        }
        else{
            res = await dba.publishActivity(options)
        }
        ctx.status = status.OK
        ctx.body = res
    }
    catch(err) {
        ctx.status = status.BAD_REQUEST
		ctx.body = {status: status.BAD_REQUEST, message: err.message}
    }
})

/**
 * Route: PUT /api/v1/activities/:id/answer
 * :id - ID of activity
 * data: Feedback object:
 * {
 * username,
 * text,
 * rating
 * }
 * Body: See [ Shape] [postAnswer]{@link activity-persist#postAnswer}
 * Takes the user corresponding to the Authorization header and calls  [postAnswer]{@link activity-persist#postAnswer} for that user.
 *
 * Responses:
 *  200: The call was successfull
 *  401: User has no access to the database.
 *  400: Bad Request
 * Returns:
 * See  [postAnswer]{@link activity-persist#postAnswer} for a look at result shape.
 */
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

/**
 * Route: PUT /api/v1/activities/:id/feedback
 * :id - ID of activity
 * Body: See [Shape] [postFeedback]{@link activity-persist#postFeedback}
 * Takes the user corresponding to the Authorization header and calls   [postFeedback]{@link activity-persist#postFeedback} for that user.
 *
 * Responses:
 *  200: The call was successfull
 *  401: User has no access to the database.
 *  400: Bad Request
 * Returns:
 * See   [postFeedback]{@link activity-persist#postFeedback} for a look at result shape.
 */
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
