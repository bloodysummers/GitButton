const electron = require('electron')

const { ipcRenderer: ipc } = electron

document.getElementById('min-button').addEventListener('click', () => {
    ipc.send('minimize')
})

document.getElementById('close-button').addEventListener('click', () => {
    ipc.send('close')
})