// softir.ts
// Software UART receiver for IR modules - SoftIR namespace

namespace SoftIR {
    export enum IRProtocol {
        Auto,
        Keyestudio,
        NEC,
        Sony,
        RC5,
        Raw
    }

    export enum BaudRate {
        B2400 = 2400,
        B4800 = 4800,
        B9600 = 9600,
        B19200 = 19200
    }

    // internal state
    let _rxPin: DigitalPin = DigitalPin.P2
    let _baud = 9600
    let _bitTimeUs = Math.idiv(1000000, _baud)
    let _timeoutMs = 15 // silence to consider frame ended (ms)
    let _running = false
    let _onData: (hex: string) => void = null
    let _protocol = IRProtocol.Auto
    let _lastFrame = ""

    export function setBaud(baud: number) {
        if (baud <= 0) return
        _baud = baud
        _bitTimeUs = Math.idiv(1000000, _baud)
    }

    function readByteFromPin(pin: DigitalPin, bitTimeUs: number): number {
        // Wait for start bit (falling edge)
        while (pins.digitalReadPin(pin) == 1) {
            basic.pause(0)
        }
        // Wait approx 1.2 bit times to sample in the middle of the first data bit
        control.waitMicros(bitTimeUs + Math.idiv(bitTimeUs, 5))
        let value = 0
        for (let i = 0; i < 8; i++) {
            let b = pins.digitalReadPin(pin)
            if (b) value |= (1 << i)
            control.waitMicros(bitTimeUs)
        }
        // wait stop bit
        control.waitMicros(bitTimeUs)
        return value
    }

    function readFrameBlocking(pin: DigitalPin, bitTimeUs: number, timeoutMs: number): number[] {
        let bytes: number[] = []
        let start = control.millis()
        // Wait for first byte (start bit)
        while (true) {
            if (pins.digitalReadPin(pin) == 0) {
                let b = readByteFromPin(pin, bitTimeUs)
                bytes.push(b)
                start = control.millis()
                break
            }
            basic.pause(0)
        }
        // Read subsequent bytes until timeout silence
        while (true) {
            if (pins.digitalReadPin(pin) == 0) {
                let b = readByteFromPin(pin, bitTimeUs)
                bytes.push(b)
                start = control.millis()
                continue
            }
            if (control.millis() - start >= timeoutMs) break
            basic.pause(0)
        }
        return bytes
    }

    function bytesToHex(bytes: number[]): string {
        if (bytes.length == 0) return ""
        const hexChars = "0123456789ABCDEF"
        let s = ""
        for (let i = 0; i < bytes.length; i++) {
            let b = bytes[i] & 0xFF
            let hi = (b >> 4) & 0x0F
            let lo = b & 0x0F
            s += hexChars.charAt(hi)
            s += hexChars.charAt(lo)
        }
        return s
    }

    //% block="IRSoft.init pin $pin baud $baud"
    //% pin.fieldEditor="gridpicker"
    //% expandableArgumentMode="toggle"
    //% weight=100
    export function init(pin: DigitalPin, baud: BaudRate = BaudRate.B9600) {
        _rxPin = pin
        _baud = baud as number
        _bitTimeUs = Math.idiv(1000000, _baud)
        // start background receiver
        if (!_running) {
            _running = true
            // Use a function wrapper to be compatible with various MakeCode versions
            control.inBackground(function () { receiveLoop() })
        }
    }

    //% block="IRSoft.setProtocol $p"
    //% weight=90
    export function setProtocol(p: IRProtocol) {
        _protocol = p
    }

    //% block="IRSoft.readHex"
    //% weight=80
    export function readHex(): string {
        let bytes = readFrameBlocking(_rxPin, _bitTimeUs, _timeoutMs)
        let hex = bytesToHex(bytes)
        _lastFrame = hex
        return hex
    }

    //% block="IRSoft.onDataReceived %handler"
    //% weight=70
    export function onDataReceived(handler: (hex: string) => void) {
        _onData = handler
    }

    export function getLastFrame(): string {
        return _lastFrame
    }

    function receiveLoop() {
        while (_running) {
            // wait for any activity
            if (pins.digitalReadPin(_rxPin) == 0) {
                let bytes = readFrameBlocking(_rxPin, _bitTimeUs, _timeoutMs)
                let hex = bytesToHex(bytes)
                _lastFrame = hex
                if (_onData) {
                    _onData(hex)
                }
            }
            basic.pause(1)
        }
    }
}
