/** @module basicAuth */

/**
 * Analyzes the request Authorization header.
 * Throws error if it doesn't exist or it's not valid.
 * Sets the ctx.state to the user credentials
 * @param {Context} ctx - Koa context
 * @param {Function} next - Koa middleware connector function
 */
export default async function(ctx,next) {
    if (!(ctx.get('Authorization')) || !(ctx.get('Authorization').indexOf('Basic ' == -1))){
        throw new Error('Authorization header is not present')
    }
    // verify auth credentials
   const base64Credentials =  ctx.get('Authorization').split(' ')[1]
   const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
   const [username, password] = credentials.split(':')

   ctx.state.user = {
       username,
       password
   }
   await next()
}
