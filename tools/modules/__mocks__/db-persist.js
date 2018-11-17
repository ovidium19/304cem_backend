const users = [
    {
        username: 'ovidium19',
        password: '304CEMWork'
    }
]
const courses = [
    {
        _id: 1,
        name: 'CourseTest'
    }
]
const userSchema = {
    username: '',
    password: ''
}
function schemaCheck(schema,data) {
     return Object.keys(schema).reduce((p,c,i) => p && data.hasOwnProperty(c), true)

}
export async function createUser(userData) {

    return new Promise(
        (resolve,reject) => {
        if (!(schemaCheck(userSchema,userData))) reject({message: 'Not the right data'})
        if (users.find(u => u.username == userData.username)){
            reject({message: 'Username is in use'})
        }
        users.push(userData)
        resolve(users.find(u => u.username == userData.username))
        }
    )
}
