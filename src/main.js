const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, Menu } = electron

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let mainWindow

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width:600,
        heiht:400
    })

    mainWindow.loadURL(path.join(__dirname, 'index.html'))

    mainWindow.on('closed', () => {
        mainWindow = null
    })
})
