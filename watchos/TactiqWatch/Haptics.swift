import WatchKit

/// watchOS exposes only fixed haptic types — no custom waveforms. We build a
/// distinguishable per-category "pattern" by playing timed sequences of those
/// fixed haptics. Same vocabulary as the phone/Wear OS vibration patterns.
enum Haptics {
    static func play(_ category: SoundCategory) {
        let device = WKInterfaceDevice.current()
        switch category {
        case .alarm:
            sequence(device, [(.failure, 0), (.failure, 0.45), (.failure, 0.9), (.failure, 1.35)])
        case .doorbell:
            sequence(device, [(.notification, 0), (.notification, 0.5)])
        case .babyCry:
            sequence(device, [(.directionUp, 0), (.directionUp, 0.35), (.success, 0.8)])
        case .dogBark:
            sequence(device, [(.click, 0), (.click, 0.18), (.click, 0.36)])
        case .speech:
            sequence(device, [(.directionDown, 0)])
        case .music:
            sequence(device, [(.click, 0)])
        case .loudNoise:
            sequence(device, [(.retry, 0), (.retry, 0.5)])
        case .silence:
            break
        }
    }

    private static func sequence(_ device: WKInterfaceDevice, _ steps: [(WKHapticType, TimeInterval)]) {
        for (haptic, delay) in steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                device.play(haptic)
            }
        }
    }
}
