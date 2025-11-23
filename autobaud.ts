// autobaud.ts
// Improved autoBaud: measures start-bit durations for two consecutive bytes and averages them.

namespace SoftIR {
    //% block="IRSoft.autoBaud pin $pin"
    //% weight=60
    export function autoBaud(pin: DigitalPin): number {
        // Wait for first falling edge (start bit of first byte)
        let globalTimeout = control.millis() + 5000
        while (pins.digitalReadPin(pin) == 1) {
            if (control.millis() > globalTimeout) return 0
            basic.pause(0)
        }
        // First falling edge detected - measure until line returns high (end of start bit)
        let t1_start = control.micros()
        let t1_end = 0
        while (pins.digitalReadPin(pin) == 0) {
            if (control.micros() - t1_start > 1000000) return 0
        }
        t1_end = control.micros()
        // Now wait for next byte start (another falling edge) - allow some time for data bits
        let t_wait_start = control.micros()
        let t2_start = 0
        let waitTimeout = t_wait_start + 500000 // 0.5s
        while (pins.digitalReadPin(pin) == 1) {
            if (control.micros() > waitTimeout) break
        }
        let baud = 0
        if (pins.digitalReadPin(pin) == 0) {
            t2_start = control.micros()
            // measure end of second start bit
            while (pins.digitalReadPin(pin) == 0) {
                if (control.micros() - t2_start > 1000000) break
            }
            let t2_end = control.micros()
            let bt1 = t1_end - t1_start
            let bt2 = t2_end - t2_start
            let bitTimeUs = Math.idiv(bt1 + bt2, 2)
            if (bitTimeUs <= 0) return 0
            baud = Math.round(1000000 / bitTimeUs)
        } else {
            // Only one byte detected - use single measurement
            let bitTimeUs = t1_end - t1_start
            if (bitTimeUs <= 0) return 0
            baud = Math.round(1000000 / bitTimeUs)
        }

        // choose nearest standard baud
        if (Math.abs(baud - 9600) < 1000) baud = 9600
        else if (Math.abs(baud - 4800) < 600) baud = 4800
        else if (Math.abs(baud - 2400) < 400) baud = 2400
        else if (Math.abs(baud - 19200) < 2000) baud = 19200

        // Use public setter to apply the measured baud to SoftIR
        // If your SoftIR implementation uses setBaud_impl, call that:
        try {
            // prefer public API if available
            (SoftIR as any).setBaud_impl(baud)
        } catch (e) {
            // fallback: try setBaud (some toolchains might expect that)
            try {
                (SoftIR as any).setBaud(baud)
            } catch (e2) {
                // nothing else we can do programmatically; inform user by returning the baud
            }
        }

        return baud
    }
}
