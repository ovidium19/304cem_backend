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
   console.log(ctx.state.user)
   await next()
}
