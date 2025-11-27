namespace IRSoft {

    //% block="IRSoft AutoBaud RX %pin"
    export function autoBaud(pin: DigitalPin): number {
        let t0 = control.micros()
        while (pins.digitalReadPin(pin) == 1) {
            if (control.micros() - t0 > 3000000) return 0
        }

        let start = control.micros()
        while (pins.digitalReadPin(pin) == 0) {}
        let stop = control.micros()

        let bt = stop - start
        if (bt <= 0) return 0

        let est = Math.round(1000000 / bt)

        if (Math.abs(est - 9600) < 800) est = 9600
        else if (Math.abs(est - 4800) < 600) est = 4800
        else if (Math.abs(est - 2400) < 400) est = 2400
        else if (Math.abs(est - 19200) < 1500) est = 19200

        return est
    }
}
