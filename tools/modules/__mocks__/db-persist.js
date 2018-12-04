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
    email: '',
    roles: ''
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

            resolve(userData)
        }
    )
}
export async function updateUser(options) {
    return new Promise(
        (resolve,reject) => {
            console.log(options)
            if (users.find(u => u.username == options.user.username)){
                resolve({
                    adminUpdate: {
                        roles: options.data.roles
                    },
                    userUpdate: {
                        nModified: 1
                    }
                })
            }
            reject({
                message: 'Username doesn\'t exist'
            })
        }
    )
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
