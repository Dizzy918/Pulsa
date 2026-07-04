import Foundation

/// Tactiq's 8-category vocabulary, mirrored from the phone app's
/// lib/soundClassifier.ts. Keep labels/icons/urgency in sync across platforms.
enum SoundCategory: String, CaseIterable {
    case alarm, doorbell, babyCry = "baby_cry", dogBark = "dog_bark"
    case speech, music, loudNoise = "loud_noise", silence

    var icon: String {
        switch self {
        case .alarm: return "▲"
        case .doorbell: return "◆"
        case .babyCry: return "♥"
        case .dogBark: return "✦"
        case .speech: return "◉"
        case .music: return "♪"
        case .loudNoise: return "◈"
        case .silence: return "◦"
        }
    }

    var defaultLabel: String {
        switch self {
        case .alarm: return "Alarm / Siren"
        case .doorbell: return "Doorbell / Knock"
        case .babyCry: return "Baby crying"
        case .dogBark: return "Dog barking"
        case .speech: return "Someone is speaking"
        case .music: return "Music playing"
        case .loudNoise: return "Loud noise nearby"
        case .silence: return "Quiet"
        }
    }

    /// Minimum interval between repeated alerts of the same category.
    var minInterval: TimeInterval {
        switch self {
        case .alarm: return 4
        case .doorbell: return 3
        case .babyCry: return 5
        case .dogBark: return 3
        case .speech: return 8
        case .music: return 15
        case .loudNoise: return 4
        case .silence: return .infinity
        }
    }
}

struct WristDetection {
    let category: SoundCategory
    let label: String
    let confidence: Double
    let source: String // "watch" | "phone"
    let at: Date
}

@MainActor
final class DetectionModel: ObservableObject {
    @Published var latest: WristDetection?
    @Published var isListening = false

    private let listener = SoundListener()
    private var phoneLink: PhoneLink?
    private var lastFired: [SoundCategory: Date] = [:]

    init() {
        phoneLink = PhoneLink { [weak self] detection in
            Task { @MainActor in self?.commit(detection) }
        }
    }

    func toggleListening() {
        if isListening {
            listener.stop()
            isListening = false
        } else {
            listener.start { [weak self] detection in
                Task { @MainActor in self?.commit(detection) }
            } onFailure: { error in
                print("SoundListener failed: \(error)")
                Task { @MainActor in self.isListening = false }
            }
            isListening = true
        }
    }

    private func commit(_ detection: WristDetection) {
        let now = Date()
        if let last = lastFired[detection.category],
           now.timeIntervalSince(last) < detection.category.minInterval {
            return
        }
        lastFired[detection.category] = now
        latest = detection
        Haptics.play(detection.category)
    }
}
