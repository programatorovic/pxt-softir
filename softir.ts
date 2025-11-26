namespace SoftIR {
    export enum IRProtocol { Auto, Keyestudio, NEC, Sony, RC5, Raw }
    export enum BaudRate { B2400=2400, B4800=4800, B9600=9600, B19200=19200 }

    let _rxPin: DigitalPin = DigitalPin.P2
    let _baud = 9600
    let _bitTimeUs = Math.idiv(1000000, _baud)
    let _timeoutMs = 15
    let _running = false
    let _onData: (hex: string) => void = null
    let _lastFrame = ""

    export function setBaud(baud: number) {
        if (baud <= 0) return
        _baud = baud
        _bitTimeUs = Math.idiv(1000000, _baud)
    }

    function readByteFromPin(pin: DigitalPin, bitTimeUs: number): number {
        while (pins.digitalReadPin(pin) == 1) basic.pause(0)
        control.waitMicros(bitTimeUs + Math.idiv(bitTimeUs, 5))
        let value = 0
        for (let i = 0; i < 8; i++) {
            if (pins.digitalReadPin(pin)) value |= (1 << i)
            control.waitMicros(bitTimeUs)
        }
        control.waitMicros(bitTimeUs)
        return value
    }

    function readFrameBlocking(pin: DigitalPin, bitTimeUs: number, timeoutMs: number): number[] {
        let bytes: number[] = []
        let start = control.millis()
        while (true) {
            if (pins.digitalReadPin(pin) == 0) {
                bytes.push(readByteFromPin(pin, bitTimeUs))
                start = control.millis()
                break
            }
            basic.pause(0)
        }
        while (true) {
            if (pins.digitalReadPin(pin) == 0) {
                bytes.push(readByteFromPin(pin, bitTimeUs))
                start = control.millis()
                continue
            }
            if (control.millis() - start >= timeoutMs) break
            basic.pause(0)
        }
        return bytes
    }

    function bytesToHex(bytes: number[]): string {
        let s = ""
        for (let b of bytes) {
            let h = b.toString(16)
            if (h.length == 1) h = "0" + h
            s += h.toUpperCase()
        }
        return s
    }

    //% block="IRSoft.init pin $pin baud $baud"
    //% pin.fieldEditor="gridpicker"
    export function init(pin: DigitalPin, baud: BaudRate = BaudRate.B9600) {
        _rxPin = pin
        setBaud(baud)
        if (!_running) {
            _running = true
            control.inBackground(function () { receiveLoop() })
        }
    }

    //% block="IRSoft.readHex"
    export function readHex(): string {
        let bytes = readFrameBlocking(_rxPin, _bitTimeUs, _timeoutMs)
        let hex = bytesToHex(bytes)
        _lastFrame = hex
        return hex
    }

    //% block="IRSoft.onDataReceived %handler"
    export function onDataReceived(handler: (hex: string) => void) {
        _onData = handler
    }

    export function getLastFrame(): string {
        return _lastFrame
    }

    function receiveLoop() {
        while (_running) {
            if (pins.digitalReadPin(_rxPin) == 0) {
                let bytes = readFrameBlocking(_rxPin, _bitTimeUs, _timeoutMs)
                let hex = bytesToHex(bytes)
                _lastFrame = hex
                if (_onData) _onData(hex)
            }
            basic.pause(1)
        }
    }
}
