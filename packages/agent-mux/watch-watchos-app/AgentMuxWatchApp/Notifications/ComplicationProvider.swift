import ClockKit

final class ComplicationProvider: NSObject, CLKComplicationDataSource {
  func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
    let template = CLKComplicationTemplateGraphicCornerTextView(textProvider: CLKSimpleTextProvider(text: "0 hooks"))
    handler(CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template))
  }

  func getTimelineStartDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
    handler(Date())
  }

  func getTimelineEndDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
    handler(Date().addingTimeInterval(3600))
  }

  func getSupportedTimeTravelDirections(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimeTravelDirections) -> Void) {
    handler([])
  }

  func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
    handler(.showOnLockScreen)
  }
}
