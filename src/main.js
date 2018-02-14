const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, Menu, ipcMain: ipc } = electron

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let mainWindow

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width:750,
        height:500,
        resizable: false,
        frame: false
    })

    mainWindow.loadURL(path.join(__dirname, 'index.html'))

    mainWindow.on('closed', () => {
        mainWindow = null
    })
})

ipc.on('commit', (e, data) => {
    mainWindow.webContents.send('showCommit', data)
})
