namespace IRSoft {

    export enum BaudRate {
        B2400 = 2400,
        B4800 = 4800,
        B9600 = 9600,
        B19200 = 19200
    }

    let rxPin: DigitalPin = DigitalPin.P2
    let baud = 9600
    let bitTime = 0
    let timeoutMs = 20
    let lastHex = ""
    let handler: (hex:string)=>void = null

    function updateTiming() {
        bitTime = Math.idiv(1000000, baud)
    }

    function readByte(): number {
        while (pins.digitalReadPin(rxPin) == 1) {}
        control.waitMicros(bitTime + Math.idiv(bitTime, 2))
        let value = 0
        for (let i = 0; i < 8; i++) {
            if (pins.digitalReadPin(rxPin)) value |= (1 << i)
            control.waitMicros(bitTime)
        }
        control.waitMicros(bitTime)
        return value
    }

    function readFrame(): number[] {
        let buffer: number[] = []
        let timer = control.millis()

        while (pins.digitalReadPin(rxPin) == 1) {}

        buffer.push(readByte())
        timer = control.millis()

        while (true) {
            if (pins.digitalReadPin(rxPin) == 0) {
                buffer.push(readByte())
                timer = control.millis()
                if (buffer.length > 32) break
            }
            if (control.millis() - timer > timeoutMs) break
        }
        return buffer
    }

    function toHex(buf: number[]): string {
        const map = "0123456789ABCDEF"
        let out = ""
        for (let b of buf) {
            b &= 0xFF
            out += map.charAt((b >> 4) & 0xF)
            out += map.charAt(b & 0xF)
        }
        return out
    }

    //% block="IRSoft init RX pin %pin baud %rate"
    //% pin.fieldEditor="gridpicker"
    export function init(pin: DigitalPin, rate: BaudRate) {
        rxPin = pin
        baud = rate as number
        updateTiming()
    }

    //% block="IRSoft read HEX"
    export function readHex(): string {
        let frame = readFrame()
        lastHex = toHex(frame)
        if (handler) handler(lastHex)
        return lastHex
    }

    //% block="IRSoft on data received"
    export function onDataReceived(h:(hex:string)=>void) {
        handler = h
    }

    //% block="IRSoft last HEX"
    export function getLastHex(): string {
        return lastHex
    }

    //% block="IRSoft wait and read"
    export function waitAndRead() {
        readHex()
    }
}
