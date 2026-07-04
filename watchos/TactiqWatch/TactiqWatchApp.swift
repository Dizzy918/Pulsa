import SwiftUI

@main
struct TactiqWatchApp: App {
    @StateObject private var model = DetectionModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
        }
    }
}
