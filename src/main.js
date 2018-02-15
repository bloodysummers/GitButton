const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, Menu, ipcMain: ipc, globalShortcut } = electron

require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let mainWindow

let commitWindow

function startCommitWindow() {
    commitWindow = new BrowserWindow({
        width: 400,
        height:70,
        resizable: false,
        frame: false,
        hasShadow: false,
        show: false
    })
    commitWindow.loadURL(path.join(__dirname, 'renderers/commit/commit.html'))
    
    commitWindow.on('closed', () => {
        if (mainWindow) {
            startCommitWindow()
            mainWindow.webContents.send('startComm')
        } else {
            commitWindow = null
        }
    })
}

function showCommit() {
    mainWindow.webContents.send('blockComm')
    commitWindow.webContents.send('allowActions')
    commitWindow.show()
    commitWindow.center()
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width:750,
        height:500,
        resizable: false,
        frame: false
    })
    mainWindow.loadURL(path.join(__dirname, 'renderers/index/index.html'))
    mainWindow.on('closed', () => {
        mainWindow = null
        app.quit()
    })
    
    startCommitWindow()
    
    globalShortcut.register('CmdOrCtrl+Shift+Alt+C', () => {
        showCommit()
    })
})

ipc.on('showCommit', () => {
    if (commitWindow != null) {
        showCommit()
    } else {
        startCommitWindow()
    }
    
})

ipc.on('hideCommit', () => {
    mainWindow.webContents.send('startComm')
    commitWindow.webContents.send('blockActions')
    commitWindow.hide()
})

ipc.on('minimize', () => {
    mainWindow.minimize()
})

ipc.on('close', () => {
    app.quit()
})