const electron = require('electron')

const { ipcRenderer: ipc } = electron

const fs = require('fs')
const exec = require('child_process').exec
const os = require('os')
const { addRepository, getRepositories, setSelectedProject, getSelectedProject, hashExists, getCurrentDirectory, deleteRepository, setFilesStatus, getFilesStatus } = require('./store')
const { checkGitStatus, hashDirectory, getBranches, checkoutBranch, createBranch, addToIndex, commitChanges, pushCommits, fetchOrigin, checkRemote, mergeRemote, modifiedFiles } = require('./git')

const repoWindow = $('.repo-container')
const branchWindow = $('.branch-container')
const repoError = $('#repo-error')
const inputFile = $('#search-repo')
const inputFileButton = $('#search-repo-button')
const addRepoButton = $('#add-repo-button')
const repoList = $('#repo-list')
const repositoryButton = $('#repository')
const branchButton = $('#branch')
const branchList = $('#branch-list')
const branchError = $('#branch-error')
const newBranchButton = $('#new-branch-button')
const allBranchesButton = $('#checkbox-branches')
const blackLayer = $('.black-layer')
const newBranchModal = $('.new-branch-modal')
const logContainer = $('.log-container')

let DIRECTORY
let PROJECT
let PROJECT_HASH
let BRANCH
let BRANCH_STATUS
let SHOW_ALL_BRANCHES = false
let SHOW_REPO_SETTINGS = false
let SHOW_BRANCH_SETTINS = false

//   ______  _____  ______ _______ _______ _______  _____   ______ __   __
//   |     \   |   |_____/ |______ |          |    |     | |_____/   \_/
//   |_____/ __|__ |    \_ |______ |_____     |    |_____| |    \_    |
//

function isDir(dir) {
    try {
        return fs.lstatSync(dir).isDirectory()
    } catch(e) {
        return false
    }
}

function formatDir(dir) {
    return /^~/.test(dir)
        ? os.homedir() + dir.substr(1).trim()
        : dir.trim()
}

//          _____ _______ _______ _____ __   _  ______
//   |        |   |______    |      |   | \  | |  ____
//   |_____ __|__ ______|    |    __|__ |  \_| |_____|
//

function main() {
    PROJECT_HASH = getSelectedProject()
    DIRECTORY = getCurrentDirectory(PROJECT_HASH)
    PROJECT = getCurrentDirectory(PROJECT_HASH, true)
    listRepositories()
    listBranches()
    checkGitStatus(DIRECTORY, (status) => {
        BRANCH_STATUS = status
    })
    modifiedFiles(DIRECTORY, (files) => {
        let oldFiles = getFilesStatus()
        let checkedFiles = files.map(file => {
            let checkOldFiles = oldFiles.filter(f => {
                return f.file == file.file
            })
            if (checkOldFiles.length)
                return checkOldFiles[0]
            else
                return file
        })
        setFilesStatus(checkedFiles)
        listFiles()
    })
}

// Just list the repos
function listRepositories() {
    repoList.html('')
    const repos = getRepositories()
    for (let i = 0; i < repos.length; i++) {
        let hash = repos[i].hash
        let active = hash == PROJECT_HASH
        repoList.append(`
            <div class="repo-item${active ? ' active' : ''}" data-hash=${repos[i].hash}>
                <div class="delete-project"><i class="fa fa-trash"></i></div>
                <h4 class="repo-name">${repos[i].name}</h4>
                <p className="repo-location">${repos[i].location}</p>
            </div>`
        )
    }
    if (PROJECT)
        repositoryButton.find('.title').text(PROJECT)
    else
        repositoryButton.find('.title').text('No project selected')
}

