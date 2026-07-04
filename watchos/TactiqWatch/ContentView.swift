import SwiftUI

// Pulsa brand palette (watch accents on the standard black watchOS background).
private extension Color {
    static let pulsaSun = Color(red: 253 / 255, green: 202 / 255, blue: 58 / 255)
    static let pulsaEmber = Color(red: 211 / 255, green: 59 / 255, blue: 54 / 255)
    static let pulsaMarineLight = Color(red: 136 / 255, green: 164 / 255, blue: 222 / 255)
}

struct ContentView: View {
    @EnvironmentObject private var model: DetectionModel

    var body: some View {
        VStack(spacing: 6) {
            Text(model.latest?.category.icon ?? "◦")
                .font(.system(size: 34))
                .foregroundColor(.pulsaSun)

            Text(model.latest?.label ?? "Pulsa")
                .font(.system(size: 14, weight: .medium))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .foregroundColor(.white)

            Text(statusLine)
                .font(.system(size: 9))
                .kerning(1.2)
                .textCase(.uppercase)
                .foregroundColor(.gray)

            Button(model.isListening ? "Stop listening" : "Start listening") {
                model.toggleListening()
            }
            .font(.system(size: 12, weight: .semibold))
            .tint(model.isListening ? .pulsaEmber : .pulsaMarineLight)
            .padding(.top, 4)
        }
        .padding()
    }

    private var statusLine: String {
        if let latest = model.latest {
            let pct = Int(latest.confidence * 100)
            return latest.source == "watch" ? "Watch mic · \(pct)%" : "From phone · \(pct)%"
        }
        return model.isListening ? "Listening…" : "Standby"
    }
}
