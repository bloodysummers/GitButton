const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const { addRepository, getRepositories } = require('./store')

const inputText = $('#repo-location')
const inputFile = $('#search-repo')
const inputFileButton = $('#search-repo-button')
const addRepoButton = $('#add-repo-button')
const repoList = $('#repo-list')

inputFileButton.on('click', () => {
    inputFile.click()
})

function isDir(dir) {
    try {
        return fs.lstatSync(dir).isDirectory()
    } catch(e) {
        return false
    }
}

function checkGitStatus(dir) {
    let status
    exec("git status", {
        cwd: dir
    }, (err, stdout, stderr) => {
        if (err) status = 'unknown'
        else if (/nothing to commit/.test(stdout)) status = 'clean'
        else status = 'dirty'
        if (status != 'unknown') {
            addRepository(dir)
            listRepositories()
        }
    })
}

function formatDir(dir) {
    return /^~/.test(dir)
        ? os.homedir() + dir.substr(1).trim()
        : dir.trim()
}

inputFile.on('change', () => {
    const dir = formatDir(inputFile[0].files[0].path)
    if (isDir(dir))
        inputText.val(dir)
        checkGitStatus(dir)
})

function listRepositories() {
    const repos = getRepositories()
    repoList.html('')
    for (let i = 0; i < repos.length; i++) {
        repoList.append(`<div class="repo-item">
            <h4 class="repo-name">${repos[i].name}</h4>
            <p className="repo-location">${repos[i].location}</p>
        </div>`)
    }
}

listRepositories()