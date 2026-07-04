import Foundation
import WatchConnectivity

/// Companion mode: receives detections classified on the iPhone (pushed by
/// react-native-watch-connectivity on the RN side) while the watch app is
/// reachable. When it isn't, standard iPhone→Watch notification mirroring
/// covers the alert instead.
final class PhoneLink: NSObject, WCSessionDelegate {

    private let onDetection: (WristDetection) -> Void

    init(onDetection: @escaping (WristDetection) -> Void) {
        self.onDetection = onDetection
        super.init()
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func session(_ session: WCSession,
                 activationDidCompleteWith activationState: WCSessionActivationState,
                 error: Error?) {
        if let error { print("WCSession activation failed: \(error)") }
    }

    // Payload shape matches lib/watchBridge.ts serializeDetection().
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard
            let rawCategory = message["category"] as? String,
            let category = SoundCategory(rawValue: rawCategory),
            category != .silence
        else { return }

        onDetection(WristDetection(
            category: category,
            label: message["label"] as? String ?? category.defaultLabel,
            confidence: message["confidence"] as? Double ?? 0,
            source: "phone",
            at: Date()
        ))
    }
}