// Just list the branches
function listBranches() {
    branchList.html('')
    getBranches(DIRECTORY, SHOW_ALL_BRANCHES, (stdout) => {
        let branches = stdout.split('\n')
        let clrBranches = []
        if (branches.length > 1) {
            for (let i = 0; i<branches.length; i++) {
                if (branches[i].charAt(0) == '*') {
                    BRANCH = branches[i].substr(2, branches[i].length-1).trim()
                    branchButton.find('.title').text(BRANCH)
                    clrBranches.push({branch: BRANCH, active: true})
                } else {
                    if (branches[i].length > 0)
                        clrBranches.push({branch: branches[i].trim(), active: false})
                }
            }
        }
        clrBranches.sort(function(a, b) {
            var branchA = a.branch.toUpperCase()
            var branchB = b.branch.toUpperCase()
            return (branchA < branchB) ? -1 : (branchA > branchB) ? 1 : 0
        })
        for (let i = 0; i<clrBranches.length; i++) {
            let active = clrBranches[i].active
            branchError.text('')
            branchList.append(`
                <div class="branch-item${active ? ' active' : ''}" data-branch=${encodeURI(clrBranches[i].branch)}>
                    <h4 class="branch-name">${clrBranches[i].branch}</h4>
                </div>`
            )
        }
        let activeBranch = clrBranches.filter(branch => {
            return branch.active
        })
        if (!activeBranch.length) {
            branchButton.find('.title').text('No branch selected')
            BRANCH = "No branch selected"
        }
    })
}

// Just list the files
function listFiles() {
    logContainer.html('')
    let files = getFilesStatus()
    files.map((file) => {
        let icon = (file.status == '??' || file.status == '!!') ? 'untracked' :
                    (file.status == 'M' || file.status == 'MM' || file.status == 'MD') ? 'modified' :
                    (file.status == 'A' || file.status == 'AM' || file.status == 'AD') ? 'added' :
                    (file.status == 'D' || file.status == 'DM') ? 'deleted' :
                    (file.status == 'R' || file.status == 'RM' || file.status == 'RD') ? 'renamed' :
                    (file.status == 'C' || file.status == 'CM' || file.status == 'CD') ? 'copied' :
                    'stateless'
        let fileName = []
        if (file.file.indexOf('/') > -1  || file.file.indexOf('\\') > -1) {
            if (file.file.lastIndexOf('/') > -1) {
                fileName.push(file.file.substr(0, file.file.lastIndexOf('/')))
                fileName.push(file.file.substr(file.file.lastIndexOf('/'), file.file.length))
            } else if (file.file.lastIndexOf('\\') > -1) {
                fileName.push(file.file.substr(0, file.file.lastIndexOf('\\')))
                fileName.push(file.file.substr(file.file.lastIndexOf('\\'), file.file.length))
            }
        } else {
            fileName.push(file.file)
        }
        logContainer.append(`
            <div class="file-item file-${icon}">
                <input type="checkbox" data-file="${file.file}" ${file.add ? 'checked' : ''} />
                <div class="file-name" title="${file.file}">
                    <div class="name-flex">
                        <span class="part-1">${fileName[0]}</span>${fileName.length > 1 ? `<span class="part-2">${fileName[1]}</span>` : ''}
                    </div>
                </div>
                <i class="icon"></i>
            </div>
        `)
    })
}

//   _______ _    _ _______ __   _ _______ _______
//   |______  \  /  |______ | \  |    |    |______
//   |______   \/   |______ |  \_|    |    ______|
//

// Repo window
repositoryButton.on('click', (e) => {
    if (SHOW_REPO_SETTINGS) {
        repoWindow.fadeOut(300)
        SHOW_REPO_SETTINGS = false
    } else {
        repoWindow.fadeIn(300)
        SHOW_REPO_SETTINGS = true
        branchWindow.fadeOut(300)
        SHOW_BRANCH_SETTINS = false
    }
})

inputFileButton.on('click', () => {
    inputFile.click()
})

inputFile.on('change', () => {
    if (inputFile[0].files[0]) {
        const dir = formatDir(inputFile[0].files[0].path)
        if (isDir(dir)) {
            checkGitStatus(dir, (status) => {
                if (status != 'unknown') {
                    hashDirectory(dir, (hash) => {
                        if (!hashExists(hash)) {
                            repoError.text('')
                            addRepository(dir, hash)
                            listRepositories()
                        } else {
                            repoError.text('Already stored')
                        }
                    })
                } else {
                    repoError.text('Not a git repository')
                }
            })
        }
    }
})

repoWindow.find('.close-icon').on('click', () => {
    repoWindow.fadeOut(300)
    SHOW_REPO_SETTINGS = false
})

