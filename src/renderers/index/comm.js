const electron = require('electron')
const SerialPort = require('serialport')

const { ipcRenderer: ipc } = electron
const { Readline } = SerialPort.parsers

SerialPort.list((err, ports) => {
    console.log(ports)
})

let commitAvailable = true

// UI Button
const button = document.getElementById('button')
button.addEventListener('click', () => {
    if (commitAvailable) {
        button.classList.add('pushed')
        ipc.send('showCommit')
    }
})

// Serial Button
const port = new SerialPort('COM3', {
    baudRate: 9600
})
const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
parser.on('data', (data) => {
    console.log(data)
    if (commitAvailable && data == "Commit!") {
        button.classList.add('pushed')
        ipc.send('showCommit')
    }
})
port.on('open', () => {
})
port.on('error', function(error){
    console.log(error)
})

// Communication
ipc.on('blockComm', () => {
    commitAvailable = false
})

ipc.on('startComm', () => {
    commitAvailable = true
    button.classList.remove('pushed')
})