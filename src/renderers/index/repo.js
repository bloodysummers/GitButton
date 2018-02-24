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

let directory
let project
let branch
let branchStatus
let showAllBranches = false
let showRepoSettings = false
let showBranchSettings = false

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
    listBranches()
    // branch = getCurrentBranch(directory)
    checkGitStatus(directory, (status) => {
        branchStatus = status
    })
    if (project)
        repositoryButton.find('.title').text(project)
    else
        repositoryButton.find('.title').text('No project selected')
}

// TODO: Sanitize data-branch
function listBranches() {
    branchList.html('')
    getBranches(directory, showAllBranches, (stdout) => {
        let branches = stdout.split('\n')
        let clrBranches = []
        if (branches.length > 1) {
            for (let i = 0; i<branches.length; i++) {
                if (branches[i].charAt(0) == '*') {
                    branch = branches[i].substr(2, branches[i].length-1).trim()
                    branchButton.find('.title').text(branch)
                    clrBranches.push({branch, active: true})
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
                <div class="branch-item${active ? ' active' : ''}" data-branch=${clrBranches[i].branch}>
                    <h4 class="branch-name">${clrBranches[i].branch}</h4>
                </div>`
            )
        }
        let activeBranch = clrBranches.filter(branch => {
            return branch.active
        })
        if (!activeBranch.length) {
            branchButton.find('.title').text('No branch selected')
            branch = "No branch selected"
        }
    })
}

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
        logContainer.append(`
            <div class="file-item file-${icon}">
                <input type="checkbox" data-file="${file.file}" ${file.add ? 'checked' : ''} />
                ${file.file}
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
    if (showRepoSettings) {
        repoWindow.fadeOut(300)
        showRepoSettings = false
    } else {
        repoWindow.fadeIn(300)
        showRepoSettings = true
        branchWindow.fadeOut(300)
        showBranchSettings = false
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
    showRepoSettings = false
})

repoList.on('click', '.repo-item', function() {
    let hash = $(this).data('hash')
    setSelectedProject(hash)
    listRepositories()
    repoWindow.fadeOut(300)
    showRepoSettings = false
})

repoList.on('click', '.delete-project', function(e) {
    e.stopPropagation()
    let hash = $(this).parent().data('hash')
    deleteRepository(hash)
    listRepositories()
})

// Branch window
branchButton.on('click', (e) => {
    if (showBranchSettings) {
        branchWindow.fadeOut(300)
        showBranchSettings = false
    } else {
        branchWindow.fadeIn(300)
        showBranchSettings = true
        repoWindow.fadeOut(300)
        showRepoSettings = false
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
        createBranch(branchName, directory, newBranchModal, () => {
            listBranches()
            blackLayer.click()
        })
})

branchWindow.find('.close-icon').on('click', () => {
    branchWindow.fadeOut(300)
    showBranchSettings = false
})

branchList.on('click', '.branch-item', function() {
    let branch = $(this).data('branch')
    checkoutBranch(branch, directory, branchError, () => {
        listBranches()
        // getCurrentBranch(directory)
        branchWindow.fadeOut(300)
        showBranchSettings = false
    })
})

allBranchesButton.on('change', function() {
    let checked = allBranchesButton[0].checked
    showAllBranches = checked
    listBranches()
})

// Black layer
blackLayer.on('click', () => {
    blackLayer.fadeOut(300).find('modal').fadeOut(300)
    newBranchModal.find('.error-message').text('')
})

//   _______  _____  _______ _______ _     _ __   _ _____ _______ _______ _______ _____  _____  __   _
//   |       |     | |  |  | |  |  | |     | | \  |   |   |       |_____|    |      |   |     | | \  |
//   |_____  |_____| |  |  | |  |  | |_____| |  \_| __|__ |_____  |     |    |    __|__ |_____| |  \_|
//

ipc.on('getCommitMessage', (e, message) => {
    // Pull all the remote changes
    fetchOrigin(branch, directory, msg => {
        console.log(msg)
        // Merge changes from remote
        mergeRemote(branch, directory, (msg) => {
            console.log(msg)
            // If merge has no conflicts...
            // Check if you have changes to upload
            checkGitStatus(directory, (status) => {
                branchStatus = status
                if (branchStatus == 'dirty') {
                    // Check if local is ancestor
                    //if ancestor, fast-forward
                    // else merge
                    // If no conflict, continue
                    // Add all files to index
                    addToIndex(directory, () => {
                        commitChanges(directory, message, (result) => {
                            console.log(result)
                            checkRemote(branch, directory, (msg, remote) => {
                                console.log(msg, remote)
                                pushCommits(remote ? branch : '', directory, (msg) => {
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
    listRepositories()
    modifiedFiles(directory, (files) => {
        setFilesStatus(files)
        listFiles()
    })
})

//    _____  __   _      _______ _______ _______  ______ _______
//   |     | | \  |      |______    |    |_____| |_____/    |
//   |_____| |  \_|      ______|    |    |     | |    \_    |
//

listRepositories()
modifiedFiles(directory, (files) => {
    setFilesStatus(files)
    listFiles()
})
