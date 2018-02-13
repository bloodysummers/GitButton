const SerialPort = require('serialport')
const Readline = SerialPort.parsers.Readline

SerialPort.list((err, ports) => {
    console.log(ports)
})

const port = new SerialPort('COM3', {
    baudRate: 9600
})

const parser = port.pipe(new Readline({ delimiter: '\r\n' }))

parser.on('data', console.log)

port.on('open', () => {
    console.log('port open')
})

port.on('error', function(error){
    console.log(error)
})
