const users = [
    {
        username: 'ovidium19',
        password: '304CEMWork'
    }
]
const activities =  [{
    _id: 1,
    name: 'Git',
    username: 'test'
}]
const activitySchema = {
    username: '',
    name: ''
}
function schemaCheck(schema,data) {
     return Object.keys(schema).reduce((p,c,i) => p && data.hasOwnProperty(c), true)

}
export async function getActivityById(id,user){
    return new Promise((resolve,reject) => {
        resolve(activities.find(a => a.id == id))
    })
}
