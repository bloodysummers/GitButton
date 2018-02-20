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

function createBranch(branch, dir, modal, callback) {
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

exports.pushCommits = (dir, callback) => {
    exec('git push origin', {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (callback)
            callback()
    })
}
