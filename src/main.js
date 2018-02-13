const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, Menu, ipcMain: ipc } = electron

// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
// });

let mainWindow

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width:250,
        height:400
    })

    mainWindow.loadURL(path.join(__dirname, 'index.html'))

    mainWindow.on('closed', () => {
        mainWindow = null
    })
})

ipc.on('commit', (e, data) => {
    mainWindow.webContents.send('showCommit', data)
})
