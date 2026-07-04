import AVFoundation
import SoundAnalysis

/// Standalone mode: the watch listens with its own microphone.
/// Uses Apple's built-in ~300-class sound classifier (SoundAnalysis,
/// watchOS 8+) — no bundled model needed.
final class SoundListener: NSObject, SNResultsObserving {

    private let engine = AVAudioEngine()
    private var analyzer: SNAudioStreamAnalyzer?
    private let queue = DispatchQueue(label: "tactiq.sound-analysis")
    private var onDetection: ((WristDetection) -> Void)?

    private static let scoreThreshold = 0.6 // Apple's classifier scores are well calibrated; be strict

    func start(onDetection: @escaping (WristDetection) -> Void,
               onFailure: @escaping (Error) -> Void) {
        self.onDetection = onDetection

        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.record, mode: .default)
            try session.setActive(true)

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            let analyzer = SNAudioStreamAnalyzer(format: format)
            self.analyzer = analyzer

            let request = try SNClassifySoundRequest(classifierIdentifier: .version1)
            request.windowDuration = CMTimeMakeWithSeconds(1.0, preferredTimescale: 48_000)
            request.overlapFactor = 0.5
            try analyzer.add(request, withObserver: self)

            input.installTap(onBus: 0, bufferSize: 8192, format: format) { [weak self] buffer, when in
                self?.queue.async {
                    self?.analyzer?.analyze(buffer, atAudioFramePosition: when.sampleTime)
                }
            }
            engine.prepare()
            try engine.start()
        } catch {
            onFailure(error)
        }
    }

    func stop() {
        engine.inputNode.removeTap(onBus: 0)
        engine.stop()
        analyzer?.removeAllRequests()
        analyzer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    // MARK: - SNResultsObserving

    func request(_ request: SNRequest, didProduce result: SNResult) {
        guard let result = result as? SNClassificationResult else { return }
        // Best alert-worthy classification in this window.
        for classification in result.classifications {
            guard classification.confidence >= Self.scoreThreshold else { break } // sorted desc
            if let category = Self.categorize(identifier: classification.identifier) {
                let label = classification.identifier
                    .replacingOccurrences(of: "_", with: " ")
                    .capitalized
                onDetection?(WristDetection(
                    category: category,
                    label: label,
                    confidence: Double(classification.confidence),
                    source: "watch",
                    at: Date()
                ))
                return
            }
        }
    }

    /// Keyword mapping over Apple's snake_case identifiers (e.g. "smoke_detector",
    /// "door_bell", "baby_crying"). Mirrors scripts/gen-yamnet-map.js in spirit.
    static func categorize(identifier: String) -> SoundCategory? {
        let id = identifier.lowercased()

        func matches(_ keywords: [String]) -> Bool {
            keywords.contains { id.contains($0) }
        }

        if matches(["siren", "alarm", "smoke_detector", "buzzer", "horn", "scream"]) { return .alarm }
        if matches(["baby_cry", "crying", "sobbing", "whimper"]) { return .babyCry }
        if matches(["dog", "bark", "howl", "growl", "yip"]) { return .dogBark }
        if matches(["door_bell", "doorbell", "ding_dong", "knock", "telephone", "ringtone"]) { return .doorbell }
        if matches(["explosion", "gunshot", "firework", "firecracker", "boom", "bang",
                    "smash", "crash", "shatter", "glass_break", "thunder", "slam"]) { return .loudNoise }
        if matches(["speech", "shout", "yell", "conversation", "babble"]) { return .speech }
        if matches(["music", "singing", "guitar", "piano", "drum", "violin", "choir",
                    "orchestra", "synthesizer", "whistling", "humming"]) { return .music }
        return nil
    }
}
