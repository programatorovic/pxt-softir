# SoftIR MakeCode extension

Malé MakeCode rozšírenie pre čítanie dekódovaných IR telegramov z prijímačov ako VS1838B / HX1838 (Keyestudio mód).

Funkcie:
- softvérový UART na ľubovoľnom pine
- autodetekcia baud rate (2400/4800/9600/19200)
- blokujúce čítanie celého datagramu (timeout-based)
- event handler pre prijatie rámca

Použitie (MakeCode - JavaScript):

```ts
SoftIR.init(DigitalPin.P2, SoftIR.BaudRate.B9600)
let hex = SoftIR.readHex()
basic.showString(hex)

// alebo
SoftIR.onDataReceived((h) => {
    serial.writeString(h)
})
```

Poznámky:
- Pri autodetekcii `AutoBaud`, zavolajte `SoftIR.autoBaud(pin)` a následne `SoftIR.init(pin, returnedBaud)`.
- `readHex()` čaká na začiatok telegramu a potom číta bajty až do ticha (timeout) - následne vráti hex string bez medzier (napr. `00EFC320`).
