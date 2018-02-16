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
        show:false
    })
    commitWindow.loadURL(path.join(__dirname, 'renderers/commit/commit.html'))

    commitWindow.once('ready-to-show', () => {
        commitWindow.show()
        commitWindow.center()
        commitWindow.setAlwaysOnTop(true)
        commitWindow.focus()
    })

    commitWindow.on('closed', () => {
        if (mainWindow) {
            mainWindow.webContents.send('startComm')
        } else {
            commitWindow = null
        }
    })
}

function showCommit() {
    mainWindow.webContents.send('blockComm')
    startCommitWindow()
}

function hideCommit() {
    mainWindow.webContents.send('startComm')
    commitWindow.close()
}

app.disableHardwareAcceleration()

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width:750,
        height:500,
        resizable: false,
        frame: false,
        focus: true
    })
    mainWindow.loadURL(path.join(__dirname, 'renderers/index/index.html'))
    mainWindow.on('closed', () => {
        mainWindow = null
        app.quit()
    })

    globalShortcut.register('CmdOrCtrl+Shift+Alt+C', () => {
        mainWindow.webContents.send('showCommit')
    })
})


// Communication
ipc.on('showCommit', () => {
    showCommit()
})

ipc.on('hideCommit', () => {
    hideCommit()
})

ipc.on('doCommit', (e, message) => {
    mainWindow.webContents.send('getCommitMessage', message)
    hideCommit()
})

ipc.on('minimize', () => {
    mainWindow.minimize()
})

ipc.on('close', () => {
    app.quit()
})
