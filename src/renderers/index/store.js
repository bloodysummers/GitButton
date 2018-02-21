const Store = require('electron-store')
const os = require('os')

const store = new Store()

// store.clear()
console.log(store.store)

if (!store.get('repositories')) {
    store.set('repositories', [])
}

exports.getRepositories = () => {
    return (store.get('repositories'))
}

exports.hashExists = (hash) => {
    let repositories = store.get('repositories')
    for (let i=0; i<repositories.length; i++) {
        if (hash == repositories[i].hash)
            return true
    }
    return false
}

exports.addRepository = (dir, hash) => {
    let repositories = store.get('repositories')
    let location, name
    let index = dir.lastIndexOf('/')
    if (index == -1)
        index = dir.lastIndexOf('\\')
    location = dir.slice(0, index)
    name = dir.slice(index + 1)
    repositories.push({
        location, name, hash, dir
    })
    repositories.sort(function(a, b) {
        var projectA = a.name.toUpperCase();
        var projectB = b.name.toUpperCase();
        return (projectA < projectB) ? -1 : (projectA > projectB) ? 1 : 0;
    });
    store.set('repositories', repositories)
    store.set('project', hash)
}

exports.deleteRepository = (hash) => {
    let repositories = store.get('repositories')
    let index
    let repository = repositories.map((repo, i) => {
        if (repo.hash == hash)
            index = i
    })
    repositories.splice(index, 1)
    store.set('repositories', repositories)
    if (repositories.length) {
        if (index == 0)
            store.set('project', repositories[0].hash)
        else
            store.set('project', repositories[index-1].hash)
    }

}

exports.getCurrentDirectory = (hash, getName) => {
    let repositories = store.get('repositories')
    if (repositories.length) {
        let repo = repositories.filter(repo => {
            return repo.hash == hash
        })
        if (getName)
            return repo[0].name
        else
            return repo[0].dir
    }
}

exports.setSelectedProject = (hash) => {
    store.set('project', hash)
}

exports.getSelectedProject = () => {
    return store.get('project')
}

exports.setFilesStatus = (files) => {
    store.set('files', files)
}

exports.getFilesStatus = () => {
    return store.get('files')
}
