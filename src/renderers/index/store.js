const Store = require('electron-store')
const os = require('os')

const store = new Store()

if (!store.get('repositories')) {
    store.set('repositories', [])
}

exports.getRepositories = () => {
    return (store.get('repositories'))
}

exports.addRepository = (dir) => {
    let repositories = store.get('repositories')
    let index = dir.lastIndexOf('/')
    let location, name
    if (index == -1)
        index = dir.lastIndexOf('\\')
    location = dir.slice(0, index)
    name = dir.slice(index + 1)
    repositories.push({
        location, name
    })
    store.set('repositories', repositories)
}