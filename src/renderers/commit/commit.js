const electron = require('electron')
// const remote = require('electron').remote

const { ipcRenderer: ipc } = electron

const button = document.getElementById('commit-message')
let allowActions = false

function getKey(e) {
    if ("key" in e) {
        if (e.key == "Escape" || e.key == "Esc" || e.keyCode == 27)
            return "Escape"
        else if (e.key == "Enter" || e.keyCode == 13)
            return "Enter"
    }
}

document.onkeydown = function(e) {
    if (allowActions) {
        e = e || window.event
        let key = getKey(e)
        if (key == "Escape") {
            button.value = ""
            ipc.send('hideCommit')
        } else if (key == "Enter") {
            const commit = button.value
            if (commit != "") {
                ipc.send('doCommit')
            } else {
            }
        }
    }
}

ipc.on('allowActions', () => {
    allowActions = true
})

ipc.on('blockActions', () => {
    allowActions = false
})