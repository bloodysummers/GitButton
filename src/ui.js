const electron = require('electron')

const { ipcRenderer: ipc } = electron

const button = document.getElementById('button')

button.addEventListener('click', () => {
    ipc.send('commit', "Commit de botón!")
})
