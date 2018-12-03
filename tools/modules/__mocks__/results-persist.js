import { capitalize, schemaCheck } from '../utils'

const users = [
    {
        username: 'ovidium19',
        password: '304CEMWork'
    }
]
const results = [
    {
        username: 'test',
        category: 'random',
        answers: [
            {
                _id: 1,
                correct: true
            }
        ],
        passed: 1
    },
    {
        username: 'test',
        category: 'random',
        answers: [
            {
                _id: 1,
                correct: true
            }
        ],
        passed: 1
    }
]
const resultSchema = {
    username: '',
    category: '',
    answers: '',
    passed: ''
}
export async function postResults(options) {
    let schema = schemaCheck(resultSchema,options.data)
    if (!(schema.correct)) throw new Error(schema.message)
    return Promise.resolve({id: results.length})
}
