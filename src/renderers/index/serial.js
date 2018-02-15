const electron = require('electron')
const SerialPort = require('serialport')

const { ipcRenderer: ipc } = electron
const { Readline } = SerialPort.parsers

SerialPort.list((err, ports) => {
    console.log(ports)
})

const port = new SerialPort('COM3', {
    baudRate: 9600
})

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

parser.on('data', (data) => {
    if (data == "Commit!") {
        ipc.send('commit', data)
    }
})

let timer

ipc.on('showCommit', (e, data) => {
    clearTimeout(timer)
    document.getElementById('serial-read').innerHTML = data
    timer = setTimeout(function() {
        document.getElementById('serial-read').innerHTML = ""
    }, 2000)
})

port.on('open', () => {
})

port.on('error', function(error){
    console.log(error)
})
