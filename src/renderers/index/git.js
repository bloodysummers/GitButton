const exec = require('child_process').exec

exports.checkGitStatus = (dir, callback) => {
    let status
    exec("git status", {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (err) status = 'unknown'
        else if (/nothing to commit/.test(stdout)) status = 'clean'
        else status = 'dirty'
        if (callback)
            callback(status)
    })
}

exports.hashDirectory = (dir, callback) => {
    exec(`echo "${dir}" | git hash-object --stdin`, (err, stdout, stderr) => {
        if (callback)
            callback(stdout.trim())
    })
}

exports.getBranches = (dir, showAll, callback) => {
    if (dir) {
        let all = showAll ? ' -a' : ''
        exec(`git branch${all}`, {
            cwd: dir
        }, (err, stdout, stderr) => {
            if (callback)
                callback(stdout)
        })
    } else {
        if (callback)
            callback('')
    }
}

exports.checkoutBranch = (branch, dir, branchError, callback) => {
    exec(`git checkout ${branch}`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (/Please commit your changes or stash them before you switch branches/.test(stderr))
            branchError.text('Changes not commited or stashed')
        else
            if (callback)
                callback()
    })
}

exports.createBranch = (branch, dir, modal, callback) => {
    if (/^[a-zA-Z0-9_-]*$/g.test(branch)) {
        exec(`git checkout -b ${branch}`, {
            cwd: dir
        }, (err, stdout, stderr) => {
            if (/already exists/.test(stderr))
                modal.find('.error-message').text('The branch already exists')
            else if (/is not recognized as an internal or external command/.test(stderr) || /is not a valid branch name/.test(stderr))
                modal.find('.error-message').text('Invalid branch name')
            else {
                modal.find('.error-message').text('')
                if (callback)
                    callback()
            }
        })
    } else
        modal.find('.error-message').text('Invalid branch name')
}

exports.addToIndex = (dir, callback) => {
    exec('git add .', {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback()
    })
}

exports.commitChanges = (dir, message, callback) => {
    exec(`git commit -m "${message}"`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback([err, stdout, stderr])
    })
}

exports.pushCommits = (branch, dir, callback) => {
    exec(`git push${branch ? ' -u' : ''} origin${branch ? ` ${branch}` : ''}`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback({err, stdout, stderr})
    })
}

exports.fetchOrigin = (branch, dir, callback) => {
    exec(`git fetch ${branch}`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback({err, stdout, stderr})
    })
}

exports.checkRemote = (branch, dir, callback) => {
    exec(`git show-branch remotes/origin/${branch}`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        let hasRemote
        if (/fatal: bad sha1 reference/.test(stderr)) hasRmote = false
        else hasRemote = true
        if (callback)
            callback({err, stdout, stderr}, hasRemote)
    })
}

exports.mergeRemote = (branch, dir, callback) => {
    exec(`git merge origin/${branch}`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback({err, stdout, stderr})
    })
}

exports.modifiedFiles = (dir, callback) => {
    exec(`git status -u --porcelain`, {
        cwd: dir
    }, (err, stdout, stderr) => {
        let files = stdout.split('\n')
        let filesObj = []
        files.map(function(file) {
            let status = file.substr(0, 2).trim()
            if (file.length) {
                filesObj.push({
                    file: file.substr(2, file.length).trim(),
                    status,
                    add: true
                })
            }
        })
        filesObj.sort(function(a, b) {
            var fileA = a.file.toUpperCase()
            var fileB = b.file.toUpperCase()
            return (fileA < fileB) ? -1 : (fileA > fileB) ? 1 : 0
        })
        if (callback)
            callback(filesObj)
    })
}
