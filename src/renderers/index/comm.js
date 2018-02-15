const electron = require('electron')

const { ipcRenderer: ipc } = electron

const button = document.getElementById('button')

let commitAvailable = true

button.addEventListener('click', () => {
    if (commitAvailable)
        ipc.send('showCommit')
})

ipc.on('blockComm', () => {
    commitAvailable = false
})

ipc.on('startComm', () => {
    commitAvailable = true
})