import {schemaCheck} from '../utils'
import status from 'http-status-codes'
const users = [
    {
        username: 'ovidium19',
        password: '340CTWork',
        email: 'ovi'
    },
    {
        username: 'test',
        password: 'test',
        email: 'test'
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
    password: '',
    email: ''
}

export async function createUser(userData) {

    return new Promise(
        (resolve,reject) => {
            let schema = schemaCheck(userSchema,userData)

            if (!(schema.correct)) reject({
                response: {
                    status: status.UNPROCESSABLE_ENTITY,
                data: schema.message
                }
            })
            if (users.find(u => u.username == userData.username)){
                reject({
                    response: {
                        status: status.UNPROCESSABLE_ENTITY,
                        data: 'Username already exists'
                    }
                })
            }
            users.push(userData)
            resolve(users.find(u => u.username == userData.username))
        }
    )
}
export async function updateUser(options) {

}
export async function getUserByUsername(user){
    return new Promise((resolve,reject) => {
        let userFound = users.find(u => u.username == user.username)
        userFound ? resolve(userFound) : reject({message: 'Username not found'})
    })
}
export async function headlessConnection(user){
    return new Promise((resolve,reject) => {
        let resp = users.some(u => u.username == user.username)
        resp ? resolve() : reject()
    })
}
