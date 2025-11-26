namespace SoftIR {
    //% block="IRSoft.autoBaud pin $pin"
    export function autoBaud(pin: DigitalPin): number {
        let t0 = control.micros()
        while (pins.digitalReadPin(pin) == 1) {
            if (control.micros() - t0 > 5000000) return 0
        }
        let s = control.micros()
        while (pins.digitalReadPin(pin) == 0) {}
        let e = control.micros()
        let bitTime = e - s
        if (bitTime <= 0) return 0
        let baud = Math.round(1000000 / bitTime)

        if (Math.abs(baud - 9600) < 1000) baud = 9600
        else if (Math.abs(baud - 4800) < 600) baud = 4800
        else if (Math.abs(baud - 2400) < 400) baud = 2400
        else if (Math.abs(baud - 19200) < 2000) baud = 19200

        SoftIR.setBaud(baud)
        return baud
    }
}