repoList.on('click', '.repo-item', function() {
    let hash = $(this).data('hash')
    setSelectedProject(hash)
    listRepositories()
    repoWindow.fadeOut(300)
    SHOW_REPO_SETTINGS = false
})

repoList.on('click', '.delete-project', function(e) {
    e.stopPropagation()
    let hash = $(this).parent().data('hash')
    deleteRepository(hash)
    listRepositories()
})

// Branch window
branchButton.on('click', (e) => {
    if (SHOW_BRANCH_SETTINS) {
        branchWindow.fadeOut(300)
        SHOW_BRANCH_SETTINS = false
    } else {
        branchWindow.fadeIn(300)
        SHOW_BRANCH_SETTINS = true
        repoWindow.fadeOut(300)
        SHOW_REPO_SETTINGS = false
    }
})

newBranchButton.on('click', () => {
    $('.new-branch-modal').show()
    $('.black-layer').fadeIn(300)
})

newBranchModal.on('click', (e) => {
    e.stopPropagation()
})

newBranchModal.on('click', '#create-branch-button', () => {
    const branchName = newBranchModal.find('#new-branch-input').val()
    if (branchName != "")
        createBranch(branchName, DIRECTORY, newBranchModal, () => {
            listBranches()
            blackLayer.click()
        })
})

branchWindow.find('.close-icon').on('click', () => {
    branchWindow.fadeOut(300)
    SHOW_BRANCH_SETTINS = false
})

branchList.on('click', '.branch-item', function() {
    let branch = $(this).data('branch')
    checkoutBranch(branch, DIRECTORY, branchError, () => {
        listBranches()
        branchWindow.fadeOut(300)
        SHOW_BRANCH_SETTINS = false
    })
})

allBranchesButton.on('change', function() {
    let checked = allBranchesButton[0].checked
    SHOW_ALL_BRANCHES = checked
    listBranches()
})

// Black layer
blackLayer.on('click', () => {
    blackLayer.fadeOut(300).find('modal').fadeOut(300)
    newBranchModal.find('.error-message').text('')
})

// Files
logContainer.on('click', '.file-item input', function() {
    const val = $(this).is(':checked')
    const fileName = $(this).data('file')
    let files = getFilesStatus()
    let newFiles = files.map(file => {
        if (file.file == fileName) {
            return {
                file: fileName,
                status: file.status,
                add: val
            }
        } else {
            return file
        }
    })
    setFilesStatus(newFiles)
    listFiles()
})

//   _______  _____  _______ _______ _     _ __   _ _____ _______ _______ _______ _____  _____  __   _
//   |       |     | |  |  | |  |  | |     | | \  |   |   |       |_____|    |      |   |     | | \  |
//   |_____  |_____| |  |  | |  |  | |_____| |  \_| __|__ |_____  |     |    |    __|__ |_____| |  \_|
//

ipc.on('getCommitMessage', (e, message) => {
    // Pull all the remote changes
    fetchOrigin(BRANCH, DIRECTORY, msg => {
        console.log(msg)
        // Merge changes from remote
        mergeRemote(BRANCH, DIRECTORY, (msg) => {
            console.log(msg)
            // If merge has no conflicts...
            // Check if you have changes to upload
            checkGitStatus(DIRECTORY, (status) => {
                BRANCH_STATUS = status
                if (BRANCH_STATUS == 'dirty') {
                    // Check if local is ancestor
                    //if ancestor, fast-forward
                    // else merge
                    // If no conflict, continue
                    // Add all files to index
                    addToIndex(DIRECTORY, () => {
                        commitChanges(DIRECTORY, message, (result) => {
                            console.log(result)
                            checkRemote(BRANCH, DIRECTORY, (msg, remote) => {
                                console.log(msg, remote)
                                pushCommits(remote ? BRANCH : '', DIRECTORY, (msg) => {
                                    console.log(msg)
                                })
                            })
                        })
                    })
                } else {
                    console.log('The branch is clean')
                }
            })
        })
    })
})


ipc.on('focused', (e) => {
    main()
})

//    _____  __   _      _______ _______ _______  ______ _______
//   |     | | \  |      |______    |    |_____| |_____/    |
//   |_____| |  \_|      ______|    |    |     | |    \_    |
//

main()
