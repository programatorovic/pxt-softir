// protocols.ts
// (helper functions for protocol detection - placeholder for future extension)

namespace SoftIR {
    export function detectProtocolFromHex(hex: string): IRProtocol {
        if (!hex) return IRProtocol.Raw
        let len = hex.length / 2
        if (len == 4) return IRProtocol.Keyestudio
        if (len == 2 || len == 3) return IRProtocol.Sony
        return IRProtocol.Raw
    }
}
