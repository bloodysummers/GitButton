const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const { addRepository, getRepositories, setSelectedProject, getSelectedProject, hashExists, getCurrentDirectory, deleteRepository } = require('./store')

const repoWindow = $('.repo-container')
const errorMessage = $('#repo-error')
const inputFile = $('#search-repo')
const inputFileButton = $('#search-repo-button')
const addRepoButton = $('#add-repo-button')
const repoList = $('#repo-list')
const repositoryButton = $('#repository')

let directory
let project
let showRepoSettings = false

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
            exec(`echo "${dir}" | git hash-object --stdin`, (err, hash) => {
                if (!hashExists(hash.trim())) {
                    errorMessage.text('')
                    addRepository(dir, hash.trim())
                    listRepositories()
                } else {
                    errorMessage.text('Already stored')
                }
            })
        } else {
            errorMessage.text('Not a git repository')
        }
    })
}

function formatDir(dir) {
    return /^~/.test(dir)
        ? os.homedir() + dir.substr(1).trim()
        : dir.trim()
}

inputFile.on('change', () => {
    if (inputFile[0].files[0]) {
        const dir = formatDir(inputFile[0].files[0].path)
        if (isDir(dir))
            checkGitStatus(dir)
    }
})

repoList.on('click', '.repo-item', function() {
    let hash = $(this).data('hash')
    setSelectedProject(hash)
    listRepositories()
})
repoList.on('click', '.delete-project', function(e) {
    e.stopPropagation()
    let hash = $(this).parent().data('hash')
    deleteRepository(hash)
    listRepositories()
})
repositoryButton.on('click', (e) => {
    console.log(e)
    if (showRepoSettings) {
        repoWindow.fadeOut(300)
        showRepoSettings = false
    } else {
        repoWindow.fadeIn(300)
        showRepoSettings = true
    }
})
repoWindow.find('.close-icon').on('click', () => {
    repoWindow.fadeOut(300)
    showRepoSettings = false
})

function listRepositories() {
    const repos = getRepositories()
    let selected = getSelectedProject()
    repoList.html('')
    for (let i = 0; i < repos.length; i++) {
        let hash = repos[i].hash
        let active = hash == selected
        repoList.append(`
            <div class="repo-item${active ? ' active' : ''}" data-hash=${repos[i].hash}>
                <div class="delete-project"><i class="fa fa-trash"></i></div>
                <h4 class="repo-name">${repos[i].name}</h4>
                <p className="repo-location">${repos[i].location}</p>
            </div>`
        )
    }
    directory = getCurrentDirectory(selected)
    project = getCurrentDirectory(selected, true)
    if (project)
        repositoryButton.find('.title').text(project)
    else
        repositoryButton.find('.title').text('No project selected')
}

listRepositories()
