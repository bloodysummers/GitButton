const electron = require('electron')
// const remote = require('electron').remote

const { ipcRenderer: ipc } = electron

const input = document.getElementById('commit-message')
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
            ipc.send('hideCommit')
            input.value = ""
        } else if (key == "Enter") {
            const commit = input.value
            if (commit != "") {
                ipc.send('doCommit', commit)
                input.value = ""
            } else {
                input.classList.add("error")
                setTimeout(() => {
                    input.classList.remove("error")
                }, 1000)
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