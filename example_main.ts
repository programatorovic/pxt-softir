// example_main.ts

SoftIR.init(DigitalPin.P2, SoftIR.BaudRate.B9600)

SoftIR.onDataReceived((hex) => {
    basic.showString(hex)
})

basic.forever(() => {
    basic.pause(1000)
})
